/**
 * Conversation model — index of every chat thread.
 *
 * Types:
 *  - "user_admin"  → one dedicated thread per user with the admin
 *  - "admin_team"  → DM between admin and a team member
 *  - "team_team"   → DM between two team members
 *
 * Participants array always contains exactly 2 user ObjectIds.
 * Compound index on (participants + type) makes admin search O(log n).
 */
import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
    {
        participants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
        ],

        type: {
            type: String,
            enum: ["user_admin", "admin_team", "team_team"],
            required: true,
        },

        // Denormalised pointer to the most recent message — used for sidebar previews
        lastMessage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
            default: null,
        },

        lastMessageAt: {
            type: Date,
            default: Date.now,
        },

        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// Fast lookup: find conversation by participant userId + type
conversationSchema.index({ participants: 1, type: 1 });
// Sort conversations by most recent activity
conversationSchema.index({ lastMessageAt: -1 });

const Conversation =
    mongoose.models.Conversation ||
    mongoose.model("Conversation", conversationSchema);

export default Conversation;
