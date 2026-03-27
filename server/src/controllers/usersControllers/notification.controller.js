/**
 * Notification Controller
 *
 * REST endpoints for the /notifications dashboard page and bell icon dropdown.
 * Socket events (notification:new, notification:unread_count) are handled in
 * socketServer.js — these routes cover persistence and initial page load.
 *
 * Routes:
 *  GET    /api/v1/notifications         → paginated list for current user
 *  PUT    /api/v1/notifications/:id     → mark one as read
 *  PUT    /api/v1/notifications/read-all → mark all as read
 *  DELETE /api/v1/notifications/:id     → delete one
 *  DELETE /api/v1/notifications         → clear all
 */
import asyncHandler from "../../middlewares/asyncHandler.js";
import AppError from "../../utils/AppError.js";
import { successResponse } from "../../utils/apiResponse.js";
import Notification from "../../models/usersModels/Notification.model.js";

// =============================================================================
// GET /api/v1/notifications
// Paginated notification list for the current user. Supports ?unread=true filter.
// =============================================================================
export const getNotifications = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const unreadOnly = req.query.unread === "true";

    const filter = { recipientId: req.user._id };
    if (unreadOnly) filter.isRead = false;

    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
        Notification.find(filter)
            .populate("createdBy", "name photo role")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        Notification.countDocuments(filter),
        Notification.countDocuments({ recipientId: req.user._id, isRead: false }),
    ]);

    successResponse(res, "Notifications fetched", {
        notifications,
        unreadCount,
        pagination: {
            total,
            page,
            pages: Math.ceil(total / limit),
            hasMore: skip + limit < total,
        },
    });
});

// =============================================================================
// PUT /api/v1/notifications/:id
// Mark a single notification as read.
// =============================================================================
export const markAsRead = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
        { _id: id, recipientId: req.user._id },
        { isRead: true },
        { new: true }
    );

    if (!notification) {
        throw new AppError("Notification not found", 404);
    }

    const unreadCount = await Notification.countDocuments({
        recipientId: req.user._id,
        isRead: false,
    });

    successResponse(res, "Notification marked as read", { notification, unreadCount });
});

// =============================================================================
// PUT /api/v1/notifications/read-all
// Mark all of the current user's unread notifications as read.
// =============================================================================
export const markAllAsRead = asyncHandler(async (req, res) => {
    await Notification.updateMany(
        { recipientId: req.user._id, isRead: false },
        { isRead: true }
    );

    successResponse(res, "All notifications marked as read", { unreadCount: 0 });
});

// =============================================================================
// DELETE /api/v1/notifications/:id
// Delete a single notification.
// =============================================================================
export const deleteNotification = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const notification = await Notification.findOneAndDelete({
        _id: id,
        recipientId: req.user._id,
    });

    if (!notification) {
        throw new AppError("Notification not found", 404);
    }

    const unreadCount = await Notification.countDocuments({
        recipientId: req.user._id,
        isRead: false,
    });

    successResponse(res, "Notification deleted", { unreadCount });
});

// =============================================================================
// DELETE /api/v1/notifications
// Clear all notifications for the current user.
// =============================================================================
export const clearAllNotifications = asyncHandler(async (req, res) => {
    await Notification.deleteMany({ recipientId: req.user._id });
    successResponse(res, "All notifications cleared", { unreadCount: 0 });
});
