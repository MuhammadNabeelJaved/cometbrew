/**
 * User controller – authentication, profile management, and team endpoints.
 *
 * Exported functions:
 *  - registerUser          POST /api/v1/users/register
 *  - verifyUserEmail       POST /api/v1/users/verify
 *  - resendVerificationEmail POST /api/v1/users/resend-verification
 *  - loginUser             POST /api/v1/users/login
 *  - logoutUser            POST /api/v1/users/logout
 *  - getAllUserProfile      GET  /api/v1/users/          (admin)
 *  - getUserProfile        GET  /api/v1/users/profile/:id
 *  - deleteUser            DELETE /api/v1/users/:id
 *  - updateUserProfile     PUT  /api/v1/users/update/:id
 *  - updateUserPassword    PUT  /api/v1/users/update-password/:id
 *  - forgotPassword        POST /api/v1/users/forgot-password
 *  - resetPassword         POST /api/v1/users/reset-password/:token
 *  - refreshAccessToken    POST /api/v1/users/refresh-token
 *  - getPublicTeamMembers  GET  /api/v1/users/team
 */
import crypto from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import asyncHandler from "../../middlewares/asyncHandler.js";
import AppError from "../../utils/AppError.js";
import { successResponse } from "../../utils/apiResponse.js";
import User from "../../models/usersModels/User.model.js";
import { uploadImage, deleteImage } from "../../middlewares/Cloudinary.js";



// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL HELPER – Generate and store JWT access + refresh tokens
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generates a JWT access token and refresh token for the given user,
 * saves the user document (to persist the refresh token), and returns both.
 *
 * @param {Document} user - Mongoose User document
 * @returns {{ accessToken: string, refreshToken: string }}
 * @throws {AppError} 500 on token generation failure
 */
const jwtTokens = async (user) => {
    try {
        if (!user) {
            throw new AppError("User not found", 404);
        }

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        // Persist the refresh token so the /refresh-token endpoint can validate it
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        console.error("Error in jwtTokens:", error);
        if (error.isOperational || error.name === 'ValidationError' || error.name === 'CastError' || error.code === 11000) throw error;
        throw new AppError(`Token generation failed: ${error.message}`, 500);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a new user account.
 *
 * - Optionally accepts an avatar file (via multer `upload.single("avatar")`)
 * - Generates a 6-digit email verification code (not yet emailed — placeholder)
 * - Issues access and refresh tokens and stores them in HTTP-only cookies
 */
export const registerUser = asyncHandler(async (req, res) => {
    try {
        const { name, email, password } = req.body || {};
        const avatar = req.file?.path;

        if (!name || !email || !password) {
            throw new AppError("Name, email and password are required", 400);
        }

        // Reject if email or username already exists
        const userExists = await User.findOne({
            $or: [{ email }, { name }],
        });
        if (userExists) {
            throw new AppError("User already exists", 409);
        }

        // Upload avatar to Cloudinary if provided
        let avatarUrl;
        if (avatar) {
            const uploaded = await uploadImage(avatar, "avatars");
            avatarUrl = uploaded?.secure_url;
        }

        const createdUser = await User.create({
            name,
            email,
            password,
            ...(avatarUrl && { photo: avatarUrl }),
        });

        if (!createdUser) {
            throw new AppError("User registration failed", 500);
        }

        // Generate a verification code and save it to the user document
        // TODO: send the code via email using sendVerificationEmail()
        const code = await createdUser.generateVerificationCode();

        // Issue JWT tokens and set them in HTTP-only cookies
        const { accessToken, refreshToken } = await jwtTokens(createdUser);

        if (!accessToken || !refreshToken) {
            throw new AppError("Token generation failed", 500);
        }

        // Access token: short-lived (15 min)
        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "Strict",
            maxAge: 15 * 60 * 1000, // 15 minutes
        });

        // Refresh token: long-lived (30 days)
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "Strict",
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        });

        const user = createdUser.toObject();
        delete user.password; // Never expose the password hash in responses

        successResponse(res, "User registered successfully", user, 201);
    } catch (error) {
        console.error("Error in registerUser:", error);
        if (error.isOperational || error.name === 'ValidationError' || error.name === 'CastError' || error.code === 11000) throw error;
        throw new AppError(`Registration failed: ${error.message}`, 500);

    }
});

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL VERIFICATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Verifies a user's email address using the 6-digit code sent after registration.
 *
 * Checks: code exists, code not expired, code matches stored value.
 */
