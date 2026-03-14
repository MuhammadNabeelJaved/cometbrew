import express from "express";
import {
    createJob,
    getAllJobs,
    getActiveJobs,
    getJobById,
    updateJob,
    deleteJob,
    updateJobStatus,
    getFeaturedJobs,
} from "../../controllers/usersControllers/jobs.controller.js";
import { userAuthenticated, authorizeRoles } from "../../middlewares/Auth.js";

const router = express.Router();

// Public routes
router.get("/", getAllJobs);
router.get("/active", getActiveJobs);
router.get("/featured", getFeaturedJobs);
router.get("/:id", getJobById);

// Admin-only routes
router.post("/", userAuthenticated, authorizeRoles("admin"), createJob);
router.put("/:id", userAuthenticated, authorizeRoles("admin"), updateJob);
router.patch("/:id/status", userAuthenticated, authorizeRoles("admin"), updateJobStatus);
router.delete("/:id", userAuthenticated, authorizeRoles("admin"), deleteJob);

export default router;
