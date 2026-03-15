/**
 * Notification model – per-user in-app notifications.
 *
 * Notifications are created by admins or automatically by the system and
 * delivered to individual users. Each notification has a `type` that the
 * frontend uses to choose an appropriate icon and colour.
 *
 * Key features:
 *  - Compound index `{ recipient, isRead, createdAt }` optimises the common
 *    "fetch my unread notifications" query
 *  - `relatedId` + `relatedModel` provide optional deep-linking to the entity
 *    that triggered the notification (e.g. a Project or Review document)
 *  - `Notification.notify()` – convenience static for creating a notification
 *  - `Notification.markAllRead()` – marks all unread notifications for a user
 *
 * Endpoints:
 *  - GET  /api/v1/notifications/my          – user's own notifications
 *  - PATCH /api/v1/notifications/my/:id/read – mark one as read
 *  - PATCH /api/v1/notifications/my/read-all – mark all as read
 *  - DELETE /api/v1/notifications/my/:id    – delete one
 *  - DELETE /api/v1/notifications/my/clear-all – clear all
 *  - GET  /api/v1/notifications             – admin: all notifications
 *  - POST /api/v1/notifications/send        – admin: send to a user
 */
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        // The user this notification is addressed to
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        // Type of notification – drives icon/colour rendering on the frontend
        type: {
            type: String,
            enum: [
                "project_update",     // project status changed
                "project_milestone",  // milestone reached
                "new_message",        // new message from admin/team
                "payment_received",   // payment confirmed
                "payment_due",        // payment overdue
                "review_requested",   // admin asks for review
                "job_application",    // application status updated
                "system",             // platform announcements
            ],
            required: true,
            index: true,
        },

        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: [150, "Title cannot exceed 150 characters"],
        },
        message: {
            type: String,
            required: true,
            trim: true,
            maxlength: [500, "Message cannot exceed 500 characters"],
        },

        // Optional deep-link URL (e.g. "/projects/abc123") for frontend routing
        link: {
            type: String,
            trim: true,
        },

        // Optional reference to the related document that triggered this notification
        relatedId: {
            type: mongoose.Schema.Types.ObjectId,
        },
        relatedModel: {
            type: String,
            trim: true, // e.g. "Project", "Review"
        },

        // Read state – false = unread (shown as highlighted in the UI)
        isRead: {
            type: Boolean,
            default: false,
            index: true,
        },

        // The admin or system user who created this notification
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// Optimise "get my unread notifications sorted by date" – the most common query
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

// ─── Static Methods ───────────────────────────────────────────────────────────

/**
 * Creates and persists a notification for a recipient.
 *
 * @param {ObjectId|string} recipientId - The target user's ID
 * @param {string}          type        - Notification type (must be in enum)
 * @param {string}          title       - Short notification title
 * @param {string}          message     - Full notification message body
 * @param {Object}          extras      - Optional extra fields (link, relatedId, etc.)
 * @returns {Promise<Document>} The created Notification document
 */
notificationSchema.statics.notify = async function (recipientId, type, title, message, extras = {}) {
    return this.create({ recipient: recipientId, type, title, message, ...extras });
};

/**
 * Marks all unread notifications for a user as read in a single operation.
 *
 * @param {ObjectId|string} userId - The recipient user's ID
 * @returns {Promise<UpdateResult>}
 */
notificationSchema.statics.markAllRead = function (userId) {
    return this.updateMany({ recipient: userId, isRead: false }, { isRead: true });
};

const Notification =
    mongoose.models.Notification || mongoose.model("Notification", notificationSchema);

export default Notification;
