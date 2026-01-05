import AppError from "../../utils/AppError.js";
import asyncHandler from "../../middlewares/asyncHandler.js";
import Project from "../../models/usersModels/Project.model.js";
import User from "../../models/usersModels/User.model.js";
import { successResponse } from "../../utils/apiResponse.js";
import { uploadImage, deleteImage } from "../../middlewares/Cloudinary.js";


// =========================
// CREATE PROJECT
// =========================
export const createProject = asyncHandler(async (req, res) => {
    try {
        const {
            projectName,
            projectType,
            budgetRange,
            projectDetails,
            // deadline,
            // totalCost
        } = req.body;
        const files = req.file?.path;


        if (!projectName || !projectDetails, !projectType || !budgetRange) {
            throw new AppError("All fields are required", 400);
        }
        const user = await User.findById(req?.user?.id);
        if (!user) {
            throw new AppError("User not found", 404);
        }

        // Handle file uploads
        let attachments = [];
        if (files && files.length > 0) {
            for (const file of files) {
                try {
                    const uploadResult = await uploadImage(file.path, "projects");
                    if (uploadResult && uploadResult.secure_url) {
                        // Determine file type
                        const fileType = file.mimetype.startsWith('image/') ? 'image'
                            : file.mimetype === 'application/pdf' ? 'pdf'
                                : file.mimetype.includes('document') ? 'doc'
                                    : 'other';

                        attachments.push({
                            fileName: file.originalname,
                            fileUrl: uploadResult.secure_url,
                            fileType: fileType
                        });
                    }
                } catch (error) {
                    console.error("File upload error:", error);
                    // Continue with other files even if one fails
                    throw new AppError("Failed to upload one of the files", error.message, 500);
                }
            }
        }



        const project = await Project.create({
            projectName,
            projectType,
            budgetRange,
            projectDetails,
            attachments,
            status: 'pending',
            progress: 0,
            paidAmount: 0
        });

        if (!project) {
            throw new AppError("Project creation failed", 500);
        }

        // Populate user info
        await project.populate('requestedBy', 'name email');

        // Also send project creation email to user (optional)

        successResponse(res, "Project created successfully", project, 201);
    } catch (error) {
        console.error("Error in createProject:", error);
        throw new AppError(`Failed to create project: ${error.message}`, 500);
    }
});


// =========================
// GET ALL PROJECTS
// =========================
export const getAllProjects = asyncHandler(async (req, res) => {
    try {
        const {
            status,
            projectType,
            paymentStatus,
            isArchived,
            search,
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            order = 'desc'
        } = req.query;

        // Build filter
        const filter = {};

        if (status) filter.status = status;
        if (projectType) filter.projectType = projectType;
        if (paymentStatus) filter.paymentStatus = paymentStatus;
        if (isArchived !== undefined) filter.isArchived = isArchived === 'true';

        // Text search
        if (search) {
            filter.$text = { $search: search };
        }

        // For regular users, show only their projects
        if (req?.user?.role !== 'admin') {
            filter.requestedBy = req?.user?.id;
        }

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortOrder = order === 'desc' ? -1 : 1;

        // Execute query
        const [projects, total] = await Promise.all([
            Project.find(filter)
                .populate('requestedBy', 'name email')
                .sort({ [sortBy]: sortOrder })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            Project.countDocuments(filter)
        ]);

        if (!projects) {
            throw new AppError("Failed to fetch projects", 500);
        }

        successResponse(res, "Projects fetched successfully", {
            projects,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / parseInt(limit)),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error("Error in getAllProjects:", error);
        throw new AppError(`Failed to fetch projects: ${error.message}`, 500);
    }
});