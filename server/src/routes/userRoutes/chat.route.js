/**
 * Chat Routes
 * All routes require authentication.
 * File upload route uses multerAny middleware for single-file support.
 */
import express from "express";
import { userAuthenticated } from "../../middlewares/Auth.js";
import upload from "../../middlewares/multerChat.js";
import {
    getConversations,
    getOrCreateConversation,
    getMessages,
    uploadChatFile,
    adminGetAllConversations,
    getTeamMembersForChat,
    getTeamPeersForChat,
    clearChatMessages,
    deleteConversation,
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

// ── Team member routes ────────────────────────────────────────────────────────
router.get("/team/peers", getTeamPeersForChat);

// ── Admin-only routes ─────────────────────────────────────────────────────────
router.get("/admin/conversations", adminGetAllConversations);
router.get("/admin/team-members", getTeamMembersForChat);
router.delete("/conversations/:id/messages", clearChatMessages);
router.delete("/conversations/:id", deleteConversation);

export default router;
