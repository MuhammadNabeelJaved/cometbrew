import Review from "../../models/usersModels/Reviews.model.js";
import Project from "../../models/usersModels/Project.model.js";
import User from "../../models/usersModels/User.model.js";
import asyncHandler from "../../middlewares/asyncHandler.js";
import AppError from "../../utils/AppError.js";
import { successResponse } from "../../utils/apiResponse.js";
import mongoose from "mongoose";

// =========================
// CREATE REVIEW (User only - for their completed projects)
// =========================
export const createReview = asyncHandler(async (req, res) => {
    try {
        const { rating, reviewText, project } = req.body;
        const userId = req?.user?._id;

        console.log("Create Review Request Body:", req.body);

        // Validate required fields
        if (!rating || !reviewText || !project) {
            throw new AppError("Rating, review text, and project are required", 400);
        }

        // Check if project exists
        const projectExists = await Project.findById(project);
        if (!projectExists) {
            throw new AppError("Project not found", 404);
        }

        // Check if user is the project owner
        if (projectExists.requestedBy.toString() !== userId.toString()) {
            throw new AppError("You can only review your own projects", 403);
        }

        // Check if project is completed
        if (projectExists.status !== "approved") {
            throw new AppError("You can only review completed projects", 400);
        }

        // Check if user has already reviewed this project
        const existingReview = await Review.findOne({
            client: userId,
            project: project,
        });

        if (existingReview) {
            throw new AppError("You have already reviewed this project", 400);
        }

        // Create review
        const review = await Review.create({
            client: userId,
            rating,
            reviewText,
            project,
            status: "pending", // Admin will approve
        });

        await review.populate([
            { path: "client", select: "name email photo" },
            { path: "project", select: "projectName projectType" },
        ]);

        successResponse(res, "Review submitted successfully. Waiting for admin approval.", review, 201);
    } catch (error) {
        console.error("Error creating review:", error.message);
        if (error.isOperational) throw error;
        throw new AppError(`Failed to create review: ${error.message}`, 500);
    }
});

// =========================
// GET ALL REVIEWS (Public - only approved)
// =========================
export const getAllReviews = asyncHandler(async (req, res) => {
    try {
        const { page = 1, limit = 10, rating, sortBy = "createdAt", order = "desc" } = req.query;

        // Build query - only approved reviews for public
        const query = { status: "approved" };

        if (rating) {
            query.rating = parseInt(rating);
        }

        // Pagination
        const skip = (page - 1) * limit;
        const sortOrder = order === "asc" ? 1 : -1;

        // Get reviews
        const reviews = await Review.find(query)
            .populate("client", "name email avatar")
            .populate("project", "projectName projectType")
            .sort({ [sortBy]: sortOrder })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        // Get total count
        const totalReviews = await Review.countDocuments(query);

        // Calculate overall statistics
        const stats = await Review.aggregate([
            { $match: { status: "approved" } },
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: "$rating" },
                    totalReviews: { $sum: 1 },
                },
            },
        ]);

        successResponse(res, "Reviews retrieved successfully", {
            reviews,
            statistics: stats[0] || { averageRating: 0, totalReviews: 0 },
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalReviews / limit),
                totalReviews,
                limit: parseInt(limit),
            },
        });
    } catch (error) {
        console.error("Error retrieving reviews:", error.message);
        if (error.isOperational) throw error;
        throw new AppError(`Failed to retrieve reviews: ${error.message}`, 500);
    }
});

// =========================
// GET ALL REVIEWS FOR ADMIN (includes pending/rejected)
// =========================
export const getAllReviewsAdmin = asyncHandler(async (req, res) => {
    try {
        const { page = 1, limit = 10, status, rating, search, sortBy = "createdAt", order = "desc" } = req.query;

        // Build query
        const query = {};

        if (status) {
            query.status = status;
        }

        if (rating) {
            query.rating = parseInt(rating);
        }

        if (search) {
            query.$or = [
                { reviewText: { $regex: search, $options: "i" } },
            ];
        }

        // Pagination
        const skip = (page - 1) * limit;
        const sortOrder = order === "asc" ? 1 : -1;

        // Get reviews
        const reviews = await Review.find(query)
            .populate("client", "name email avatar")
            .populate("project", "projectName projectType status")
            .sort({ [sortBy]: sortOrder })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        // Get total count
        const totalReviews = await Review.countDocuments(query);

        // Get counts by status
        const statusCounts = await Review.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                },
            },
        ]);

        successResponse(res, "Reviews retrieved successfully", {
            reviews,
            statusCounts: statusCounts.reduce((acc, curr) => {
                acc[curr._id] = curr.count;
                return acc;
            }, {}),
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalReviews / limit),
                totalReviews,
                limit: parseInt(limit),
            },
        });
    } catch (error) {
        console.error("Error retrieving reviews:", error.message);
        if (error.isOperational) throw error;
        throw new AppError(`Failed to retrieve reviews: ${error.message}`, 500);
    }
});

