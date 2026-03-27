/**
 * Message model — individual messages inside a Conversation.
 *
 * messageType:
 *  - "text"   → plain text
 *  - "file"   → Cloudinary file (image, pdf, doc, etc.)
 *  - "system" → automated event messages (e.g. "Conversation started")
 *
 * readBy tracks which participants have seen the message.
 * Compound index on (conversationId + createdAt DESC) for efficient pagination.
 */
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        conversationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Conversation",
            required: true,
            index: true,
        },

        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        content: {
            type: String,
            default: "",
            trim: true,
        },

        // Populated for file messages
        fileUrl: { type: String, default: null },
        fileName: { type: String, default: null },
        fileType: {
            type: String,
            enum: ["image", "pdf", "doc", "other"],
            default: null,
        },

        messageType: {
            type: String,
            enum: ["text", "file", "system"],
            default: "text",
        },

        // Array of user IDs who have read this message
        readBy: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// Primary query pattern: get messages for a conversation, newest first
messageSchema.index({ conversationId: 1, createdAt: -1 });

const Message =
    mongoose.models.Message || mongoose.model("Message", messageSchema);

export default Message;
