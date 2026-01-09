const mongoose = require('mongoose');

// Team Member Schema
const teamMemberSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters']
    },

    position: {
        type: String,
        required: [true, 'Position/Role is required'],
        trim: true,
        maxlength: [150, 'Position cannot exceed 150 characters']
    },

    department: {
        type: String,
        enum: ['CEO', 'Design', 'Development', 'Marketing', 'Sales', 'Management', 'Other'],
        default: 'Other'
    },

    profileImage: {
        url: {
            type: String,
            required: [true, 'Profile image URL is required']
        },
        alt: {
            type: String,
            default: 'Team member photo'
        }
    },

    bio: {
        type: String,
        required: [true, 'Bio/Description is required'],
        trim: true,
        maxlength: [500, 'Bio cannot exceed 500 characters']
    },

    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },

    phone: {
        type: String,
        trim: true
    },

    socialLinks: {
        linkedin: {
            type: String,
            default: ''
        },
        twitter: {
            type: String,
            default: ''
        },
        github: {
            type: String,
            default: ''
        },
        portfolio: {
            type: String,
            default: ''
        }
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

    isActive: {
        type: Boolean,
        default: true
    },

    featured: {
        type: Boolean,
        default: false
    },
    Status: {
        type: String,
        enum: ['Active', 'On Leave', 'Inactive'],
        default: 'Active'
    }

}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better query performance
teamMemberSchema.index({ name: 1 });
teamMemberSchema.index({ department: 1 });
teamMemberSchema.index({ displayOrder: 1 });
teamMemberSchema.index({ isActive: 1 });

// Virtual for full contact info
teamMemberSchema.virtual('contactInfo').get(function () {
    return {
        email: this.email,
        phone: this.phone,
        social: this.socialLinks
    };
});

// Static method to get all active team members
teamMemberSchema.statics.getActiveMembers = function () {
    return this.find({ isActive: true }).sort({ displayOrder: 1, createdAt: 1 });
};

// Static method to get members by department
teamMemberSchema.statics.getByDepartment = function (department) {
    return this.find({
        department: department,
        isActive: true
    }).sort({ displayOrder: 1 });
};

// Instance method to get member card data
teamMemberSchema.methods.getCardData = function () {
    return {
        id: this._id,
        name: this.name,
        position: this.position,
        image: this.profileImage.url,
        bio: this.bio,
        socialLinks: this.socialLinks
    };
};

// Pre-save middleware to set default alt text
teamMemberSchema.pre('save', function (next) {
    if (!this.profileImage.alt) {
        this.profileImage.alt = `${this.name} - ${this.position}`;
    }
    next();
});

const TeamMember = mongoose.models.TeamMember || mongoose.model('TeamMember', teamMemberSchema);

export default TeamMember;