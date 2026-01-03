import jwt from "jsonwebtoken";
import asyncHandler from "./asyncHandler.js";
import User from "../models/User.model.js"; // Your Mongoose User model
import AppError from "../utils/AppError.js";

// ========================
// User Authentication Middleware
// ========================
export const userAuthenticated = asyncHandler(async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new AppError("Unauthorized: No token provided", 401);
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

        // Fetch full user info from DB
        const user = await User.findById(decoded.id).select("-password");
        if (!user) {
            throw new AppError("Unauthorized: User not found", 401);
        }

        // Check if user is verified
        if (!user.isVerified) {
            throw new AppError("Unauthorized: Account not verified", 403);
        }

        // Attach user to request
        req.user = user;
        next();
    } catch (err) {
        throw new AppError("Unauthorized: Invalid token", 401);
    }
});

// ========================
// Role-based Authorization Middleware
// ========================
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
