/**
 * Request tracker middleware.
 * Records every API request's duration and error status into perfStats.
 * Must be registered BEFORE routes and AFTER the body parser.
 */
import { recordRequest } from '../utils/perfStats.js';

export function requestTracker(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const durationMs = Date.now() - start;
    const isError = res.statusCode >= 400;
    recordRequest(durationMs, isError);
  });
  next();
}