export const verifyUserEmail = asyncHandler(async (req, res) => {
    try {
        const { code, email } = req.body;

        if (!email || !code) {
            throw new AppError("Email and verification code are required", 400);
        }

        const user = await User.findOne({ email });
        if (!user) {
            throw new AppError("User not found", 404);
        }
        if (user.isVerified) {
            throw new AppError("User is already verified", 400);
        }

        // Check if a code has been generated for this user
        if (!user.emailVerificationToken) {
            throw new AppError("No verification code found. Please request a new one", 400);
        }

        // Check if the code has expired (10-minute TTL)
        if (user.emailVerificationExpires < Date.now()) {
            throw new AppError("Verification code has expired. Please request a new one", 400);
        }

        // Validate the code
        if (user.emailVerificationToken !== code) {
            throw new AppError("Invalid verification code", 400);
        }

        // Mark account as verified and clear the one-time code
        user.isVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        await user.save({ validateBeforeSave: false });

        successResponse(res, "Email verified successfully", null, 200);
    } catch (error) {
        if (error.isOperational || error.name === 'ValidationError' || error.name === 'CastError' || error.code === 11000) throw error;
        throw new AppError(`Failed to verify email: ${error.message}`, 500);
    }
});

/**
 * Re-generates and stores a fresh 6-digit verification code.
 * Use when the previous code has expired.
 * TODO: send the new code via email.
 */
export const resendVerificationEmail = asyncHandler(async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            throw new AppError("Email is required", 400);
        }

        const user = await User.findOne({ email });
        if (!user) {
            throw new AppError("User not found", 404);
        }
        if (user.isVerified) {
            throw new AppError("User is already verified", 400);
        }

        // Generate a new verification code (saves the user internally)
        const code = await user.generateVerificationCode();

        if (!code) {
            throw new AppError("Failed to generate verification code", 500);
        }

        successResponse(res, "Verification code resent successfully", null, 200);
    } catch (error) {
        console.error("Error in resendVerificationEmail:", error);
        if (error.isOperational || error.name === 'ValidationError' || error.name === 'CastError' || error.code === 11000) throw error;
        throw new AppError(`Failed to resend verification email: ${error.message}`, 500);
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// AUTH – LOGIN / LOGOUT / REFRESH
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Authenticates a user by email and password, then issues JWT cookies.
 * Rejected if: user not found, password wrong.
 * Note: email verification is NOT required to log in (only to access protected routes).
 */
export const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new AppError("Email and password are required", 400);
    }

    // Fetch user with password hash (excluded by default)
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
        throw new AppError("Invalid email or password", 401);
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
        throw new AppError("Invalid password", 401);
    }

    const { accessToken, refreshToken } = await jwtTokens(user);

    const userResponse = user.toObject();
    delete userResponse.password;

    // Set short-lived access token cookie
    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
        maxAge: 15 * 60 * 1000,
    });

    // Set long-lived refresh token cookie
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
        maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    successResponse(res, "User logged in successfully", userResponse, 200);
});

/**
 * Clears the access and refresh token cookies, effectively ending the session.
 */
export const logoutUser = asyncHandler(async (req, res) => {
    try {
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
        successResponse(res, "User logged out successfully", null, 200);
    } catch (error) {
        console.error("Error in logoutUser:", error);
        if (error.isOperational || error.name === 'ValidationError' || error.name === 'CastError' || error.code === 11000) throw error;
        throw new AppError(`Failed to logout user: ${error.message}`, 500);
    }
})

