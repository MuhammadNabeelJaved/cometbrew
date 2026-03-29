/**
 * Chat Controller
 *
 * REST endpoints that back the chat UI (conversation list, message history,
 * file upload, admin search). Socket events handle real-time delivery —
 * these routes handle persistence and initial data loading.
 *
 * Routes:
 *  GET  /api/v1/chat/conversations              → user's conversation list
 *  POST /api/v1/chat/conversations              → get-or-create a conversation
 *  GET  /api/v1/chat/conversations/:id/messages → paginated message history
 *  POST /api/v1/chat/upload                     → upload file → Cloudinary URL
 *  GET  /api/v1/chat/admin/conversations        → admin: all user conversations (search)
 *  GET  /api/v1/chat/admin/team-members         → admin: list team members for DM
 */
import asyncHandler from "../../middlewares/asyncHandler.js";
import AppError from "../../utils/AppError.js";
import { successResponse } from "../../utils/apiResponse.js";
import Conversation from "../../models/usersModels/Conversation.model.js";
import Message from "../../models/usersModels/Message.model.js";
import User from "../../models/usersModels/User.model.js";
import { uploadFile } from "../../middlewares/Cloudinary.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function detectFileType(mimetype = "") {
    if (mimetype.startsWith("image/")) return "image";
    if (mimetype === "application/pdf") return "pdf";
    if (mimetype.includes("word") || mimetype.includes("document")) return "doc";
    return "other";
}

// ─── Shared helper: inject unreadCount per conversation ──────────────────────
async function withUnreadCounts(conversations, userId) {
    if (!conversations.length) return conversations;
    const convoIds = conversations.map((c) => c._id);
    const agg = await Message.aggregate([
        {
            $match: {
                conversationId: { $in: convoIds },
                readBy: { $not: { $elemMatch: { $eq: userId } } },
                messageType: { $ne: "system" },
            },
        },
        { $group: { _id: "$conversationId", count: { $sum: 1 } } },
    ]);
    const map = Object.fromEntries(agg.map((u) => [u._id.toString(), u.count]));
    return conversations.map((c) => ({
        ...c,
        unreadCount: map[c._id.toString()] || 0,
    }));
}

// =============================================================================
// GET /api/v1/chat/conversations
// Returns all conversations the authenticated user participates in.
// =============================================================================
export const getConversations = asyncHandler(async (req, res) => {
    let conversations = await Conversation.find({
        participants: req.user._id,
        isActive: true,
    })
        .populate("participants", "name photo role teamProfile.position")
        .populate({
            path: "lastMessage",
            populate: { path: "senderId", select: "name" },
        })
        .sort({ lastMessageAt: -1 })
        .lean();

    conversations = await withUnreadCounts(conversations, req.user._id);
    successResponse(res, "Conversations fetched", conversations);
});

// =============================================================================
// POST /api/v1/chat/conversations
// Get-or-create a conversation between two participants.
// Body: { participantId?, type: "user_admin" | "admin_team" }
// For type "user_admin", participantId is optional — the server finds an admin.
// =============================================================================
export const getOrCreateConversation = asyncHandler(async (req, res) => {
    let { participantId, type } = req.body;

    if (!type) {
        throw new AppError("type is required", 400);
    }

    const validTypes = ["user_admin", "admin_team", "team_team"];
    if (!validTypes.includes(type)) {
        throw new AppError("Invalid conversation type", 400);
    }

    // For user_admin or admin_team conversations, if no participantId is given, find the first admin
    if ((type === "user_admin" || type === "admin_team") && !participantId) {
        const admin = await User.findOne({ role: "admin", isActive: true }).select("_id");
        if (!admin) throw new AppError("No admin available", 404);
        participantId = admin._id;
    }

    if (!participantId) {
        throw new AppError("participantId is required", 400);
    }

    const otherUser = await User.findById(participantId);
    if (!otherUser) throw new AppError("Participant not found", 404);

    // Look for an existing conversation between these two users of this type
    let conversation = await Conversation.findOne({
        type,
        participants: { $all: [req.user._id, participantId] },
    })
        .populate("participants", "name photo role teamProfile.position")
        .populate({
            path: "lastMessage",
            populate: { path: "senderId", select: "name" },
        });

    if (!conversation) {
        conversation = await Conversation.create({
            participants: [req.user._id, participantId],
            type,
        });

        conversation = await Conversation.findById(conversation._id)
            .populate("participants", "name photo role teamProfile.position")
            .populate({
                path: "lastMessage",
                populate: { path: "senderId", select: "name" },
            });

        // Emit system message to conversation room via socket
        const io = req.app.get("io");
        if (io) {
            await Message.create({
                conversationId: conversation._id,
                senderId: req.user._id,
                content: "Conversation started",
                messageType: "system",
                readBy: [req.user._id],
            });
        }
    }

    successResponse(res, "Conversation ready", conversation);
});

