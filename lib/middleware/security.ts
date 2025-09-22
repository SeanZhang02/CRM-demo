import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

/**
 * Rate limiting middleware
 */
export function rateLimit(options: {
  maxRequests?: number
  windowMs?: number
  keyGenerator?: (req: NextRequest) => string
} = {}) {
  const maxRequests = options.maxRequests || parseInt(process.env.RATE_LIMIT_MAX || "100")
  const windowMs = options.windowMs || parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000") // 15 minutes
  const keyGenerator = options.keyGenerator || ((req: NextRequest) => {
    return req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "anonymous"
  })

  return async (req: NextRequest): Promise<NextResponse | null> => {
    const key = keyGenerator(req)
    const now = Date.now()
    const windowStart = now - windowMs

    // Clean up expired entries
    for (const [k, v] of rateLimitStore.entries()) {
      if (v.resetTime < now) {
        rateLimitStore.delete(k)
      }
    }

    // Get or create rate limit entry
    let entry = rateLimitStore.get(key)
    if (!entry || entry.resetTime < now) {
      entry = { count: 0, resetTime: now + windowMs }
      rateLimitStore.set(key, entry)
    }

    // Check rate limit
    if (entry.count >= maxRequests) {
      return NextResponse.json(
        {
          error: "Too many requests",
          message: "Rate limit exceeded. Please try again later.",
          retryAfter: Math.ceil((entry.resetTime - now) / 1000),
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": maxRequests.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": entry.resetTime.toString(),
            "Retry-After": Math.ceil((entry.resetTime - now) / 1000).toString(),
          },
        }
      )
    }

    // Increment counter
    entry.count++

    return null // Allow request to continue
  }
}

/**
 * CSRF protection middleware
 */
export function csrfProtection() {
  return async (req: NextRequest): Promise<NextResponse | null> => {
    // Skip CSRF for GET, HEAD, OPTIONS
    if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      return null
    }

    const origin = req.headers.get("origin")
    const host = req.headers.get("host")
    const referer = req.headers.get("referer")

    // Check origin header
    if (origin) {
      const originUrl = new URL(origin)
      if (originUrl.host !== host) {
        return NextResponse.json(
          { error: "CSRF protection: Invalid origin" },
          { status: 403 }
        )
      }
    }

    // Check referer header as fallback
    if (!origin && referer) {
      const refererUrl = new URL(referer)
      if (refererUrl.host !== host) {
        return NextResponse.json(
          { error: "CSRF protection: Invalid referer" },
          { status: 403 }
        )
      }
    }

    // Require either origin or referer for state-changing operations
    if (!origin && !referer) {
      return NextResponse.json(
        { error: "CSRF protection: Missing origin and referer headers" },
        { status: 403 }
      )
    }

    return null // Allow request to continue
  }
}

/**
 * Input sanitization helpers
 */
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, "") // Remove potential XSS characters
    .substring(0, 1000) // Limit length
}

export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim()
}

export function sanitizeObject(obj: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {}

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      sanitized[key] = sanitizeString(value)
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeObject(value)
    } else {
      sanitized[key] = value
    }
  }

  return sanitized
}

/**
 * Request validation middleware
 */
export function validateRequest<T>(schema: z.ZodSchema<T>) {
  return async (req: NextRequest): Promise<{ data?: T; error?: NextResponse }> => {
    try {
      let body: any

      if (req.method !== "GET" && req.method !== "DELETE") {
        body = await req.json()
        body = sanitizeObject(body)
      }

      const validation = schema.safeParse(body)

      if (!validation.success) {
        return {
          error: NextResponse.json(
            {
              error: "Validation failed",
              details: validation.error.errors.map(err => ({
                field: err.path.join("."),
                message: err.message,
              })),
            },
            { status: 400 }
          )
        }
      }

      return { data: validation.data }
    } catch (error) {
      return {
        error: NextResponse.json(
          { error: "Invalid JSON in request body" },
          { status: 400 }
        )
      }
    }
  }
}

/**
 * Security headers middleware
 */
export function securityHeaders() {
  return (response: NextResponse): NextResponse => {
    // Set security headers
    response.headers.set("X-Content-Type-Options", "nosniff")
    response.headers.set("X-Frame-Options", "DENY")
    response.headers.set("X-XSS-Protection", "1; mode=block")
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
    response.headers.set(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
    )
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
    )

    return response
  }
}

/**
 * Combined security middleware
 */
export async function applySecurity(
  req: NextRequest,
  options: {
    rateLimit?: boolean
    csrf?: boolean
    rateLimitOptions?: Parameters<typeof rateLimit>[0]
  } = {}
): Promise<NextResponse | null> {
  const { rateLimit: enableRateLimit = true, csrf = true, rateLimitOptions } = options

  // Apply rate limiting
  if (enableRateLimit) {
    const rateLimitResponse = await rateLimit(rateLimitOptions)(req)
    if (rateLimitResponse) {
      return rateLimitResponse
    }
  }

  // Apply CSRF protection
  if (csrf) {
    const csrfResponse = await csrfProtection()(req)
    if (csrfResponse) {
      return csrfResponse
    }
  }

  return null // All security checks passed
}

/**
 * Wrapper for API routes with security middleware
 */
export function secureRoute(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options?: Parameters<typeof applySecurity>[1]
) {
  return async (req: NextRequest) => {
    // Apply security middleware
    const securityResponse = await applySecurity(req, options)
    if (securityResponse) {
      return securityResponse
    }

    // Execute handler
    const response = await handler(req)

    // Apply security headers
    return securityHeaders()(response)
  }
}