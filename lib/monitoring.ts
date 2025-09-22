/**
 * Production Monitoring and Error Tracking System
 * Comprehensive observability for CRM system
 */

import { NextRequest } from 'next/server';

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Performance metric types
export enum MetricType {
  API_RESPONSE_TIME = 'api_response_time',
  DATABASE_QUERY_TIME = 'database_query_time',
  PAGE_LOAD_TIME = 'page_load_time',
  USER_ACTION = 'user_action',
  ERROR_COUNT = 'error_count',
  CACHE_HIT_RATE = 'cache_hit_rate'
}

// Error context interface
interface ErrorContext {
  userId?: string;
  requestId?: string;
  url?: string;
  method?: string;
  userAgent?: string;
  ip?: string;
  timestamp: string;
  environment: string;
  version?: string;
  extra?: Record<string, any>;
}

// Performance metric interface
interface PerformanceMetric {
  type: MetricType;
  value: number;
  unit: string;
  timestamp: string;
  tags?: Record<string, string>;
  context?: Record<string, any>;
}

// Alert configuration
interface AlertConfig {
  threshold: number;
  window: number; // Time window in minutes
  severity: ErrorSeverity;
  enabled: boolean;
}

class MonitoringService {
  private metrics: PerformanceMetric[] = [];
  private errors: Array<{ error: Error; context: ErrorContext; severity: ErrorSeverity }> = [];
  private alerts: Map<string, AlertConfig> = new Map();

  constructor() {
    this.setupDefaultAlerts();
  }

  private setupDefaultAlerts() {
    this.alerts.set('api_response_time_high', {
      threshold: 2000, // 2 seconds
      window: 5,
      severity: ErrorSeverity.HIGH,
      enabled: true
    });

    this.alerts.set('database_query_time_high', {
      threshold: 1000, // 1 second
      window: 5,
      severity: ErrorSeverity.MEDIUM,
      enabled: true
    });

    this.alerts.set('error_rate_high', {
      threshold: 10, // 10 errors per minute
      window: 1,
      severity: ErrorSeverity.CRITICAL,
      enabled: true
    });
  }

