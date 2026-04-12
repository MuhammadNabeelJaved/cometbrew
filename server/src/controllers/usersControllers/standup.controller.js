/**
 * Standup Controller
 * Daily standup notes for team members.
 *
 * Routes:
 *  GET  /api/v1/standup/today        → get today's note for the logged-in user
 *  POST /api/v1/standup              → upsert today's standup note
 *  GET  /api/v1/standup/team         → admin: all team standups for today
 *  GET  /api/v1/standup/history      → own history (last 14 days)
 */
import asyncHandler from "../../middlewares/asyncHandler.js";
import AppError from "../../utils/AppError.js";
import { successResponse } from "../../utils/apiResponse.js";
import StandupNote from "../../models/usersModels/StandupNote.model.js";
import User from "../../models/usersModels/User.model.js";

function todayStr() {
    return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

// GET /standup/today
export const getTodayStandup = asyncHandler(async (req, res) => {
    const note = await StandupNote.findOne({ userId: req.user._id, date: todayStr() });
    successResponse(res, "Standup fetched", note || null);
});

// POST /standup — upsert
export const upsertStandup = asyncHandler(async (req, res) => {
    const { didYesterday, doingToday, blockers, mood } = req.body;
    const note = await StandupNote.findOneAndUpdate(
        { userId: req.user._id, date: todayStr() },
        { didYesterday, doingToday, blockers, mood },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    successResponse(res, "Standup saved", note);
});

// GET /standup/team — admin only; today's standups for all team members
export const getTeamStandups = asyncHandler(async (req, res) => {
    if (req.user.role !== "admin") throw new AppError("Admin only", 403);
    const date = req.query.date || todayStr();
    const notes = await StandupNote.find({ date })
        .populate("userId", "name photo teamProfile.position teamProfile.department availabilityStatus")
        .sort({ createdAt: -1 });
    successResponse(res, "Team standups fetched", notes);
});

// GET /standup/history — own last 14 days
export const getStandupHistory = asyncHandler(async (req, res) => {
    const notes = await StandupNote.find({ userId: req.user._id })
        .sort({ date: -1 })
        .limit(14);
    successResponse(res, "Standup history fetched", notes);
});

// PUT /standup/status — update availability status via REST (Socket is preferred)
export const updateAvailabilityStatus = asyncHandler(async (req, res) => {
    const VALID = ["available", "busy", "meeting", "away", "wfh", "offline"];
    const { status } = req.body;
    if (!VALID.includes(status)) throw new AppError("Invalid status", 400);

    await User.findByIdAndUpdate(req.user._id, { availabilityStatus: status });

    // Broadcast via Socket.IO if available
    const io = req.app.get("io");
    if (io) {
        const payload = { userId: req.user._id, status, userName: req.user.name };
        io.to("team:global").emit("user:status_changed", payload);
        io.to("admin:global").emit("user:status_changed", payload);
    }

    successResponse(res, "Status updated", { status });
});
