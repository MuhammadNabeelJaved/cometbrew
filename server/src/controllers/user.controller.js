import asyncHandler from "../middlewares/asyncHandler.js";
import AppError from "../utils/AppError.js";
import { successResponse } from "../utils/apiResponse.js";
import User from "../models/User.model.js";



// Generate JWT tokens 

const jwtTokens = async (user) => {
    if (!user) {
        throw new AppError("User not found", 404);
    }

    const accessToken = await user.genrateAccessToken();
    const refreshToken = await user.genrateRefreshToken();
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
}

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

        // Send verification email



        // Generate JWT tokens
        const { accessToken, refreshToken } = await jwtTokens(createdUser);

        if (!accessToken || !refreshToken) {
            throw new AppError("Token generation failed", 500);
        }

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

    // Check if password matches

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
        throw new AppError("Invalid password", 401);
    }

    // Skip password field in response
    user.password = undefined;

    // Generate JWT tokens
    const { accessToken, refreshToken } = await jwtTokens(createdUser);

    if (!accessToken || !refreshToken) {
        throw new AppError("Token generation failed", 500);
    }
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


// All user profile retrieval logic can be added here

export const getAllUserProfile = asyncHandler(async (req, res) => {
    try {
        const allUser = await User.find().select("-password");

        if (!allUser) {
            throw new AppError("User not found", 404);
        }

        successResponse(res, "User profile retrieved successfully", allUser, 200);
    } catch (error) {
        console.error("Error in getAllUserProfile:", error);
        throw new AppError(`Failed to retrieve user profile: ${error.message}`, 500);
    }
});


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


// Update user profile logic can be added here

export const updateUserProfile = asyncHandler(async (req, res) => {
    try {
        const userId = req.params.id;
        const updates = req.body;

        if (!userId) {
            throw new AppError("User ID is required", 400);
        }

        if (!req.body || Object.keys(req.body).length === 0) {
            throw new AppError("No data provided for update", 400);
        }
        if (updates.password || updates.email) {
            throw new AppError("Cannot update password or email through this route", 400);
        }
        const updatedUser = await User.findByIdAndUpdate(userId, updates, { new: true });
        if (!updatedUser) {
            throw new AppError("User not found", 404);
        }
        successResponse(res, "User profile updated successfully", updatedUser, 200);
    } catch (error) {
        console.error("Error in updateUserProfile:", error);
        throw new AppError(`Failed to update user profile: ${error.message}`, 500);
    }
});

// Update user password and forgot password logic can be added here
export const updateUserPassword = asyncHandler(async (req, res) => {
    try {
        const userId = req.params.id;
        const { oldPassword, newPassword } = req.body;
        if (!userId) {
            throw new AppError("User ID is required", 400);
        }
        if (!oldPassword || !newPassword) {
            throw new AppError("Old password and new password are required", 400);
        }
        console.log("oldPassword:", oldPassword, "newPassword:", newPassword);
        const user = await User.findById(userId).select("+password");
        console.log("DB password:", user?.password);

        if (!user) {
            throw new AppError("User not found", 404);
        }
        const isPasswordValid = await user.comparePassword(oldPassword);
        if (!isPasswordValid) {
            throw new AppError("Invalid old password", 401);
        }
        user.password = newPassword;
        await user.save();
        successResponse(res, "Password updated successfully", null, 200);
    } catch (error) {
        console.error("Error in updateUserPassword:", error);
        throw new AppError(`Failed to update password: ${error.message}`, 500);
    }
});

export const forgotPassword = asyncHandler(async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            throw new AppError("Email is required", 400);
        }
        const user = await User.findOne({ email });
        if (!user) {
            throw new AppError("User not found", 404);
        }
        const resetToken = await user.forgetPasswordToken();
        await user.save({ validateBeforeSave: false });
        const resetUrl = `${req.protocol}://${req.get("host")}/api/v1/auth/reset-password/${resetToken}`;
        console.log("Password reset URL:", resetUrl);

        // Send password reset email
        successResponse(res, "Password reset email sent successfully", resetUrl, 200);
    } catch (error) {
        console.error("Error in forgotPassword:", error);
        throw new AppError(`Failed to send password reset email: ${error.message}`, 500);
    }
});

export const resetPassword = asyncHandler(async (req, res) => {
    try {
        const { token } = req.params;
        const { newPassword, confirmPassword } = req.body;
        if (!token) {
            throw new AppError("Reset token is required", 400);
        }
        if (!newPassword || !confirmPassword) {
            throw new AppError("New password and confirm password are required", 400);
        }
        if (newPassword !== confirmPassword) {
            throw new AppError("New password and confirm password do not match", 400);
        }
        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() },
        });
        if (!user) {
            throw new AppError("Invalid or expired reset token", 400);
        }
        user.password = await bcrypt.hash(newPassword, 10);
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();
        successResponse(res, "Password reset successfully", null, 200);
    } catch (error) {
        console.error("Error in resetPassword:", error);
        throw new AppError(`Failed to reset password: ${error.message}`, 500);
    }
});