// =========================
// GET REVIEW BY ID
// =========================
export const getReviewById = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            throw new AppError("Review ID is required", 400);
        }

        const review = await Review.findById(id)
            .populate("client", "name email avatar")
            .populate("project", "projectName projectType status");

        if (!review) {
            throw new AppError("Review not found", 404);
        }

        // If not admin, only show approved reviews or own reviews
        if (req.user.role !== "admin") {
            if (review.status !== "approved" && review.client._id.toString() !== req.user._id.toString()) {
                throw new AppError("Review not found", 404);
            }
        }

        successResponse(res, "Review retrieved successfully", review);
    } catch (error) {
        console.error("Error retrieving review:", error.message);
        if (error.isOperational) throw error;
        throw new AppError(`Failed to retrieve review: ${error.message}`, 500);
    }
});

// =========================
// GET REVIEWS BY PROJECT
// =========================
export const getReviewsByProject = asyncHandler(async (req, res) => {
    try {
        const { projectId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        if (!projectId) {
            throw new AppError("Project ID is required", 400);
        }

        // Check if project exists
        const projectExists = await Project.findById(projectId);
        if (!projectExists) {
            throw new AppError("Project not found", 404);
        }

        // Only show approved reviews for public
        const query = { project: projectId, status: "approved" };

        // Pagination
        const skip = (page - 1) * limit;

        const reviews = await Review.find(query)
            .populate("client", "name email avatar")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        const totalReviews = await Review.countDocuments(query);

        // Get average rating for this project
        const projectStats = await Review.aggregate([
            { $match: { project: new mongoose.Types.ObjectId(projectId), status: "approved" } },
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: "$rating" },
                    totalReviews: { $sum: 1 },
                    ratingDistribution: {
                        $push: "$rating"
                    }
                },
            },
        ]);

        // Calculate rating distribution
        let ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        if (projectStats[0]?.ratingDistribution) {
            projectStats[0].ratingDistribution.forEach(rating => {
                ratingCounts[rating] = (ratingCounts[rating] || 0) + 1;
            });
        }

        successResponse(res, "Project reviews retrieved successfully", {
            reviews,
            statistics: {
                averageRating: projectStats[0]?.averageRating || 0,
                totalReviews: projectStats[0]?.totalReviews || 0,
                ratingDistribution: ratingCounts,
            },
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalReviews / limit),
                totalReviews,
                limit: parseInt(limit),
            },
        });
    } catch (error) {
        console.error("Error retrieving project reviews:", error.message);
        if (error.isOperational) throw error;
        throw new AppError(`Failed to retrieve project reviews: ${error.message}`, 500);
    }
});

// =========================
// GET USER'S OWN REVIEWS
// =========================
export const getMyReviews = asyncHandler(async (req, res) => {
    try {
        const userId = req?.user?._id;
        const { page = 1, limit = 10 } = req.query;

        const skip = (page - 1) * limit;

        const reviews = await Review.find({ client: userId })
            .populate("project", "projectName projectType status")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        const totalReviews = await Review.countDocuments({ client: userId });

        successResponse(res, "Your reviews retrieved successfully", {
            reviews,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalReviews / limit),
                totalReviews,
                limit: parseInt(limit),
            },
        });
    } catch (error) {
        console.error("Error retrieving user's reviews:", error.message);
        if (error.isOperational) throw error;
        throw new AppError(`Failed to retrieve user's reviews: ${error.message}`, 500);
    }
});

// =========================
// UPDATE REVIEW (User can update their own review if pending)
// =========================
export const updateReview = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const { rating, reviewText } = req.body;
        const userId = req?.user?._id;

        if (!id) {
            throw new AppError("Review ID is required", 400);
        }

        if (reviewText && reviewText.length > 500) {
            throw new AppError("Review text must be less than 500 characters", 400);
        }

        if (rating && (rating < 1 || rating > 5)) {
            throw new AppError("Rating must be between 1 and 5", 400);
        }

        if (!userId) {
            throw new AppError("User ID is required", 400);
        }

        const review = await Review.findById(id);

        if (!review) {
            throw new AppError("Review not found", 404);
        }

        // Check authorization
        if (review.client.toString() !== userId.toString() && req?.user?.role !== "admin") {
            throw new AppError("You are not authorized to update this review", 403);
        }

        // Users can only update pending reviews
        if (req?.user?.role !== "admin" && review.status !== "pending") {
            throw new AppError("You can only update pending reviews", 400);
        }

        // Update fields
        if (rating) review.rating = rating;
        if (reviewText) review.reviewText = reviewText;

        await review.save();

        await review.populate([
            { path: "client", select: "name email avatar" },
            { path: "project", select: "projectName projectType" },
        ]);

        successResponse(res, "Review updated successfully", review);
    } catch (error) {
        console.error("Error updating review:", error.message);
        if (error.isOperational) throw error;
        throw new AppError(`Failed to update review: ${error.message}`, 500);
    }
});

