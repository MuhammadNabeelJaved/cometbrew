/**
 * Socket.IO Server
 *
 * Responsibilities:
 *  1. JWT authentication on every connection (reads from cookie or auth.token)
 *  2. Private room per user: "user:{userId}"
 *  3. Admins also join "admin:global" for broadcast events
 *  4. Conversation rooms: "conversation:{conversationId}"
 *  5. All chat events: send_message, typing, read_messages
 *  6. All notification events: unread count, mark_read, mark_all_read
 *  7. Optional Redis adapter for horizontal scaling (set REDIS_URL in .env)
 *
 * Room strategy:
 *  - "user:{id}"             → private; used for notification delivery
 *  - "admin:global"          → all admins; used for new support request alerts
 *  - "conversation:{id}"     → all participants in a thread; used for messages
 */
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/usersModels/User.model.js";
import Conversation from "../models/usersModels/Conversation.model.js";
import Message from "../models/usersModels/Message.model.js";
import Notification from "../models/usersModels/Notification.model.js";

// ─── Cookie helper ────────────────────────────────────────────────────────────
// Parse the raw "Cookie" header string without any external dependency.
function parseCookies(cookieStr = "") {
    return cookieStr.split(";").reduce((acc, pair) => {
        const idx = pair.indexOf("=");
        if (idx < 0) return acc;
        const key = pair.slice(0, idx).trim();
        const val = pair.slice(idx + 1).trim();
        acc[key] = decodeURIComponent(val);
        return acc;
    }, {});
}

// ─── File type helper ─────────────────────────────────────────────────────────
function detectFileType(mimeOrName = "") {
    const s = mimeOrName.toLowerCase();
    if (s.startsWith("image/") || /\.(png|jpg|jpeg|gif|webp|svg)$/.test(s)) return "image";
    if (s === "application/pdf" || s.endsWith(".pdf")) return "pdf";
    if (s.includes("word") || s.includes("document") || /\.(doc|docx)$/.test(s)) return "doc";
    return "other";
}

