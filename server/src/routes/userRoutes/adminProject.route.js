import express from "express";
import {
    createProject,
    getAllProjects,
    getProjectById,
    updateProject,
    deleteProject,
    updateProjectStatus,
} from "../../controllers/usersControllers/adminProject.controller.js";
import { userAuthenticated, authorizeRoles } from "../../middlewares/Auth.js";

const router = express.Router();

// All routes require admin authentication
router.use(userAuthenticated, authorizeRoles("admin"));

router.get("/", getAllProjects);
router.post("/", createProject);
router.get("/:id", getProjectById);
router.put("/:id", updateProject);
router.patch("/:id/status", updateProjectStatus);
router.delete("/:id", deleteProject);

export default router;
