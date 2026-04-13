import express from 'express';
import { createService, getAllServices, getServiceBySlug, getServiceById, deleteService, updateService, bulkDeleteServices } from '../../controllers/usersControllers/services.controller.js';
import { userAuthenticated, authorizeRoles } from "../../middlewares/Auth.js"
import { setCacheHeaders } from "../../middlewares/cacheHeaders.js";
import { cacheMiddleware } from "../../middlewares/redisCache.js";


const router = express.Router();

router.route('/create').post(userAuthenticated, authorizeRoles("admin"), createService);
router.route('/').get(setCacheHeaders(300), cacheMiddleware(300), getAllServices);
router.route('/:slug').get(setCacheHeaders(300), cacheMiddleware(300), getServiceBySlug);
router.route('/id/:id').get(setCacheHeaders(300), cacheMiddleware(300), getServiceById);
router.route('/delete/:id').delete(userAuthenticated, authorizeRoles("admin"), deleteService);
router.route('/update/:id').put(userAuthenticated, authorizeRoles("admin"), updateService);
router.delete('/bulk', userAuthenticated, authorizeRoles("admin"), bulkDeleteServices);

export default router;