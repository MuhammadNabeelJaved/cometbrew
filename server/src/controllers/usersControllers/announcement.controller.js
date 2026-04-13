import asyncHandler from "../../middlewares/asyncHandler.js";
import AppError from "../../utils/AppError.js";
import { successResponse } from "../../utils/apiResponse.js";
import Announcement from "../../models/usersModels/Announcement.model.js";
import AnnouncementBar from "../../models/usersModels/AnnouncementBar.model.js";
import { invalidateCache } from "../../middlewares/redisCache.js";

// Singleton settings stored as a special doc (_meta: true)
const SETTINGS_FILTER = { _meta: true };

/** GET /api/v1/announcements/settings — public */
export const getSettings = asyncHandler(async (req, res) => {
    const doc = await Announcement.findOne(SETTINGS_FILTER).lean();
    successResponse(res, "Settings fetched", {
        tickerDuration:    doc?.tickerDuration    ?? 30,
        scrollEnabled:     doc?.scrollEnabled     ?? true,
        textAlign:         doc?.textAlign         ?? "center",
        separatorVisible:  doc?.separatorVisible  ?? true,
        separatorColor:    doc?.separatorColor     ?? "",
        itemSpacing:       doc?.itemSpacing        ?? 32,
    });
});

/** PUT /api/v1/announcements/settings — admin */
export const updateSettings = asyncHandler(async (req, res) => {
    const { tickerDuration, scrollEnabled, textAlign, separatorVisible, separatorColor, itemSpacing } = req.body;
    const setFields = { _meta: true };

    if (tickerDuration !== undefined) {
        if (isNaN(Number(tickerDuration))) throw new AppError("tickerDuration must be a number", 400);
        setFields.tickerDuration = Math.min(Math.max(Number(tickerDuration), 5), 120);
    }
    if (scrollEnabled !== undefined) setFields.scrollEnabled = Boolean(scrollEnabled);
    if (textAlign !== undefined) {
        if (!["left", "center", "right"].includes(textAlign)) throw new AppError("textAlign must be left, center, or right", 400);
        setFields.textAlign = textAlign;
    }
    if (separatorVisible !== undefined) setFields.separatorVisible = Boolean(separatorVisible);
    if (separatorColor !== undefined) setFields.separatorColor = String(separatorColor);
    if (itemSpacing !== undefined) {
        if (isNaN(Number(itemSpacing))) throw new AppError("itemSpacing must be a number", 400);
        setFields.itemSpacing = Math.min(Math.max(Number(itemSpacing), 0), 128);
    }

    const doc = await Announcement.findOneAndUpdate(SETTINGS_FILTER, { $set: setFields }, { upsert: true, new: true });
    const io = req.app.get("io");
    if (io) io.of("/public").emit("cms:updated", { section: "announcements" });
    invalidateCache('/announcements').catch(() => {});
    successResponse(res, "Settings updated", {
        tickerDuration:   doc.tickerDuration,
        scrollEnabled:    doc.scrollEnabled,
        textAlign:        doc.textAlign,
        separatorVisible: doc.separatorVisible,
        separatorColor:   doc.separatorColor,
        itemSpacing:      doc.itemSpacing,
    });
});

/** GET /api/v1/announcements — public, only active */
export const getActiveAnnouncements = asyncHandler(async (req, res) => {
    const items = await Announcement.find({ isActive: true, _meta: { $ne: true } }).sort({ order: 1, createdAt: -1 });
    successResponse(res, "Announcements fetched", items);
});

/** GET /api/v1/announcements/all — admin, all including inactive */
export const getAllAnnouncements = asyncHandler(async (req, res) => {
    const items = await Announcement.find({ _meta: { $ne: true } }).sort({ order: 1, createdAt: -1 });
    successResponse(res, "All announcements fetched", items);
});

/** POST /api/v1/announcements — admin */
export const createAnnouncement = asyncHandler(async (req, res) => {
    const { text, emoji, link, linkLabel, bgColor, textColor, isActive, order, barId } = req.body;
    if (!text?.trim()) throw new AppError("text is required", 400);

    // Resolve barId: if provided use it; else use first/default bar
    let resolvedBarId = barId || null;
    if (!resolvedBarId) {
        const defaultBar = await AnnouncementBar.findOne().sort({ order: 1, createdAt: 1 });
        resolvedBarId = defaultBar?._id || null;
    }

    const item = await Announcement.create({
        text: text.trim(),
        emoji: emoji?.trim() || "",
        link: link?.trim() || "",
        linkLabel: linkLabel?.trim() || "Learn More",
        bgColor: bgColor || "#7c3aed",
        textColor: textColor || "#ffffff",
        isActive: isActive !== undefined ? isActive : true,
        order: order ?? 0,
        barId: resolvedBarId,
        createdBy: req.user._id,
    });

    const io = req.app.get("io");
    if (io) io.of("/public").emit("cms:updated", { section: "announcements" });
    invalidateCache('/announcements').catch(() => {});
    successResponse(res, "Announcement created", item, 201);
});

/** PUT /api/v1/announcements/:id — admin */
export const updateAnnouncement = asyncHandler(async (req, res) => {
    const allowed = ["text", "emoji", "link", "linkLabel", "bgColor", "textColor", "isActive", "order"];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    const item = await Announcement.findByIdAndUpdate(req.params.id, updates, {
        new: true,
        runValidators: true,
    });
    if (!item) throw new AppError("Announcement not found", 404);

    const io = req.app.get("io");
    if (io) io.of("/public").emit("cms:updated", { section: "announcements" });
    invalidateCache('/announcements').catch(() => {});
    successResponse(res, "Announcement updated", item);
});

/** DELETE /api/v1/announcements/:id — admin */
export const deleteAnnouncement = asyncHandler(async (req, res) => {
    const item = await Announcement.findByIdAndDelete(req.params.id);
    if (!item) throw new AppError("Announcement not found", 404);
    const io = req.app.get("io");
    if (io) io.of("/public").emit("cms:updated", { section: "announcements" });
    invalidateCache('/announcements').catch(() => {});
    successResponse(res, "Announcement deleted", {});
});
