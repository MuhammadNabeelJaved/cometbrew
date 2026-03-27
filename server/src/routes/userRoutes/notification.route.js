/**
 * Notification Routes
 * All routes require authentication.
 */
import express from "express";
import { userAuthenticated } from "../../middlewares/Auth.js";
import {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
} from "../../controllers/usersControllers/notification.controller.js";

const router = express.Router();

router.use(userAuthenticated);

router.get("/", getNotifications);
router.put("/read-all", markAllAsRead);
router.put("/:id", markAsRead);
router.delete("/", clearAllNotifications);
router.delete("/:id", deleteNotification);

export default router;
