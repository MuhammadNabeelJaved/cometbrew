/**
 * Global error-handling middleware for Express.
 *
 * Must be registered LAST (after all routes and other middleware) so that
 * Express recognises it as an error handler via its 4-argument signature.
 *
 * Handles and normalises the following error types:
 *  - `AppError`         – operational errors thrown by controllers/middleware
 *  - `CastError`        – invalid MongoDB ObjectId (returns 400)
 *  - Duplicate key (11000) – unique constraint violation (returns 400)
 *  - `ValidationError`  – Mongoose schema validation failure (returns 400)
 *
 * In development mode the full stack trace is included in the response body.
 *
 * Response shape (on error):
 *   { success: false, message: string, stack?: string }
 */
import AppError from "../utils/AppError.js";

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // MongoDB Cast Error – e.g. an invalid ObjectId in a URL param
  if (err.name === "CastError") {
    message = "Invalid ID format";
    statusCode = 400;
  }

  // Duplicate Key Error – unique index violated (e.g. duplicate email)
  if (err.code === 11000) {
    message = "Duplicate field value";
    statusCode = 400;
  }

  // Validation Error – Mongoose schema validation failed; collect all messages
  if (err.name === "ValidationError") {
    message = Object.values(err.errors)
      .map((el) => el.message)
      .join(", ");
    statusCode = 400;
  }

  res.status(statusCode).json({
    success: false,
    message,
    // Only expose stack traces in development to avoid leaking internals
    ...(process.env.NODE_ENV === "development" && { stack: err.stack })
  });
};

export default errorHandler;
