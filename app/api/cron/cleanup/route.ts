import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Database Cleanup and Maintenance Cron Job
 * Runs weekly to optimize database performance
 */

export async function POST(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (!process.env.HEALTH_CHECK_SECRET || authHeader !== `Bearer ${process.env.HEALTH_CHECK_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('🧹 Starting database cleanup and maintenance...');

  try {
    const results = {
      deletedExpiredSessions: 0,
      deletedOldFilterUsage: 0,
      optimizedTables: 0,
      databaseSize: null as string | null
    };

    // Clean up expired sessions (older than 30 days)
    const expiredSessionsResult = await prisma.session.deleteMany({
      where: {
        expires: {
          lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    });
    results.deletedExpiredSessions = expiredSessionsResult.count;

    // Clean up old filter usage records (older than 90 days)
    const oldFilterUsageResult = await prisma.savedFilterUsage.deleteMany({
      where: {
        usedAt: {
          lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
        }
      }
    });
    results.deletedOldFilterUsage = oldFilterUsageResult.count;

    // Update database statistics for query optimizer
    await prisma.$executeRaw`ANALYZE;`;

    // Vacuum analyze for PostgreSQL optimization
    try {
      await prisma.$executeRaw`VACUUM ANALYZE;`;
      results.optimizedTables = 1;
    } catch (error) {
      console.log('Note: VACUUM requires elevated privileges, skipping...');
    }

    // Get current database size
    const dbSize = await prisma.$queryRaw`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size;
    ` as Array<{ size: string }>;
    results.databaseSize = dbSize[0]?.size || null;

    console.log('✅ Database cleanup completed:', results);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results
    });

  } catch (error) {
    console.error('❌ Database cleanup failed:', error);

    return NextResponse.json(
      { error: 'Cleanup failed', message: (error as Error).message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'Database Cleanup',
    status: 'operational',
    timestamp: new Date().toISOString(),
    schedule: 'Weekly on Sundays at 3:00 AM UTC'
  });
}