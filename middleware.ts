/**
 * Next.js Middleware for Global Request Processing
 *
 * This middleware runs on every request and handles:
 * - Security headers
 * - CORS policies
 * - Rate limiting
 * - Authentication checks
 * - Request logging
 * - Performance monitoring
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { SECURITY_HEADERS, getCorsHeaders } from './lib/security/headers'
import { withRateLimit, getClientId } from './lib/security/rate-limit'

/**
 * Main middleware function
 */
export async function middleware(request: NextRequest) {
  const startTime = Date.now()
  const pathname = request.nextUrl.pathname

  // ========================================================================
  // SKIP MIDDLEWARE FOR STATIC ASSETS
  // ========================================================================
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/images/') ||
    pathname.startsWith('/icons/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // ========================================================================
  // CORS PREFLIGHT HANDLING
  // ========================================================================
  if (request.method === 'OPTIONS') {
    const origin = request.headers.get('origin')
    const corsHeaders = getCorsHeaders(origin || undefined)

    return new NextResponse(null, {
      status: 200,
      headers: corsHeaders
    })
  }

  // ========================================================================
  // RATE LIMITING
  // ========================================================================
  if (process.env.RATE_LIMIT_ENABLED === 'true') {
    try {
      let rateLimitConfig: 'api' | 'auth' | 'health' | 'upload' = 'api'

      // Determine rate limit configuration based on path
      if (pathname.startsWith('/api/auth/')) {
        rateLimitConfig = 'auth'
      } else if (pathname.startsWith('/api/health')) {
        rateLimitConfig = 'health'
      } else if (pathname.includes('upload') || pathname.includes('file')) {
        rateLimitConfig = 'upload'
      }

      const rateLimitResult = await withRateLimit(rateLimitConfig)(request)

      if (!rateLimitResult.allowed) {
        console.warn(`🚨 Rate limit exceeded: ${getClientId(request)} on ${pathname}`)

        const response = NextResponse.json(
          {
            error: 'Rate limit exceeded',
            message: 'Too many requests. Please try again later.',
            retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
          },
          { status: 429 }
        )

        // Add rate limit headers
        Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
          if (value) {
            response.headers.set(key, value)
          }
        })

        return response
      }
    } catch (error) {
      console.error('❌ Rate limiting error:', error)
      // Continue without rate limiting on error
    }
  }

  // ========================================================================
  // SECURITY VALIDATION
  // ========================================================================
  const securityChecks = performSecurityChecks(request)

  if (!securityChecks.passed) {
    console.warn('🚨 Security check failed:', securityChecks.reason)

    return NextResponse.json(
      { error: 'Security validation failed' },
      { status: 403 }
    )
  }

  // ========================================================================
  // AUTHENTICATION PROTECTION
  // ========================================================================
  if (isProtectedRoute(pathname)) {
    const authResult = await checkAuthentication(request)

    if (!authResult.authenticated) {
      // Redirect to login for protected pages
      if (!pathname.startsWith('/api/')) {
        const loginUrl = new URL('/auth/signin', request.url)
        loginUrl.searchParams.set('callbackUrl', request.url)
        return NextResponse.redirect(loginUrl)
      }

      // Return unauthorized for API routes
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
  }

  // ========================================================================
  // CONTINUE WITH REQUEST
  // ========================================================================
  const response = NextResponse.next()

  // ========================================================================
  // APPLY SECURITY HEADERS
  // ========================================================================
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  // Apply CORS headers for API routes
  if (pathname.startsWith('/api/')) {
    const origin = request.headers.get('origin')
    const corsHeaders = getCorsHeaders(origin || undefined)

    Object.entries(corsHeaders).forEach(([key, value]) => {
      if (value) {
        response.headers.set(key, value)
      }
    })
  }

  // ========================================================================
  // PERFORMANCE MONITORING
  // ========================================================================
  const duration = Date.now() - startTime

  // Log slow requests
  if (duration > 1000) {
    console.warn(`🐌 Slow middleware execution: ${pathname} (${duration}ms)`)
  }

  // Add performance headers
  response.headers.set('X-Response-Time', `${duration}ms`)
  response.headers.set('X-Timestamp', new Date().toISOString())

  // ========================================================================
  // REQUEST LOGGING (Production)
  // ========================================================================
  if (process.env.NODE_ENV === 'production' && pathname.startsWith('/api/')) {
    console.log('📡 API Request:', {
      method: request.method,
      path: pathname,
      ip: getClientId(request),
      userAgent: request.headers.get('user-agent')?.substring(0, 100),
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    })
  }

  return response
}

