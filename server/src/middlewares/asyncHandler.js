/**
 * Async error-forwarding wrapper for Express route handlers.
 *
 * Eliminates repetitive try/catch blocks by catching any promise rejection
 * and passing it to Express's `next()` function, which routes the error to
 * the global errorHandler middleware.
 *
 * Usage:
 *   export const myController = asyncHandler(async (req, res) => {
 *     // No try/catch needed — thrown errors are forwarded automatically
 *     const data = await someAsyncOperation();
 *     res.json(data);
 *   });
 *
 * @param {Function} fn - Async Express route handler (req, res, next) => Promise
 * @returns {Function} Wrapped handler that forwards rejections to `next`
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

export default asyncHandler;
