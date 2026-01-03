import asyncHandler from "../middlewares/asyncHandler.js";
import AppError from "../utils/AppError.js";
import { successResponse } from "../utils/apiResponse.js";
import User from "../models/User.model.js";

// @desc    Register a new user
export const registerUser = asyncHandler(async (req, res) => {
    try {
        const { name, email, password } = req.body;

        console.log(name, email, password);

        if (!name || !email || !password) {
            throw new AppError("Name, email and password are required", 400);
        }

        const userExists = await User.findOne({
            $or: [{ email }, { name }],
        });
        if (userExists) {
            throw new AppError("User already exists", 409);
        }

        const createdUser = await User.create({ name, email, password });

        if (!createdUser) {
            throw new AppError("User registration failed", 500);
        }

        // Email verification logic can be added here

        const code = await createdUser.genrateVerificationCode();
        console.log("Verification code:", code);
        await createdUser.save();

        // Generate JWT tokens
        const accessToken = await createdUser.genrateAccessToken();
        const refreshToken = await createdUser.genrateRefreshToken();
        // Set tokens in HTTP-only cookies

        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "Strict",
            maxAge: 15 * 60 * 1000, // 15 minutes
        });

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "Strict",
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        });

        const user = createdUser.toObject();
        delete user.password; // Remove password from the response

        successResponse(res, "User registered successfully", user, 201);
    } catch (error) {
        console.error("Error in registerUser:", error);
        throw new AppError(`Registration failed: ${error.message}`, 500);

    }
});


export const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new AppError("Email and password are required", 400);
    }
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
        throw new AppError("User not found", 404);
    }

    if (!(await user.comparePassword(password))) {
        throw new AppError("Invalid password", 401);
    }

    // Skip password field in response
    user.password = undefined;

    // Generate JWT tokens
    const accessToken = await user.genrateAccessToken();
    const refreshToken = await user.genrateRefreshToken();
    // Set tokens in HTTP-only cookies

    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
        maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });


    successResponse(res, "User logged in successfully", user, 200);
});


// Additional user controller functions can be added here


export const getUserProfile = asyncHandler(async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId).select("-password");

        if (!user) {
            throw new AppError("User not found", 404);
        }

        successResponse(res, "User profile retrieved successfully", user, 200);
    } catch (error) {
        console.error("Error in getUserProfile:", error);
        throw new AppError(`Failed to retrieve user profile: ${error.message}`, 500);
    }
});

// Delete user controller functions can be added here

export const deleteUser = asyncHandler(async (req, res) => {
    try {
        const userId = req.params.id;
        await User.findByIdAndDelete(userId);
        successResponse(res, "User deleted successfully", null, 200);
    } catch (error) {
        console.error("Error in deleteUser:", error);
        throw new AppError(`Failed to delete user: ${error.message}`, 500);
    }
});