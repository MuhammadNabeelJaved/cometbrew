/**
 * Client model – CRM record for the agency's business clients.
 *
 * Represents real-world companies or individuals that the agency works with.
 * This is separate from `User` (platform accounts) — a Client may or may not
 * have a User account on the platform.
 *
 * Key fields:
 *  - `companyName` – primary identifier for the client
 *  - `email`       – unique contact email (enforced by unique index)
 *  - `accountManager` – ref to the User (team member) responsible
 *  - `totalRevenue` – running total of all revenue from this client
 *  - `isArchived`  – soft-delete; archived clients are hidden from active lists
 *
 * The active project count is computed on-the-fly from the `Project` collection
 * rather than stored here, to avoid synchronisation issues.
 *
 * All routes are admin-only (see client.route.js).
 */
import mongoose from "mongoose";

const clientSchema = new mongoose.Schema(
    {
        // Basic info
        companyName: {
            type: String,
            required: [true, "Company name is required"],
            trim: true,
            maxlength: [150, "Company name cannot exceed 150 characters"],
            index: true,
        },
        contactName: {
            type: String,
            trim: true,
            maxlength: [100, "Contact name cannot exceed 100 characters"],
        },

        // Unique email ensures no duplicate client records
        email: {
            type: String,
            required: [true, "Email is required"],
            trim: true,
            lowercase: true,
            unique: true,
            index: true,
            match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
        },
        phone: {
            type: String,
            trim: true,
            maxlength: [20, "Phone cannot exceed 20 characters"],
        },

        // Classification
        industry: {
            type: String,
            trim: true,
            maxlength: [80, "Industry cannot exceed 80 characters"],
        },
        status: {
            type: String,
            enum: ["Active", "Inactive", "Onboarding", "Churned"],
            default: "Active",
            index: true,
        },

        // The team member who manages the relationship with this client
        accountManager: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            index: true,
        },

        // Optional metadata
        website: {
            type: String,
            trim: true,
        },
        notes: {
            type: String,
            trim: true,
            maxlength: [1000, "Notes cannot exceed 1000 characters"],
        },
        logoUrl: {
            type: String,
            trim: true, // Cloudinary URL for the client's company logo
        },

        // Cumulative revenue from all projects for this client (updated externally)
        totalRevenue: {
            type: Number,
            default: 0,
            min: 0,
        },

        // Who created this client record (for audit trail)
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        // Soft-delete: archived clients are excluded from active listings
        isArchived: {
            type: Boolean,
            default: false,
            index: true,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// Virtual: active projects count is computed via Project collection, not stored here

// Full-text index for searching clients by name, contact, or email
clientSchema.index({ companyName: "text", contactName: "text", email: "text" });

const Client = mongoose.models.Client || mongoose.model("Client", clientSchema);

export default Client;