/**
 * Perform security validation checks
 */
function performSecurityChecks(request: NextRequest): {
  passed: boolean
  reason?: string
} {
  const userAgent = request.headers.get('user-agent') || ''
  const pathname = request.nextUrl.pathname

  // Block known malicious user agents
  const blockedUserAgents = [
    /curl/i,
    /wget/i,
    /python-requests/i,
    /bot/i,
    /spider/i,
    /crawler/i
  ]

  // Allow legitimate bots for public pages
  if (!pathname.startsWith('/api/') && !isProtectedRoute(pathname)) {
    // Allow search engine bots for public pages
    const allowedBots = [/googlebot/i, /bingbot/i, /slurp/i]
    const isAllowedBot = allowedBots.some(pattern => pattern.test(userAgent))

    if (isAllowedBot) {
      return { passed: true }
    }
  }

  // Block suspicious user agents for API routes
  if (pathname.startsWith('/api/')) {
    const isSuspiciousUserAgent = blockedUserAgents.some(pattern =>
      pattern.test(userAgent)
    )

    if (isSuspiciousUserAgent) {
      return {
        passed: false,
        reason: `Blocked user agent: ${userAgent.substring(0, 50)}`
      }
    }
  }

  // Check for malicious path patterns
  const maliciousPatterns = [
    /\.\.\//,           // Path traversal
    /%2e%2e%2f/i,       // Encoded path traversal
    /union.*select/i,   // SQL injection
    /<script/i,         // XSS
    /javascript:/i,     // JavaScript injection
    /%00/,              // Null byte
    /\/etc\/passwd/,    // File access attempt
    /\/proc\//,         // Process access attempt
    /admin\/config/,    // Admin access attempt
    /\.env/,            // Environment file access
    /\.git\//           // Git repository access
  ]

  const isMaliciousPath = maliciousPatterns.some(pattern =>
    pattern.test(pathname) || pattern.test(request.url)
  )

  if (isMaliciousPath) {
    return {
      passed: false,
      reason: `Malicious path detected: ${pathname}`
    }
  }

  return { passed: true }
}

/**
 * Check if route requires authentication
 */
function isProtectedRoute(pathname: string): boolean {
  const protectedPaths = [
    '/dashboard',
    '/companies',
    '/contacts',
    '/deals',
    '/activities',
    '/settings',
    '/profile',
    '/api/companies',
    '/api/contacts',
    '/api/deals',
    '/api/activities',
    '/api/user'
  ]

  const publicPaths = [
    '/',
    '/auth',
    '/api/auth',
    '/api/health',
    '/api/monitoring'
  ]

  // Check if it's explicitly public
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return false
  }

  // Check if it's explicitly protected
  return protectedPaths.some(path => pathname.startsWith(path))
}

/**
 * Check authentication status
 */
async function checkAuthentication(request: NextRequest): Promise<{
  authenticated: boolean
  userId?: string
}> {
  try {
    // Check for session token in cookies
    const sessionToken = request.cookies.get('next-auth.session-token') ||
                        request.cookies.get('__Secure-next-auth.session-token')

    if (!sessionToken) {
      return { authenticated: false }
    }

    // For MVP, we'll do a simple session validation
    // In production, this would validate against the database
    const userId = request.headers.get('x-user-id')

    return {
      authenticated: true,
      userId: userId || undefined
    }
  } catch (error) {
    console.error('❌ Authentication check failed:', error)
    return { authenticated: false }
  }
}

/**
 * Middleware configuration
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
    '/api/:path*'
  ]
}