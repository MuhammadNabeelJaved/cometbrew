/**
 * Notification model — persistent record of every notification event.
 *
 * Every notification hits three surfaces on the client simultaneously:
 *  1. Toast (transient) — via socket emit
 *  2. Bell icon counter — via socket emit + REST unread count
 *  3. /notifications page — via REST list + socket prepend
 *
 * The server only writes to this collection and emits one socket event.
 * The client hook drives all three surfaces from that single event.
 *
 * Types:
 *  - message          → new chat message received
 *  - file_received    → file sent in a chat
 *  - project_accepted → admin accepted a user project
 *  - project_rejected → admin rejected a user project
 *  - project_assigned → admin assigned a project to a team member
 */
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        recipientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        type: {
            type: String,
            enum: [
                "message",
                "file_received",
                "project_accepted",
                "project_rejected",
                "project_assigned",
            ],
            required: true,
        },

        title: {
            type: String,
            required: true,
            trim: true,
        },

        message: {
            type: String,
            required: true,
            trim: true,
        },

        // Arbitrary extra data (conversationId, projectId, messageId, etc.)
        payload: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },

        isRead: {
            type: Boolean,
            default: false,
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// Compound index for bell icon unread count query
notificationSchema.index({ recipientId: 1, isRead: 1 });
// Compound index for notification list page (newest first per user)
notificationSchema.index({ recipientId: 1, createdAt: -1 });

const Notification =
    mongoose.models.Notification ||
    mongoose.model("Notification", notificationSchema);

export default Notification;
