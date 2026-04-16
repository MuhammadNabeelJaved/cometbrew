/**
 * LiveChatMessage model — represents a single message within a live chat session.
 *
 * Messages can be sent by:
 *  - "visitor"  → end user chatting via the live chat widget
 *  - "agent"    → team member responding from the admin dashboard
 *  - "system"   → automated messages (e.g. "Agent joined", "Chat closed")
 *
 * readByAgent / readByVisitor track if the message has been seen.
 * sessionId links to a LiveChatSession._id (string) for fast retrieval.
 */
import mongoose from "mongoose";

const liveChatMessageSchema = new mongoose.Schema(
    {
        sessionId: {
            type: String,
            required: true,
            index: true,
        },

        sender: {
            type: String,
            enum: ["visitor", "agent", "system"],
            required: true,
        },

        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        content: {
            type: String,
            required: true,
            trim: true,
        },

        timestamp: {
            type: Date,
            default: Date.now,
        },

        readByAgent: {
            type: Boolean,
            default: false,
        },

        readByVisitor: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

liveChatMessageSchema.index({ sessionId: 1, timestamp: 1 });

const LiveChatMessage =
    mongoose.models.LiveChatMessage ||
    mongoose.model("LiveChatMessage", liveChatMessageSchema);

export default LiveChatMessage;
