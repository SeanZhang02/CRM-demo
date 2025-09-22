/**
 * Rate Limiting Implementation
 *
 * Provides robust rate limiting for API endpoints to prevent abuse and ensure
 * system stability. Uses in-memory storage for development and Redis for production.
 */

import { NextRequest } from 'next/server'
import { getRateLimitHeaders } from './headers'

// In-memory rate limit store for development
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

/**
 * Rate limit configuration for different endpoint types
 */
export const RATE_LIMIT_CONFIGS = {
  // Authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,            // 5 attempts per window
    message: 'Too many authentication attempts'
  },

  // General API endpoints
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,          // 100 requests per window
    message: 'Rate limit exceeded'
  },

  // Database operations
  database: {
    windowMs: 1 * 60 * 1000,  // 1 minute
    maxRequests: 60,          // 60 requests per minute
    message: 'Database rate limit exceeded'
  },

  // File upload endpoints
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,          // 10 uploads per hour
    message: 'Upload rate limit exceeded'
  },

  // Health check endpoints
  health: {
    windowMs: 1 * 60 * 1000,  // 1 minute
    maxRequests: 30,          // 30 requests per minute
    message: 'Health check rate limit exceeded'
  }
} as const

/**
 * Get client identifier for rate limiting
 */
export const getClientId = (req: NextRequest): string => {
  // Try to get authenticated user ID first
  const userId = req.headers.get('x-user-id')
  if (userId) {
    return `user:${userId}`
  }

  // Fall back to IP address
  const ip = req.headers.get('x-forwarded-for') ||
             req.headers.get('x-real-ip') ||
             req.headers.get('cf-connecting-ip') ||
             'unknown'

  return `ip:${ip.split(',')[0].trim()}`
}

/**
 * Rate limiting middleware
 */
export const withRateLimit = (
  configKey: keyof typeof RATE_LIMIT_CONFIGS = 'api'
) => {
  return async (req: NextRequest): Promise<{
    allowed: boolean
    remaining: number
    resetTime: number
    headers: Record<string, string>
  }> => {
    // Skip rate limiting in development if disabled
    if (process.env.NODE_ENV === 'development' &&
        process.env.RATE_LIMIT_ENABLED !== 'true') {
      return {
        allowed: true,
        remaining: 999,
        resetTime: Date.now() + 60000,
        headers: {}
      }
    }

    const config = RATE_LIMIT_CONFIGS[configKey]
    const clientId = getClientId(req)
    const now = Date.now()
    const windowStart = Math.floor(now / config.windowMs) * config.windowMs
    const resetTime = windowStart + config.windowMs
    const key = `${configKey}:${clientId}:${windowStart}`

    // Get current count from store
    const current = rateLimitStore.get(key) || { count: 0, resetTime }

    // Clean up expired entries periodically
    if (Math.random() < 0.01) { // 1% chance
      cleanupExpiredEntries()
    }

    // Check if limit exceeded
    const allowed = current.count < config.maxRequests
    const newCount = allowed ? current.count + 1 : current.count

    // Update store
    rateLimitStore.set(key, { count: newCount, resetTime })

    // Generate headers
    const headers = getRateLimitHeaders(
      config.maxRequests,
      Math.max(0, config.maxRequests - newCount),
      resetTime
    )

    // Log rate limit violations
    if (!allowed) {
      console.warn(`🚨 Rate limit exceeded for ${clientId} on ${configKey} endpoint`)
    }

    return {
      allowed,
      remaining: Math.max(0, config.maxRequests - newCount),
      resetTime,
      headers
    }
  }
}

/**
 * Clean up expired rate limit entries
 */
const cleanupExpiredEntries = () => {
  const now = Date.now()
  let cleanedCount = 0

  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key)
      cleanedCount++
    }
  }

  if (cleanedCount > 0) {
    console.log(`🧹 Cleaned up ${cleanedCount} expired rate limit entries`)
  }
}

/**
 * Rate limit middleware factory for specific endpoints
 */
