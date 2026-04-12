/**
 * StandupNote model — daily standup entries for team members.
 * One document per user per day (upserted via date string key).
 */
import mongoose from "mongoose";

const standupNoteSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        // ISO date string "YYYY-MM-DD" — uniqueness enforced per user
        date: {
            type: String,
            required: true,
        },

        didYesterday: {
            type: String,
            default: "",
            maxlength: 1000,
        },

        doingToday: {
            type: String,
            default: "",
            maxlength: 1000,
        },

        blockers: {
            type: String,
            default: "",
            maxlength: 500,
        },

        mood: {
            type: String,
            enum: ["great", "good", "okay", "stressed", "blocked"],
            default: "good",
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// One standup per user per day
standupNoteSchema.index({ userId: 1, date: 1 }, { unique: true });

const StandupNote =
    mongoose.models.StandupNote || mongoose.model("StandupNote", standupNoteSchema);

export default StandupNote;
