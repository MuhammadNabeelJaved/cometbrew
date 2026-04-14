/**
 * AdminProject model – the agency's own portfolio projects.
 *
 * These are projects created by admin users to showcase the agency's work on
 * the public portfolio page (`GET /api/v1/admin/projects/portfolio`).
 * They are distinct from `Project` (client project requests).
 *
 * Key features:
 *  - `isPublic` flag controls visibility on the public portfolio
 *  - `techStack[]` lists technologies used
 *  - `teamMembers[]` links to User documents with roles
 *  - `projectGallery[]` stores Cloudinary image URLs
 *  - `clientFeedback` embeds a review reference + rating
 *  - Full-text index on `projectTitle` + `projectDescription`
 *  - Virtuals: `isOverdue`, `durationInDays`
 *  - Statics: `findByStatus`, `findByCreator`, `getProjectStats`, `getPublicPortfolio`
 *  - Instance methods: `addTeamMember`, `removeTeamMember`, `updateStatus`, `addProjectImage`
 */
import mongoose from 'mongoose';

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

    // Project duration with flexible unit (days/weeks/months/years)
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

    // Array of team members assigned to this project, each with a role
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

    // Convenience reference to the single lead member (denormalised from teamMembers)
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


    // Project Gallery – Cloudinary image entries
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

    // Client Feedback – can reference a Review document for consistency
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

    endDate: {
        type: Date
    },

    deadline: {
        type: Date
    },

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

    // Completion percentage (0–100); auto-set to 100 when status is "Completed"
    completionPercentage: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },

    // Tech Stack – array of technology names shown on the Add Project form
    techStack: [{
        type: String,
        trim: true,
        maxlength: [50, 'Tech name cannot exceed 50 characters']
    }],

    // Whether this project appears on the public portfolio page
    isPublic: {
        type: Boolean,
        default: false,
        index: true
    },

    // Whether this project is pinned to the home page Featured Projects slider
    featuredOnHome: {
        type: Boolean,
        default: false,
        index: true
    }
}, {
    timestamps: true, // Automatically adds createdAt and updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// ─── Indexes ─────────────────────────────────────────────────────────────────
// Full-text search across title and description
projectSchema.index({ projectTitle: 'text', projectDescription: 'text' });
projectSchema.index({ createdBy: 1, status: 1 });
projectSchema.index({ status: 1, priority: 1 });
projectSchema.index({ startDate: 1, endDate: 1 });

// ─── Virtuals ─────────────────────────────────────────────────────────────────

/** True when the deadline has passed and the project is not yet completed. */
projectSchema.virtual('isOverdue').get(function () {
    if (!this.deadline) return false;
    return this.deadline < new Date() && this.status !== 'Completed';
});

/** Total duration normalised to days using the configured unit. */
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

// ─── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Auto-set `completionPercentage` based on status:
 *  - "Completed" → 100%
 *  - "Draft"     → 0%
 */
projectSchema.pre('save', function () {
    if (this.status === 'Completed') {
        this.completionPercentage = 100;
    } else if (this.status === 'Draft') {
        this.completionPercentage = 0;
    }
});

// ─── Instance Methods ─────────────────────────────────────────────────────────

/** Adds a team member (no-op if already present); sets projectLead if isLead. */
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

/** Removes a team member by their user ID. */
projectSchema.methods.removeTeamMember = function (memberId) {
    this.teamMembers = this.teamMembers.filter(member =>
        member.memberId.toString() !== memberId.toString()
    );

    return this.save();
};

/** Changes the project status and records who made the change; sets endDate on completion. */
projectSchema.methods.updateStatus = function (newStatus, updatedBy) {
    this.status = newStatus;
    this.updatedBy = updatedBy;

    if (newStatus === 'Completed') {
        this.endDate = new Date();
        this.completionPercentage = 100;
    }

    return this.save();
};

/** Appends an image entry to `projectGallery`. */
projectSchema.methods.addProjectImage = function (url, filename, caption, uploadedBy) {
    this.projectGallery.push({
        url,
        filename,
        caption,
        uploadedBy
    });

    return this.save();
};

// ─── Static Methods ───────────────────────────────────────────────────────────

/** Returns all non-archived projects with a given status, populated with user info. */
projectSchema.statics.findByStatus = function (status) {
    return this.find({ status, isArchived: false })
        .populate('createdBy', 'name email')
        .populate('projectLead', 'name email')
        .populate('teamMembers.memberId', 'name email')
        .sort('-createdAt');
};

/** Returns all non-archived projects created by a specific user. */
projectSchema.statics.findByCreator = function (userId) {
    return this.find({ createdBy: userId, isArchived: false })
        .sort('-createdAt');
};

/** Aggregates project counts and average completion grouped by status. */
projectSchema.statics.getProjectStats = async function (userId) {
    return this.aggregate([
        { $match: { createdBy: new mongoose.Types.ObjectId(userId), isArchived: false } },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                avgCompletion: { $avg: '$completionPercentage' }
            }
        }
    ]);
};

/** Returns publicly visible, non-archived projects for the portfolio page. */
projectSchema.statics.getPublicPortfolio = function (filter = {}) {
    return this.find({ isPublic: true, isArchived: false, ...filter })
        .select('projectTitle clientName category status techStack projectGallery projectDescription completionPercentage tags startDate endDate clientFeedback featuredOnHome')
        .sort({ createdAt: -1 });
};

// ─── Model ────────────────────────────────────────────────────────────────────
const adminProject = mongoose.models.AdminProject || mongoose.model('AdminProject', projectSchema);

export default adminProject;
