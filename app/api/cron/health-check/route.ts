import { NextRequest, NextResponse } from 'next/server';
import { Monitor, ErrorSeverity } from '@/lib/monitoring';

/**
 * Automated Health Check Cron Job
 * Runs every 5 minutes to monitor system health and send alerts
 */

export async function POST(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (!process.env.HEALTH_CHECK_SECRET || authHeader !== `Bearer ${process.env.HEALTH_CHECK_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('🔍 Running automated health check...');

  try {
    const healthCheckUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const healthEndpoint = `${healthCheckUrl}/api/health?detailed=true`;

    // Perform health check
    const healthResponse = await fetch(healthEndpoint, {
      method: 'GET',
      headers: {
        'User-Agent': 'CRM-Health-Monitor/1.0'
      }
    });

    const healthData = await healthResponse.json();
    const isHealthy = healthResponse.status === 200 && healthData.status === 'healthy';

    // Analyze health metrics
    const alerts = [];

    // Check response time
    if (healthData.checks?.responseTime?.value > 2000) {
      alerts.push({
        type: 'SLOW_RESPONSE',
        severity: ErrorSeverity.HIGH,
        message: `Health check response time: ${healthData.checks.responseTime.value}ms`,
        threshold: '2000ms'
      });
    }

    // Check database health
    if (healthData.checks?.database?.status === 'unhealthy') {
      alerts.push({
        type: 'DATABASE_DOWN',
        severity: ErrorSeverity.CRITICAL,
        message: 'Database is unhealthy',
        error: healthData.checks.database.error
      });
    }

    // Check memory usage
    if (healthData.checks?.memory?.status === 'warning') {
      alerts.push({
        type: 'HIGH_MEMORY_USAGE',
        severity: ErrorSeverity.MEDIUM,
        message: `Memory utilization: ${healthData.checks.memory.utilization}`,
        threshold: '90%'
      });
    }

    // Check error rates (if detailed metrics available)
    if (healthData.checks?.performance?.errors?.totalErrors > 10) {
      alerts.push({
        type: 'HIGH_ERROR_RATE',
        severity: ErrorSeverity.HIGH,
        message: `High error rate: ${healthData.checks.performance.errors.totalErrors} errors in last hour`,
        threshold: '10 errors/hour'
      });
    }

    // Send alerts if any issues found
    if (alerts.length > 0) {
      await sendAlerts(alerts, healthData);
    }

    // Log metrics
    const responseTime = healthData.checks?.responseTime?.value || 0;
    Monitor.recordMetric('health_check_response_time', responseTime, 'ms', {
      automated: 'true',
      status: healthData.status
    });

    // Record overall health status
    Monitor.recordMetric('system_health', isHealthy ? 1 : 0, 'status', {
      automated: 'true'
    });

    console.log(`✅ Health check completed. Status: ${healthData.status}, Alerts: ${alerts.length}`);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      healthStatus: healthData.status,
      alertsTriggered: alerts.length,
      alerts: alerts.map(a => ({ type: a.type, severity: a.severity }))
    });

  } catch (error) {
    console.error('❌ Automated health check failed:', error);

    // Record the health check failure
    Monitor.recordError(error as Error, {
      extra: { context: 'automated-health-check' }
    }, ErrorSeverity.CRITICAL);

    // Send critical alert for health check failure
    await sendCriticalAlert('HEALTH_CHECK_FAILED', (error as Error).message);

    return NextResponse.json({
      success: false,
      error: (error as Error).message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

async function sendAlerts(alerts: any[], healthData: any) {
  try {
    // Group alerts by severity
    const criticalAlerts = alerts.filter(a => a.severity === ErrorSeverity.CRITICAL);
    const highAlerts = alerts.filter(a => a.severity === ErrorSeverity.HIGH);
    const mediumAlerts = alerts.filter(a => a.severity === ErrorSeverity.MEDIUM);

    // Send Slack notification if webhook is configured
    if (process.env.SLACK_WEBHOOK_URL) {
      const color = criticalAlerts.length > 0 ? 'danger' :
                   highAlerts.length > 0 ? 'warning' : 'good';

      const slackMessage = {
        username: 'CRM Health Monitor',
        icon_emoji: '🚨',
        attachments: [{
          color,
          title: `🚨 CRM Health Alert - ${alerts.length} issue(s) detected`,
          fields: [
            {
              title: 'System Status',
              value: healthData.status.toUpperCase(),
              short: true
            },
            {
              title: 'Timestamp',
              value: new Date().toISOString(),
              short: true
            },
            ...alerts.map(alert => ({
              title: alert.type.replace(/_/g, ' '),
              value: `${alert.message} (Severity: ${alert.severity})`,
              short: false
            }))
          ],
          footer: 'CRM Health Monitor',
          ts: Math.floor(Date.now() / 1000)
        }]
      };

      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slackMessage)
      });
    }

    // Send email alerts for critical issues
    if (criticalAlerts.length > 0 && process.env.ERROR_WEBHOOK_URL) {
      await fetch(process.env.ERROR_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'CRITICAL_HEALTH_ALERT',
          alerts: criticalAlerts,
          healthData,
          timestamp: new Date().toISOString()
        })
      });
    }

    console.log(`📧 Sent ${alerts.length} alert(s)`);

  } catch (error) {
    console.error('Failed to send health alerts:', error);
  }
}

async function sendCriticalAlert(type: string, message: string) {
  try {
    if (process.env.SLACK_WEBHOOK_URL) {
      const slackMessage = {
        username: 'CRM Health Monitor',
        icon_emoji: '🚨',
        attachments: [{
          color: 'danger',
          title: '🚨 CRITICAL: CRM Health Monitor Failure',
          fields: [
            {
              title: 'Alert Type',
              value: type,
              short: true
            },
            {
              title: 'Message',
              value: message,
              short: false
            },
            {
              title: 'Timestamp',
              value: new Date().toISOString(),
              short: true
            }
          ],
          footer: 'CRM Health Monitor - CRITICAL',
          ts: Math.floor(Date.now() / 1000)
        }]
      };

      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slackMessage)
      });
    }

  } catch (error) {
    console.error('Failed to send critical alert:', error);
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'Automated Health Check',
    status: 'operational',
    timestamp: new Date().toISOString(),
    schedule: 'Every 5 minutes',
    nextRun: new Date(Date.now() + 5 * 60 * 1000).toISOString()
  });
}