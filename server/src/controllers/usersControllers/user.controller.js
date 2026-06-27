/**
 * User controller – authentication, profile management, and team endpoints.
 *
 * Routes (all prefixed with /api/v1/users):
 *  POST   /register                  → registerUser
 *  POST   /login                     → loginUser
 *  POST   /logout                    → logoutUser
 *  POST   /verify                    → verifyUserEmail
 *  POST   /resend-verification       → resendVerificationEmail
 *  POST   /forgot-password           → forgotPassword
 *  POST   /reset-password/:token     → resetPassword
 *  POST   /refresh-token             → refreshAccessToken
 *  GET    /team                      → getPublicTeamMembers
 *  GET    /                          → getAllUserProfile  (admin)
 *  POST   /create-team-member        → adminCreateTeamMember  (admin)
 *  GET    /profile/:id               → getUserProfile
 *  PUT    /update/:id                → updateUserProfile
 *  PUT    /update-password/:id       → updateUserPassword
 *  DELETE /:id                       → deleteUser
 */
import crypto from "crypto";
import jwt from "jsonwebtoken";
import asyncHandler from "../../middlewares/asyncHandler.js";
import AppError from "../../utils/AppError.js";
import { successResponse } from "../../utils/apiResponse.js";
import User from "../../models/usersModels/User.model.js";
import { uploadImage, deleteImage } from "../../middlewares/Cloudinary.js";
import { logAuthFail, logAuthSuccess } from "../../middlewares/requestLogger.js";
import { generateTokens } from "../../utils/generateTokens.js";
import {
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendSignupConfirmation,
} from "../../utils/sendEmails.js";
import { notifyAdmins } from "../../utils/notificationService.js";
import { fireAutomation, scheduleInactivityFollowup } from "../../utils/emailAutomationService.js";

// ─── Cookie helpers ───────────────────────────────────────────────────────────

const setAuthCookies = (res, accessToken, refreshToken) => {
    const secure = process.env.NODE_ENV === "production";
    // Cross-domain production setup (cometbrew.com → onrender.com) requires
    // SameSite: "None" + Secure so the browser sends cookies on withCredentials requests.
    const sameSite = secure ? "None" : "Strict";
    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure,
        sameSite,
        maxAge: 15 * 60 * 1000, // 15 minutes
    });
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure,
        sameSite,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });
};

// ─── REGISTER ────────────────────────────────────────────────────────────────

/**
 * Creates a new local (email/password) account.
 *
 * - Rejects if the email is already registered (no silent overwrite).
 * - Generates a 6-digit OTP and sends a verification email via Resend.
 * - Issues JWT cookies so the user can immediately reach /verification.
 */
export const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    const avatar = req.file?.path;

    if (!name || !email || !password) {
        throw new AppError("Name, email and password are required", 400);
    }

    const existing = await User.findOne({ email });
    if (existing) {
        throw new AppError("An account with this email already exists. Please sign in.", 409);
    }

    let avatarUrl;
    if (avatar) {
        const uploaded = await uploadImage(avatar, "avatars");
        avatarUrl = uploaded?.secure_url;
    }

    const user = await User.create({
        name,
        email,
        password,
        provider: "local",
        ...(avatarUrl && { photo: avatarUrl }),
    });

    // Generate OTP — method saves the user internally, returns the plain code
    const code = await user.generateVerificationCode();

    // Send verification email — non-blocking so a Resend hiccup never fails registration
    Promise.allSettled([
        sendVerificationEmail({ to: email, name, code }),
    ]).then(([result]) => {
        if (result.status === "rejected") {
            console.error("[Register] Verification email failed:", result.reason?.message);
        }
    });

    const { accessToken, refreshToken } = await generateTokens(user);
    setAuthCookies(res, accessToken, refreshToken);

    const userObj = user.toObject();
    delete userObj.password;

    // Notify all admins of the new signup (non-blocking, no createdBy since user is unverified)
    const io = req.app.get("io");
    notifyAdmins(io, {
        type: "user_registered",
        title: "New User Registered",
        message: `${name} (${email}) just created an account`,
        payload: { userId: user._id, name, email },
    }).catch(() => {});

    successResponse(res, "Account created. Check your email for the verification code.", userObj, 201);
});

