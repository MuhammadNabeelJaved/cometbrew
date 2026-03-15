/**
 * JobApplication controller – handles job application submission and admin management.
 *
 * `submitApplication` is the only public endpoint; all others require admin auth.
 * On submission:
 *  1. Validates the target job exists and is Active
 *  2. Rejects duplicate applications (same email + job)
 *  3. Increments the job's `applicationsCount` counter
 *
 * Exported functions:
 *  - submitApplication       POST   /api/v1/job-applications          (public)
 *  - getAllApplications       GET    /api/v1/job-applications          (admin, paginated)
 *  - getApplicationsByJob    GET    /api/v1/job-applications/job/:jobId (admin)
 *  - getApplicationById      GET    /api/v1/job-applications/:id      (admin)
 *  - updateApplicationStatus PATCH  /api/v1/job-applications/:id/status (admin)
 *  - deleteApplication       DELETE /api/v1/job-applications/:id      (admin)
 *  - getApplicationStats     GET    /api/v1/job-applications/stats    (admin)
 */
import asyncHandler from "../../middlewares/asyncHandler.js";
import AppError from "../../utils/AppError.js";
import { successResponse } from "../../utils/apiResponse.js";
import JobApplication from "../../models/usersModels/JobApplication.model.js";
import JobPosting from "../../models/usersModels/Jobs.model.js";

// =========================
// SUBMIT APPLICATION (public)
// =========================
export const submitApplication = asyncHandler(async (req, res) => {
    const {
        job,
        firstName,
        lastName,
        email,
        phone,
        desiredRole,
        experienceLevel,
        portfolioUrl,
        coverLetter,
    } = req.body;

    if (!job || !firstName || !lastName || !email) {
        throw new AppError("job, firstName, lastName and email are required", 400);
    }

    // Verify the job exists and is active
    const jobPosting = await JobPosting.findById(job);
    if (!jobPosting) throw new AppError("Job not found", 404);
    if (jobPosting.status !== "Active") throw new AppError("This position is no longer accepting applications", 400);

    // Check duplicate
    const existing = await JobApplication.findOne({ job, email });
    if (existing) throw new AppError("You have already applied for this position", 409);

    // Handle resume upload (Cloudinary URL injected by multer middleware if present)
    const resumeUrl = req.file?.path || req.body.resumeUrl || "";
    const resumePublicId = req.file?.filename || "";

    const application = await JobApplication.create({
        job,
        firstName,
        lastName,
        email,
        phone,
        desiredRole,
        experienceLevel,
        portfolioUrl,
        resumeUrl,
        resumePublicId,
        coverLetter,
    });

    // Increment applications count on the job
    await jobPosting.incrementApplications();

    successResponse(res, "Application submitted successfully", application, 201);
});

// =========================
// GET ALL APPLICATIONS (admin)
// =========================
export const getAllApplications = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, status, jobId, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter = {};
    if (status) filter.status = status;
    if (jobId) filter.job = jobId;
    if (search) {
        filter.$or = [
            { firstName: { $regex: search, $options: "i" } },
            { lastName: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
        ];
    }

    const [applications, total] = await Promise.all([
        JobApplication.find(filter)
            .populate("job", "jobTitle department")
            .populate("reviewedBy", "name email")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        JobApplication.countDocuments(filter),
    ]);

    successResponse(res, "Applications fetched successfully", {
        applications,
        pagination: {
            total,
            page: Number(page),
            pages: Math.ceil(total / Number(limit)),
            limit: Number(limit),
        },
    });
});

// =========================
// GET APPLICATIONS BY JOB (admin)
// =========================
export const getApplicationsByJob = asyncHandler(async (req, res) => {
    const { jobId } = req.params;

    const applications = await JobApplication.find({ job: jobId })
        .populate("reviewedBy", "name email")
        .sort({ createdAt: -1 });

    successResponse(res, "Applications fetched", { applications, total: applications.length });
});

// =========================
// GET SINGLE APPLICATION (admin)
// =========================
export const getApplicationById = asyncHandler(async (req, res) => {
    const application = await JobApplication.findById(req.params.id)
        .populate("job", "jobTitle department location employmentType")
        .populate("reviewedBy", "name email");

    if (!application) throw new AppError("Application not found", 404);
    successResponse(res, "Application fetched", application);
});

// =========================
// UPDATE APPLICATION STATUS (admin)
// =========================
export const updateApplicationStatus = asyncHandler(async (req, res) => {
    const { status, adminNotes } = req.body;

    const validStatuses = ["pending", "reviewing", "shortlisted", "rejected", "hired"];
    if (!status || !validStatuses.includes(status)) {
        throw new AppError(`status must be one of: ${validStatuses.join(", ")}`, 400);
    }

    const application = await JobApplication.findByIdAndUpdate(
        req.params.id,
        {
            status,
            adminNotes,
            reviewedBy: req.user._id,
            reviewedAt: new Date(),
        },
        { new: true, runValidators: true }
    );

    if (!application) throw new AppError("Application not found", 404);
    successResponse(res, "Application status updated", application);
});

// =========================
// DELETE APPLICATION (admin)
// =========================
export const deleteApplication = asyncHandler(async (req, res) => {
    const application = await JobApplication.findByIdAndDelete(req.params.id);
    if (!application) throw new AppError("Application not found", 404);
    successResponse(res, "Application deleted successfully", {});
});

// =========================
// GET STATS (admin)
// =========================
export const getApplicationStats = asyncHandler(async (req, res) => {
    const [statusStats, totalByJob] = await Promise.all([
        JobApplication.getStats(),
        JobApplication.aggregate([
            { $group: { _id: "$job", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: "jobpostings",
                    localField: "_id",
                    foreignField: "_id",
                    as: "jobInfo",
                },
            },
            { $unwind: { path: "$jobInfo", preserveNullAndEmptyArrays: true } },
            { $project: { count: 1, jobTitle: "$jobInfo.jobTitle" } },
        ]),
    ]);

    const total = await JobApplication.countDocuments();

    successResponse(res, "Application stats fetched", { total, byStatus: statusStats, topJobs: totalByJob });
});