// =============================================================================
// GET /api/v1/chat/conversations/:id/messages
// Paginated message history. Returns newest-last (ascending) for chat UI.
// Query: page=1, limit=50
// =============================================================================
export const getMessages = asyncHandler(async (req, res) => {
    const { id: conversationId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    // Verify participant — admin can access any conversation
    const conversationQuery = req.user.role === "admin"
        ? { _id: conversationId }
        : { _id: conversationId, participants: req.user._id };
    const conversation = await Conversation.findOne(conversationQuery);
    if (!conversation) {
        throw new AppError("Conversation not found or access denied", 404);
    }

    const skip = (page - 1) * limit;
    const total = await Message.countDocuments({ conversationId });

    // Fetch in reverse (newest first), then flip for ascending display order
    const messages = await Message.find({ conversationId })
        .populate("senderId", "name photo role")
        .populate({ path: "replyTo", populate: { path: "senderId", select: "name" } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    messages.reverse(); // chronological order for the chat UI

    // Mark all fetched messages as read by this user
    await Message.updateMany(
        {
            conversationId,
            readBy: { $ne: req.user._id },
        },
        { $addToSet: { readBy: req.user._id } }
    );

    successResponse(res, "Messages fetched", {
        messages,
        pagination: {
            total,
            page,
            pages: Math.ceil(total / limit),
            hasMore: skip + limit < total,
        },
    });
});

// =============================================================================
// POST /api/v1/chat/upload
// Upload a file to Cloudinary and return the URL.
// The client then sends the URL as a socket chat:send_message event.
// =============================================================================
export const uploadChatFile = asyncHandler(async (req, res) => {
    if (!req.file) throw new AppError("No file provided", 400);

    const result = await uploadFile(req.file.path, "chat-files");

    const fileType = detectFileType(req.file.mimetype);

    successResponse(res, "File uploaded", {
        fileUrl: result.secure_url,
        fileName: req.file.originalname,
        fileType,
        fileMime: req.file.mimetype,
    });
});

// =============================================================================
// GET /api/v1/chat/admin/conversations
// Admin only: list all user-admin conversations. Supports search by user name.
// =============================================================================
export const adminGetAllConversations = asyncHandler(async (req, res) => {
    if (req.user.role !== "admin") {
        throw new AppError("Admin access required", 403);
    }

    const { search, type = "user_admin" } = req.query;

    let conversations = await Conversation.find({ type, isActive: true })
        .populate("participants", "name photo email role teamProfile.position")
        .populate({
            path: "lastMessage",
            populate: { path: "senderId", select: "name" },
        })
        .sort({ lastMessageAt: -1 })
        .lean();

    // Filter by participant name if search provided
    if (search) {
        const q = search.toLowerCase();
        conversations = conversations.filter((c) =>
            c.participants.some((p) => p.name?.toLowerCase().includes(q))
        );
    }

    conversations = await withUnreadCounts(conversations, req.user._id);
    successResponse(res, "Conversations fetched", conversations);
});

// =============================================================================
// GET /api/v1/chat/admin/team-members
// Admin only: list team members available for DM conversations.
// =============================================================================
export const getTeamMembersForChat = asyncHandler(async (req, res) => {
    if (req.user.role !== "admin") {
        throw new AppError("Admin access required", 403);
    }

    const members = await User.find({
        role: "team",
        isActive: true,
        deletedAt: null,
    }).select("name photo email teamProfile.position teamProfile.department");

    successResponse(res, "Team members fetched", members);
});

// =============================================================================
// DELETE /api/v1/chat/conversations/:id/messages
// Admin only: clear all messages in a conversation (keeps the conversation).
// =============================================================================
export const clearChatMessages = asyncHandler(async (req, res) => {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) throw new AppError("Conversation not found", 404);

    const isParticipant = conversation.participants.some((p) =>
        p.equals(req.user._id)
    );
    if (!isParticipant && req.user.role !== "admin") {
        throw new AppError("Access denied", 403);
    }

    await Message.deleteMany({ conversationId: req.params.id });

    // Reset the conversation's lastMessage pointer
    await Conversation.findByIdAndUpdate(req.params.id, {
        lastMessage: null,
        lastMessageAt: new Date(),
    });

    successResponse(res, "Chat cleared");
});

// =============================================================================
// GET /api/v1/chat/team/peers
// Team members only: list other team members available for DM.
// =============================================================================
export const getTeamPeersForChat = asyncHandler(async (req, res) => {
    if (req.user.role !== "team") {
        throw new AppError("Team member access required", 403);
    }

    const members = await User.find({
        role: "team",
        isActive: true,
        deletedAt: null,
        _id: { $ne: req.user._id },
    }).select("name photo email teamProfile.position teamProfile.department");

    successResponse(res, "Team peers fetched", members);
});

// =============================================================================
// DELETE /api/v1/chat/conversations/:id
// Admin only: permanently delete a conversation and all its messages.
// =============================================================================
export const deleteConversation = asyncHandler(async (req, res) => {
    if (req.user.role !== "admin") {
        throw new AppError("Admin access required", 403);
    }

    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) throw new AppError("Conversation not found", 404);

    await Message.deleteMany({ conversationId: req.params.id });
    await Conversation.findByIdAndDelete(req.params.id);

    successResponse(res, "Conversation deleted");
});
