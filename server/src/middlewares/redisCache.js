/**
 * Redis response cache middleware.
 *
 * Usage: router.get('/path', cacheMiddleware(300), controller)
 *
 * - Cache hit  → return JSON immediately, set X-Cache: HIT header
 * - Cache miss → let request proceed, intercept res.json(), store in Redis
 * - Redis down → silently skip, app works normally
 */
import { getRedisClient } from '../config/redis.js';
import { recordCacheHit, recordCacheMiss } from '../utils/perfStats.js';

/**
 * @param {number} ttlSeconds
 * @returns {import('express').RequestHandler}
 */
export function cacheMiddleware(ttlSeconds) {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') return next();

    const redis = getRedisClient();
    const key = `cache:GET:${req.originalUrl}`;

    try {
      const cached = await redis.get(key);
      if (cached) {
        res.set('X-Cache', 'HIT');
        recordCacheHit();
        return res.json(JSON.parse(cached));
      }
    } catch {
      // Redis unavailable — skip cache, proceed normally
      return next();
    }

    // Intercept res.json to store the response in Redis
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      res.set('X-Cache', 'MISS');
      recordCacheMiss();
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Non-blocking — don't delay the response
        redis.setex(key, ttlSeconds, JSON.stringify(body)).catch(() => {});
      }
      return originalJson(body);
    };

    next();
  };
}

/**
 * Invalidate all cache keys matching a URL fragment.
 * Call this in controllers after create/update/delete operations.
 *
 * @param {string} urlFragment — e.g. '/services', '/jobs', '/announcements'
 */
export async function invalidateCache(urlFragment) {
  const redis = getRedisClient();
  try {
    let cursor = '0';
    do {
      const [nextCursor, keys] = await redis.scan(
        cursor, 'MATCH', `cache:GET:*${urlFragment}*`, 'COUNT', 100
      );
      cursor = nextCursor;
      if (keys.length > 0) await redis.del(...keys);
    } while (cursor !== '0');
  } catch {
    // Redis unavailable — skip invalidation silently
  }
}
