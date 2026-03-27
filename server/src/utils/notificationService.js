/**
 * Notification Service
 *
 * Single responsibility: write a notification document to MongoDB AND emit
 * a real-time socket event to the recipient's private room.
 *
 * The server calls this function — it never worries about toasts, badge
 * counts, or page updates. The client's useNotifications hook handles all
 * three surfaces when it receives the "notification:new" socket event.
 *
 * Usage:
 *   import { createAndEmitNotification } from '../utils/notificationService.js';
 *   await createAndEmitNotification(io, {
 *     recipientId, type, title, message, payload, createdBy
 *   });
 */
import Notification from "../models/usersModels/Notification.model.js";

/**
 * @param {import('socket.io').Server} io - The Socket.IO server instance
 * @param {Object} opts
 * @param {string|ObjectId} opts.recipientId  - User ID of the recipient
 * @param {string}          opts.type         - Notification type enum value
 * @param {string}          opts.title        - Short title for the notification
 * @param {string}          opts.message      - Full notification message
 * @param {Object}          opts.payload      - Extra data (conversationId, projectId…)
 * @param {string|ObjectId} opts.createdBy    - User ID of the actor (optional)
 * @returns {Promise<Document>}               - The saved Notification document
 */
export async function createAndEmitNotification(
    io,
    { recipientId, type, title, message, payload = {}, createdBy = null }
) {
    // Step 1 — Persist to MongoDB
    const notification = await Notification.create({
        recipientId,
        type,
        title,
        message,
        payload,
        isRead: false,
        createdBy,
    });

    // Step 2 — Emit to recipient's private room
    // The client hook listens to this event and fans out to toast + bell + page
    if (io) {
        io.to(`user:${recipientId}`).emit("notification:new", {
            _id: notification._id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            payload: notification.payload,
            isRead: false,
            createdAt: notification.createdAt,
        });
    }

    return notification;
}