// ─── EMAIL VERIFICATION ───────────────────────────────────────────────────────

/**
 * Verifies a user's email using the 6-digit OTP sent at registration.
 */
export const verifyUserEmail = asyncHandler(async (req, res) => {
    const { code, email } = req.body;

    if (!email || !code) {
        throw new AppError("Email and verification code are required", 400);
    }

    const user = await User.findOne({ email });
    if (!user) throw new AppError("No account found with this email", 404);
    if (user.isVerified) throw new AppError("This account is already verified", 400);

    if (!user.emailVerificationToken) {
        throw new AppError("No verification code found. Please request a new one.", 400);
    }
    if (user.emailVerificationExpires < Date.now()) {
        throw new AppError("Verification code has expired. Please request a new one.", 400);
    }
    if (user.emailVerificationToken !== code) {
        throw new AppError("Invalid verification code", 400);
    }

    user.isVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });

    successResponse(res, "Email verified successfully", null, 200);

    // Send welcome email non-blocking
    sendSignupConfirmation({ to: user.email, name: user.name }).catch(() => {});
    fireAutomation('welcome_user', { userName: user.name, userEmail: user.email }).catch(() => {});
});

/**
 * Re-generates and emails a fresh 6-digit OTP.
 * Use when the original code expired before the user could enter it.
 */
export const resendVerificationEmail = asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) throw new AppError("Email is required", 400);

    const user = await User.findOne({ email });
    if (!user) throw new AppError("No account found with this email", 404);
    if (user.isVerified) throw new AppError("This account is already verified", 400);

    const code = await user.generateVerificationCode();

    Promise.allSettled([
        sendVerificationEmail({ to: email, name: user.name, code }),
    ]).then(([result]) => {
        if (result.status === "rejected") {
            console.error("[ResendVerify] Email failed:", result.reason?.message);
        }
    });

    successResponse(res, "A new verification code has been sent to your email.", null, 200);
});

// ─── LOGIN / LOGOUT / REFRESH ─────────────────────────────────────────────────

/**
 * Authenticates an existing user with email and password.
 *
 * Strict LOGIN-only rule: this endpoint NEVER creates accounts.
 * Rejects with a clear error if the user signed up via OAuth and has no password.
 */
export const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new AppError("Email and password are required", 400);
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
        logAuthFail(req, "user_not_found");
        throw new AppError("No account found with this email address", 401);
    }

    // Account created via Google or GitHub — has no password
    if (!user.password) {
        const providers = [user.googleId && "Google", user.githubId && "GitHub"]
            .filter(Boolean)
            .join(" or ");
        logAuthFail(req, "oauth_only_account");
        throw new AppError(
            `This account was created with ${providers || "OAuth"}. Please sign in using that method.`,
            401
        );
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
        logAuthFail(req, "wrong_password");
        throw new AppError("Incorrect password", 401);
    }

    // If 2FA is enabled, return a pending state instead of full tokens
    if (user.twoFactorEnabled) {
        logAuthSuccess(req, user._id);
        return successResponse(res, "2FA required", {
            requiresTwoFactor: true,
            userId: user._id.toString(),
        }, 200);
    }

    user.lastLoginAt = new Date();
    const { accessToken, refreshToken } = await generateTokens(user);
    logAuthSuccess(req, user._id);
    setAuthCookies(res, accessToken, refreshToken);
    scheduleInactivityFollowup(user).catch(() => {});

    const userResponse = user.toObject();
    delete userResponse.password;

    // Include accessToken in body so the client can use it for Socket.IO auth
    // (HTTP-only cookies don't cross domain boundaries in all browsers)
    successResponse(res, "Signed in successfully", { ...userResponse, accessToken }, 200);
});

