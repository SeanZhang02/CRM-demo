/**
 * Security Headers Configuration
 *
 * Implements comprehensive security headers for:
 * - Content Security Policy (CSP)
 * - Cross-Origin protections
 * - Data protection
 * - Attack prevention
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Production-ready security headers
 */
export const SECURITY_HEADERS = {
  // Prevent MIME-type sniffing
  'X-Content-Type-Options': 'nosniff',

  // Prevent page embedding in frames (clickjacking protection)
  'X-Frame-Options': 'DENY',

  // Enable XSS filtering
  'X-XSS-Protection': '1; mode=block',

  // Control referrer information
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // Restrict dangerous browser features
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=()',
    'usb=()',
    'bluetooth=()',
    'magnetometer=()',
    'gyroscope=()',
    'accelerometer=()'
  ].join(', '),

  // Strict Transport Security (HTTPS only)
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',

  // Content Security Policy
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://vercel.com https://vitals.vercel-insights.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: https: blob:",
    "media-src 'self' data: blob:",
    "connect-src 'self' https://vercel.live https://vitals.vercel-insights.com https://*.supabase.co wss://*.supabase.co",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; ')
} as const

/**
 * API-specific CORS headers
 */
export const getCorsHeaders = (origin?: string) => {
  const allowedOrigins = [
    process.env.NEXTAUTH_URL,
    process.env.FRONTEND_URL,
    'https://*.vercel.app',
    'http://localhost:3000', // Development
    'http://localhost:3001'  // Development
  ].filter(Boolean)

  const isAllowedOrigin = origin && allowedOrigins.some(allowed => {
    if (allowed?.includes('*')) {
      const pattern = allowed.replace('*', '.*')
      return new RegExp(pattern).test(origin)
    }
    return allowed === origin
  })

  return {
    'Access-Control-Allow-Origin': isAllowedOrigin ? origin : 'null',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
    'Access-Control-Allow-Headers': [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Cache-Control',
      'X-File-Name'
    ].join(', '),
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400', // 24 hours
    'Vary': 'Origin'
  }
}

/**
 * Rate limiting headers
 */
export const getRateLimitHeaders = (
  limit: number,
  remaining: number,
  resetTime: number
) => ({
  'X-RateLimit-Limit': limit.toString(),
  'X-RateLimit-Remaining': remaining.toString(),
  'X-RateLimit-Reset': resetTime.toString(),
  'Retry-After': remaining === 0 ? Math.ceil((resetTime - Date.now()) / 1000).toString() : undefined
})

/**
 * Security middleware for API routes
 */
export const withSecurity = (
  handler: (req: NextRequest) => Promise<NextResponse>
) => {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      // Execute the handler
      const response = await handler(req)

      // Apply security headers
      Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
        response.headers.set(key, value)
      })

      // Apply CORS headers for API routes
      if (req.nextUrl.pathname.startsWith('/api/')) {
        const origin = req.headers.get('origin')
        const corsHeaders = getCorsHeaders(origin || undefined)

        Object.entries(corsHeaders).forEach(([key, value]) => {
          if (value) {
            response.headers.set(key, value)
          }
        })
      }

      return response
    } catch (error) {
      console.error('Security middleware error:', error)

      // Return secure error response
      const errorResponse = NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )

      // Apply security headers even to error responses
      Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
        errorResponse.headers.set(key, value)
      })

      return errorResponse
    }
  }
}

/**
 * Content type validation middleware
 */
export const validateContentType = (
  allowedTypes: string[] = ['application/json']
) => {
  return (req: NextRequest): boolean => {
    const contentType = req.headers.get('content-type')

    if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
      return true // No content type validation needed
    }

    if (!contentType) {
      return false
    }

    return allowedTypes.some(type => contentType.includes(type))
  }
}

/**
 * Request size validation
 */
export const validateRequestSize = (maxSizeBytes: number = 10 * 1024 * 1024) => {
  return (req: NextRequest): boolean => {
    const contentLength = req.headers.get('content-length')

    if (!contentLength) {
      return true // Allow requests without content-length (browser will handle)
    }

    const size = parseInt(contentLength, 10)
    return size <= maxSizeBytes
  }
}

/**
 * Security audit middleware
 */
export const withSecurityAudit = (
  handler: (req: NextRequest) => Promise<NextResponse>
) => {
  return async (req: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now()
    const userAgent = req.headers.get('user-agent') || 'unknown'
    const ip = req.headers.get('x-forwarded-for') ||
               req.headers.get('x-real-ip') ||
               'unknown'

    // Security checks
    const securityChecks = {
      hasValidContentType: validateContentType()(req),
      hasValidSize: validateRequestSize()(req),
      isFromAllowedOrigin: true, // Will be set based on CORS check
      hasSuspiciousPatterns: checkSuspiciousPatterns(req)
    }

    // Log suspicious requests
    if (securityChecks.hasSuspiciousPatterns) {
      console.warn('🚨 Suspicious request detected:', {
        method: req.method,
        url: req.url,
        userAgent,
        ip,
        timestamp: new Date().toISOString()
      })
    }

    try {
      const response = await handler(req)
      const duration = Date.now() - startTime

      // Log security metrics
      if (process.env.NODE_ENV === 'production') {
        console.log('🔒 Security audit:', {
          method: req.method,
          path: req.nextUrl.pathname,
          status: response.status,
          duration,
          ip,
          userAgent: userAgent.substring(0, 100),
          securityChecks
        })
      }

      return response
    } catch (error) {
      console.error('🚨 Security audit - handler error:', error)
      throw error
    }
  }
}

/**
 * Check for suspicious request patterns
 */
const checkSuspiciousPatterns = (req: NextRequest): boolean => {
  const suspiciousPatterns = [
    /\.\.\//,           // Path traversal
    /<script/i,         // XSS attempts
    /union.*select/i,   // SQL injection
    /javascript:/i,     // JavaScript injection
    /eval\(/i,          // Code injection
    /%00/,              // Null byte injection
    /base64_decode/i,   // Base64 decode attempts
    /exec\(/i,          // Command execution
    /system\(/i         // System command attempts
  ]

  const url = req.url
  const userAgent = req.headers.get('user-agent') || ''

  return suspiciousPatterns.some(pattern =>
    pattern.test(url) || pattern.test(userAgent)
  )
}

/**
 * Generate Content Security Policy nonce
 */
export const generateCSPNonce = (): string => {
  const buffer = new Uint8Array(16)
  crypto.getRandomValues(buffer)
  return Buffer.from(buffer).toString('base64')
}

/**
 * Dynamic CSP header with nonce
 */
export const getDynamicCSP = (nonce: string): string => {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' https://vercel.live`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests"
  ].join('; ')
}