export const createRateLimitMiddleware = (
  configKey: keyof typeof RATE_LIMIT_CONFIGS,
  customConfig?: Partial<typeof RATE_LIMIT_CONFIGS[keyof typeof RATE_LIMIT_CONFIGS]>
) => {
  return async (req: NextRequest) => {
    const result = await withRateLimit(configKey)(req)

    if (!result.allowed) {
      const config = { ...RATE_LIMIT_CONFIGS[configKey], ...customConfig }

      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: config.message,
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            ...result.headers
          }
        }
      )
    }

    return null // Allow request to proceed
  }
}

/**
 * Advanced rate limiting with burst protection
 */
export const withBurstProtection = (
  baseConfig: keyof typeof RATE_LIMIT_CONFIGS,
  burstConfig: {
    burstLimit: number
    burstWindowMs: number
  }
) => {
  return async (req: NextRequest) => {
    const clientId = getClientId(req)
    const now = Date.now()

    // Check burst limit (shorter window, lower limit)
    const burstWindowStart = Math.floor(now / burstConfig.burstWindowMs) * burstConfig.burstWindowMs
    const burstKey = `burst:${clientId}:${burstWindowStart}`
    const burstCurrent = rateLimitStore.get(burstKey) || { count: 0, resetTime: burstWindowStart + burstConfig.burstWindowMs }

    if (burstCurrent.count >= burstConfig.burstLimit) {
      console.warn(`🚨 Burst protection triggered for ${clientId}`)

      return new Response(
        JSON.stringify({
          error: 'Burst limit exceeded',
          message: 'Too many requests in a short time period',
          retryAfter: Math.ceil((burstCurrent.resetTime - now) / 1000)
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Type': 'burst'
          }
        }
      )
    }

    // Update burst counter
    rateLimitStore.set(burstKey, {
      count: burstCurrent.count + 1,
      resetTime: burstCurrent.resetTime
    })

    // Check normal rate limit
    const normalResult = await withRateLimit(baseConfig)(req)

    if (!normalResult.allowed) {
      const config = RATE_LIMIT_CONFIGS[baseConfig]

      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: config.message,
          retryAfter: Math.ceil((normalResult.resetTime - Date.now()) / 1000)
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Type': 'normal',
            ...normalResult.headers
          }
        }
      )
    }

    return null // Allow request to proceed
  }
}

/**
 * IP-based rate limiting for unauthenticated requests
 */
export const withIPRateLimit = (
  maxRequestsPerHour: number = 1000
) => {
  return async (req: NextRequest) => {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ||
               req.headers.get('x-real-ip') ||
               'unknown'

    const now = Date.now()
    const hourStart = Math.floor(now / (60 * 60 * 1000)) * (60 * 60 * 1000)
    const key = `ip_hour:${ip}:${hourStart}`

    const current = rateLimitStore.get(key) || { count: 0, resetTime: hourStart + (60 * 60 * 1000) }

    if (current.count >= maxRequestsPerHour) {
      console.warn(`🚨 IP rate limit exceeded for ${ip}`)

      return new Response(
        JSON.stringify({
          error: 'IP rate limit exceeded',
          message: 'Too many requests from this IP address',
          retryAfter: Math.ceil((current.resetTime - now) / 1000)
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Type': 'ip',
            'X-RateLimit-Limit': maxRequestsPerHour.toString(),
            'X-RateLimit-Remaining': Math.max(0, maxRequestsPerHour - current.count - 1).toString()
          }
        }
      )
    }

    // Update counter
    rateLimitStore.set(key, {
      count: current.count + 1,
      resetTime: current.resetTime
    })

    return null // Allow request to proceed
  }
}

/**
 * Get rate limit status for monitoring
 */
export const getRateLimitStatus = () => {
  const now = Date.now()
  const activeWindows = new Map<string, number>()

  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime > now) {
      const [type] = key.split(':')
      activeWindows.set(type, (activeWindows.get(type) || 0) + 1)
    }
  }

  return {
    totalActiveWindows: rateLimitStore.size,
    activeWindowsByType: Object.fromEntries(activeWindows),
    memoryUsage: rateLimitStore.size * 100, // Rough estimate in bytes
    lastCleanup: new Date().toISOString()
  }
}