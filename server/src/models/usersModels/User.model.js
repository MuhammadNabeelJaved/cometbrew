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
            required: [true, "Password is required"],
            minlength: [8, "Password must be at least 8 characters"],
            // maxlength: [20, "Password cannot exceed 20 characters"],
            select: false,
        },

        photo: {
            type: String,
            default: "default.jpg",
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

        isVerified: {
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

        // =====================
        // TEAM MEMBER SPECIFIC FIELDS (conditionally required)
        // =====================
        teamProfile: {
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

            displayOrder: {
                type: Number,
                default: 0
            },

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

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        return next();
    }

    try {
        this.password = await bcrypt.hash(this.password, 10);
        next();
    } catch (err) {
        next(err);
    }
});

// Static method to get team members only
userSchema.statics.getTeamMembers = function () {
    return this.find({
        role: { $in: ['team', 'admin'] },
        isActive: true
    }).sort({ 'teamProfile.displayOrder': 1 });
};

// Static method to get by department
userSchema.statics.getByDepartment = function (department) {
    return this.find({
        role: { $in: ['team', 'admin'] },
        'teamProfile.department': department,
        isActive: true
    });
};


userSchema.methods.generateVerificationCode = async function () {
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    this.emailVerificationToken = code
    this.emailVerificationExpires = Date.now() + 1000 * 60 * 10 // 10 minutes
    await this.save({ validateBeforeSave: false })
    return code
}



userSchema.methods.comparePassword = async function (enteredPassword) {
    if (!enteredPassword || !this.password) {
        return false;
    }

    return await bcrypt.compare(enteredPassword, this.password);
};


userSchema.methods.forgetPasswordToken = async function () {
    const resetToken = crypto.randomBytes(20).toString("hex");
    this.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    this.passwordResetExpires = Date.now() + 1000 * 60 * 10; // 10 minutes
    await this.save({ validateBeforeSave: false });
    return resetToken;
}


userSchema.methods.isVerificationCodeCorrect = async function (code) {
    return this.emailVerificationToken === code && this.emailVerificationExpires > Date.now()
}

userSchema.methods.isVerificationCodeExpired = async function () {
    return this.emailVerificationExpires < Date.now()
}

userSchema.methods.generateAccessToken = function () {
    return jwt.sign({ id: this._id }, process.env.JWT_ACCESS_SECRET, { expiresIn: process.env.JWT_ACCESS_SECRET_EXPIRES_IN })
}

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign({ id: this._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN })
}


const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;
