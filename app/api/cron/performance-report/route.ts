import { NextRequest, NextResponse } from 'next/server';
import { Monitor, MetricType } from '@/lib/monitoring';

/**
 * Weekly Performance Report Cron Job
 * Generates comprehensive performance analytics and sends weekly reports
 */

export async function POST(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (!process.env.HEALTH_CHECK_SECRET || authHeader !== `Bearer ${process.env.HEALTH_CHECK_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('📊 Generating weekly performance report...');

  try {
    const reportDate = new Date();
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Gather performance metrics
    const performanceData = {
      reportPeriod: {
        start: weekAgo.toISOString(),
        end: reportDate.toISOString(),
        duration: '7 days'
      },

      // API Performance
      apiMetrics: {
        responseTime: Monitor.getMetricsSummary(MetricType.API_RESPONSE_TIME, 7 * 24 * 60),
        databaseQueries: Monitor.getMetricsSummary(MetricType.DATABASE_QUERY_TIME, 7 * 24 * 60),
        pageLoads: Monitor.getMetricsSummary(MetricType.PAGE_LOAD_TIME, 7 * 24 * 60)
      },

      // Error Analysis
      errorAnalysis: Monitor.getErrorSummary(7 * 24 * 60),

      // System Health
      systemHealth: await getSystemHealthReport(),

      // Database Performance
      databaseMetrics: await getDatabaseMetrics(),

      // Cache Performance
      cacheMetrics: await getCacheMetrics(),

      // User Activity (if available)
      userMetrics: await getUserActivityMetrics()
    };

    // Generate insights and recommendations
    const insights = generatePerformanceInsights(performanceData);

    // Create comprehensive report
    const report = {
      generated: reportDate.toISOString(),
      period: performanceData.reportPeriod,
      summary: {
        overallHealth: calculateOverallHealth(performanceData),
        keyMetrics: extractKeyMetrics(performanceData),
        alerts: insights.alerts,
        recommendations: insights.recommendations
      },
      details: performanceData,
      insights
    };

    // Send report to stakeholders
    await sendPerformanceReport(report);

    console.log('✅ Weekly performance report generated and sent');

    return NextResponse.json({
      success: true,
      timestamp: reportDate.toISOString(),
      reportSummary: report.summary,
      alertsCount: insights.alerts.length,
      recommendationsCount: insights.recommendations.length
    });

  } catch (error) {
    console.error('❌ Performance report generation failed:', error);

    Monitor.recordError(error as Error, {
      extra: { context: 'performance-report-generation' }
    });

    return NextResponse.json({
      success: false,
      error: (error as Error).message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

async function getSystemHealthReport() {
  try {
    const healthEndpoint = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/health?detailed=true`;
    const response = await fetch(healthEndpoint);
    return response.ok ? await response.json() : { status: 'unhealthy', error: 'Health check failed' };
  } catch (error) {
    return { status: 'unhealthy', error: (error as Error).message };
  }
}

async function getDatabaseMetrics() {
  try {
    const { db } = await import('@/lib/database');
    const poolStats = await db.getPoolStats();
    const dbHealth = await db.health();

    return {
      connectionPool: poolStats,
      health: dbHealth,
      performanceInsights: {
        avgQueryTime: Monitor.getMetricsSummary(MetricType.DATABASE_QUERY_TIME, 7 * 24 * 60),
        slowQueries: Monitor.getMetricsSummary(MetricType.DATABASE_QUERY_TIME, 7 * 24 * 60).p95 > 500
      }
    };
  } catch (error) {
    return { error: (error as Error).message };
  }
}

async function getCacheMetrics() {
  try {
    const { cache } = await import('@/lib/cache');
    const stats = cache.getStats();
    const hitRate = stats.total > 0 ? (stats.valid / stats.total * 100) : 0;

    return {
      ...stats,
      hitRate: Math.round(hitRate * 100) / 100,
      efficiency: hitRate > 80 ? 'excellent' : hitRate > 60 ? 'good' : hitRate > 40 ? 'fair' : 'poor'
    };
  } catch (error) {
    return { error: (error as Error).message };
  }
}

async function getUserActivityMetrics() {
  try {
    const db = (await import('@/lib/database')).db;

    // Get basic user activity metrics (last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      activeUsers,
      newCompanies,
      newContacts,
      newDeals,
      completedActivities
    ] = await Promise.all([
      db.client.user.count({
        where: {
          lastLoginAt: { gte: weekAgo },
          isActive: true
        }
      }),
      db.client.company.count({
        where: {
          createdAt: { gte: weekAgo },
          isDeleted: false
        }
      }),
      db.client.contact.count({
        where: {
          createdAt: { gte: weekAgo },
          isDeleted: false
        }
      }),
      db.client.deal.count({
        where: {
          createdAt: { gte: weekAgo },
          isDeleted: false
        }
      }),
      db.client.activity.count({
        where: {
          completedAt: { gte: weekAgo },
          isDeleted: false
        }
      })
    ]);

    return {
      activeUsers,
      newRecords: {
        companies: newCompanies,
        contacts: newContacts,
        deals: newDeals
      },
      completedActivities,
      growthRate: {
        companies: calculateGrowthRate('companies'),
        contacts: calculateGrowthRate('contacts'),
        deals: calculateGrowthRate('deals')
      }
    };

  } catch (error) {
    return { error: (error as Error).message };
  }
}

function calculateGrowthRate(entity: string): string {
  // Simplified growth rate calculation
  // In a real implementation, you'd compare with previous period
  return 'N/A - Implement historical comparison';
}

