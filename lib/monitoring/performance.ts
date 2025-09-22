/**
 * Performance Monitoring Utilities
 *
 * Provides tools for tracking and optimizing application performance:
 * - Database query monitoring
 * - API response time tracking
 * - Memory usage monitoring
 * - User experience metrics
 */

import { trackDatabaseQuery, trackApiEndpoint, trackBusinessMetric } from './sentry'

/**
 * High-resolution timer for precise performance measurements
 */
export class PerformanceTimer {
  private startTime: number
  private label: string

  constructor(label: string) {
    this.label = label
    this.startTime = performance.now()
  }

  /**
   * End the timer and return duration in milliseconds
   */
  end(): number {
    const duration = performance.now() - this.startTime
    return Math.round(duration * 100) / 100 // Round to 2 decimal places
  }

  /**
   * End timer and log to monitoring
   */
  endAndLog(category: string = 'performance'): number {
    const duration = this.end()

    trackBusinessMetric(`${category}_duration`, duration, {
      operation: this.label
    })

    // Log slow operations
    if (duration > 1000) {
      console.warn(`⚠️  Slow operation: ${this.label} took ${duration}ms`)
    }

    return duration
  }
}

/**
 * Database query performance wrapper
 */
export const withDatabaseMonitoring = async <T>(
  queryName: string,
  queryFn: () => Promise<T>
): Promise<T> => {
  const timer = new PerformanceTimer(`db:${queryName}`)

  try {
    const result = await queryFn()
    const duration = timer.end()

    // Track the query performance
    trackDatabaseQuery(queryName, duration)

    // Log slow queries
    if (duration > 100) {
      console.warn(`🐌 Slow query: ${queryName} (${duration}ms)`)
    }

    return result
  } catch (error) {
    const duration = timer.end()
    trackDatabaseQuery(queryName, duration)

    console.error(`❌ Database query failed: ${queryName} (${duration}ms)`, error)
    throw error
  }
}

/**
 * API endpoint performance wrapper
 */
export const withApiMonitoring = <T extends Record<string, any>>(
  endpoint: string,
  method: string,
  handler: () => Promise<T>
) => {
  return async (): Promise<T> => {
    const timer = new PerformanceTimer(`api:${method}:${endpoint}`)
    let statusCode = 200

    try {
      const result = await handler()
      statusCode = result.status || 200

      const duration = timer.end()
      trackApiEndpoint(endpoint, method, duration, statusCode)

      return result
    } catch (error) {
      statusCode = 500
      const duration = timer.end()
      trackApiEndpoint(endpoint, method, duration, statusCode)

      throw error
    }
  }
}

/**
 * Memory usage monitoring
 */
export const getMemoryUsage = () => {
  const usage = process.memoryUsage()

  return {
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
    external: Math.round(usage.external / 1024 / 1024), // MB
    rss: Math.round(usage.rss / 1024 / 1024), // MB
    percentage: Math.round((usage.heapUsed / usage.heapTotal) * 100)
  }
}

/**
 * System resource monitoring
 */
export const getSystemMetrics = () => {
  const memUsage = getMemoryUsage()
  const uptime = process.uptime()

  return {
    memory: memUsage,
    uptime: {
      seconds: Math.floor(uptime),
      human: formatUptime(uptime)
    },
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch
  }
}

/**
 * Format uptime in human-readable format
 */
const formatUptime = (seconds: number): string => {
  const days = Math.floor(seconds / (24 * 60 * 60))
  const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60))
  const minutes = Math.floor((seconds % (60 * 60)) / 60)

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else {
    return `${minutes}m`
  }
}

/**
 * Performance benchmarking utility
 */
export const benchmark = async <T>(
  name: string,
  fn: () => Promise<T>,
  iterations: number = 1
): Promise<{ result: T; stats: { avg: number; min: number; max: number } }> => {
  const durations: number[] = []
  let lastResult: T

  for (let i = 0; i < iterations; i++) {
    const timer = new PerformanceTimer(name)
    lastResult = await fn()
    durations.push(timer.end())
  }

  const stats = {
    avg: durations.reduce((a, b) => a + b, 0) / durations.length,
    min: Math.min(...durations),
    max: Math.max(...durations)
  }

  console.log(`📊 Benchmark ${name}:`, {
    iterations,
    ...stats,
    unit: 'ms'
  })

  return { result: lastResult!, stats }
}

/**
 * Rate limiting monitoring
 */
export const trackRateLimit = (
  endpoint: string,
  clientId: string,
  remaining: number,
  limit: number
) => {
  const utilizationPercent = ((limit - remaining) / limit) * 100

  trackBusinessMetric('rate_limit_utilization', utilizationPercent, {
    endpoint,
    client_id: clientId
  })

  // Alert if rate limit is being heavily used
  if (utilizationPercent > 80) {
    console.warn(`⚠️  High rate limit utilization: ${utilizationPercent.toFixed(1)}% for ${endpoint}`)
  }
}

/**
 * Client-side performance metrics (for monitoring user experience)
 */
export const trackClientPerformance = (metrics: {
  pageLoadTime?: number
  timeToInteractive?: number
  firstContentfulPaint?: number
  largestContentfulPaint?: number
  cumulativeLayoutShift?: number
}) => {
  Object.entries(metrics).forEach(([metric, value]) => {
    if (value !== undefined) {
      trackBusinessMetric(`client_${metric}`, value, {
        page: window.location.pathname
      })
    }
  })
}

/**
 * Feature performance tracking
 */
export const trackFeaturePerformance = (
  feature: string,
  operation: string,
  duration: number,
  success: boolean = true
) => {
  trackBusinessMetric('feature_performance', duration, {
    feature,
    operation,
    success: success.toString()
  })

  // Log slow feature operations
  if (duration > 2000) {
    console.warn(`🐌 Slow feature operation: ${feature}.${operation} (${duration}ms)`)
  }
}