// server/src/routes/userRoutes/liveChat.route.js
import { Router } from 'express';
import { userAuthenticated, authorizeRoles } from '../../middlewares/Auth.js';
import {
  getStats, getSessions, getSessionById, updateSession, deleteSession, getMessages,
} from '../../controllers/usersControllers/liveChat.controller.js';

const router = Router();
const adminOnly = [userAuthenticated, authorizeRoles('admin')];

router.get('/stats',                  ...adminOnly, getStats);
router.get('/sessions',               ...adminOnly, getSessions);
router.get('/sessions/:id',           ...adminOnly, getSessionById);
router.patch('/sessions/:id',         ...adminOnly, updateSession);
router.delete('/sessions/:id',        ...adminOnly, deleteSession);
router.get('/messages/:sessionId',    ...adminOnly, getMessages);

export default router;
