/**
 * Authentication and authorisation middleware.
 *
 * Exports two middleware factories:
 *  - `userAuthenticated` – verifies the JWT access token and attaches the
 *    authenticated user to `req.user`
 *  - `authorizeRoles`    – RBAC gate that restricts access to specific roles
 */
import jwt from "jsonwebtoken";
import asyncHandler from "./asyncHandler.js";
import User from "../models/usersModels/User.model.js"; // Your Mongoose User model
import AppError from "../utils/AppError.js";

// ========================
// User Authentication Middleware
// ========================
/**
 * Verifies the JWT access token from either:
 *  1. The `accessToken` HTTP-only cookie, OR
 *  2. The `Authorization: Bearer <token>` header
 *
 * On success, attaches the full user document to `req.user` and calls next().
 * Throws 401 if the token is missing/invalid, or 403 if the account is
 * unverified.
 */
export const userAuthenticated = asyncHandler(async (req, res, next) => {
    // Extract token from cookie or Authorization header
    const token = req.cookies?.accessToken ||
        (req.headers.authorization?.startsWith("Bearer") && req.headers.authorization.split(" ")[1]);

    if (!token) {
        throw new AppError("Unauthorized: No token provided", 401);
    }

    try {
        // Verify signature and expiry
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

        // Load the full user document (excluding the password hash)
        const user = await User.findById(decoded.id).select("-password");
        if (!user) {
            throw new AppError("Unauthorized: User not found", 401);
        }

        // Block unverified accounts — return 403 (not 401) so the client
        // knows the credentials are valid but the account needs verification
        if (!user.isVerified) {
            throw new AppError("Unauthorized: Account not verified", 403);
        }

        req.user = user;
        next();
    } catch (err) {
        // Re-throw AppErrors (e.g. 403 for unverified) without wrapping them
        if (err.isOperational) throw err;
        // Wrap JWT errors (TokenExpiredError, JsonWebTokenError) as 401
        throw new AppError(`Unauthorized: ${err.message}`, 401);
    }
});

// ========================
// Role-based Authorization Middleware
// ========================
/**
 * Factory that returns a middleware enforcing role-based access control.
 *
 * Must be used AFTER `userAuthenticated` (which sets `req.user`).
 *
 * @param {...string} allowedRoles - One or more roles permitted to access the route
 *                                   (e.g. "admin", "team", "user")
 * @returns {Function} Express middleware that calls next() or returns 403
 *
 * Usage:
 *   router.get("/admin-only", userAuthenticated, authorizeRoles("admin"), handler);
 */
export const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new AppError("Not authorized", 401));
        }

        if (!allowedRoles.includes(req.user.role)) {
            return next(
                new AppError(
                    `Role (${req.user.role}) is not authorized to access this resource`,
                    403
                )
            );
        }

        next();
    };
};