function generatePerformanceInsights(data: any) {
  const alerts = [];
  const recommendations = [];

  // Analyze API performance
  if (data.apiMetrics.responseTime.average > 1000) {
    alerts.push({
      type: 'SLOW_API_RESPONSE',
      severity: 'HIGH',
      message: `Average API response time is ${Math.round(data.apiMetrics.responseTime.average)}ms`,
      threshold: '1000ms'
    });
    recommendations.push({
      type: 'API_OPTIMIZATION',
      priority: 'HIGH',
      suggestion: 'Consider implementing response caching and database query optimization'
    });
  }

  // Analyze database performance
  if (data.apiMetrics.databaseQueries.average > 500) {
    alerts.push({
      type: 'SLOW_DATABASE_QUERIES',
      severity: 'MEDIUM',
      message: `Average database query time is ${Math.round(data.apiMetrics.databaseQueries.average)}ms`,
      threshold: '500ms'
    });
    recommendations.push({
      type: 'DATABASE_OPTIMIZATION',
      priority: 'MEDIUM',
      suggestion: 'Review slow queries and consider adding database indexes'
    });
  }

  // Analyze error rates
  if (data.errorAnalysis.totalErrors > 50) {
    alerts.push({
      type: 'HIGH_ERROR_RATE',
      severity: 'HIGH',
      message: `${data.errorAnalysis.totalErrors} errors in the last week`,
      threshold: '50 errors/week'
    });
    recommendations.push({
      type: 'ERROR_REDUCTION',
      priority: 'HIGH',
      suggestion: 'Investigate and fix recurring errors to improve system stability'
    });
  }

  // Analyze cache performance
  if (data.cacheMetrics.hitRate < 60) {
    recommendations.push({
      type: 'CACHE_OPTIMIZATION',
      priority: 'MEDIUM',
      suggestion: `Cache hit rate is ${data.cacheMetrics.hitRate}%. Consider optimizing cache strategy`
    });
  }

  return { alerts, recommendations };
}

function calculateOverallHealth(data: any): 'excellent' | 'good' | 'fair' | 'poor' {
  let score = 100;

  // Deduct points for performance issues
  if (data.apiMetrics.responseTime.average > 1000) score -= 20;
  if (data.apiMetrics.responseTime.average > 2000) score -= 30;

  if (data.apiMetrics.databaseQueries.average > 500) score -= 15;
  if (data.apiMetrics.databaseQueries.average > 1000) score -= 25;

  if (data.errorAnalysis.totalErrors > 50) score -= 25;
  if (data.errorAnalysis.totalErrors > 100) score -= 40;

  if (data.cacheMetrics.hitRate < 60) score -= 10;
  if (data.cacheMetrics.hitRate < 40) score -= 20;

  if (score >= 90) return 'excellent';
  if (score >= 75) return 'good';
  if (score >= 60) return 'fair';
  return 'poor';
}

function extractKeyMetrics(data: any) {
  return {
    avgApiResponseTime: Math.round(data.apiMetrics.responseTime.average) + 'ms',
    avgDatabaseQueryTime: Math.round(data.apiMetrics.databaseQueries.average) + 'ms',
    totalErrors: data.errorAnalysis.totalErrors,
    cacheHitRate: Math.round(data.cacheMetrics.hitRate) + '%',
    activeUsers: data.userMetrics.activeUsers || 'N/A',
    systemUptime: data.systemHealth.uptime ? Math.round(data.systemHealth.uptime / 3600) + 'h' : 'N/A'
  };
}

async function sendPerformanceReport(report: any) {
  try {
    // Send to Slack if webhook is configured
    if (process.env.SLACK_WEBHOOK_URL) {
      const healthColor = report.summary.overallHealth === 'excellent' ? 'good' :
                         report.summary.overallHealth === 'good' ? 'good' :
                         report.summary.overallHealth === 'fair' ? 'warning' : 'danger';

      const slackMessage = {
        username: 'CRM Performance Monitor',
        icon_emoji: '📊',
        attachments: [{
          color: healthColor,
          title: '📊 Weekly CRM Performance Report',
          fields: [
            {
              title: 'Overall Health',
              value: report.summary.overallHealth.toUpperCase(),
              short: true
            },
            {
              title: 'Period',
              value: report.period.duration,
              short: true
            },
            {
              title: 'Avg API Response',
              value: report.summary.keyMetrics.avgApiResponseTime,
              short: true
            },
            {
              title: 'Cache Hit Rate',
              value: report.summary.keyMetrics.cacheHitRate,
              short: true
            },
            {
              title: 'Total Errors',
              value: report.summary.keyMetrics.totalErrors.toString(),
              short: true
            },
            {
              title: 'Active Users',
              value: report.summary.keyMetrics.activeUsers.toString(),
              short: true
            }
          ],
          footer: 'CRM Performance Monitor',
          ts: Math.floor(Date.now() / 1000)
        }]
      };

      if (report.summary.alerts.length > 0) {
        slackMessage.attachments.push({
          color: 'warning',
          title: `⚠️ ${report.summary.alerts.length} Alert(s)`,
          text: report.summary.alerts.map((a: any) => `• ${a.type}: ${a.message}`).join('\n'),
          footer: 'Performance Alerts'
        });
      }

      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slackMessage)
      });
    }

    console.log('📧 Performance report sent successfully');

  } catch (error) {
    console.error('Failed to send performance report:', error);
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'Performance Report Generator',
    status: 'operational',
    timestamp: new Date().toISOString(),
    schedule: 'Weekly on Mondays at 8:00 AM UTC',
    nextRun: getNextMondayAt8AM().toISOString()
  });
}

function getNextMondayAt8AM(): Date {
  const now = new Date();
  const daysUntilMonday = (8 - now.getDay()) % 7;
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + daysUntilMonday);
  nextMonday.setHours(8, 0, 0, 0);

  if (nextMonday <= now) {
    nextMonday.setDate(nextMonday.getDate() + 7);
  }

  return nextMonday;
}