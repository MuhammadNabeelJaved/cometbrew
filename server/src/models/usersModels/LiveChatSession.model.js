/**
 * LiveChatSession model — represents a single live chat session between a visitor and an agent.
 *
 * States:
 *  - "waiting"  → session created but no agent accepted yet
 *  - "active"   → agent has accepted and is chatting with visitor
 *  - "closed"   → conversation ended (by agent, visitor, or system)
 *  - "missed"   → visitor closed before any agent accepted
 *
 * When status moves from "waiting" to "active", acceptedAt is recorded and agentId is set.
 * When status moves to "closed", closedAt is recorded and closedBy indicates who closed it.
 */
import mongoose from "mongoose";

const liveChatSessionSchema = new mongoose.Schema(
    {
        sessionId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },

        visitorName: {
            type: String,
            required: true,
            trim: true,
        },

        visitorEmail: {
            type: String,
            trim: true,
            default: null,
        },

        status: {
            type: String,
            enum: ["waiting", "active", "closed", "missed"],
            default: "waiting",
            index: true,
        },

        agentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        startedAt: {
            type: Date,
            default: Date.now,
        },

        acceptedAt: {
            type: Date,
            default: null,
        },

        closedAt: {
            type: Date,
            default: null,
        },

        closedBy: {
            type: String,
            enum: ["agent", "visitor", "system"],
            default: null,
        },

        tags: [
            {
                type: String,
                trim: true,
            },
        ],

        agentNotes: {
            type: String,
            trim: true,
            default: "",
        },

        userAgent: {
            type: String,
            default: null,
        },

        pageUrl: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

liveChatSessionSchema.index({ status: 1, startedAt: -1 });

const LiveChatSession =
    mongoose.models.LiveChatSession ||
    mongoose.model("LiveChatSession", liveChatSessionSchema);

export default LiveChatSession;
