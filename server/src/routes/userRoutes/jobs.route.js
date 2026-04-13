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
    bulkDeleteJobs,
    bulkUpdateJobStatus,
} from "../../controllers/usersControllers/jobs.controller.js";
import { userAuthenticated, authorizeRoles } from "../../middlewares/Auth.js";
import { mutationLimiter } from "../../middlewares/rateLimiter.js";
import { mongoIdParam, validate } from "../../middlewares/validate.js";
import { setCacheHeaders } from "../../middlewares/cacheHeaders.js";
import { cacheMiddleware } from "../../middlewares/redisCache.js";

const router = express.Router();

// Public routes
router.get("/", getAllJobs);
router.get("/active", setCacheHeaders(300), cacheMiddleware(300), getActiveJobs);
router.get("/featured", setCacheHeaders(300), cacheMiddleware(300), getFeaturedJobs);
router.get("/:id", setCacheHeaders(300), cacheMiddleware(300), validate([mongoIdParam("id")]), getJobById);

// Bulk routes – must come before /:id param routes
router.delete("/bulk", userAuthenticated, authorizeRoles("admin"), mutationLimiter, bulkDeleteJobs);
router.patch("/bulk/status", userAuthenticated, authorizeRoles("admin"), mutationLimiter, bulkUpdateJobStatus);

// Admin-only routes
router.post("/", userAuthenticated, authorizeRoles("admin"), mutationLimiter, createJob);
router.put("/:id", userAuthenticated, authorizeRoles("admin"), mutationLimiter, validate([mongoIdParam("id")]), updateJob);
router.patch("/:id/status", userAuthenticated, authorizeRoles("admin"), mutationLimiter, validate([mongoIdParam("id")]), updateJobStatus);
router.delete("/:id", userAuthenticated, authorizeRoles("admin"), mutationLimiter, validate([mongoIdParam("id")]), deleteJob);

export default router;
