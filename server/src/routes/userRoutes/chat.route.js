/**
 * Chat Routes
 * All routes require authentication.
 * File upload route uses multerAny middleware for single-file support.
 */
import express from "express";
import { userAuthenticated } from "../../middlewares/Auth.js";
import upload from "../../middlewares/multerAny.js";
import {
    getConversations,
    getOrCreateConversation,
    getMessages,
    uploadChatFile,
    adminGetAllConversations,
    getTeamMembersForChat,
} from "../../controllers/usersControllers/chat.controller.js";

const router = express.Router();

// All chat routes require a valid JWT session
router.use(userAuthenticated);

// ── Conversation management ───────────────────────────────────────────────────
router.get("/conversations", getConversations);
router.post("/conversations", getOrCreateConversation);
router.get("/conversations/:id/messages", getMessages);

// ── File upload (returns Cloudinary URL; client sends as socket message) ──────
router.post("/upload", upload.single("file"), uploadChatFile);

// ── Admin-only routes ─────────────────────────────────────────────────────────
router.get("/admin/conversations", adminGetAllConversations);
router.get("/admin/team-members", getTeamMembersForChat);

export default router;
