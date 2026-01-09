const mongoose = require('mongoose');

// Project Schema
const projectSchema = new mongoose.Schema({
    // Basic Information
    projectTitle: {
        type: String,
        required: [true, 'Project title is required'],
        trim: true,
        maxlength: [100, 'Project title cannot exceed 100 characters'],
        index: true
    },

    clientName: {
        type: String,
        required: [true, 'Client name is required'],
        trim: true,
        maxlength: [100, 'Client name cannot exceed 100 characters']
    },

    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: {
            values: ['Web App', 'Mobile App', 'Desktop App', 'API Development', 'UI/UX Design', 'Other'],
            message: '{VALUE} is not a valid category'
        },
        default: 'Web App'
    },

    status: {
        type: String,
        required: [true, 'Status is required'],
        enum: {
            values: ['Draft', 'In Progress', 'Review', 'Completed', 'On Hold', 'Cancelled'],
            message: '{VALUE} is not a valid status'
        },
        default: 'Draft',
        index: true
    },

    duration: {
        value: {
            type: Number,
            min: [1, 'Duration must be at least 1'],
            max: [999, 'Duration cannot exceed 999']
        },
        unit: {
            type: String,
            enum: ['days', 'weeks', 'months', 'years'],
            default: 'months'
        }
    },

    // Role and Team Assignment
    yourRole: {
        type: String,
        required: [true, 'Your role is required'],
        trim: true,
        maxlength: [100, 'Role cannot exceed 100 characters']
    },

    teamMembers: [{
        memberId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        role: {
            type: String,
            enum: ['Lead', 'Developer', 'Designer', 'Tester', 'Project Manager', 'Other'],
            default: 'Developer'
        },
        assignedAt: {
            type: Date,
            default: Date.now
        },
        isLead: {
            type: Boolean,
            default: false
        }
    }],

    projectLead: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },

    // Project Description
    projectDescription: {
        type: String,
        required: [true, 'Project description is required'],
        trim: true,
        minlength: [10, 'Description must be at least 10 characters'],
        maxlength: [5000, 'Description cannot exceed 5000 characters']
    },


    // Project Gallery
    projectGallery: [{
        url: {
            type: String,
            required: true
        },
        filename: String,
        caption: String,
        uploadedAt: {
            type: Date,
            default: Date.now
        },
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }],

    // Client Feedback
    clientFeedback: {
        reviewId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Review'
        },
        rating: {
            type: Number,
            min: 1,
            max: 5
        },
        comment: String,
        receivedAt: Date
    },

    // Additional Project Details
    budget: {
        amount: Number,
        currency: {
            type: String,
            default: 'USD'
        }
    },

    startDate: {
        type: Date,
        default: Date.now
    },

    endDate: Date,

    deadline: Date,

    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Urgent'],
        default: 'Medium'
    },

    tags: [{
        type: String,
        trim: true,
        lowercase: true
    }],

    // Tracking and Metadata
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    isArchived: {
        type: Boolean,
        default: false,
        index: true
    },

    archivedAt: Date,

    completionPercentage: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    }
}, {
    timestamps: true, // Automatically adds createdAt and updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better query performance
projectSchema.index({ projectTitle: 'text', projectDescription: 'text' });
projectSchema.index({ createdBy: 1, status: 1 });
projectSchema.index({ status: 1, priority: 1 });
projectSchema.index({ startDate: 1, endDate: 1 });

// Virtual for checking if project is overdue
projectSchema.virtual('isOverdue').get(function () {
    if (!this.deadline) return false;
    return this.deadline < new Date() && this.status !== 'Completed';
});

// Virtual for project duration in days
projectSchema.virtual('durationInDays').get(function () {
    if (!this.duration.value) return null;

    const multipliers = {
        days: 1,
        weeks: 7,
        months: 30,
        years: 365
    };

    return this.duration.value * multipliers[this.duration.unit];
});

// Pre-save middleware
projectSchema.pre('save', function (next) {
    // Update completion percentage based on status
    if (this.status === 'Completed') {
        this.completionPercentage = 100;
    } else if (this.status === 'Draft') {
        this.completionPercentage = 0;
    }

    // Set archived date if archiving
    if (this.isArchived && !this.archivedAt) {
        this.archivedAt = new Date();
    }

    next();
});

// Instance methods
projectSchema.methods.addTeamMember = function (memberId, role = 'Developer', isLead = false) {
    const exists = this.teamMembers.some(member =>
        member.memberId.toString() === memberId.toString()
    );

    if (!exists) {
        this.teamMembers.push({ memberId, role, isLead });
        if (isLead) {
            this.projectLead = memberId;
        }
    }

    return this.save();
};

projectSchema.methods.removeTeamMember = function (memberId) {
    this.teamMembers = this.teamMembers.filter(member =>
        member.memberId.toString() !== memberId.toString()
    );

    return this.save();
};

projectSchema.methods.updateStatus = function (newStatus, updatedBy) {
    this.status = newStatus;
    this.updatedBy = updatedBy;

    if (newStatus === 'Completed') {
        this.endDate = new Date();
        this.completionPercentage = 100;
    }

    return this.save();
};

projectSchema.methods.addProjectImage = function (url, filename, caption, uploadedBy) {
    this.projectGallery.push({
        url,
        filename,
        caption,
        uploadedBy
    });

    return this.save();
};

// Static methods
projectSchema.statics.findByStatus = function (status) {
    return this.find({ status, isArchived: false })
        .populate('createdBy', 'name email')
        .populate('projectLead', 'name email')
        .populate('teamMembers.memberId', 'name email')
        .sort('-createdAt');
};

projectSchema.statics.findByCreator = function (userId) {
    return this.find({ createdBy: userId, isArchived: false })
        .sort('-createdAt');
};

projectSchema.statics.getProjectStats = async function (userId) {
    return this.aggregate([
        { $match: { createdBy: mongoose.Types.ObjectId(userId), isArchived: false } },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                avgCompletion: { $avg: '$completionPercentage' }
            }
        }
    ]);
};

// Model
const Project = mongoose.models.Project || mongoose.model('Project', projectSchema);

export default Project;