/**
 * Clears auth cookies, ending the session.
 */
export const logoutUser = asyncHandler(async (req, res) => {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    successResponse(res, "Signed out successfully", null, 200);
});

/**
 * Issues a new access token from a valid refresh token.
 * The refresh token is read from the HTTP-only cookie (or request body as fallback).
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

    const accessToken = user.generateAccessToken();
    await user.save({ validateBeforeSave: false });

    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "None" : "Strict",
        maxAge: 15 * 60 * 1000,
    });

    successResponse(res, "Access token refreshed", { accessToken });
});

// ─── PASSWORD MANAGEMENT ──────────────────────────────────────────────────────

/**
 * Initiates the forgot-password flow.
 * Generates a signed reset token and emails a reset link to the user.
 * OAuth-only accounts (no password) are rejected with a clear message.
 */
export const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) throw new AppError("Email is required", 400);

    const user = await User.findOne({ email });
    if (!user) throw new AppError("No account found with this email", 404);

    if (!user.password) {
        const providers = [user.googleId && "Google", user.githubId && "GitHub"]
            .filter(Boolean)
            .join(" or ");
        throw new AppError(
            `This account uses ${providers || "OAuth"} sign-in. Password reset is not available.`,
            400
        );
    }

    const resetToken = await user.forgetPasswordToken();
    // Use the frontend CLIENT_URL so the user lands on the React reset-password page
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    await Promise.allSettled([
        sendPasswordResetEmail({ to: email, name: user.name, resetUrl }),
    ]);

    successResponse(res, "Password reset email sent. Check your inbox.", null, 200);
});

/**
 * Completes the forgot-password flow.
 * Validates the raw reset token from the URL, then sets the new password.
 */
export const resetPassword = asyncHandler(async (req, res) => {
    const { token } = req.params;
    const { newPassword, confirmPassword } = req.body;

    if (!token) throw new AppError("Reset token is required", 400);
    if (!newPassword || !confirmPassword) {
        throw new AppError("New password and confirmation are required", 400);
    }
    if (newPassword !== confirmPassword) {
        throw new AppError("Passwords do not match", 400);
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) throw new AppError("Reset token is invalid or has expired", 400);

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    successResponse(res, "Password reset successfully. You can now sign in.", null, 200);
});

/**
 * Changes a user's password after verifying the current password.
 */
export const updateUserPassword = asyncHandler(async (req, res) => {
    const userId = req.params.id;
    const { oldPassword, newPassword } = req.body;

    if (!userId) throw new AppError("User ID is required", 400);
    if (!oldPassword || !newPassword) {
        throw new AppError("Current password and new password are required", 400);
    }

    const user = await User.findById(userId).select("+password");
    if (!user) throw new AppError("User not found", 404);

    if (!user.password) {
        throw new AppError(
            "This account uses OAuth sign-in. Please set a password first.",
            400
        );
    }

    const isValid = await user.comparePassword(oldPassword);
    if (!isValid) throw new AppError("Current password is incorrect", 401);

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    successResponse(res, "Password updated successfully", null, 200);
});

// ─── PROFILE ──────────────────────────────────────────────────────────────────

/**
 * Returns all user profiles (admin only). Password excluded.
 */
export const getAllUserProfile = asyncHandler(async (req, res) => {
    const users = await User.find().select("-password");
    successResponse(res, "Users retrieved successfully", users, 200);
});

/**
 * Returns a single user's profile by ID. Password excluded.
 */
export const getUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) throw new AppError("User not found", 404);
    successResponse(res, "User profile retrieved successfully", user, 200);
});

/**
 * Updates a user's profile fields.
 *
 * Password and email are intentionally blocked here — use their dedicated endpoints.
 * Replaces the Cloudinary avatar if a new file is uploaded.
 */
