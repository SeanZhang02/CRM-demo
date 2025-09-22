import { NextRequest, NextResponse } from 'next/server'
import { getSystemMetrics, getMemoryUsage } from '@/lib/monitoring/performance'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * System Metrics API Endpoint
 *
 * Provides detailed system performance metrics for monitoring dashboards
 * and alerting systems. This endpoint should be secured and only accessible
 * to monitoring systems.
 */
export async function GET(request: NextRequest) {
  try {
    // Security: Validate monitoring access
    const authHeader = request.headers.get('authorization')
    const monitoringSecret = process.env.HEALTH_CHECK_SECRET

    if (process.env.NODE_ENV === 'production' && monitoringSecret) {
      if (!authHeader || authHeader !== `Bearer ${monitoringSecret}`) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
    }

    // ========================================================================
    // COLLECT SYSTEM METRICS
    // ========================================================================
    const systemMetrics = getSystemMetrics()
    const memoryUsage = getMemoryUsage()

    // ========================================================================
    // DATABASE PERFORMANCE METRICS
    // ========================================================================
    const dbStartTime = Date.now()

    // Test database performance with multiple queries
    const [
      userCount,
      companyCount,
      contactCount,
      dealCount,
      activityCount
    ] = await Promise.all([
      prisma.user.count(),
      prisma.company.count(),
      prisma.contact.count(),
      prisma.deal.count(),
      prisma.activity.count()
    ])

    const dbLatency = Date.now() - dbStartTime

    // Get database connection info
    const dbConnectionTest = await prisma.$queryRaw`
      SELECT
        count(*) as active_connections,
        current_database() as database_name,
        version() as database_version
    ` as any[]

    const dbInfo = dbConnectionTest[0] || {}

    // ========================================================================
    // APPLICATION PERFORMANCE METRICS
    // ========================================================================
    const metrics = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      version: process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7) || 'dev',
      region: process.env.VERCEL_REGION || 'local',

      // System Performance
      system: {
        ...systemMetrics,
        loadAverage: process.platform === 'linux' ? (require('os').loadavg() || []) : [],
        cpuUsage: process.cpuUsage()
      },

      // Memory Metrics
      memory: {
        ...memoryUsage,
        // Calculate memory efficiency
        efficiency: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100),
        // Memory pressure indicator
        pressure: memoryUsage.heapUsed > 400 ? 'high' : memoryUsage.heapUsed > 200 ? 'medium' : 'low'
      },

      // Database Metrics
      database: {
        latency: dbLatency,
        status: dbLatency < 50 ? 'excellent' : dbLatency < 100 ? 'good' : dbLatency < 200 ? 'slow' : 'critical',
        connectionInfo: {
          activeConnections: dbInfo.active_connections || 'unknown',
          databaseName: dbInfo.database_name || 'unknown',
          version: dbInfo.database_version || 'unknown'
        },
        recordCounts: {
          users: userCount,
          companies: companyCount,
          contacts: contactCount,
          deals: dealCount,
          activities: activityCount,
          total: userCount + companyCount + contactCount + dealCount + activityCount
        }
      },

      // Application Health Indicators
      health: {
        overallStatus: calculateOverallStatus({
          memoryPressure: memoryUsage.percentage,
          dbLatency,
          uptime: systemMetrics.uptime.seconds
        }),
        alerts: generateAlerts({
          memoryUsage: memoryUsage.heapUsed,
          dbLatency,
          uptime: systemMetrics.uptime.seconds
        })
      },

      // Performance Benchmarks
      benchmarks: {
        databaseQuery: {
          target: 100, // ms
          actual: dbLatency,
          status: dbLatency <= 100 ? 'pass' : 'fail'
        },
        memoryUsage: {
          target: 80, // % of heap
          actual: memoryUsage.percentage,
          status: memoryUsage.percentage <= 80 ? 'pass' : 'fail'
        },
        uptime: {
          target: 300, // 5 minutes minimum
          actual: systemMetrics.uptime.seconds,
          status: systemMetrics.uptime.seconds >= 300 ? 'pass' : 'warming_up'
        }
      }
    }

    return NextResponse.json(metrics, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    })

  } catch (error) {
    console.error('❌ Metrics collection failed:', error)

    return NextResponse.json(
      {
        error: 'Failed to collect metrics',
        timestamp: new Date().toISOString(),
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

/**
 * Calculate overall system health status
 */
function calculateOverallStatus(params: {
  memoryPressure: number
  dbLatency: number
  uptime: number
}): 'healthy' | 'degraded' | 'critical' {
  const { memoryPressure, dbLatency, uptime } = params

  // Critical conditions
  if (memoryPressure > 90 || dbLatency > 500) {
    return 'critical'
  }

  // Degraded conditions
  if (memoryPressure > 80 || dbLatency > 200 || uptime < 300) {
    return 'degraded'
  }

  return 'healthy'
}

/**
 * Generate alerts based on system metrics
 */
function generateAlerts(params: {
  memoryUsage: number
  dbLatency: number
  uptime: number
}): Array<{ level: 'warning' | 'critical'; message: string; metric: string; value: number }> {
  const alerts = []
  const { memoryUsage, dbLatency, uptime } = params

  // Memory alerts
  if (memoryUsage > 500) {
    alerts.push({
      level: 'critical' as const,
      message: 'High memory usage detected',
      metric: 'memory_mb',
      value: memoryUsage
    })
  } else if (memoryUsage > 400) {
    alerts.push({
      level: 'warning' as const,
      message: 'Memory usage above recommended threshold',
      metric: 'memory_mb',
      value: memoryUsage
    })
  }

  // Database latency alerts
  if (dbLatency > 500) {
    alerts.push({
      level: 'critical' as const,
      message: 'Database response time critically slow',
      metric: 'db_latency_ms',
      value: dbLatency
    })
  } else if (dbLatency > 200) {
    alerts.push({
      level: 'warning' as const,
      message: 'Database response time above threshold',
      metric: 'db_latency_ms',
      value: dbLatency
    })
  }

  // Uptime alerts
  if (uptime < 300) {
    alerts.push({
      level: 'warning' as const,
      message: 'Application recently restarted',
      metric: 'uptime_seconds',
      value: uptime
    })
  }

  return alerts
}

/**
 * OPTIONS handler for CORS
 */
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Authorization',
      'Access-Control-Max-Age': '300'
    }
  })
}