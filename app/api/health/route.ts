import { NextRequest, NextResponse } from 'next/server'
import { Monitor, MetricType } from '@/lib/monitoring'
import { successResponse, handleError, methodNotAllowed, createPerformanceLogger } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
  const perf = createPerformanceLogger('GET /api/health')
  const startTime = Date.now()
  const { searchParams } = new URL(request.url);
  const detailed = searchParams.get('detailed') === 'true';

  try {
    // Basic health check
    const health = {
      status: 'healthy' as 'healthy' | 'unhealthy' | 'degraded',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'unknown',
      uptime: process.uptime(),
      checks: {} as Record<string, any>
    };

    // Enhanced database health check
    try {
      const { db } = await import('@/lib/database');
      const { prisma } = await import('@/lib/prisma');
      const dbHealth = await db.health();
      health.checks.database = {
        status: dbHealth.status,
        latency: dbHealth.latency,
        version: dbHealth.version
      };

      if (dbHealth.status === 'unhealthy') {
        health.status = 'unhealthy';
      }

      // Get basic system stats
      const [
        companiesCount,
        contactsCount,
        dealsCount,
        activitiesCount,
        pipelineStagesCount
      ] = await Promise.all([
        prisma.company.count({ where: { isDeleted: false } }),
        prisma.contact.count({ where: { isDeleted: false } }),
        prisma.deal.count({ where: { isDeleted: false } }),
        prisma.activity.count({ where: { isDeleted: false } }),
        prisma.pipelineStage.count({ where: { isActive: true } })
      ]);

      health.checks.database.stats = {
        companies: companiesCount,
        contacts: contactsCount,
        deals: dealsCount,
        activities: activitiesCount,
        pipelineStages: pipelineStagesCount,
        total: companiesCount + contactsCount + dealsCount + activitiesCount
      };

    } catch (error) {
      health.checks.database = {
        status: 'unhealthy',
        error: (error as Error).message
      };
      health.status = 'unhealthy';
    }

    // Cache health check
    try {
      const { cache } = await import('@/lib/cache');
      const cacheStats = cache.getStats();
      health.checks.cache = {
        status: 'healthy',
        stats: cacheStats,
        hitRate: cacheStats.total > 0 ? (cacheStats.valid / cacheStats.total * 100).toFixed(1) + '%' : '0%'
      };
    } catch (error) {
      health.checks.cache = {
        status: 'unhealthy',
        error: (error as Error).message
      };
      health.status = 'degraded';
    }

    // Memory usage check
    const memUsage = process.memoryUsage();
    const memoryHealthy = memUsage.heapUsed / memUsage.heapTotal < 0.9;
    health.checks.memory = {
      status: memoryHealthy ? 'healthy' : 'warning',
      usage: {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024),
        rss: Math.round(memUsage.rss / 1024 / 1024)
      },
      unit: 'MB',
      utilization: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100) + '%'
    };

    if (detailed) {
      // Performance metrics summary (last hour)
      health.checks.performance = {
        apiResponseTime: Monitor.getMetricsSummary(MetricType.API_RESPONSE_TIME, 60),
        databaseQueryTime: Monitor.getMetricsSummary(MetricType.DATABASE_QUERY_TIME, 60),
        errors: Monitor.getErrorSummary(60)
      };

      // Database connection pool stats
      try {
        const { db } = await import('@/lib/database');
        const poolStats = await db.getPoolStats();
        if (poolStats) {
          health.checks.connectionPool = {
            status: 'healthy',
            stats: poolStats
          };
        }
      } catch (error) {
        health.checks.connectionPool = {
          status: 'unknown',
          error: 'Could not retrieve pool stats'
        };
      }
    }

    // Calculate overall response time
    const responseTime = Date.now() - startTime;
    health.checks.responseTime = {
      value: responseTime,
      unit: 'ms',
      status: responseTime < 200 ? 'healthy' : responseTime < 500 ? 'warning' : 'unhealthy',
      target: '< 200ms'
    };

    // Record health check metric
    Monitor.recordMetric(MetricType.API_RESPONSE_TIME, responseTime, 'ms', {
      endpoint: '/api/health',
      detailed: detailed.toString()
    });

    // Determine final status based on critical checks
    const criticalChecks = ['database'];
    const hasCriticalFailure = criticalChecks.some(
      check => health.checks[check]?.status === 'unhealthy'
    );

    if (hasCriticalFailure) {
      health.status = 'unhealthy';
    } else if (health.checks.responseTime.status === 'unhealthy' || !memoryHealthy) {
      health.status = 'degraded';
    }

    // Return appropriate HTTP status
    const httpStatus = health.status === 'healthy' ? 200 :
                      health.status === 'degraded' ? 200 :
                      503; // Service Unavailable for unhealthy

    return NextResponse.json(health, {
      status: httpStatus,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;

    Monitor.recordError(error as Error, {
      extra: { endpoint: '/api/health', detailed }
    });

    console.error('Health check failed:', error)
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: (error as Error).message,
      responseTime
    }, {
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    });
  } finally {
    perf.end()
  }
}

// Handle unsupported methods
export async function POST() {
  return methodNotAllowed(['GET'])
}

export async function PUT() {
  return methodNotAllowed(['GET'])
}

export async function DELETE() {
  return methodNotAllowed(['GET'])
}

export async function PATCH() {
  return methodNotAllowed(['GET'])
}