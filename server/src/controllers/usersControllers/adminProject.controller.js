/**
 * AdminProject controller – CRUD for the agency's own portfolio projects.
 *
 * All mutating routes require admin authentication.
 * The public portfolio endpoint (`getPublicPortfolio`) is unauthenticated.
 *
 * Exported functions:
 *  - createProject      POST /api/v1/admin/projects
 *  - getAllProjects      GET  /api/v1/admin/projects         (admin, paginated + filtered)
 *  - getProjectById     GET  /api/v1/admin/projects/:id
 *  - updateProject      PUT  /api/v1/admin/projects/:id
 *  - deleteProject      DELETE /api/v1/admin/projects/:id
 *  - getPublicPortfolio GET  /api/v1/admin/projects/portfolio (public)
 *  - updateProjectStatus PATCH /api/v1/admin/projects/:id/status
 */
import asyncHandler from "../../middlewares/asyncHandler.js"
import AppError from "../../utils/AppError.js";
import { successResponse } from "../../utils/apiResponse.js";
import adminProject from "../../models/usersModels/AdminProject.model.js";
import { autoSyncSection } from "../../utils/chatbotAutoSync.js";
import { invalidateCache } from "../../middlewares/redisCache.js";
import mongoose from "mongoose";
import { escapeRegex } from "../../middlewares/sanitize.js";
import { uploadFile, deleteImage } from "../../middlewares/Cloudinary.js";


// =========================
// CREATE PROJECT
// =========================
export const createProject = asyncHandler(async (req, res, next) => {
    try {
        const {
            projectTitle,
            clientName,
            category,
            status,
            duration,
            yourRole,
            teamMembers,
            projectLead,
            projectDescription,
            projectLink,
            projectGallery,
            clientFeedback,
            budget,
            startDate,
            endDate,
            deadline,
            priority,
            tags,
            isArchived,
            completionPercentage,
            techStack,
            isPublic
        } = req.body;

        if (!projectTitle || !projectDescription || !clientName || !projectLead || !teamMembers || !startDate || !category || !status || !duration || !yourRole) {
            return next(new AppError('Please provide all required fields', 400));
        }

        const newProject = await adminProject.create({
            projectTitle,
            clientName,
            category,
            status,
            duration,
            yourRole,
            teamMembers,
            projectLead,
            projectDescription,
            projectLink,
            projectGallery,
            clientFeedback,
            budget,
            startDate,
            endDate,
            deadline,
            priority,
            tags,
            isArchived,
            completionPercentage,
            techStack,
            isPublic,
            createdBy: req.user._id,
        });

        if (!newProject) {
            return next(new AppError('Project creation failed', 500));
        }

        const io = req.app.get("io");
        if (io) io.of("/public").emit("cms:updated", { section: "projects" });
        autoSyncSection('projects').catch(() => {});
        invalidateCache('/admin/projects').catch(() => {});
        return successResponse(res, 'Project created successfully', newProject, 201);
    } catch (error) {
        console.error(error);
        if (error.isOperational || error.name === 'ValidationError' || error.name === 'CastError' || error.code === 11000) throw error;
        throw error;
    }
});


// =========================
// GET ALL PROJECTS
// =========================
export const getAllProjects = asyncHandler(async (req, res, next) => {
    try {
        const {
            status,
            category,
            priority,
            isArchived,
            search,
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            order = 'desc'
        } = req.query;

        const filter = {};
        if (status) filter.status = status;
        if (category) filter.category = category;
        if (priority) filter.priority = priority;
        if (isArchived !== undefined) filter.isArchived = isArchived === 'true';
        if (search) filter.$text = { $search: search };

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortOrder = order === 'desc' ? -1 : 1;

        const [projects, total] = await Promise.all([
            adminProject.find(filter)
                .populate('createdBy', 'name email')
                .populate('projectLead', 'name email')
                .populate('teamMembers.memberId', 'name email')
                .sort({ [sortBy]: sortOrder })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            adminProject.countDocuments(filter)
        ]);

        successResponse(res, 'Projects fetched successfully', {
            projects,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / parseInt(limit)),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error(error);
        if (error.isOperational || error.name === 'ValidationError' || error.name === 'CastError' || error.code === 11000) throw error;
        throw error;
    }
});


// =========================
// GET PROJECT BY ID
// =========================
export const getProjectById = asyncHandler(async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return next(new AppError('Invalid project ID', 400));
        }

        const project = await adminProject.findById(id)
            .populate('createdBy', 'name email')
            .populate('projectLead', 'name email')
            .populate('teamMembers.memberId', 'name email');

        if (!project) {
            return next(new AppError('Project not found', 404));
        }

        successResponse(res, 'Project fetched successfully', project);
    } catch (error) {
        console.error(error);
        if (error.isOperational || error.name === 'ValidationError' || error.name === 'CastError' || error.code === 11000) throw error;
        throw error;
    }
});


