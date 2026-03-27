import AppError from "../../utils/AppError.js";
import asyncHandler from "../../middlewares/asyncHandler.js";
import Project from "../../models/usersModels/Project.model.js";
import User from "../../models/usersModels/User.model.js";
import { successResponse } from "../../utils/apiResponse.js";
import { uploadImage, deleteImage } from "../../middlewares/Cloudinary.js";
import { createAndEmitNotification } from "../../utils/notificationService.js";


// =========================
// CREATE PROJECT
// =========================

// Helper function to determine file type
function getFileType(mimetype) {
    if (mimetype.startsWith('image/')) return 'image';
    if (mimetype === 'application/pdf') return 'pdf';
    if (mimetype.includes('word') || mimetype.includes('document')) return 'doc';
    return 'other';
}


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
        const files = req?.files;



        if (!projectName || !projectDetails || !projectType || !budgetRange) {
            throw new AppError("All fields are required", 400);
        }
        const user = await User.findById(req?.user?._id);
        if (!user) {
            throw new AppError("User not found", 404);
        }

        // Handle multiple file uploads
        let uploadedFiles = [];

        // In createProject controller
        if (files && files.length > 0) {
            for (const file of files) {
                const uploaded = await uploadImage(file.path, "projects");

                if (uploaded) {
                    uploadedFiles.push({
                        fileName: file.originalname,
                        fileUrl: uploaded.secure_url || uploaded.url,
                        publicId: uploaded.public_id, // Store public_id
                        fileType: getFileType(file.mimetype)
                    });
                }
            }
        }






        const project = await Project.create({
            projectName,
            projectType,
            budgetRange,
            projectDetails,
            attachments: uploadedFiles,
            status: 'pending',
            progress: 0,
            paidAmount: 0,
            requestedBy: user._id
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
        if (error.isOperational || error.name === 'ValidationError' || error.name === 'CastError' || error.code === 11000) throw error;
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

        // Role-based filtering:
        //  - admin  → sees everything
        //  - team   → sees only projects assigned to them
        //  - user   → sees only their own requests
        if (req?.user?.role === 'team') {
            filter.assignedTeam = req?.user?._id;
        } else if (req?.user?.role !== 'admin') {
            filter.requestedBy = req?.user?._id;
        }

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortOrder = order === 'desc' ? -1 : 1;

        // Execute query
        const [projects, total] = await Promise.all([
            Project.find(filter)
                .populate('requestedBy', 'name email photo')
                .populate('assignedTeam', 'name email photo')
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
        if (error.isOperational || error.name === 'ValidationError' || error.name === 'CastError' || error.code === 11000) throw error;
        throw new AppError(`Failed to fetch projects: ${error.message}`, 500);
    }
});


// =========================
// GET PROJECT BY ID
// =========================
export const getProjectById = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            throw new AppError("Project ID is required", 400);
        }

        const project = await Project.findById(id)
            .populate('requestedBy', 'name email photo')
            .populate('assignedTeam', 'name email photo');

        if (!project) {
            throw new AppError("Project not found", 404);
        }

        // Check authorization
        if (req?.user?.role !== 'admin' && project.requestedBy._id.toString() !== req.user.id) {
            throw new AppError("You are not authorized to view this project", 403);
        }

        successResponse(res, "Project fetched successfully", project);
    } catch (error) {
        console.error("Error in getProjectById:", error);
        if (error.isOperational || error.name === 'ValidationError' || error.name === 'CastError' || error.code === 11000) throw error;
        throw new AppError(`Failed to fetch project: ${error.message}`, 500);
    }
});


