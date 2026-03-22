import express from 'express';
import upload from "../../middlewares/multer.js"
import { userAuthenticated, authorizeRoles } from '../../middlewares/Auth.js';
import {
    createProject,
    getAllProjects,
    updateProject,
    getProjectById,
    updateProjectStatus,
    deleteProject,
    getProjectStats,
    deleteAttachment
} from '../../controllers/usersControllers/project.controller.js';



const router = express.Router();


router.route('/create').post(userAuthenticated, authorizeRoles("admin", "user"), upload.array('files', 5), createProject);
router.route('/').get(userAuthenticated, authorizeRoles('admin', 'user', 'team'), getAllProjects);
router.route('/stats').get(userAuthenticated, authorizeRoles('admin', 'user'), getProjectStats);
router.route('/:id').get(userAuthenticated, authorizeRoles("admin", "user"), getProjectById);
router.route('/:id').patch(userAuthenticated, authorizeRoles("admin", "user"), upload.array('files', 5), updateProject);
router.route('/:id/status').patch(userAuthenticated, authorizeRoles('admin'), updateProjectStatus);
router.route('/:id').delete(userAuthenticated, authorizeRoles('admin', 'user'), deleteProject);
router.route('/:id/attachments/:attachmentId').delete(userAuthenticated, authorizeRoles('admin'), deleteAttachment);
export default router;
