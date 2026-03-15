/**
 * Contact model – stores contact form submissions from site visitors.
 *
 * Each submission captures a visitor's name, email, subject, and message.
 * The email field is unique-indexed, meaning each email address can only
 * submit one contact form (prevents duplicate leads from the same person).
 *
 * Accessible via:
 *  - POST /api/v1/contacts        – public, anyone can submit
 *  - GET  /api/v1/contacts        – admin only
 *  - GET  /api/v1/contacts/:id    – admin only
 *  - PUT  /api/v1/contacts/:id    – admin only
 *  - DELETE /api/v1/contacts/:id  – admin only
 */
import mongoose from "mongoose";
import validator from "validator";

const contactSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
            minlength: [3, "Name must be at least 3 characters"],
            maxlength: [50, "Name cannot exceed 50 characters"],
        },

        lastName: {
            type: String,
            required: [true, "Last name is required"],
            trim: true,
            minlength: [3, "Last name must be at least 3 characters"],
            maxlength: [50, "Last name cannot exceed 50 characters"],
        },

        // Unique index prevents the same person submitting multiple times
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
            validate: [validator.isEmail, "Please provide a valid email"],
            index: true,
        },

        subject: {
            type: String,
            required: [true, "Subject is required"],
            trim: true,
            minlength: [3, "Subject must be at least 3 characters"],
            maxlength: [50, "Subject cannot exceed 50 characters"],
        },

        message: {
            type: String,
            required: [true, "Message is required"],
            trim: true,
            minlength: [10, "Message must be at least 10 characters"],
            maxlength: [1000, "Message cannot exceed 1000 characters"],
        },
    },
    { timestamps: true }
);

const Contact = mongoose.models.Contact || mongoose.model("Contact", contactSchema);

export default Contact;
