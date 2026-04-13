/**
 * HTTP cache header helpers.
 *
 * setCacheHeaders(seconds) — public cacheable responses (CDN + browser)
 * noCache                  — auth-required or mutation responses
 */

/**
 * @param {number} maxAgeSeconds
 * @returns {import('express').RequestHandler}
 */
export function setCacheHeaders(maxAgeSeconds) {
  return (_req, res, next) => {
    res.set(
      'Cache-Control',
      `public, max-age=${maxAgeSeconds}, stale-while-revalidate=${Math.floor(maxAgeSeconds / 2)}`
    );
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
