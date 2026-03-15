/**
 * 404 catch-all middleware.
 *
 * Placed after all route definitions in app.js.
 * When no route matches the incoming request, this middleware creates a
 * 404 AppError and forwards it to the global errorHandler middleware.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {Function} next - Express next function (receives the AppError)
 */
import AppError from "../utils/AppError.js";

const notFound = (req, res, next) => {
    next(new AppError(`Route not found: ${req.originalUrl}`, 404));
};

export default notFound;
