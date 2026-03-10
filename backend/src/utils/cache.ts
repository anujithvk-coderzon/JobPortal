import redis, { isRedisConnected } from '../config/redis';

// Default TTLs in seconds
export const TTL = {
  SHORT: 30,          // 30s - frequently changing data (notifications, unread counts)
  MEDIUM: 120,        // 2min - moderately changing data (job listings, news feed)
  LONG: 300,          // 5min - rarely changing data (job details, user profiles)
  VERY_LONG: 600,     // 10min - almost static data (admin stats, credibility scores)
  AUTH: 60,            // 1min - auth user check (blocked/exists)
  VERIFICATION: 600,   // 10min - verification codes
};

/**
 * Get cached data or fetch from source.
 * Gracefully falls back to source if Redis is unavailable.
 */
export async function cacheGet<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = TTL.MEDIUM
): Promise<T> {
  if (!isRedisConnected()) {
    return fetcher();
  }

  try {
    const cached = await redis.get(key);
    if (cached !== null) {
      return JSON.parse(cached) as T;
    }
  } catch {
    // Cache read failed, fall through to fetcher
  }

  const data = await fetcher();

  // Store in cache (non-blocking, don't await)
  try {
    redis.setex(key, ttlSeconds, JSON.stringify(data)).catch(() => {});
  } catch {
    // Ignore cache write errors
  }

  return data;
}

/**
 * Invalidate specific cache keys
 */
export async function cacheInvalidate(...keys: string[]): Promise<void> {
  if (!isRedisConnected() || keys.length === 0) return;
  try {
    await redis.del(...keys);
  } catch {
    // Ignore invalidation errors
  }
}

/**
 * Invalidate all keys matching a pattern.
 * Uses SCAN to avoid blocking Redis on large datasets.
 */
export async function cacheInvalidatePattern(pattern: string): Promise<void> {
  if (!isRedisConnected()) return;
  try {
    let cursor = '0';
    do {
      const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } while (cursor !== '0');
  } catch {
    // Ignore pattern invalidation errors
  }
}

/**
 * Set a value directly in cache
 */
export async function cacheSet(key: string, value: any, ttlSeconds: number): Promise<void> {
  if (!isRedisConnected()) return;
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
  } catch {
    // Ignore cache set errors
  }
}

/**
 * Get a value directly from cache
 */
export async function cacheGetDirect<T>(key: string): Promise<T | null> {
  if (!isRedisConnected()) return null;
  try {
    const cached = await redis.get(key);
    if (cached !== null) {
      return JSON.parse(cached) as T;
    }
  } catch {
    // Ignore cache read errors
  }
  return null;
}

/**
 * Delete a value directly from cache
 */
export async function cacheDel(key: string): Promise<void> {
  if (!isRedisConnected()) return;
  try {
    await redis.del(key);
  } catch {
    // Ignore cache delete errors
  }
}

/**
 * Check if a key exists in cache
 */
export async function cacheExists(key: string): Promise<boolean> {
  if (!isRedisConnected()) return false;
  try {
    return (await redis.exists(key)) === 1;
  } catch {
    return false;
  }
}

// ---- Cache Key Builders ----

export const CacheKeys = {
  // Auth
  userAuth: (userId: string) => `auth:user:${userId}`,

  // Jobs
  allJobs: (queryHash: string) => `jobs:all:${queryHash}`,
  jobById: (jobId: string) => `jobs:detail:${jobId}`,
  companyJobs: (companyId: string, page: number) => `jobs:company:${companyId}:${page}`,
  myJobs: (userId: string, queryHash: string) => `jobs:my:${userId}:${queryHash}`,
  savedJobs: (userId: string, page: number) => `jobs:saved:${userId}:${page}`,
  jobMatch: (userId: string, jobId: string) => `jobs:match:${userId}:${jobId}`,

  // Job News
  allJobNews: (queryHash: string) => `jobnews:all:${queryHash}`,
  jobNewsById: (id: string) => `jobnews:detail:${id}`,
  myJobNews: (userId: string, queryHash: string) => `jobnews:my:${userId}:${queryHash}`,
  credibility: (userId: string) => `credibility:${userId}`,

  // User
  userProfile: (userId: string) => `user:profile:${userId}`,
  publicProfile: (userId: string, page: number) => `user:public:${userId}:${page}`,

  // Dashboard
  dashboardStats: (userId: string) => `dashboard:${userId}`,

  // Admin
  adminStats: () => `admin:stats`,

  // Notifications
  unreadCount: (userId: string) => `notifications:unread:${userId}`,

  // Verification codes
  verification: (email: string) => `verification:${email}`,
  passwordReset: (email: string) => `password-reset:${email}`,
};

/**
 * Create a simple hash from query params for cache key uniqueness
 */
export function hashQuery(params: Record<string, any>): string {
  const sorted = Object.keys(params)
    .sort()
    .filter(k => params[k] !== undefined && params[k] !== null && params[k] !== '')
    .map(k => `${k}=${params[k]}`)
    .join('&');
  // Simple fast hash
  let hash = 0;
  for (let i = 0; i < sorted.length; i++) {
    const char = sorted.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}
