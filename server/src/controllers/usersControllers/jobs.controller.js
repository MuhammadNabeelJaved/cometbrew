import asyncHandler from "../../middlewares/asyncHandler.js";
import AppError from "../../utils/AppError.js";
import { successResponse } from "../../utils/apiResponse.js";
import JobPosting from "../../models/usersModels/Jobs.model.js";
import mongoose from "mongoose";


// =========================
// CREATE JOB
// =========================
export const createJob = asyncHandler(async (req, res) => {
    try {
        const {
            jobTitle,
            department,
            employmentType,
            experienceLevel,
            workMode,
            location,
            salaryRange,
            description,
            responsibilities,
            requirements,
            benefits,
            applicationDeadline,
            positionsAvailable,
            requiredSkills,
            niceToHaveSkills,
            featured,
            urgentHiring,
        } = req.body;

        if (!jobTitle || !department || !employmentType || !experienceLevel || !workMode || !location || !salaryRange || !description) {
            throw new AppError("All required fields must be provided", 400);
        }

        const job = await JobPosting.create({
            jobTitle,
            department,
            employmentType,
            experienceLevel,
            workMode,
            location,
            salaryRange,
            description,
            responsibilities,
            requirements,
            benefits,
            applicationDeadline,
            positionsAvailable,
            requiredSkills,
            niceToHaveSkills,
            featured,
            urgentHiring,
            postedBy: req.user._id,
        });

        successResponse(res, "Job created successfully", job, 201);
    } catch (error) {
        console.error("Error in createJob:", error);
        throw new AppError(`Failed to create job: ${error.message}`, 500);
    }
});


// =========================
// GET ALL JOBS (Public)
// =========================
export const getAllJobs = asyncHandler(async (req, res) => {
    try {
        const {
            status,
            department,
            employmentType,
            experienceLevel,
            workMode,
            featured,
            search,
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            order = 'desc'
        } = req.query;

        const filter = {};
        if (status) filter.status = status;
        if (department) filter.department = department;
        if (employmentType) filter.employmentType = employmentType;
        if (experienceLevel) filter.experienceLevel = experienceLevel;
        if (workMode) filter.workMode = workMode;
        if (featured !== undefined) filter.featured = featured === 'true';
        if (search) filter.$text = { $search: search };

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortOrder = order === 'desc' ? -1 : 1;

        const [jobs, total] = await Promise.all([
            JobPosting.find(filter)
                .select('-postedBy')
                .sort({ [sortBy]: sortOrder })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            JobPosting.countDocuments(filter)
        ]);

        successResponse(res, "Jobs fetched successfully", {
            jobs,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / parseInt(limit)),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error("Error in getAllJobs:", error);
        throw new AppError(`Failed to fetch jobs: ${error.message}`, 500);
    }
});


// =========================
// GET ACTIVE JOBS (Public)
// =========================
export const getActiveJobs = asyncHandler(async (req, res) => {
    try {
        const jobs = await JobPosting.getActiveJobs();
        successResponse(res, "Active jobs fetched successfully", jobs);
    } catch (error) {
        console.error("Error in getActiveJobs:", error);
        throw new AppError(`Failed to fetch active jobs: ${error.message}`, 500);
    }
});


// =========================
// GET JOB BY ID (Public)
// =========================
export const getJobById = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new AppError("Invalid job ID", 400);
        }

        const job = await JobPosting.findById(id);

        if (!job) {
            throw new AppError("Job not found", 404);
        }

        await job.incrementViews();

        successResponse(res, "Job fetched successfully", job);
    } catch (error) {
        console.error("Error in getJobById:", error);
        throw new AppError(`Failed to fetch job: ${error.message}`, 500);
    }
});


// =========================
// UPDATE JOB (Admin)
// =========================
export const updateJob = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new AppError("Invalid job ID", 400);
        }

        if (Object.keys(updateData).length === 0) {
            throw new AppError("No data provided for update", 400);
        }

        const job = await JobPosting.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
        });

        if (!job) {
            throw new AppError("Job not found", 404);
        }

        successResponse(res, "Job updated successfully", job);
    } catch (error) {
        console.error("Error in updateJob:", error);
        throw new AppError(`Failed to update job: ${error.message}`, 500);
    }
});


// =========================
// DELETE JOB (Admin)
// =========================
export const deleteJob = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new AppError("Invalid job ID", 400);
        }

        const job = await JobPosting.findByIdAndDelete(id);

        if (!job) {
            throw new AppError("Job not found", 404);
        }

        successResponse(res, "Job deleted successfully", null);
    } catch (error) {
        console.error("Error in deleteJob:", error);
        throw new AppError(`Failed to delete job: ${error.message}`, 500);
    }
});


// =========================
// UPDATE JOB STATUS (Admin)
// =========================
export const updateJobStatus = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new AppError("Invalid job ID", 400);
        }

        if (!status) {
            throw new AppError("Status is required", 400);
        }

        const job = await JobPosting.findByIdAndUpdate(
            id,
            { status },
            { new: true, runValidators: true }
        );

        if (!job) {
            throw new AppError("Job not found", 404);
        }

        successResponse(res, "Job status updated successfully", job);
    } catch (error) {
        console.error("Error in updateJobStatus:", error);
        throw new AppError(`Failed to update job status: ${error.message}`, 500);
    }
});


// =========================
// GET FEATURED JOBS (Public)
// =========================
export const getFeaturedJobs = asyncHandler(async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 5;
        const jobs = await JobPosting.getFeaturedJobs(limit);
        successResponse(res, "Featured jobs fetched successfully", jobs);
    } catch (error) {
        console.error("Error in getFeaturedJobs:", error);
        throw new AppError(`Failed to fetch featured jobs: ${error.message}`, 500);
    }
});