export const updateUserProfile = asyncHandler(async (req, res) => {
    const userId = req.params.id;
    const rawUpdates = req.body || {};
    const avatar = req.file?.path;

    if (!userId) throw new AppError("User ID is required", 400);

    const ALLOWED_FIELDS = new Set([
        "name", "phone", "bio", "position", "department",
        "teamProfile", "skills", "location", "website",
    ]);

    const updates = Object.fromEntries(
        Object.entries(rawUpdates).filter(([k]) => ALLOWED_FIELDS.has(k))
    );

    if (Object.keys(updates).length === 0 && !avatar) {
        throw new AppError("No data provided for update", 400);
    }

    if (avatar) {
        const user = await User.findById(userId);
        if (!user) throw new AppError("User not found", 404);

        if (user.photo && user.photo !== "default.jpg") {
            await deleteImage(user.photo);
        }

        const uploaded = await uploadImage(avatar, "avatars");
        updates.photo = uploaded.secure_url;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updates, {
        new: true,
        runValidators: true,
    });

    if (!updatedUser) throw new AppError("User not found", 404);

    successResponse(res, "Profile updated successfully", updatedUser, 200);
});

/**
 * Permanently deletes a user account.
 */
export const deleteUser = asyncHandler(async (req, res) => {
    const userId = req.params.id;
    if (!userId) throw new AppError("User ID is required", 400);

    const deleted = await User.findByIdAndDelete(userId);
    if (!deleted) throw new AppError("User not found", 404);

    successResponse(res, "Account deleted successfully", null, 200);
});

// ─── ADMIN ────────────────────────────────────────────────────────────────────

/**
 * Admin-only: Creates a pre-verified team member or admin account.
 */
export const adminCreateTeamMember = asyncHandler(async (req, res) => {
    const { name, email, password, role = "team", teamProfile = {} } = req.body;

    if (!name || !email || !password) {
        throw new AppError("Name, email and password are required", 400);
    }
    if (!["team", "admin"].includes(role)) {
        throw new AppError("Role must be 'team' or 'admin'", 400);
    }

    const existing = await User.findOne({ email });
    if (existing) throw new AppError("A user with this email already exists", 409);

    let photoUrl;
    if (req.file?.path) {
        const uploaded = await uploadImage(req.file.path, "avatars");
        photoUrl = uploaded?.secure_url;
    }

    const newUser = await User.create({
        name,
        email,
        password,
        role,
        provider: "local",
        isVerified: true,
        isActive: true,
        ...(photoUrl && { photo: photoUrl }),
        teamProfile: {
            position:     teamProfile.position     || name,
            department:   teamProfile.department   || "Other",
            bio:          teamProfile.bio          || "",
            phone:        teamProfile.phone        || "",
            skills:       teamProfile.skills       || [],
            experience:   teamProfile.experience   || "",
            status:       teamProfile.status       || "Active",
            memberRole:   teamProfile.memberRole   || "Member",
            socialLinks:  teamProfile.socialLinks  || {},
            featured:     teamProfile.featured     || false,
            displayOrder: teamProfile.displayOrder || 0,
        },
    });

    const userObj = newUser.toObject();
    delete userObj.password;

    successResponse(res, "Team member created successfully", userObj, 201);
});

// ─── PUBLIC ───────────────────────────────────────────────────────────────────

/**
 * Returns publicly visible team member profiles for the "Meet the Team" section.
 * Only active members with status "Active" are returned; no sensitive fields exposed.
 */
export const getPublicTeamMembers = asyncHandler(async (req, res) => {
    const members = await User.find({
        role: { $in: ["team", "admin"] },
        isActive: { $ne: false },
        deletedAt: null,
        // Only exclude members explicitly hidden by admin (false); show all others
        "teamProfile.showOnTeamPage": { $ne: false },
    })
        .select(
            "name photo email teamProfile.position teamProfile.department " +
            "teamProfile.bio teamProfile.socialLinks teamProfile.skills " +
            "teamProfile.featured teamProfile.displayOrder teamProfile.showOnTeamPage teamProfile.status"
        )
        .sort({ "teamProfile.displayOrder": 1, createdAt: 1 });

    successResponse(res, "Team members fetched", { members, total: members.length });
});
