/**
 * User model – core identity and authentication schema.
 *
 * Covers:
 *  - Basic profile (name, email, password, avatar)
 *  - Roles: "admin" | "team" | "user"
 *  - JWT access/refresh token storage
 *  - Email verification (6-digit code, 10-minute expiry)
 *  - Password reset (SHA-256 hashed token, 10-minute expiry)
 *  - Soft-delete via `deletedAt`
 *  - Team-member extended profile (`teamProfile` sub-document)
 *
 * Important: `password` is excluded from queries by default (`select: false`).
 * Use `.select("+password")` when you need to compare passwords.
 */
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import validator from "validator";
import crypto from "crypto";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema(
    {
        // =====================
        // BASIC INFORMATION
        // =====================
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
            minlength: [3, "Name must be at least 3 characters"],
            maxlength: [50, "Name cannot exceed 50 characters"],
        },

        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
            validate: [validator.isEmail, "Please provide a valid email"],
            index: true,
            match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
        },

        password: {
            type: String,
            required: false, // Optional for OAuth users (Google/GitHub sign-in)
            minlength: [8, "Password must be at least 8 characters"],
            // maxlength: [20, "Password cannot exceed 20 characters"],
            select: false, // Never returned in queries unless explicitly requested
        },

        // =====================
        // AUTH PROVIDER
        // =====================
        // Which method was used to create this account
        provider: {
            type: String,
            enum: ['local', 'google', 'github'],
            default: 'local',
            index: true,
        },

        // OAuth provider IDs (sparse index: only indexed when field is present)
        googleId: {
            type: String,
            sparse: true,
            index: true,
        },

        githubId: {
            type: String,
            sparse: true,
            index: true,
        },

        photo: {
            type: String,
            default: "default.jpg", // Falls back to a placeholder avatar
        },

        // =====================
        // ROLE & PERMISSIONS
        // =====================
        role: {
            type: String,
            enum: ["admin", "team", "user"],
            default: "user",
            index: true,
        },

        // Stored tokens (not returned by default); refreshed on each login
        accessToken: {
            type: String,
            select: false,
        },
        refreshToken: {
            type: String,
            select: false,
        },

        // Fine-grained permission strings (currently unused; reserved for future RBAC)
        permissions: {
            type: [String],
            default: [],
        },

        // =====================
        // ACCOUNT STATUS
        // =====================
        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },

        // Real-time availability for team members (visible to teammates & admin)
        availabilityStatus: {
            type: String,
            enum: ["available", "busy", "meeting", "away", "wfh", "offline"],
            default: "available",
        },

        // Email must be verified before the user can log in
        isVerified: {
            type: Boolean,
            default: false,
        },

        // =====================
        // EMAIL VERIFICATION
        // =====================
        emailVerificationToken: {
            type: String,
            // Plain-text 6-digit code stored temporarily until verified
        },

        emailVerificationExpires: {
            type: Date,
            // Set to 10 minutes from generation; checked before accepting the code
        },

        // =====================
        // PASSWORD RESET
        // =====================
        passwordResetToken: {
            type: String,
            select: false, // SHA-256 hash of the raw token sent via email
        },

        passwordResetExpires: {
            type: Date,
            select: false,
        },

        passwordChangedAt: Date, // Updated whenever the password is changed

        // =====================
        // SOFT DELETE (PRO)
        // =====================
        deletedAt: {
            type: Date,
            default: null, // null = active; non-null = soft-deleted
            index: true,
        },

        // =====================
        // TEAM MEMBER SPECIFIC FIELDS (conditionally required)
        // =====================
        teamProfile: {
            // `position` is required for users with role "team" or "admin"
            position: {
                type: String,
                trim: true,
                maxlength: [150, 'Position cannot exceed 150 characters'],
                required: function () {
                    return this.role === 'team' || this.role === 'admin';
                }
            },

            department: {
                type: String,
                enum: ['CEO', 'Design', 'Development', 'Marketing', 'Sales', 'Management', 'Other'],
            },

            bio: {
                type: String,
                trim: true,
                maxlength: [500, 'Bio cannot exceed 500 characters']
            },

            phone: {
                type: String,
                trim: true
            },

            socialLinks: {
                linkedin: String,
                twitter: String,
                github: String,
                portfolio: String,
                other: [String]
            },

            skills: [{
                type: String,
                trim: true
            }],

            experience: {
                type: String,
                trim: true
            },

            joinedDate: {
                type: Date,
                default: Date.now
            },

            // Controls display order on the public team page (lower = first)
            displayOrder: {
                type: Number,
                default: 0
            },

            // Whether this member appears in the "featured" section of the team page
            featured: {
                type: Boolean,
                default: false
            },

            status: {
                type: String,
                enum: ['Active', 'On Leave', 'Inactive', 'Recently Joined'],
                default: 'Active'
            },

            memberRole: {
                type: String,
                enum: ['Member', 'Team Lead', 'Manager', 'Director', 'VP', 'C-Level', 'Intern', 'Other'],
                default: 'Member'
            }
        }


    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// ─── Hooks ───────────────────────────────────────────────────────────────────

