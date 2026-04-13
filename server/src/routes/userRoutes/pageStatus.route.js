import express from "express";
import {
    getAllPageStatuses,
    updatePageStatus,
    createPageStatus,
    deletePageStatus,
} from "../../controllers/usersControllers/pageStatus.controller.js";
import { userAuthenticated, authorizeRoles } from "../../middlewares/Auth.js";
import { setCacheHeaders } from "../../middlewares/cacheHeaders.js";
import { cacheMiddleware } from "../../middlewares/redisCache.js";

const router = express.Router();

// Public — visitors need this to know if a page is under maintenance
router.get("/", setCacheHeaders(120), cacheMiddleware(120), getAllPageStatuses);

// Admin only
router.post("/", userAuthenticated, authorizeRoles("admin"), createPageStatus);
router.put("/:key", userAuthenticated, authorizeRoles("admin"), updatePageStatus);
router.delete("/:key", userAuthenticated, authorizeRoles("admin"), deletePageStatus);

export default router;
