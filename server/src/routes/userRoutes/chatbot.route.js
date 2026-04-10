/**
 * Chatbot routes — /api/v1/chatbot
 *
 * Public:
 *   GET  /config/public   — widget metadata (botName, welcomeMessage, isEnabled)
 *   POST /chat            — stream a Claude response via SSE
 *
 * Admin (require userAuthenticated + admin role):
 *   GET    /stats
 *   GET    /sessions
 *   GET    /sessions/:id
 *   DELETE /sessions/:id
 *   PATCH  /sessions/:id/resolve
 *
 *   GET    /config
 *   PUT    /config
 *   POST   /config/keys
 *   DELETE /config/keys/:keyId
 *   PATCH  /config/keys/:keyId/activate
 *
 *   GET    /knowledge
 *   POST   /knowledge
 *   PUT    /knowledge/:id
 *   DELETE /knowledge/:id
 *   POST   /knowledge/upload
 */

import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import {
  chat,
  userChat,
  teamChat,
  getPublicConfig,
  getStats,
  getSessions,
  getSession,
  deleteSession,
  resolveSession,
  getConfig,
  updateConfig,
  addApiKey,
  removeApiKey,
  activateApiKey,
  getHistoryBySessionId,
  getKnowledge,
  createKnowledge,
  updateKnowledge,
  deleteKnowledge,
  uploadKnowledgeFile,
  crawlUrl,
  syncFromDatabase,
  getUsageStats,
} from '../../controllers/usersControllers/chatbot.controller.js';

import { userAuthenticated, authorizeRoles } from '../../middlewares/Auth.js';
import { mutationLimiter } from '../../middlewares/rateLimiter.js';

const router = Router();

// ── Multer for knowledge file uploads ─────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'src/public/uploads/'),
  filename:    (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'kb-' + unique + path.extname(file.originalname));
  },
});

const kbUpload = multer({
  storage,
  limits:      { fileSize: 10 * 1024 * 1024 },  // 10 MB
  fileFilter:  (req, file, cb) => {
    const allowed = /\.(pdf|txt|md|doc|docx|csv|json)$/i;
    if (allowed.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, TXT, MD, DOC, DOCX, CSV, JSON files are allowed'));
    }
  },
});

// ── Public routes ─────────────────────────────────────────────────────────────
router.get('/config/public',            getPublicConfig);
router.post('/chat',                    mutationLimiter, chat);
router.get('/history/:sessionId',       getHistoryBySessionId);

// ── Authenticated dashboard chatbots ──────────────────────────────────────────
router.post('/user-chat', userAuthenticated, mutationLimiter, userChat);
router.post('/team-chat', userAuthenticated, authorizeRoles('admin', 'team'), mutationLimiter, teamChat);

// ── Admin routes ──────────────────────────────────────────────────────────────
const adminOnly = [userAuthenticated, authorizeRoles('admin')];

router.get('/stats',                          ...adminOnly, getStats);
router.get('/usage/stats',                    ...adminOnly, getUsageStats);

// Sessions
router.get   ('/sessions',                   ...adminOnly, getSessions);
router.get   ('/sessions/:id',               ...adminOnly, getSession);
router.delete('/sessions/:id',               ...adminOnly, deleteSession);
router.patch ('/sessions/:id/resolve',       ...adminOnly, resolveSession);

// Config
router.get ('/config',                        ...adminOnly, getConfig);
router.put ('/config',                        ...adminOnly, updateConfig);
router.post('/config/keys',                   ...adminOnly, mutationLimiter, addApiKey);
router.delete('/config/keys/:keyId',          ...adminOnly, removeApiKey);
router.patch ('/config/keys/:keyId/activate', ...adminOnly, activateApiKey);

// Knowledge base — specific routes MUST come before /:id to avoid ambiguity
router.get   ('/knowledge',          ...adminOnly, getKnowledge);
router.post  ('/knowledge',          ...adminOnly, mutationLimiter, createKnowledge);
router.post  ('/knowledge/upload',   ...adminOnly, mutationLimiter, kbUpload.single('file'), uploadKnowledgeFile);
router.post  ('/knowledge/crawl',    ...adminOnly, mutationLimiter, crawlUrl);
router.post  ('/knowledge/sync',     ...adminOnly, mutationLimiter, syncFromDatabase);
router.put   ('/knowledge/:id',      ...adminOnly, mutationLimiter, updateKnowledge);
router.delete('/knowledge/:id',      ...adminOnly, deleteKnowledge);

export default router;
