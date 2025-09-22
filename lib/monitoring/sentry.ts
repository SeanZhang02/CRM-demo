/**
 * Sentry Configuration for Error Tracking and Performance Monitoring
 *
 * Provides comprehensive monitoring for:
 * - Runtime errors and exceptions
 * - Performance bottlenecks and slow queries
 * - User session replay (optional)
 * - Custom business metrics
 */

// TODO: Re-enable Sentry monitoring in production
// import * as Sentry from '@sentry/nextjs'
import * as Sentry from './sentry-mock'

export const initSentry = () => {
  if (!process.env.SENTRY_DSN) {
    console.warn('Sentry DSN not configured - error tracking disabled')
    return
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.VERCEL_GIT_COMMIT_SHA || '1.0.0-dev',

    // Performance Monitoring Configuration
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Session Replay (for debugging user issues)
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Filter out noise
    beforeSend(event, hint) {
      // Don't send client-side hydration errors in development
      if (process.env.NODE_ENV === 'development') {
        const error = hint.originalException
        if (error && error.toString().includes('Hydration')) {
          return null
        }
      }

      // Filter out known harmless errors
      const harmlessErrors = [
        'ResizeObserver loop limit exceeded',
        'Non-Error promise rejection captured',
        'Network request failed'
      ]

      if (event.message && harmlessErrors.some(msg => event.message?.includes(msg))) {
        return null
      }

      return event
    },

    // Enhanced error context
    beforeSendTransaction(event) {
      // Add custom tags for better filtering
      event.tags = {
        ...event.tags,
        feature: 'crm',
        platform: 'web'
      }
      return event
    },

    // Configure what data to capture
    integrations: [
      new Sentry.BrowserTracing({
        // Set up automatic route change tracking for Next.js App Router
        routingInstrumentation: Sentry.nextRouterInstrumentation(),
      }),
      new Sentry.Replay({
        // Capture 10% of all sessions for replay
        sessionSampleRate: 0.1,
        // Capture 100% of sessions with an error for replay
        errorSampleRate: 1.0,
      })
    ]
  })
}

/**
 * Custom error logging with enhanced context
 */
export const logError = (
  error: Error,
  context?: {
    user?: { id: string; email?: string }
    extra?: Record<string, any>
    tags?: Record<string, string>
    level?: 'error' | 'warning' | 'info'
  }
) => {
  Sentry.withScope((scope) => {
    // Add user context
    if (context?.user) {
      scope.setUser(context.user)
    }

    // Add extra context
    if (context?.extra) {
      scope.setExtras(context.extra)
    }

    // Add tags for filtering
    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value)
      })
    }

    // Set severity level
    scope.setLevel(context?.level || 'error')

    Sentry.captureException(error)
  })
}

/**
 * Track custom business metrics
 */
export const trackBusinessMetric = (
  metricName: string,
  value: number,
  tags?: Record<string, string>
) => {
  Sentry.addBreadcrumb({
    message: `Business Metric: ${metricName}`,
    level: 'info',
    data: {
      metric: metricName,
      value,
      ...tags
    }
  })
}

/**
 * Track user actions for analytics
 */
export const trackUserAction = (
  action: string,
  properties?: Record<string, any>
) => {
  Sentry.addBreadcrumb({
    message: `User Action: ${action}`,
    level: 'info',
    category: 'user-action',
    data: properties
  })
}

/**
 * Performance monitoring for database queries
 */
export const trackDatabaseQuery = (
  query: string,
  duration: number,
  recordCount?: number
) => {
  if (duration > 100) { // Log slow queries
    Sentry.addBreadcrumb({
      message: `Slow Database Query: ${duration}ms`,
      level: 'warning',
      category: 'database',
      data: {
        query: query.substring(0, 100), // Truncate long queries
        duration,
        recordCount,
        threshold: 100
      }
    })
  }

  // Track as custom metric
  trackBusinessMetric('database_query_duration', duration, {
    query_type: query.split(' ')[0].toLowerCase() // SELECT, INSERT, etc.
  })
}

/**
 * API endpoint performance tracking
 */
export const trackApiEndpoint = (
  endpoint: string,
  method: string,
  duration: number,
  statusCode: number
) => {
  const isError = statusCode >= 400
  const isSlow = duration > 2000

  if (isError || isSlow) {
    Sentry.addBreadcrumb({
      message: `API ${isError ? 'Error' : 'Slow Response'}: ${method} ${endpoint}`,
      level: isError ? 'error' : 'warning',
      category: 'api',
      data: {
        endpoint,
        method,
        duration,
        statusCode,
        threshold: 2000
      }
    })
  }

  // Track API performance metrics
  trackBusinessMetric('api_response_time', duration, {
    endpoint: endpoint.replace(/\/[0-9]+/g, '/:id'), // Normalize dynamic routes
    method,
    status: statusCode.toString()
  })
}

/**
 * Feature usage tracking
 */
export const trackFeatureUsage = (
  feature: string,
  userId?: string,
  metadata?: Record<string, any>
) => {
  Sentry.addBreadcrumb({
    message: `Feature Used: ${feature}`,
    level: 'info',
    category: 'feature-usage',
    data: {
      feature,
      userId,
      timestamp: new Date().toISOString(),
      ...metadata
    }
  })

  trackBusinessMetric('feature_usage', 1, {
    feature,
    user_id: userId || 'anonymous'
  })
}

export default Sentry