/**
 * Standup Routes
 * /api/v1/standup
 */
import express from "express";
import { userAuthenticated, authorizeRoles } from "../../middlewares/Auth.js";
import {
    getTodayStandup,
    upsertStandup,
    getTeamStandups,
    getStandupHistory,
    updateAvailabilityStatus,
} from "../../controllers/usersControllers/standup.controller.js";

const router = express.Router();

router.use(userAuthenticated);

router.get("/today", getTodayStandup);
router.post("/", upsertStandup);
router.get("/history", getStandupHistory);
router.get("/team", getTeamStandups);
router.put("/status", updateAvailabilityStatus);

export default router;
