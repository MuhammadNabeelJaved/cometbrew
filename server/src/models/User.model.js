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
        },

        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [8, "Password must be at least 8 characters"],
            // maxlength: [20, "Password cannot exceed 20 characters"],
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
        accessToken: {
            type: String,
            select: false,
        },
        refreshToken: {
            type: String,
            select: false,
        },

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

        isEmailVerified: {
            type: Boolean,
            default: false,
        },

        // =====================
        // EMAIL VERIFICATION
        // =====================
        emailVerificationToken: {
            type: String,
            // select: false,
        },

        emailVerificationExpires: {
            type: Date,
            // select: false,
        },

        // =====================
        // PASSWORD RESET
        // =====================
        passwordResetToken: {
            type: String,
            select: false,
        },

        passwordResetExpires: {
            type: Date,
            select: false,
        },

        passwordChangedAt: Date,

        // =====================
        // SOFT DELETE (PRO)
        // =====================
        deletedAt: {
            type: Date,
            default: null,
            index: true,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

userSchema.pre("save", async function () {
    if (!this.isModified("password")) {
        return;
    }

    try {
        this.password = await bcrypt.hash(this.password, 10);
        // next();
    } catch (err) {
        // next(err);
    }
});


userSchema.methods.genrateVerificationCode = async function () {
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    this.emailVerificationToken = code
    this.emailVerificationExpires = Date.now() + 1000 * 60 * 10 // 10 minutes
    await this.save()
    return code
}



userSchema.methods.comparePassword = async function (enteredPassword) {
    // if (!enteredPassword) return false;
    return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.forgetPasswordToken = async function () {
    const resetToken = crypto.randomBytes(20).toString("hex");
    this.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    this.passwordResetExpires = Date.now() + 1000 * 60 * 10; // 10 minutes
    // await this.save();
    return resetToken;
}


userSchema.methods.isVerificationCodeCorrect = async function (code) {
    return this.verificationCode === code && this.verificationCodeExpires > Date.now()
}

userSchema.methods.isVerificationCodeExpired = async function () {
    return this.verificationCodeExpires < Date.now()
}

userSchema.methods.genrateAccessToken = async function () {
    return jwt.sign({ id: this._id }, process.env.JWT_ACCESS_SECRET, { expiresIn: process.env.JWT_ACCESS_SECRET_EXPIRES_IN })
}

userSchema.methods.genrateRefreshToken = async function () {
    return jwt.sign({ id: this._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN })
}


const User = mongoose.model("User", userSchema);
export default User;