// ─── Main export ──────────────────────────────────────────────────────────────
export async function initSocket(httpServer, corsOptions) {
    const io = new Server(httpServer, {
        cors: corsOptions,
        // Allow both polling (fallback) and WebSocket transports
        transports: ["polling", "websocket"],
    });

    // ── Optional Redis adapter (horizontal scaling) ───────────────────────────
    if (process.env.REDIS_URL) {
        try {
            const { createClient } = await import("ioredis");
            const { createAdapter } = await import("@socket.io/redis-adapter");
            const pubClient = new createClient(process.env.REDIS_URL);
            const subClient = pubClient.duplicate();
            await Promise.all([pubClient.connect(), subClient.connect()]);
            io.adapter(createAdapter(pubClient, subClient));
            console.log("Socket.IO: Redis adapter connected");
        } catch (err) {
            console.warn("Socket.IO: Redis adapter failed — running single-node:", err.message);
        }
    }

    // ── JWT auth middleware ───────────────────────────────────────────────────
    io.use(async (socket, next) => {
        try {
            // Prefer HTTP-only cookie (browser sends automatically with withCredentials)
            const cookies = parseCookies(socket.handshake.headers.cookie);
            const token =
                cookies.accessToken ||
                socket.handshake.auth?.token;

            if (!token) {
                return next(new Error("Authentication required"));
            }

            const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
            const user = await User.findById(decoded.id).select("-password");

            if (!user) return next(new Error("User not found"));
            if (!user.isVerified) return next(new Error("Account not verified"));

            socket.user = user;
            next();
        } catch (err) {
            next(new Error(`Auth failed: ${err.message}`));
        }
    });

    // ── Connection handler ────────────────────────────────────────────────────
    io.on("connection", (socket) => {
        const user = socket.user;

        // ── Join private rooms ────────────────────────────────────────────────
        // Every user gets a private room for receiving notifications
        socket.join(`user:${user._id}`);

        // Admins get a broadcast room for new support request alerts
        if (user.role === "admin") {
            socket.join("admin:global");
        }

        // ── Send unread count immediately on connect ───────────────────────────
        Notification.countDocuments({ recipientId: user._id, isRead: false })
            .then((count) => socket.emit("notification:unread_count", { count }))
            .catch(() => {});

        // ═══════════════════════════════════════════════════════════════════════
        // NOTIFICATION EVENTS
        // ═══════════════════════════════════════════════════════════════════════

        // Client requests current unread count (e.g. on reconnect)
        socket.on("notification:get_unread_count", async () => {
            try {
                const count = await Notification.countDocuments({
                    recipientId: user._id,
                    isRead: false,
                });
                socket.emit("notification:unread_count", { count });
            } catch {
                socket.emit("error:global", { message: "Failed to fetch notification count" });
            }
        });

        // Mark a single notification as read
        socket.on("notification:mark_read", async ({ notificationId }) => {
            try {
                await Notification.findOneAndUpdate(
                    { _id: notificationId, recipientId: user._id },
                    { isRead: true }
                );
                const count = await Notification.countDocuments({
                    recipientId: user._id,
                    isRead: false,
                });
                socket.emit("notification:unread_count", { count });
            } catch {
                socket.emit("error:global", { message: "Failed to mark notification as read" });
            }
        });

        // Mark all notifications as read
        socket.on("notification:mark_all_read", async () => {
            try {
                await Notification.updateMany(
                    { recipientId: user._id, isRead: false },
                    { isRead: true }
                );
                socket.emit("notification:unread_count", { count: 0 });
            } catch {
                socket.emit("error:global", { message: "Failed to mark all notifications as read" });
            }
        });

        // ═══════════════════════════════════════════════════════════════════════
        // CHAT EVENTS
        // ═══════════════════════════════════════════════════════════════════════

        // Join a conversation room (verified participant only)
        socket.on("chat:join_conversation", async ({ conversationId }) => {
            try {
                const convo = await Conversation.findOne({
                    _id: conversationId,
                    participants: user._id,
                });
                if (!convo) {
                    socket.emit("error:global", { message: "Conversation not found or access denied" });
                    return;
                }
                socket.join(`conversation:${conversationId}`);
            } catch {
                socket.emit("error:global", { message: "Failed to join conversation" });
            }
        });

        // Leave a conversation room
        socket.on("chat:leave_conversation", ({ conversationId }) => {
            socket.leave(`conversation:${conversationId}`);
        });

        // ── Send a message ────────────────────────────────────────────────────
        socket.on(
            "chat:send_message",
            async ({ conversationId, content, messageType = "text", fileUrl, fileName, fileMime }) => {
                try {
                    // Verify participant
                    const convo = await Conversation.findOne({
                        _id: conversationId,
                        participants: user._id,
                    });
                    if (!convo) {
                        socket.emit("error:global", { message: "Conversation not found" });
                        return;
                    }

                    const fileType = fileMime ? detectFileType(fileMime) : null;

                    // Persist message
                    const msg = await Message.create({
                        conversationId,
                        senderId: user._id,
                        content: content || "",
                        messageType,
                        fileUrl: fileUrl || null,
                        fileName: fileName || null,
                        fileType,
                        readBy: [user._id],
                    });

                    // Update conversation last activity
                    await Conversation.findByIdAndUpdate(conversationId, {
                        lastMessage: msg._id,
                        lastMessageAt: new Date(),
                    });

                    // Populate sender for the client
                    const populated = await Message.findById(msg._id).populate(
                        "senderId",
                        "name photo role"
                    );

                    // Broadcast to conversation room (includes sender — for multi-tab)
                    io.to(`conversation:${conversationId}`).emit("chat:new_message", populated);

                    // Notify every other participant
                    const others = convo.participants.filter(
                        (p) => p.toString() !== user._id.toString()
                    );

                    for (const recipientId of others) {
                        const isFile = messageType === "file";
                        const notifType = isFile ? "file_received" : "message";
                        const notifTitle = isFile
                            ? `${user.name} sent a file`
                            : `New message from ${user.name}`;
                        const notifBody = isFile
                            ? fileName || "File attachment"
                            : content.length > 80
                            ? content.slice(0, 80) + "…"
                            : content;

                        const notif = await Notification.create({
                            recipientId,
                            type: notifType,
                            title: notifTitle,
                            message: notifBody,
                            payload: { conversationId, messageId: msg._id },
                            isRead: false,
                            createdBy: user._id,
                        });

                        io.to(`user:${recipientId}`).emit("notification:new", {
                            _id: notif._id,
                            type: notif.type,
                            title: notif.title,
                            message: notif.message,
                            payload: notif.payload,
                            isRead: false,
                            createdAt: notif.createdAt,
                        });
                    }

                    // Alert admin room when a user initiates support for the first time
                    if (convo.type === "user_admin") {
                        const msgCount = await Message.countDocuments({ conversationId });
                        if (msgCount === 1) {
                            io.to("admin:global").emit("admin:new_support_request", {
                                conversationId,
                                user: { _id: user._id, name: user.name, photo: user.photo },
                            });
                        }
                    }
                } catch (err) {
                    console.error("chat:send_message error:", err);
                    socket.emit("error:global", { message: "Failed to send message" });
                }
            }
        );

        // ── Typing indicator ──────────────────────────────────────────────────
        socket.on("chat:typing", ({ conversationId, isTyping }) => {
            socket.to(`conversation:${conversationId}`).emit("chat:typing_indicator", {
                userId: user._id,
                userName: user.name,
                isTyping,
            });
        });

        // ── Mark messages as read ─────────────────────────────────────────────
        socket.on("chat:read_messages", async ({ conversationId }) => {
            try {
                await Message.updateMany(
                    {
                        conversationId,
                        readBy: { $ne: user._id },
                    },
                    { $addToSet: { readBy: user._id } }
                );
                io.to(`conversation:${conversationId}`).emit("chat:messages_read", {
                    conversationId,
                    readBy: user._id,
                });
            } catch {
                socket.emit("error:global", { message: "Failed to mark messages as read" });
            }
        });

        // ── Disconnect cleanup ────────────────────────────────────────────────
        socket.on("disconnect", () => {
            // Socket.IO automatically removes the socket from all rooms on disconnect
        });
    });

    return io;
}