/**
 * Issues a new access token using a valid refresh token.
 *
 * The refresh token can be sent as:
 *  - The `refreshToken` HTTP-only cookie (preferred)
 *  - The `refreshToken` field in the request body (fallback)
 */
export const refreshAccessToken = asyncHandler(async (req, res) => {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!token) throw new AppError("Refresh token not provided", 401);

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch {
        throw new AppError("Invalid or expired refresh token", 401);
    }

    const user = await User.findById(decoded.id).select("-password");
    if (!user) throw new AppError("User not found", 401);
    if (!user.isVerified) throw new AppError("Account not verified", 403);

    // Issue a fresh access token and update the cookie
    const accessToken = user.generateAccessToken();
    await user.save({ validateBeforeSave: false });

    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 15 * 60 * 1000,
    });

    successResponse(res, "Access token refreshed", { accessToken });
});

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE – READ
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns all user profiles (admin only).
 * Password hash is excluded from results.
 */
export const getAllUserProfile = asyncHandler(async (req, res) => {
    try {
        const allUser = await User.find().select("-password");

        if (!allUser) {
            throw new AppError("User not found", 404);
        }

        successResponse(res, "User profile retrieved successfully", allUser, 200);
    } catch (error) {
        console.error("Error in getAllUserProfile:", error);
        if (error.isOperational || error.name === 'ValidationError' || error.name === 'CastError' || error.code === 11000) throw error;
        throw new AppError(`Failed to retrieve user profile: ${error.message}`, 500);
    }
});

/**
 * Returns a single user's profile by ID.
 * Password hash is excluded from results.
 */
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
        if (error.isOperational || error.name === 'ValidationError' || error.name === 'CastError' || error.code === 11000) throw error;
        throw new AppError(`Failed to retrieve user profile: ${error.message}`, 500);
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE – UPDATE / DELETE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Permanently deletes a user account by ID.
 * Returns 404 if no user was found with the provided ID.
 */
export const deleteUser = asyncHandler(async (req, res) => {
    try {
        const userId = req.params.id;
        if (!userId) {
            throw new AppError("User ID is required", 400);
        }
        const deletedUser = await User.findByIdAndDelete(userId);
        if (!deletedUser) {
            throw new AppError("User not found", 404);
        }
        successResponse(res, "User deleted successfully", null, 200);
    } catch (error) {
        console.error("Error in deleteUser:", error);
        if (error.isOperational || error.name === 'ValidationError' || error.name === 'CastError' || error.code === 11000) throw error;
        throw new AppError(`Failed to delete user: ${error.message}`, 500);
    }
});

/**
 * Updates a user's profile fields.
 *
 * - Password and email changes are blocked (dedicated endpoints exist for those)
 * - If a new avatar is uploaded, the old Cloudinary image is deleted first
 *   (unless the current photo is the default placeholder "default.jpg")
 */
export const updateUserProfile = asyncHandler(async (req, res) => {
    try {
        const userId = req.params.id;
        const updates = req.body || {};
        const avatar = req.file?.path;

        if (!userId) {
            throw new AppError("User ID is required", 400);
        }

        // At least one field or a new avatar must be provided
        if (Object.keys(updates).length === 0 && !avatar) {
            throw new AppError("No data provided for update", 400);
        }

        // Reject attempts to change sensitive fields through this route
        if (updates.password || updates.email || updates.role) {
            throw new AppError(
                "Cannot update password, email, or role through this route",
                400
            );
        }

        // Handle avatar replacement
        if (avatar) {
            const user = await User.findById(userId);

            if (!user) {
                throw new AppError("User not found", 404);
            }

            // Only delete the old avatar if it is not the default placeholder
            if (user.photo && user.photo !== "default.jpg") {
                await deleteImage(user.photo);
            }

            const avatarUpload = await uploadImage(avatar, "avatars"); // Creates "user-avatars" folder
            updates.photo = avatarUpload.secure_url;
        }

        const updatedUser = await User.findByIdAndUpdate(userId, updates, {
            new: true,
            runValidators: true,
        });

        if (!updatedUser) {
            throw new AppError("User not found", 404);
        }

        successResponse(
            res,
            "User profile updated successfully",
            updatedUser,
            200
        );
    } catch (error) {
        console.error("Error in updateUserProfile:", error);
        if (error.isOperational || error.name === 'ValidationError' || error.name === 'CastError' || error.code === 11000) throw error;
        throw new AppError(`Failed to update user profile: ${error.message}`, 500);
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// PASSWORD MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Changes a user's password after verifying the current (old) password.
 * The new password is automatically hashed by the User model's pre-save hook.
 */
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
        const user = await User.findById(userId).select("+password");

        if (!user) {
            throw new AppError("User not found", 404);
        }
        const isPasswordValid = await user.comparePassword(oldPassword);
        if (!isPasswordValid) {
            throw new AppError("Invalid old password", 401);
        }
        user.password = newPassword;
        await user.save({ validateBeforeSave: false });
        successResponse(res, "Password updated successfully", null, 200);
    } catch (error) {
        console.error("Error in updateUserPassword:", error);
        if (error.isOperational || error.name === 'ValidationError' || error.name === 'CastError' || error.code === 11000) throw error;
        throw new AppError(`Failed to update password: ${error.message}`, 500);
    }
});

