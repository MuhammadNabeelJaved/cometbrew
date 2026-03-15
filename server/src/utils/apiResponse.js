/**
 * Sends a standardised success JSON response.
 *
 * @param {import('express').Response} res - Express response object
 * @param {string}  message    - Human-readable success message
 * @param {*}       data       - Payload to include under the `data` key
 * @param {number}  statusCode - HTTP status code (default 200)
 *
 * Response shape:
 *   { success: true, message, data }
 */
export const successResponse = (
  res,
  message = "Success",
  data = {},
  statusCode = 200
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

/**
 * Sends a standardised error JSON response.
 *
 * Typically called from the global errorHandler middleware rather than
 * directly from controllers (controllers should throw AppError instead).
 *
 * @param {import('express').Response} res - Express response object
 * @param {string}  message    - Human-readable error message
 * @param {number}  statusCode - HTTP status code (default 500)
 * @param {*}       errors     - Optional validation/field error details
 *
 * Response shape:
 *   { success: false, message, errors }
 */
export const errorResponse = (
  res,
  message = "Something went wrong",
  statusCode = 500,
  errors = null
) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors
  });
};