// =========================
// UPDATE PROJECT
// =========================
export const updateProject = asyncHandler(async (req, res, next) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return next(new AppError('Invalid project ID', 400));
        }

        if (Object.keys(updateData).length === 0) {
            return next(new AppError('No data provided for update', 400));
        }

        updateData.updatedBy = req.user._id;

        const project = await adminProject.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
        })
            .populate('createdBy', 'name email')
            .populate('projectLead', 'name email')
            .populate('teamMembers.memberId', 'name email');

        if (!project) {
            return next(new AppError('Project not found', 404));
        }

        const io = req.app.get("io");
        if (io) io.of("/public").emit("cms:updated", { section: "projects" });
        autoSyncSection('projects').catch(() => {});
        invalidateCache('/admin/projects').catch(() => {});
        successResponse(res, 'Project updated successfully', project);
    } catch (error) {
        console.error(error);
        if (error.isOperational || error.name === 'ValidationError' || error.name === 'CastError' || error.code === 11000) throw error;
        throw error;
    }
});


// =========================
// DELETE PROJECT
// =========================
export const deleteProject = asyncHandler(async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return next(new AppError('Invalid project ID', 400));
        }

        const project = await adminProject.findByIdAndDelete(id);

        if (!project) {
            return next(new AppError('Project not found', 404));
        }

        const io = req.app.get("io");
        if (io) io.of("/public").emit("cms:updated", { section: "projects" });
        autoSyncSection('projects').catch(() => {});
        invalidateCache('/admin/projects').catch(() => {});
        successResponse(res, 'Project deleted successfully', null);
    } catch (error) {
        console.error(error);
        if (error.isOperational || error.name === 'ValidationError' || error.name === 'CastError' || error.code === 11000) throw error;
        throw error;
    }
});


// =========================
// GET PUBLIC PORTFOLIO (no auth)
// =========================
export const getPublicPortfolio = asyncHandler(async (req, res) => {
    const { category, search } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (search) {
        const safeSearch = escapeRegex(search);
        filter.$or = [
            { projectTitle:       { $regex: safeSearch, $options: "i" } },
            { projectDescription: { $regex: safeSearch, $options: "i" } },
        ];
    }

    const projects = await adminProject.getPublicPortfolio(filter);
    successResponse(res, "Portfolio fetched successfully", { projects, total: projects.length });
});


// =========================
// GET HOME FEATURED (no auth, no cache)
// Returns featuredOnHome projects; falls back to 3 newest public if none set.
// =========================
export const getHomeFeatured = asyncHandler(async (req, res) => {
    const FIELDS = 'projectTitle clientName category status techStack projectGallery projectDescription projectLink completionPercentage tags startDate endDate clientFeedback featuredOnHome featuredOrder';

    let projects = await adminProject
        .find({ isPublic: true, isArchived: { $ne: true }, featuredOnHome: true })
        .select(FIELDS)
        .sort({ featuredOrder: 1, createdAt: -1 })
        .lean();

    // Fallback: if admin hasn't pinned any project yet, return first 3 public ones
    if (projects.length === 0) {
        projects = await adminProject
            .find({ isPublic: true, isArchived: { $ne: true } })
            .select(FIELDS)
            .sort({ createdAt: -1 })
            .limit(3)
            .lean();
    }

    successResponse(res, "Home featured projects fetched", { projects, total: projects.length });
});

// =========================
// UPDATE PROJECT STATUS
// =========================
export const updateProjectStatus = asyncHandler(async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return next(new AppError('Invalid project ID', 400));
        }

        if (!status) {
            return next(new AppError('Status is required', 400));
        }

        const project = await adminProject.findByIdAndUpdate(
            id,
            { status, updatedBy: req.user._id },
            { new: true, runValidators: true }
        );

        if (!project) {
            return next(new AppError('Project not found', 404));
        }

        const io = req.app.get("io");
        if (io) io.of("/public").emit("cms:updated", { section: "projects" });
        autoSyncSection('projects').catch(() => {});
        invalidateCache('/admin/projects').catch(() => {});
        successResponse(res, 'Project status updated successfully', project);
    } catch (error) {
        console.error(error);
        if (error.isOperational || error.name === 'ValidationError' || error.name === 'CastError' || error.code === 11000) throw error;
        throw error;
    }
});

