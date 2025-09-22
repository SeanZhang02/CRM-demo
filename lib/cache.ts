/**
 * Production Caching Layer for API Responses and Static Assets
 * Implements multi-level caching strategy with Redis-like functionality
 */

// Simple in-memory cache for serverless environments
class MemoryCache {
  private cache = new Map<string, { value: any; expiry: number; tags: string[] }>();
  private maxSize = 1000; // Limit memory usage

  set(key: string, value: any, ttlSeconds: number = 300, tags: string[] = []): void {
    // Clean up expired entries if cache is full
    if (this.cache.size >= this.maxSize) {
      this.cleanup();
    }

    const expiry = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, { value, expiry, tags });
  }

  get<T = any>(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value as T;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  // Invalidate by tags
  invalidateByTag(tag: string): number {
    let count = 0;
    for (const [key, item] of this.cache.entries()) {
      if (item.tags.includes(tag)) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    const expired: string[] = [];

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        expired.push(key);
      }
    }

    expired.forEach(key => this.cache.delete(key));
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
  }

  // Get cache statistics
  getStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    for (const item of this.cache.values()) {
      if (now > item.expiry) {
        expiredEntries++;
      } else {
        validEntries++;
      }
    }

    return {
      total: this.cache.size,
      valid: validEntries,
      expired: expiredEntries,
      maxSize: this.maxSize
    };
  }
}

// Global cache instance
const globalCache = new MemoryCache();

/**
 * Cache key generators for consistent naming
 */
export const CacheKeys = {
  companies: (userId: string, filters?: string) =>
    `companies:${userId}${filters ? `:${filters}` : ''}`,

  contacts: (userId: string, companyId?: string, filters?: string) =>
    `contacts:${userId}${companyId ? `:${companyId}` : ''}${filters ? `:${filters}` : ''}`,

  deals: (userId: string, stageId?: string, filters?: string) =>
    `deals:${userId}${stageId ? `:${stageId}` : ''}${filters ? `:${filters}` : ''}`,

  activities: (userId: string, entityId?: string, type?: string) =>
    `activities:${userId}${entityId ? `:${entityId}` : ''}${type ? `:${type}` : ''}`,

  pipelineStages: () => 'pipeline:stages',

  userProfile: (userId: string) => `user:${userId}`,

  dashboard: (userId: string, period?: string) =>
    `dashboard:${userId}${period ? `:${period}` : ''}`,
};

/**
 * Cache tags for bulk invalidation
 */
export const CacheTags = {
  USER_DATA: (userId: string) => `user:${userId}`,
  COMPANIES: 'companies',
  CONTACTS: 'contacts',
  DEALS: 'deals',
  ACTIVITIES: 'activities',
  PIPELINE: 'pipeline',
  DASHBOARD: 'dashboard',
};

/**
 * Cache TTL settings (in seconds)
 */
export const CacheTTL = {
  SHORT: 60,        // 1 minute - frequently changing data
  MEDIUM: 300,      // 5 minutes - user-specific data
  LONG: 900,        // 15 minutes - filtered lists
  VERY_LONG: 3600,  // 1 hour - static data like pipeline stages
  DAY: 86400,       // 1 day - rarely changing configuration
};

/**
 * Main cache interface
 */
export const cache = {
  // Basic operations
  get: <T = any>(key: string): T | null => globalCache.get<T>(key),
  set: (key: string, value: any, ttl: number = CacheTTL.MEDIUM, tags: string[] = []): void =>
    globalCache.set(key, value, ttl, tags),
  delete: (key: string): boolean => globalCache.delete(key),
  has: (key: string): boolean => globalCache.has(key),

  // Bulk operations
  invalidateByTag: (tag: string): number => globalCache.invalidateByTag(tag),
  invalidateUserData: (userId: string): number =>
    globalCache.invalidateByTag(CacheTags.USER_DATA(userId)),

  // Utilities
  clear: (): void => globalCache.clear(),
  cleanup: (): void => globalCache.cleanup(),
  getStats: () => globalCache.getStats(),

  // Wrapper function for cached operations
  wrap: async <T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = CacheTTL.MEDIUM,
    tags: string[] = []
  ): Promise<T> => {
    // Check cache first
    const cached = globalCache.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch and cache
    const result = await fetcher();
    globalCache.set(key, result, ttl, tags);
    return result;
  }
};

/**
 * Response caching middleware for API routes
 */
export function withCache(options: {
  ttl?: number;
  tags?: string[];
  keyGenerator?: (...args: any[]) => string;
  bypassCache?: boolean;
}) {
  return function cacheMiddleware<T extends any[], R>(
    target: any,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<(...args: T) => Promise<R>>
  ) {
    const originalMethod = descriptor.value!;

    descriptor.value = async function (...args: T): Promise<R> {
      if (options.bypassCache || process.env.NODE_ENV === 'development') {
        return originalMethod.apply(this, args);
      }

      const key = options.keyGenerator
        ? options.keyGenerator(...args)
        : `${target.constructor.name}:${propertyName}:${JSON.stringify(args)}`;

      return cache.wrap(
        key,
        () => originalMethod.apply(this, args),
        options.ttl || CacheTTL.MEDIUM,
        options.tags || []
      );
    };

    return descriptor;
  };
}

/**
 * Static asset caching headers
 */
export const StaticCacheHeaders = {
  // Long-term caching for versioned assets
  immutable: {
    'Cache-Control': 'public, max-age=31536000, immutable', // 1 year
    'Expires': new Date(Date.now() + 31536000000).toUTCString(),
  },

  // Medium-term caching for images and fonts
  assets: {
    'Cache-Control': 'public, max-age=86400, s-maxage=31536000', // 1 day, CDN 1 year
    'Expires': new Date(Date.now() + 86400000).toUTCString(),
  },

  // Short-term caching for API responses
  api: {
    'Cache-Control': 'public, max-age=300, s-maxage=900', // 5 min, CDN 15 min
    'Expires': new Date(Date.now() + 300000).toUTCString(),
  },

  // No cache for user-specific data
  private: {
    'Cache-Control': 'private, no-cache, no-store, must-revalidate',
    'Expires': '0',
  },
};

/**
 * CDN cache invalidation (for production)
 */
export async function invalidateCDN(paths: string[]): Promise<void> {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  try {
    // For Vercel, use their API to purge cache
    if (process.env.VERCEL_URL) {
      console.log('CDN cache invalidation requested for:', paths);
      // In a full implementation, you would call Vercel's purge API
      // await fetch(`https://api.vercel.com/v1/purge`, { ... });
    }
  } catch (error) {
    console.error('CDN cache invalidation failed:', error);
  }
}

/**
 * Performance monitoring for cache operations
 */
export function logCachePerformance() {
  const stats = cache.getStats();
  const hitRate = stats.total > 0 ? (stats.valid / stats.total * 100).toFixed(1) : '0';

  console.log(`Cache performance: ${stats.valid}/${stats.total} entries (${hitRate}% hit rate)`);

  if (stats.expired > 50) {
    console.warn(`High number of expired cache entries: ${stats.expired}`);
  }
}

// Cleanup expired entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    cache.cleanup();
    if (process.env.NODE_ENV === 'production') {
      logCachePerformance();
    }
  }, 5 * 60 * 1000);
}

export default cache;