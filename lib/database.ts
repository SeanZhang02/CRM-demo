import { PrismaClient } from '@prisma/client';

/**
 * Production Database Connection with Optimized Configuration
 * Implements connection pooling and performance optimizations
 */

declare global {
  var __prisma: PrismaClient | undefined;
}

// Production database configuration
const DATABASE_CONFIG = {
  // Connection pool settings for production
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },

  // Logging configuration
  log: process.env.NODE_ENV === 'production'
    ? ['error', 'warn'] as const
    : ['query', 'info', 'warn', 'error'] as const,

  // Error formatting
  errorFormat: 'pretty' as const,

  // Query engine configuration for production
  __internal: {
    engine: {
      // Connection pool size (adjust based on Vercel limits)
      connection_limit: process.env.NODE_ENV === 'production' ? 5 : 10,

      // Connection timeout (30 seconds)
      connect_timeout: 30,

      // Pool timeout (30 seconds)
      pool_timeout: 30,

      // Statement cache size
      statement_cache_size: 100,
    },
  },
};

// Singleton pattern for database connection
function createPrismaClient() {
  return new PrismaClient({
    ...DATABASE_CONFIG,

    // Additional production optimizations
    transactionOptions: {
      maxWait: 5000, // 5 seconds
      timeout: 30000, // 30 seconds
    },
  });
}

// Global instance management
export const prisma = globalThis.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

/**
 * Database health check utility
 */
export async function checkDatabaseHealth(): Promise<{
  status: 'healthy' | 'unhealthy';
  latency: number;
  version?: string;
  error?: string;
}> {
  const startTime = Date.now();

  try {
    // Simple query to test connection
    const result = await prisma.$queryRaw`SELECT version() as version;` as Array<{ version: string }>;
    const latency = Date.now() - startTime;

    return {
      status: 'healthy',
      latency,
      version: result[0]?.version?.split(' ')[0] || 'Unknown'
    };

  } catch (error) {
    const latency = Date.now() - startTime;

    return {
      status: 'unhealthy',
      latency,
      error: (error as Error).message
    };
  }
}

/**
 * Query performance monitoring
 */
export function withQueryMetrics<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  const startTime = Date.now();

  return operation().finally(() => {
    const duration = Date.now() - startTime;

    // Log slow queries in production
    if (duration > 1000) {
      console.warn(`Slow query detected: ${operationName} took ${duration}ms`);
    }

    // In production, you could send metrics to monitoring service
    if (process.env.NODE_ENV === 'production' && duration > 500) {
      // Example: Send to monitoring service
      console.log(`Performance metric: ${operationName}=${duration}ms`);
    }
  });
}

/**
 * Transaction wrapper with retry logic
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on certain types of errors
      if (
        lastError.message.includes('Unique constraint') ||
        lastError.message.includes('Foreign key constraint') ||
        lastError.message.includes('Check constraint')
      ) {
        throw lastError;
      }

      if (attempt === maxRetries) {
        break;
      }

      console.warn(`Database operation failed (attempt ${attempt}/${maxRetries}):`, lastError.message);

      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, attempt - 1)));
    }
  }

  throw lastError;
}

/**
 * Graceful shutdown handler
 */
export async function closeDatabaseConnection() {
  try {
    await prisma.$disconnect();
    console.log('Database connection closed gracefully');
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
}

// Handle process termination
if (process.env.NODE_ENV === 'production') {
  process.on('SIGTERM', closeDatabaseConnection);
  process.on('SIGINT', closeDatabaseConnection);
}

/**
 * Production database utilities
 */
export const db = {
  // Core Prisma client
  client: prisma,

  // Health check
  health: checkDatabaseHealth,

  // Performance monitoring
  withMetrics: withQueryMetrics,

  // Retry logic
  withRetry: withRetry,

  // Graceful shutdown
  close: closeDatabaseConnection,

  // Connection pool stats (if available)
  getPoolStats: async () => {
    try {
      // PostgreSQL specific query for connection stats
      const stats = await prisma.$queryRaw`
        SELECT
          count(*) as total_connections,
          count(*) FILTER (WHERE state = 'active') as active_connections,
          count(*) FILTER (WHERE state = 'idle') as idle_connections
        FROM pg_stat_activity
        WHERE datname = current_database();
      ` as Array<{
        total_connections: number;
        active_connections: number;
        idle_connections: number;
      }>;

      return stats[0] || null;
    } catch (error) {
      console.error('Error getting pool stats:', error);
      return null;
    }
  }
};

export default db;