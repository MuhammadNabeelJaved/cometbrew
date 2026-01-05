import mongoose from "mongoose";

const projectRequestSchema = new mongoose.Schema(
    {
        // =========================
        // BASIC PROJECT INFO
        // =========================
        projectName: {
            type: String,
            required: [true, "Project name is required"],
            trim: true,
            minlength: [3, "Project name must be at least 3 characters"],
            maxlength: [100, "Project name cannot exceed 100 characters"],
        },

        projectType: {
            type: String,
            required: [true, "Project type is required"],
            enum: {
                values: [
                    "Web Development",
                    "Mobile App Development",
                    "UI/UX Design",
                    "E-commerce",
                    "Branding",
                    "Other",
                ],
                message: "Invalid project type selected",
            },
        },

        budgetRange: {
            type: String,
            required: [true, "Budget range is required"],
            enum: {
                values: [
                    "$100 - $500",
                    "$500 - $1,000",
                    "$1,000 - $5,000",
                    "$5,000+",
                ],
                message: "Invalid budget range",
            },
        },

        projectDetails: {
            type: String,
            required: [true, "Project details are required"],
            trim: true,
            minlength: [20, "Project details must be at least 20 characters"],
            maxlength: [2000, "Project details cannot exceed 2000 characters"],
        },

        // =========================
        // ATTACHMENTS
        // =========================
        attachments: [
            {
                fileName: String,
                fileUrl: String,
                fileType: {
                    type: String,
                    enum: ["image", "pdf", "doc", "other"],
                },
            },
        ],

        // =========================
        // USER & STATUS
        // =========================
        requestedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        status: {
            type: String,
            enum: ["pending", "in_review", "approved", "rejected"],
            default: "pending",
            index: true,
        },

        isArchived: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true, // createdAt & updatedAt
        versionKey: false,
    }
);

// =========================
// INDEXES (Performance)
// =========================
projectRequestSchema.index({ projectName: "text", projectDetails: "text" });

// =========================
// EXPORT MODEL
// =========================
const ProjectRequest = mongoose.model(
    "ProjectRequest",
    projectRequestSchema
);

export default ProjectRequest;