// =========================
// UPDATE PROJECT
// =========================
export const updateProject = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const {
            projectName,
            projectType,
            budgetRange,
            projectDetails,
            deadline,
            totalCost,
            paidAmount,
            progress,
            status,
            assignedTeam,
        } = req.body;

        const files = req?.files;

        // Find project
        const project = await Project.findById(id);
        if (!project) {
            throw new AppError("Project not found", 404);
        }

        // Check authorization
        if (req?.user?.role !== 'admin' && project.requestedBy.toString() !== req.user.id) {
            throw new AppError("You are not authorized to update this project", 403);
        }

        // Update fields
        if (projectName) project.projectName = projectName;
        if (projectType) project.projectType = projectType;
        if (budgetRange) project.budgetRange = budgetRange;
        if (projectDetails) project.projectDetails = projectDetails;
        if (deadline) project.deadline = new Date(deadline);
        if (totalCost !== undefined) project.totalCost = parseFloat(totalCost);
        if (paidAmount !== undefined) project.paidAmount = parseFloat(paidAmount);
        if (progress !== undefined) project.progress = parseInt(progress);

        // Only admin can update status and team assignment
        const prevStatus = project.status;
        const prevAssignedTeam = [...(project.assignedTeam || [])].map(String);

        if (req?.user?.role === 'admin') {
            if (status) project.status = status;
            if (assignedTeam !== undefined) {
                // Accept array of IDs or single ID
                project.assignedTeam = Array.isArray(assignedTeam) ? assignedTeam : [assignedTeam];
            }
        }

        // Handle new file uploads
        if (files && files.length > 0) {
            for (const file of files) {
                try {
                    const uploadResult = await uploadImage(file.path, "projects");
                    if (uploadResult && uploadResult.secure_url) {
                        const fileType = file.mimetype.startsWith('image/') ? 'image'
                            : file.mimetype === 'application/pdf' ? 'pdf'
                                : file.mimetype.includes('document') ? 'doc'
                                    : 'other';

                        project.attachments.push({
                            fileName: file.originalname,
                            fileUrl: uploadResult.secure_url,
                            fileType: fileType
                        });
                    }
                } catch (error) {
                    console.error("File upload error:", error);
                }
            }
        }

        await project.save();
        await project.populate('requestedBy', 'name email');

        // ── Fire real-time notifications on status or assignment changes ──────
        const io = req.app.get('io');
        if (req?.user?.role === 'admin' && io) {
            // Notify project owner when admin accepts or rejects
            if (status && status !== prevStatus && project.requestedBy) {
                const ownerId = project.requestedBy._id || project.requestedBy;
                if (status === 'approved') {
                    await createAndEmitNotification(io, {
                        recipientId: ownerId,
                        type: 'project_accepted',
                        title: 'Project Accepted!',
                        message: `Your project "${project.projectName}" has been accepted by the team.`,
                        payload: { projectId: project._id },
                        createdBy: req.user._id,
                    }).catch(() => {});
                } else if (status === 'rejected') {
                    await createAndEmitNotification(io, {
                        recipientId: ownerId,
                        type: 'project_rejected',
                        title: 'Project Update',
                        message: `Your project "${project.projectName}" could not be accepted at this time.`,
                        payload: { projectId: project._id },
                        createdBy: req.user._id,
                    }).catch(() => {});
                }
            }

            // Notify newly assigned team members
            if (assignedTeam !== undefined) {
                const newAssigned = Array.isArray(assignedTeam)
                    ? assignedTeam.map(String)
                    : [String(assignedTeam)];

                const freshlyAdded = newAssigned.filter(
                    (id) => !prevAssignedTeam.includes(id)
                );

                for (const memberId of freshlyAdded) {
                    await createAndEmitNotification(io, {
                        recipientId: memberId,
                        type: 'project_assigned',
                        title: 'New Project Assigned',
                        message: `You have been assigned to "${project.projectName}".`,
                        payload: { projectId: project._id },
                        createdBy: req.user._id,
                    }).catch(() => {});
                }
            }
        }

        successResponse(res, "Project updated successfully", project);
    } catch (error) {
        console.error("Error in updateProject:", error);
        if (error.isOperational || error.name === 'ValidationError' || error.name === 'CastError' || error.code === 11000) throw error;
        throw new AppError(`Failed to update project: ${error.message}`, 500);
    }
});



