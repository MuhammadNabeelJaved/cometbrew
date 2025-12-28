import mongoose from "mongoose";
import bcrypt from "bcryptjs";
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
            maxlength: [20, "Password cannot exceed 20 characters"],
            select: false, // 🔐 never return password
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
            select: false,
        },

        emailVerificationExpires: {
            type: Date,
            select: false,
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

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10);
    next();
});


userSchema.methods.genrateVerificationCode = async function () {
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    this.verificationCode = code
    this.verificationCodeExpires = Date.now() + 1000 * 60 * 10 // 10 minutes
    await this.save()
    return code
}



userSchema.methods.comparePassword = async function (enteredPassword) {
    if (!enteredPassword) return false;
    return await bcrypt.compare(enteredPassword, this.password);
};


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

// userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
//     if (this.passwordChangedAt) {
//         const changedTime = Math.floor(
//             this.passwordChangedAt.getTime() / 1000
//         );
//         return JWTTimestamp < changedTime;
//     }
//     return false;
// };


// userSchema.methods.createEmailVerificationToken = function () {
//     const token = crypto.randomBytes(32).toString("hex");

//     this.emailVerificationToken = crypto
//         .createHash("sha256")
//         .update(token)
//         .digest("hex");

//     this.emailVerificationExpires = Date.now() + 10 * 60 * 1000; // 10 min

//     return token; // send via email
// };


// userSchema.methods.createPasswordResetToken = function () {
//     const token = crypto.randomBytes(32).toString("hex");

//     this.passwordResetToken = crypto
//         .createHash("sha256")
//         .update(token)
//         .digest("hex");

//     this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 min

//     return token;
// };



userSchema.pre(/^find/, function (next) {
    this.find({
        isActive: { $ne: false },
        deletedAt: null,
    });
    next();
});


const User = mongoose.model("User", userSchema);
export default User;
