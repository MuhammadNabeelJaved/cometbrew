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
    // PROJECT MANAGEMENT
    // =========================
    deadline: {
      type: Date,
      validate: {
        validator: function (value) {
          return value > new Date();
        },
        message: "Deadline must be a future date",
      },
    },

    progress: {
      type: Number,
      default: 0,
      min: [0, "Progress cannot be less than 0"],
      max: [100, "Progress cannot exceed 100"],
    },

    // =========================
    // PAYMENT DETAILS
    // =========================
    totalCost: {
      type: Number,
      min: [0, "Total cost cannot be negative"],
    },

    paidAmount: {
      type: Number,
      min: [0, "Paid amount cannot be negative"],
      validate: {
        validator: function (value) {
          return !this.totalCost || value <= this.totalCost;
        },
        message: "Paid amount cannot exceed total cost",
      },
      default: 0,
    },

    paymentStatus: {
      type: String,
      enum: ["unpaid", "partial", "paid"],
      default: "unpaid",
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
      enum: ["pending", "in_review", "approved", "rejected", "completed"],
      default: "pending",
      index: true,
    },

    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// =========================
// VIRTUAL: DUE AMOUNT
// =========================
projectRequestSchema.virtual("dueAmount").get(function () {
  if (!this.totalCost) return 0;
  return this.totalCost - (this.paidAmount || 0);
});

// =========================
// PRE-SAVE: PAYMENT STATUS AUTO UPDATE
// =========================
projectRequestSchema.pre("save", function () {
  if (!this.totalCost || this.paidAmount === 0) {
    this.paymentStatus = "unpaid";
  } else if (this.paidAmount < this.totalCost) {
    this.paymentStatus = "partial";
  } else {
    this.paymentStatus = "paid";
  }
});

// =========================
// INDEXES
// =========================
projectRequestSchema.index({ projectName: "text", projectDetails: "text" });

// =========================
// EXPORT MODEL
// =========================
const Project = mongoose.models.Project || mongoose.model(
  "Project",
  projectRequestSchema
);

export default Project;