// =========================
// BULK DELETE PROJECTS
// =========================
export const bulkDeleteProjects = asyncHandler(async (req, res) => {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) throw new AppError("ids array is required", 400);
    const result = await adminProject.deleteMany({ _id: { $in: ids } });
    const io = req.app.get("io");
    if (io) io.of("/public").emit("cms:updated", { section: "projects" });
    invalidateCache('/admin/projects').catch(() => {});
    successResponse(res, `${result.deletedCount} project(s) deleted`, { deletedCount: result.deletedCount });
});

// =========================
// TOGGLE FEATURED ON HOME
// =========================
export const toggleFeaturedHome = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError("Invalid project ID", 400);

    const existing = await adminProject.findById(id).select('featuredOnHome').lean();
    if (!existing) throw new AppError("Project not found", 404);

    const newValue = !existing.featuredOnHome;
    const updated = await adminProject.findByIdAndUpdate(
        id,
        { $set: { featuredOnHome: newValue } },
        { new: true, select: 'featuredOnHome' }
    );

    const io = req.app.get("io");
    if (io) io.of("/public").emit("cms:updated", { section: "projects" });
    invalidateCache('/admin/projects').catch(() => {});
    successResponse(res, updated.featuredOnHome ? "Added to home page" : "Removed from home page", { featuredOnHome: updated.featuredOnHome });
});

// =========================
// BULK TOGGLE VISIBILITY
// =========================
export const bulkToggleVisibility = asyncHandler(async (req, res) => {
    const { ids, isPublic } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) throw new AppError("ids array is required", 400);
    if (typeof isPublic !== "boolean") throw new AppError("isPublic (boolean) is required", 400);
    await adminProject.updateMany({ _id: { $in: ids } }, { isPublic });
    const io = req.app.get("io");
    if (io) io.of("/public").emit("cms:updated", { section: "projects" });
    invalidateCache('/admin/projects').catch(() => {});
    successResponse(res, `${ids.length} project(s) updated`, { count: ids.length });
});


// =========================
// UPLOAD GALLERY IMAGES
// POST /api/v1/admin/projects/:id/images
// =========================
export const uploadGalleryImages = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return next(new AppError('Invalid project ID', 400));

    const project = await adminProject.findById(id);
    if (!project) return next(new AppError('Project not found', 404));

    const files = req.files;
    if (!files || files.length === 0) return next(new AppError('No images provided', 400));

    const uploaded = [];
    for (const file of files) {
        const result = await uploadFile(file.path, 'admin-projects');
        if (result) {
            const entry = {
                url: result.secure_url || result.url,
                filename: file.originalname,
                uploadedBy: req.user._id,
            };
            project.projectGallery.push(entry);
            uploaded.push(entry);
        }
    }

    await project.save();

    const io = req.app.get("io");
    if (io) io.of("/public").emit("cms:updated", { section: "projects" });
    invalidateCache('/admin/projects').catch(() => {});
    successResponse(res, `${uploaded.length} image(s) uploaded`, project.projectGallery);
});


// =========================
// DELETE GALLERY IMAGE
// DELETE /api/v1/admin/projects/:id/images/:imageId
// =========================
export const deleteGalleryImage = asyncHandler(async (req, res, next) => {
    const { id, imageId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return next(new AppError('Invalid project ID', 400));

    const project = await adminProject.findById(id);
    if (!project) return next(new AppError('Project not found', 404));

    const image = project.projectGallery.id(imageId);
    if (!image) return next(new AppError('Image not found', 404));

    // Try to remove from Cloudinary (non-blocking if it fails)
    deleteImage(image.url, 'admin-projects').catch(() => {});

    project.projectGallery.pull(imageId);
    await project.save();

    const io = req.app.get("io");
    if (io) io.of("/public").emit("cms:updated", { section: "projects" });
    invalidateCache('/admin/projects').catch(() => {});
    successResponse(res, 'Image deleted', project.projectGallery);
});