/**
 * Initiates the forgot-password flow.
 *
 * Generates a SHA-256 hashed reset token, stores it on the user document,
 * and returns the reset URL (in production this URL should be emailed to the user).
 * TODO: send the resetUrl via sendPasswordResetEmail().
 */
export const forgotPassword = asyncHandler(async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            throw new AppError("Email is required", 400);
        }
        const user = await User.findOne({ email }).select("+password");
        if (!user) {
            throw new AppError("User not found", 404);
        }

        // forgetPasswordToken() generates the raw token, hashes and saves it, returns raw
        const resetToken = await user.forgetPasswordToken();
        const resetUrl = `${req.protocol}://${req.get("host")}/api/v1/auth/reset-password/${resetToken}`;

        // TODO: Send password reset email
        successResponse(res, "Password reset email sent successfully", resetUrl, 200);
    } catch (error) {
        console.error("Error in forgotPassword:", error);
        if (error.isOperational || error.name === 'ValidationError' || error.name === 'CastError' || error.code === 11000) throw error;
        throw new AppError(`Failed to send password reset email: ${error.message}`, 500);
    }
});

/**
 * Completes the forgot-password flow.
 *
 * Accepts the raw reset token from the URL, SHA-256 hashes it, looks up the
 * user by the hash (and checks expiry), then sets the new password.
 */
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

        // Hash the raw token to compare against the stored hash
        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
        if (!hashedToken) {
            throw new AppError("Invalid reset token", 400);
        }

        // Find user with a matching, unexpired token
        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() },
        });

        if (!user) {
            throw new AppError("Invalid or expired reset token", 400);
        }

        user.password = newPassword
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();
        successResponse(res, "Password reset successfully", null, 200);
    } catch (error) {
        console.error("Error in resetPassword:", error);
        if (error.isOperational || error.name === 'ValidationError' || error.name === 'CastError' || error.code === 11000) throw error;
        throw new AppError(`Failed to reset password: ${error.message}`, 500);
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC – TEAM MEMBERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns publicly visible team member profiles for the "Meet the Team" page.
 *
 * Filters: role is "team" or "admin", account is active, deletedAt is null,
 *          and teamProfile.status is "Active".
 * Only a curated subset of fields is returned (no email, no sensitive data).
 */
export const getPublicTeamMembers = asyncHandler(async (req, res) => {
    const members = await User.find({
        role: { $in: ["team", "admin"] },
        isActive: true,
        deletedAt: null,
        "teamProfile.status": "Active",
    })
        .select("name photo teamProfile.position teamProfile.department teamProfile.bio teamProfile.socialLinks teamProfile.skills teamProfile.featured teamProfile.displayOrder")
        .sort({ "teamProfile.displayOrder": 1, createdAt: 1 });

    successResponse(res, "Team members fetched", { members, total: members.length });
});