// =========================
// DELETE ATTACHMENT
// =========================
export const deleteAttachment = asyncHandler(async (req, res) => {
    try {
        const { id, attachmentId } = req.params;

        if (!id || !attachmentId) {
            throw new AppError("Project ID and attachment ID are required", 400);
        }

        const project = await Project.findById(id);
        if (!project) {
            throw new AppError("Project not found", 404);
        }

        // Check authorization
        if (req.user.role !== 'admin' && project.requestedBy.toString() !== req.user.id) {
            throw new AppError("You are not authorized to delete attachments", 403);
        }

        const attachment = project.attachments.id(attachmentId);
        if (!attachment) {
            throw new AppError("Attachment not found", 404);
        }

        // Delete from cloudinary
        try {
            await deleteImage(attachment.fileUrl, "projects");
        } catch (error) {
            console.error("Error deleting from cloudinary:", error);
        }

        // Remove from array
        project.attachments.pull(attachmentId);
        await project.save();

        successResponse(res, "Attachment deleted successfully", project);
    } catch (error) {
        console.error("Error in deleteAttachment:", error);
        if (error.isOperational || error.name === 'ValidationError' || error.name === 'CastError' || error.code === 11000) throw error;
        throw new AppError(`Failed to delete attachment: ${error.message}`, 500);
    }
});


// =========================
// UPDATE PROJECT STATUS (ADMIN ONLY)
// =========================
export const updateProjectStatus = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!id) {
            throw new AppError("Project ID is required", 400);
        }

        if (!status) {
            throw new AppError("Status is required", 400);
        }

        const project = await Project.findByIdAndUpdate(
            id,
            { status },
            { new: true, runValidators: true }
        ).populate('requestedBy', 'name email');

        if (!project) {
            throw new AppError("Project not found", 404);
        }

        successResponse(res, "Project status updated successfully", project);
    } catch (error) {
        console.error("Error in updateProjectStatus:", error);
        if (error.isOperational || error.name === 'ValidationError' || error.name === 'CastError' || error.code === 11000) throw error;
        throw new AppError(`Failed to update project status: ${error.message}`, 500);
    }
});


// =========================
// DELETE PROJECT
// =========================
export const deleteProject = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            throw new AppError("Project ID is required", 400);
        }

        const project = await Project.findById(id);
        if (!project) {
            throw new AppError("Project not found", 404);
        }

        // Check authorization
        if (req?.user?.role !== 'admin' && project.requestedBy.toString() !== req?.user?._id.toString()) {
            throw new AppError("You are not authorized to delete this project", 403);
        }

        // Delete all attachments from cloudinary
        if (project.attachments && project.attachments.length > 0) {
            for (const attachment of project.attachments) {
                try {
                    await deleteImage(attachment?.fileUrl, "projects");
                } catch (err) {
                    console.error("Failed to delete attachment from Cloudinary:", attachment?.fileUrl);
                }
            }
        }

        // Delete the project
        await project.deleteOne();

        successResponse(res, "Project and all attachments deleted successfully", null);
    } catch (error) {
        console.error("Error in deleteProject:", error);
        if (error.isOperational || error.name === 'ValidationError' || error.name === 'CastError' || error.code === 11000) throw error;
        throw new AppError(`Failed to delete project: ${error.message}`, 500);
    }
});


// =========================
// GET PROJECT STATISTICS
// =========================
export const getProjectStats = asyncHandler(async (req, res) => {
    try {
        const filter = req?.user?.role === 'admin'
            ? {}
            : { requestedBy: req?.user?._id };

        const stats = await Project.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    pending: {
                        $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
                    },
                    inReview: {
                        $sum: { $cond: [{ $eq: ['$status', 'in_review'] }, 1, 0] }
                    },
                    approved: {
                        $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
                    },
                    completed: {
                        $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                    },
                    rejected: {
                        $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
                    },
                    totalRevenue: { $sum: '$totalCost' },
                    totalPaid: { $sum: '$paidAmount' },
                    avgProgress: { $avg: '$progress' }
                }
            }
        ]);

        successResponse(res, "Statistics fetched successfully", stats[0] || {
            total: 0,
            pending: 0,
            inReview: 0,
            approved: 0,
            completed: 0,
            rejected: 0,
            totalRevenue: 0,
            totalPaid: 0,
            avgProgress: 0
        });
    } catch (error) {
        console.error("Error in getProjectStats:", error);
        if (error.isOperational || error.name === 'ValidationError' || error.name === 'CastError' || error.code === 11000) throw error;
        throw new AppError(`Failed to fetch project statistics: ${error.message}`, 500);
    }
});