// =========================
// UPDATE REVIEW STATUS (Admin only)
// =========================
export const updateReviewStatus = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!id) {
            throw new AppError("Review ID is required", 400);
        }

        if (!status || !["pending", "approved", "rejected"].includes(status)) {
            throw new AppError("Valid status is required (pending, approved, rejected)", 400);
        }

        const review = await Review.findById(id);

        if (!review) {
            throw new AppError("Review not found", 404);
        }

        review.status = status;
        await review.save();

        await review.populate([
            { path: "client", select: "name email avatar" },
            { path: "project", select: "projectName projectType" },
        ]);

        successResponse(res, `Review ${status} successfully`, review);
    } catch (error) {
        console.error("Error updating review status:", error.message);
        if (error.isOperational) throw error;
        throw new AppError(`Failed to update review status: ${error.message}`, 500);
    }
});

// =========================
// DELETE REVIEW
// =========================
export const deleteReview = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req?.user?._id;

        if (!id) {
            throw new AppError("Review ID is required", 400);
        }

        const review = await Review.findById(id);

        if (!review) {
            throw new AppError("Review not found", 404);
        }

        // Check authorization
        if (review.client.toString() !== userId.toString() && req?.user?.role !== "admin") {
            throw new AppError("You are not authorized to delete this review", 403);
        }

        await review.deleteOne();

        successResponse(res, "Review deleted successfully", null);
    } catch (error) {
        console.error("Error deleting review:", error.message);
        if (error.isOperational) throw error;
        throw new AppError(`Failed to delete review: ${error.message}`, 500);
    }
});

// =========================
// GET REVIEWS BY RATING
// =========================
export const getReviewsByRating = asyncHandler(async (req, res) => {
    try {
        const { rating } = req.params;
        const { page = 1, limit = 10 } = req.query;

        if (!rating || rating < 1 || rating > 5) {
            throw new AppError("Valid rating (1-5) is required", 400);
        }

        const skip = (page - 1) * limit;

        const reviews = await Review.find({ rating: parseInt(rating), status: "approved" })
            .populate("client", "name email avatar")
            .populate("project", "projectName projectType")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        const totalReviews = await Review.countDocuments({ rating: parseInt(rating), status: "approved" });

        successResponse(res, `${rating}-star reviews retrieved successfully`, {
            reviews,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalReviews / limit),
                totalReviews,
                limit: parseInt(limit),
            },
        });
    } catch (error) {
        console.error("Error retrieving reviews by rating:", error.message);
        if (error.isOperational) throw error;
        throw new AppError(`Failed to retrieve reviews by rating: ${error.message}`, 500);
    }
});

// =========================
// GET REVIEW STATISTICS (Admin)
// =========================
export const getReviewStatistics = asyncHandler(async (req, res) => {
    // Overall statistics
    try {
        const overallStats = await Review.aggregate([
            {
                $group: {
                    _id: null,
                    totalReviews: { $sum: 1 },
                    averageRating: { $avg: "$rating" },
                    approved: {
                        $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] }
                    },
                    pending: {
                        $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] }
                    },
                    rejected: {
                        $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] }
                    },
                },
            },
        ]);

        // Rating distribution
        const ratingDistribution = await Review.aggregate([
            { $match: { status: "approved" } },
            {
                $group: {
                    _id: "$rating",
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: -1 } },
        ]);

        // Recent reviews
        const recentReviews = await Review.find()
            .populate("client", "name email")
            .populate("project", "projectName")
            .sort({ createdAt: -1 })
            .limit(5)
            .select("rating reviewText status createdAt");

        // Reviews by month (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const reviewsByMonth = await Review.aggregate([
            {
                $match: {
                    createdAt: { $gte: sixMonthsAgo },
                    status: "approved"
                },
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" },
                    },
                    count: { $sum: 1 },
                    averageRating: { $avg: "$rating" },
                },
            },
            {
                $sort: { "_id.year": 1, "_id.month": 1 },
            },
        ]);

        successResponse(res, "Review statistics retrieved successfully", {
            overall: overallStats[0] || { totalReviews: 0, averageRating: 0, approved: 0, pending: 0, rejected: 0 },
            ratingDistribution: ratingDistribution.reduce((acc, curr) => {
                acc[curr._id] = curr.count;
                return acc;
            }, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }),
            recentReviews,
            reviewsByMonth,
        });
    } catch (error) {
        console.error("Error retrieving review statistics:", error.message);
        if (error.isOperational) throw error;
        throw new AppError(`Failed to retrieve review statistics: ${error.message}`, 500);
    }
});

// =========================
// BULK DELETE REVIEWS (Admin only)
// =========================
export const bulkDeleteReviews = asyncHandler(async (req, res) => {
    try {
        const { ids } = req.body || {};

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            throw new AppError("Review IDs array is required", 400);
        }

        const result = await Review.deleteMany({ _id: { $in: ids } });

        if (!result) {
            throw new AppError("Failed to delete reviews", 500);
        }

        if (result.deletedCount === 0) {
            throw new AppError("No reviews found to delete", 404);
        }

        successResponse(res, `${result.deletedCount} review(s) deleted successfully`, {
            deletedCount: result.deletedCount,
        });
    } catch (error) {
        console.error("Error deleting reviews:", error.message);
        if (error.isOperational) throw error;
        throw new AppError(`Failed to delete reviews: ${error.message}`, 500);
    }
});