/**
 * Hash the password with bcrypt (cost factor 10) before any save.
 * Skipped if the password field was not modified (avoids double-hashing).
 */
userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 10);
});

// ─── Static Methods ───────────────────────────────────────────────────────────

/** Returns all active team/admin users sorted by their display order. */
userSchema.statics.getTeamMembers = function () {
    return this.find({
        role: { $in: ['team', 'admin'] },
        isActive: true
    }).sort({ 'teamProfile.displayOrder': 1 });
};

/** Returns active team/admin users filtered by department. */
userSchema.statics.getByDepartment = function (department) {
    return this.find({
        role: { $in: ['team', 'admin'] },
        'teamProfile.department': department,
        isActive: true
    });
};

// ─── Instance Methods ─────────────────────────────────────────────────────────

/**
 * Generates a 6-digit numeric verification code, stores its hash and expiry
 * on the document, saves the document, and returns the raw code.
 * The raw code should be sent to the user via email.
 */
userSchema.methods.generateVerificationCode = async function () {
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    this.emailVerificationToken = code
    this.emailVerificationExpires = Date.now() + 1000 * 60 * 10 // 10 minutes
    await this.save({ validateBeforeSave: false })
    return code
}

/**
 * Compares a plain-text password against the stored bcrypt hash.
 *
 * @param {string} enteredPassword - Plain-text password from the login form
 * @returns {Promise<boolean>} true if matching, false otherwise
 */
userSchema.methods.comparePassword = async function (enteredPassword) {
    if (!enteredPassword || !this.password) {
        return false;
    }

    return await bcrypt.compare(enteredPassword, this.password);
};

/**
 * Generates a password reset token:
 *  1. Creates a cryptographically random 20-byte hex string (the raw token)
 *  2. Stores its SHA-256 hash on the document (`passwordResetToken`)
 *  3. Sets a 10-minute expiry (`passwordResetExpires`)
 *  4. Saves the document and returns the raw token to be included in the email link
 */
userSchema.methods.forgetPasswordToken = async function () {
    const resetToken = crypto.randomBytes(20).toString("hex");
    this.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    this.passwordResetExpires = Date.now() + 1000 * 60 * 10; // 10 minutes
    await this.save({ validateBeforeSave: false });
    return resetToken;
}

/** Returns true if the provided code matches and has not expired. */
userSchema.methods.isVerificationCodeCorrect = async function (code) {
    return this.emailVerificationToken === code && this.emailVerificationExpires > Date.now()
}

/** Returns true if the verification code has passed its expiry time. */
userSchema.methods.isVerificationCodeExpired = async function () {
    return this.emailVerificationExpires < Date.now()
}

/**
 * Signs and returns a short-lived JWT access token (default 15 minutes).
 * Payload: { id }
 */
userSchema.methods.generateAccessToken = function () {
    return jwt.sign({ id: this._id }, process.env.JWT_ACCESS_SECRET, { expiresIn: process.env.JWT_ACCESS_SECRET_EXPIRES_IN })
}

/**
 * Signs and returns a long-lived JWT refresh token (default 7 days).
 * Payload: { id }
 */
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign({ id: this._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN })
}


const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;
