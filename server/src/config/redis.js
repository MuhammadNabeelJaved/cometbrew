/**
 * Singleton ioredis client.
 *
 * Graceful fallback: if Redis is unavailable, all operations are no-ops.
 * The app works normally without Redis — it just loses the server-side cache.
 *
 * Add REDIS_URL=redis://localhost:6379 to .env to enable.
 */
import Redis from 'ioredis';

let _client = null;

export function getRedisClient() {
  if (!_client) {
    _client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      lazyConnect: true,
      enableOfflineQueue: false,   // Don't queue commands when disconnected
      maxRetriesPerRequest: 1,     // Fail fast — don't hang requests
      connectTimeout: 3000,        // 3s connection timeout
    });

    _client.on('error', () => {
      // Suppress connection errors in dev to avoid log spam
      if (process.env.NODE_ENV === 'development') return;
      // In production, errors are already logged by ioredis default handler
    });

    _client.on('connect', () => {
      console.log('[Redis] Connected');
    });
  }
  return _client;
}

export async function closeRedis() {
  if (_client) {
    try {
      await _client.quit();
    } catch {
      _client.disconnect();
    }
    _client = null;
  }
}
