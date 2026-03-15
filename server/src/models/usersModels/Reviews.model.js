/**
 * Review model – client testimonials linked to projects.
 *
 * Key design decisions:
 *  - `rating` is validated as a whole integer (1–5); fractional stars are rejected
 *  - `status` workflow: pending → approved / rejected
 *    (only approved reviews are visible on the public endpoint)
 *  - Both `client` (User ref) and `project` (Project ref) are required,
 *    tying each review to a specific person and piece of work
 *
 * Public endpoint:  GET /api/v1/reviews/all  (approved reviews only)
 * Admin endpoints:  full CRUD + status management
 */
import mongoose from 'mongoose';


// Review Schema
const reviewSchema = new mongoose.Schema({
    // The User who wrote this review
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },

    // Review Content
    rating: {
        type: Number,
        required: [true, 'Rating is required'],
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating cannot exceed 5'],
        validate: {
            validator: Number.isInteger,
            message: 'Rating must be a whole number' // Reject 4.5, accept 4 or 5
        }
    },
    reviewText: {
        type: String,
        required: [true, 'Review text is required'],
        trim: true,
        minlength: [10, 'Review must be at least 10 characters long'],
        maxlength: [1000, 'Review cannot exceed 1000 characters']
    },

    // Project this review is about (must exist in the Project collection)
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: [true, 'Project reference is required']
    },

    // Moderation status – only "approved" reviews are shown publicly
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    }
}, {
    timestamps: true
});

// ─── Indexes ─────────────────────────────────────────────────────────────────
reviewSchema.index({ rating: -1 });        // For getByRating queries
reviewSchema.index({ createdAt: -1 });     // For recent-reviews queries
reviewSchema.index({ project: 1 });        // For getProjectAverageRating
reviewSchema.index({ status: 1 });         // For filtering approved reviews

// ─── Virtuals ─────────────────────────────────────────────────────────────────

/** Returns a star string representation of the rating (e.g. "⭐⭐⭐⭐"). */
reviewSchema.virtual('stars').get(function () {
    return '⭐'.repeat(this.rating);
});

// ─── Instance Methods ─────────────────────────────────────────────────────────

/** Populates the `project` reference and returns the full review document. */
reviewSchema.methods.getFullReview = async function () {
    await this.populate('project');
    return this;
};

// ─── Static Methods ───────────────────────────────────────────────────────────

/**
 * Returns all approved reviews with a specific star rating, newest first.
 *
 * @param {number} rating - Integer 1–5
 * @returns {Query} Mongoose query with `project` populated
 */
reviewSchema.statics.getByRating = function (rating) {
    return this.find({
        rating: rating,
        status: 'approved'
    })
        .populate('project')
        .sort({ createdAt: -1 });
};

/**
 * Aggregates the average rating and total review count for a project.
 * Only counts approved reviews.
 *
 * @param {string|ObjectId} projectId
 * @returns {Promise<{ averageRating: number, totalReviews: number }>}
 */
reviewSchema.statics.getProjectAverageRating = async function (projectId) {
    const result = await this.aggregate([
        {
            $match: {
                project: new mongoose.Types.ObjectId(projectId),
                status: 'approved'
            }
        },
        {
            $group: {
                _id: null,
                averageRating: { $avg: '$rating' },
                totalReviews: { $sum: 1 }
            }
        }
    ]);

    return result.length > 0 ? result[0] : { averageRating: 0, totalReviews: 0 };
};


const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema);

export default Review;