  /**
   * Track performance metrics
   */
  recordMetric(
    type: MetricType,
    value: number,
    unit: string = 'ms',
    tags?: Record<string, string>,
    context?: Record<string, any>
  ): void {
    const metric: PerformanceMetric = {
      type,
      value,
      unit,
      timestamp: new Date().toISOString(),
      tags,
      context
    };

    this.metrics.push(metric);

    // Keep only last 1000 metrics in memory
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    // Check for alerts
    this.checkAlerts(metric);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Metric: ${type} = ${value}${unit}`, tags);
    }
  }

  /**
   * Track errors with context
   */
  recordError(
    error: Error,
    context: Partial<ErrorContext> = {},
    severity: ErrorSeverity = ErrorSeverity.MEDIUM
  ): void {
    const fullContext: ErrorContext = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      version: process.env.npm_package_version || '1.0.0',
      ...context
    };

    this.errors.push({ error, context: fullContext, severity });

    // Keep only last 500 errors in memory
    if (this.errors.length > 500) {
      this.errors = this.errors.slice(-500);
    }

    // Log to console
    console.error(`🚨 Error [${severity}]:`, error.message, fullContext);

    // In production, send to external service
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalService(error, fullContext, severity);
    }

    // Record error metric
    this.recordMetric(MetricType.ERROR_COUNT, 1, 'count', {
      severity,
      errorType: error.constructor.name
    });
  }

  /**
   * Check if metrics trigger alerts
   */
  private checkAlerts(metric: PerformanceMetric): void {
    for (const [alertName, config] of this.alerts) {
      if (!config.enabled) continue;

      const shouldAlert = this.evaluateAlert(alertName, metric, config);
      if (shouldAlert) {
        this.triggerAlert(alertName, metric, config);
      }
    }
  }

  private evaluateAlert(
    alertName: string,
    metric: PerformanceMetric,
    config: AlertConfig
  ): boolean {
    // Simple threshold-based alerting
    if (alertName.includes('response_time') && metric.type === MetricType.API_RESPONSE_TIME) {
      return metric.value > config.threshold;
    }

    if (alertName.includes('query_time') && metric.type === MetricType.DATABASE_QUERY_TIME) {
      return metric.value > config.threshold;
    }

    if (alertName.includes('error_rate') && metric.type === MetricType.ERROR_COUNT) {
      // Count errors in the last window
      const windowStart = Date.now() - (config.window * 60 * 1000);
      const recentErrors = this.metrics.filter(m =>
        m.type === MetricType.ERROR_COUNT &&
        new Date(m.timestamp).getTime() > windowStart
      );

      return recentErrors.length > config.threshold;
    }

    return false;
  }

  private triggerAlert(
    alertName: string,
    metric: PerformanceMetric,
    config: AlertConfig
  ): void {
    console.warn(`🚨 ALERT: ${alertName}`, {
      metric: metric.type,
      value: metric.value,
      threshold: config.threshold,
      severity: config.severity
    });

    // In production, send to alerting service
    if (process.env.NODE_ENV === 'production') {
      this.sendAlert(alertName, metric, config);
    }
  }

  /**
   * Send error to external monitoring service
   */
  private async sendToExternalService(
    error: Error,
    context: ErrorContext,
    severity: ErrorSeverity
  ): Promise<void> {
    try {
      // Example: Send to Sentry
      if (process.env.SENTRY_DSN) {
        // In a real implementation, use @sentry/nextjs
        console.log('Sending error to Sentry:', error.message);
      }

      // Example: Send to custom webhook
      if (process.env.ERROR_WEBHOOK_URL) {
        await fetch(process.env.ERROR_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: {
              message: error.message,
              stack: error.stack,
              name: error.name
            },
            context,
            severity,
            timestamp: context.timestamp
          })
        });
      }

    } catch (sendError) {
      console.error('Failed to send error to external service:', sendError);
    }
  }

  /**
   * Send alert to external service
   */
  private async sendAlert(
    alertName: string,
    metric: PerformanceMetric,
    config: AlertConfig
  ): Promise<void> {
    try {
      // Example: Send to Slack webhook
      if (process.env.SLACK_WEBHOOK_URL) {
        await fetch(process.env.SLACK_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `🚨 CRM Alert: ${alertName}`,
            attachments: [{
              color: config.severity === ErrorSeverity.CRITICAL ? 'danger' : 'warning',
              fields: [
                { title: 'Metric', value: metric.type, short: true },
                { title: 'Value', value: `${metric.value}${metric.unit}`, short: true },
                { title: 'Threshold', value: `${config.threshold}${metric.unit}`, short: true },
                { title: 'Severity', value: config.severity, short: true }
              ]
            }]
          })
        });
      }

    } catch (alertError) {
      console.error('Failed to send alert:', alertError);
    }
  }

  /**
   * Get performance summary
   */
  getMetricsSummary(type?: MetricType, windowMinutes: number = 60): {
    count: number;
    average: number;
    min: number;
    max: number;
    p95: number;
  } {
    const windowStart = Date.now() - (windowMinutes * 60 * 1000);
    let relevantMetrics = this.metrics.filter(m =>
      new Date(m.timestamp).getTime() > windowStart
    );

    if (type) {
      relevantMetrics = relevantMetrics.filter(m => m.type === type);
    }

    if (relevantMetrics.length === 0) {
      return { count: 0, average: 0, min: 0, max: 0, p95: 0 };
    }

    const values = relevantMetrics.map(m => m.value).sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);

    return {
      count: values.length,
      average: sum / values.length,
      min: values[0],
      max: values[values.length - 1],
      p95: values[Math.floor(values.length * 0.95)] || values[values.length - 1]
    };
  }

  /**
   * Get error summary
   */
  getErrorSummary(windowMinutes: number = 60): {
    totalErrors: number;
    errorsBySeverity: Record<ErrorSeverity, number>;
    errorsByType: Record<string, number>;
  } {
    const windowStart = Date.now() - (windowMinutes * 60 * 1000);
    const recentErrors = this.errors.filter(e =>
      new Date(e.context.timestamp).getTime() > windowStart
    );

    const errorsBySeverity = Object.values(ErrorSeverity).reduce((acc, severity) => {
      acc[severity] = recentErrors.filter(e => e.severity === severity).length;
      return acc;
    }, {} as Record<ErrorSeverity, number>);

    const errorsByType = recentErrors.reduce((acc, e) => {
      const type = e.error.constructor.name;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalErrors: recentErrors.length,
      errorsBySeverity,
      errorsByType
    };
  }
}

// Global monitoring instance
const monitoring = new MonitoringService();

/**
 * Request monitoring middleware
 */
export function createRequestMiddleware(request: NextRequest) {
  const startTime = Date.now();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const context: Partial<ErrorContext> = {
    requestId,
    url: request.url,
    method: request.method,
    userAgent: request.headers.get('user-agent') || undefined,
    ip: request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        'unknown'
  };

  return {
    recordMetric: (type: MetricType, value: number, unit?: string, tags?: Record<string, string>) =>
      monitoring.recordMetric(type, value, unit, { ...tags, requestId }, context),

    recordError: (error: Error, severity?: ErrorSeverity) =>
      monitoring.recordError(error, context, severity),

    finish: () => {
      const duration = Date.now() - startTime;
      monitoring.recordMetric(
        MetricType.API_RESPONSE_TIME,
        duration,
        'ms',
        { method: request.method, endpoint: new URL(request.url).pathname }
      );
    }
  };
}

/**
 * Database query monitoring wrapper
 */
export function withDatabaseMetrics<T>(
  operation: () => Promise<T>,
  queryName: string
): Promise<T> {
  const startTime = Date.now();

  return operation()
    .then(result => {
      const duration = Date.now() - startTime;
      monitoring.recordMetric(
        MetricType.DATABASE_QUERY_TIME,
        duration,
        'ms',
        { queryName }
      );
      return result;
    })
    .catch(error => {
      const duration = Date.now() - startTime;
      monitoring.recordMetric(
        MetricType.DATABASE_QUERY_TIME,
        duration,
        'ms',
        { queryName, status: 'error' }
      );
      monitoring.recordError(error, { extra: { queryName } }, ErrorSeverity.HIGH);
      throw error;
    });
}

/**
 * Export monitoring utilities
 */
export const Monitor = {
  // Core functions
  recordMetric: monitoring.recordMetric.bind(monitoring),
  recordError: monitoring.recordError.bind(monitoring),

  // Wrappers
  withDatabaseMetrics,
  createRequestMiddleware,

  // Analytics
  getMetricsSummary: monitoring.getMetricsSummary.bind(monitoring),
  getErrorSummary: monitoring.getErrorSummary.bind(monitoring),

  // Constants
  ErrorSeverity,
  MetricType
};

export default Monitor;