import asyncHandler from "../../middlewares/asyncHandler.js"
import AppError from "../../utils/AppError.js";
import { successResponse } from "../../utils/apiResponse.js";
import adminProject from "../../models/usersModels/AdminProject.model.js";
import mongoose from "mongoose";


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
            projectGallery,
            clientFeedback,
            budget,
            startDate,
            endDate,
            deadline,
            priority,
            tags,
            isArchived,
            completionPercentage
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
            createdBy: req.user._id,
        });

        if (!newProject) {
            return next(new AppError('Project creation failed', 500));
        }

        return successResponse(res, 'Project created successfully', newProject, 201);
    } catch (error) {
        console.error(error);
        throw new AppError(`Server Error: ${error.message}`, 500);
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
        throw new AppError(`Server Error: ${error.message}`, 500);
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
        throw new AppError(`Server Error: ${error.message}`, 500);
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

        successResponse(res, 'Project updated successfully', project);
    } catch (error) {
        console.error(error);
        throw new AppError(`Server Error: ${error.message}`, 500);
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

        successResponse(res, 'Project deleted successfully', null);
    } catch (error) {
        console.error(error);
        throw new AppError(`Server Error: ${error.message}`, 500);
    }
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

        successResponse(res, 'Project status updated successfully', project);
    } catch (error) {
        console.error(error);
        throw new AppError(`Server Error: ${error.message}`, 500);
    }
});
