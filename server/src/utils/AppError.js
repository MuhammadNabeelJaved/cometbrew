/**
 * Custom operational error class for the application.
 *
 * Extends the native Error class to add:
 *  - `statusCode` – HTTP status code to send in the response
 *  - `status`     – "fail" for 4xx errors, "error" for 5xx errors
 *  - `isOperational` – flag that marks this as a known, expected error
 *    (as opposed to a programming bug). The global error handler uses this
 *    flag to decide whether to send a detailed message to the client.
 *
 * Usage:
 *   throw new AppError("User not found", 404);
 *   throw new AppError("Unauthorized", 401);
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;

    // Capture the stack trace, excluding the constructor call itself
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
