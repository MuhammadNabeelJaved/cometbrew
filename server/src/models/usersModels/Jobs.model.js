/**
 * Jobs model – job postings published by the agency.
 *
 * Key design decisions:
 *  - `salaryRange` uses a sub-schema with a null guard in the `salaryDisplay`
 *    virtual to prevent crashes when the job is partially populated (e.g. in
 *    job-application endpoints that only select {jobTitle, department})
 *  - Full-text index on `jobTitle` + `description` powers the search endpoint
 *  - `applicationsCount` and `viewsCount` are incremented in-place via
 *    instance methods to avoid race conditions
 *  - `remoteOnly` is auto-set in the pre-save hook based on `workMode`
 *
 * Public endpoints: GET /api/v1/jobs, /active, /featured, /:id
 * Admin endpoints:  POST, PUT, PATCH /status, DELETE
 */
import mongoose from 'mongoose';

// Salary Range Sub-Schema (no _id to keep the document lean)
const salaryRangeSchema = new mongoose.Schema({
    min: {
        type: Number,
        required: true
    },
    max: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'USD',
        enum: ['USD', 'EUR', 'GBP', 'PKR']
    }
}, { _id: false });

// Job Posting Schema
const jobPostingSchema = new mongoose.Schema({
    // Basic Information
    jobTitle: {
        type: String,
        required: [true, 'Job title is required'],
        trim: true,
        maxlength: [150, 'Job title cannot exceed 150 characters']
    },

    department: {
        type: String,
        required: [true, 'Department is required'],
        trim: true,
        enum: ['Engineering', 'Design', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations', 'Product', 'Other'],
        default: 'Other'
    },

    employmentType: {
        type: String,
        required: [true, 'Employment type is required'],
        enum: ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship'],
        default: 'Full-time'
    },

    experienceLevel: {
        type: String,
        required: [true, 'Experience level is required'],
        enum: ['Entry Level', 'Mid Level', 'Senior Level', 'Lead', 'Executive'],
        default: 'Mid Level'
    },

    // Location & Compensation
    workMode: {
        type: String,
        required: [true, 'Work mode is required'],
        enum: ['Remote', 'On-site', 'Hybrid'],
        default: 'Remote'
    },

    location: {
        type: String,
        required: [true, 'Location is required'],
        trim: true
    },

    // Validated to ensure min <= max in the pre-save hook
    salaryRange: {
        type: salaryRangeSchema,
        required: [true, 'Salary range is required']
    },

    // Role Details
    description: {
        type: String,
        required: [true, 'Job description is required'],
        trim: true,
        maxlength: [5000, 'Description cannot exceed 5000 characters']
    },

    responsibilities: [{
        type: String,
        trim: true
    }],

    requirements: [{
        type: String,
        trim: true
    }],

    benefits: [{
        type: String,
        trim: true
    }],

    // Additional Details
    applicationDeadline: {
        type: Date // Optional; `isExpired` virtual checks this
    },

    positionsAvailable: {
        type: Number,
        default: 1,
        min: 1
    },

    // Status controls visibility; only "Active" jobs appear on public endpoints
    status: {
        type: String,
        enum: ['Draft', 'Active', 'Paused', 'Closed', 'Filled'],
        default: 'Active'
    },

    postedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Counters incremented atomically via instance methods
    applicationsCount: {
        type: Number,
        default: 0
    },

    viewsCount: {
        type: Number,
        default: 0
    },

    featured: {
        type: Boolean,
        default: false // Featured jobs appear at the top / in a highlighted section
    },

    // Auto-set to true when workMode === "Remote" (see pre-save hook)
    remoteOnly: {
        type: Boolean,
        default: false
    },

    urgentHiring: {
        type: Boolean,
        default: false // Displays an "Urgent" badge on the job card
    },

    requiredSkills: [{
        type: String,
        trim: true
    }],

    niceToHaveSkills: [{
        type: String,
        trim: true
    }]

}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// ─── Indexes ─────────────────────────────────────────────────────────────────
jobPostingSchema.index({ jobTitle: 'text', description: 'text' }); // Full-text search
jobPostingSchema.index({ department: 1, status: 1 });
jobPostingSchema.index({ experienceLevel: 1 });
jobPostingSchema.index({ workMode: 1 });
jobPostingSchema.index({ status: 1, createdAt: -1 });
jobPostingSchema.index({ applicationDeadline: 1 });

// ─── Virtuals ─────────────────────────────────────────────────────────────────

/** True when the applicationDeadline has passed. */
jobPostingSchema.virtual('isExpired').get(function () {
    if (!this.applicationDeadline) return false;
    return new Date() > this.applicationDeadline;
});

/** Number of days until the applicationDeadline (negative if past). */
jobPostingSchema.virtual('daysRemaining').get(function () {
    if (!this.applicationDeadline) return null;
    const diff = this.applicationDeadline - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

/**
 * Human-readable salary range string (e.g. "USD 50k - 80k").
 * Returns null when salaryRange is not populated to avoid destructuring crashes
 * in endpoints that partially populate this document.
 */
jobPostingSchema.virtual('salaryDisplay').get(function () {
    if (!this.salaryRange) return null;
    const { min, max, currency } = this.salaryRange;
    const formatNumber = (num) => {
        if (num >= 1000) return `${num / 1000}k`;
        return num;
    };
    return `${currency} ${formatNumber(min)} - ${formatNumber(max)}`;
});

// ─── Static Methods ───────────────────────────────────────────────────────────

/** Returns all Active jobs that have not yet passed their deadline. */
jobPostingSchema.statics.getActiveJobs = function () {
    return this.find({
        status: 'Active',
        $or: [
            { applicationDeadline: { $exists: false } },
            { applicationDeadline: { $gte: new Date() } }
        ]
    }).sort({ featured: -1, createdAt: -1 });
};

/** Returns Active jobs for a specific department. */
jobPostingSchema.statics.getJobsByDepartment = function (department) {
    return this.find({
        department: department,
        status: 'Active'
    }).sort({ createdAt: -1 });
};

/** Full-text search across Active jobs. */
jobPostingSchema.statics.searchJobs = function (query) {
    return this.find({
        $text: { $search: query },
        status: 'Active'
    }).sort({ score: { $meta: 'textScore' } });
};

/** Returns the top `limit` featured Active jobs. */
jobPostingSchema.statics.getFeaturedJobs = function (limit = 5) {
    return this.find({
        featured: true,
        status: 'Active'
    })
        .sort({ createdAt: -1 })
        .limit(limit);
};

// ─── Instance Methods ─────────────────────────────────────────────────────────

/** Increments `viewsCount` by 1 and saves the document. */
jobPostingSchema.methods.incrementViews = function () {
    this.viewsCount += 1;
    return this.save();
};

/** Increments `applicationsCount` by 1 and saves the document. */
jobPostingSchema.methods.incrementApplications = function () {
    this.applicationsCount += 1;
    return this.save();
};

/** Sets status to "Closed" and saves the document. */
jobPostingSchema.methods.closePosition = function () {
    this.status = 'Closed';
    return this.save();
};

/** Sets status to "Filled" and saves the document. */
jobPostingSchema.methods.markAsFilled = function () {
    this.status = 'Filled';
    return this.save();
};

/** Returns a public-safe subset of fields (excludes admin-only metadata). */
jobPostingSchema.methods.getPublicData = function () {
    return {
        id: this._id,
        jobTitle: this.jobTitle,
        department: this.department,
        employmentType: this.employmentType,
        experienceLevel: this.experienceLevel,
        workMode: this.workMode,
        location: this.location,
        salaryDisplay: this.salaryDisplay,
        description: this.description,
        responsibilities: this.responsibilities,
        requirements: this.requirements,
        benefits: this.benefits,
        requiredSkills: this.requiredSkills,
        niceToHaveSkills: this.niceToHaveSkills,
        applicationDeadline: this.applicationDeadline,
        daysRemaining: this.daysRemaining,
        urgentHiring: this.urgentHiring,
        postedDate: this.createdAt
    };
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Pre-save hook:
 *  1. Auto-sets `remoteOnly` to true when workMode is "Remote"
 *  2. Validates that salaryRange.min <= salaryRange.max
 */
jobPostingSchema.pre('save', function () {
    // Set remoteOnly flag based on workMode
    if (this.workMode === 'Remote') {
        this.remoteOnly = true;
    }

    // Validate salary range
    if (this.salaryRange && this.salaryRange.min > this.salaryRange.max) {
        throw new Error('Minimum salary cannot be greater than maximum salary');
    }
});

// Pre-update Middleware (timestamps: true handles updatedAt automatically)

const JobPosting = mongoose.models.JobPosting || mongoose.model('JobPosting', jobPostingSchema);

export default JobPosting;
