/**
 * HTTP cache header helpers.
 *
 * setCacheHeaders(seconds) — public cacheable responses (CDN + browser)
 * noCache                  — auth-required or mutation responses
 */

/**
 * Every route using this middleware serves admin-editable, socket-synced CMS
 * data. A `max-age` here made browsers serve stale copies for up to 10 min
 * after an admin save (the server cannot invalidate browser caches), so edits
 * appeared not to stick and refetches reverted freshly typed values.
 * `no-cache` keeps ETag revalidation (304s still save bandwidth) while
 * guaranteeing freshness; the Redis layer (cacheMiddleware) still shields the
 * DB and IS invalidated on every write.
 *
 * @param {number} _maxAgeSeconds retained so existing route signatures keep working
 * @returns {import('express').RequestHandler}
 */
export function setCacheHeaders(_maxAgeSeconds) {
  return (_req, res, next) => {
    res.set('Cache-Control', 'no-cache');
    next();
  };
}

/**
 * @returns {import('express').RequestHandler}
 */
export function noCache(_req, res, next) {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  next();
}
