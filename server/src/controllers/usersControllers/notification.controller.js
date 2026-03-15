/**
 * Notification controller – per-user notifications and admin broadcast.
 *
 * User endpoints (require authentication, own notifications only):
 *  - getMyNotifications  GET    /api/v1/notifications/my            (supports ?unreadOnly=true)
 *  - markAsRead          PATCH  /api/v1/notifications/my/:id/read
 *  - markAllAsRead       PATCH  /api/v1/notifications/my/read-all
 *  - deleteNotification  DELETE /api/v1/notifications/my/:id
 *  - clearAllNotifications DELETE /api/v1/notifications/my/clear-all
 *
 * Admin endpoints:
 *  - sendNotification    POST   /api/v1/notifications/send          (send to any user)
 *  - getAllNotifications  GET    /api/v1/notifications               (all users, paginated)
 *
 * Security: read/delete operations filter by `recipient: req.user._id` to ensure
 * users cannot access or modify other users' notifications.
 */
import asyncHandler from "../../middlewares/asyncHandler.js";
import AppError from "../../utils/AppError.js";
import { successResponse } from "../../utils/apiResponse.js";
import Notification from "../../models/usersModels/Notification.model.js";

// =========================
// GET MY NOTIFICATIONS
// =========================
export const getMyNotifications = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter = { recipient: req.user._id };
    if (unreadOnly === "true") filter.isRead = false;

    const [notifications, total, unreadCount] = await Promise.all([
        Notification.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        Notification.countDocuments(filter),
        Notification.countDocuments({ recipient: req.user._id, isRead: false }),
    ]);

    successResponse(res, "Notifications fetched", {
        notifications,
        unreadCount,
        pagination: {
            total,
            page: Number(page),
            pages: Math.ceil(total / Number(limit)),
            limit: Number(limit),
        },
    });
});

// =========================
// MARK SINGLE AS READ
// =========================
export const markAsRead = asyncHandler(async (req, res) => {
    const notification = await Notification.findOneAndUpdate(
        { _id: req.params.id, recipient: req.user._id },
        { isRead: true },
        { new: true }
    );
    if (!notification) throw new AppError("Notification not found", 404);
    successResponse(res, "Notification marked as read", notification);
});

// =========================
// MARK ALL AS READ
// =========================
export const markAllAsRead = asyncHandler(async (req, res) => {
    await Notification.markAllRead(req.user._id);
    successResponse(res, "All notifications marked as read", {});
});

// =========================
// DELETE A NOTIFICATION
// =========================
export const deleteNotification = asyncHandler(async (req, res) => {
    const notification = await Notification.findOneAndDelete({
        _id: req.params.id,
        recipient: req.user._id,
    });
    if (!notification) throw new AppError("Notification not found", 404);
    successResponse(res, "Notification deleted", {});
});

// =========================
// CLEAR ALL NOTIFICATIONS
// =========================
export const clearAllNotifications = asyncHandler(async (req, res) => {
    await Notification.deleteMany({ recipient: req.user._id });
    successResponse(res, "All notifications cleared", {});
});

// =========================
// SEND NOTIFICATION (admin → user)
// =========================
export const sendNotification = asyncHandler(async (req, res) => {
    const { recipientId, type, title, message, link, relatedId, relatedModel } = req.body;

    if (!recipientId || !type || !title || !message) {
        throw new AppError("recipientId, type, title and message are required", 400);
    }

    const notification = await Notification.notify(recipientId, type, title, message, {
        link,
        relatedId,
        relatedModel,
        createdBy: req.user._id,
    });

    successResponse(res, "Notification sent", notification, 201);
});

// =========================
// GET ALL NOTIFICATIONS (admin view)
// =========================
export const getAllNotifications = asyncHandler(async (req, res) => {
    const { page = 1, limit = 30, type, recipientId } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter = {};
    if (type) filter.type = type;
    if (recipientId) filter.recipient = recipientId;

    const [notifications, total] = await Promise.all([
        Notification.find(filter)
            .populate("recipient", "name email")
            .populate("createdBy", "name")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        Notification.countDocuments(filter),
    ]);

    successResponse(res, "Notifications fetched", {
        notifications,
        pagination: {
            total,
            page: Number(page),
            pages: Math.ceil(total / Number(limit)),
        },
    });
});
