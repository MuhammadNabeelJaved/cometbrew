// server/src/controllers/usersControllers/liveChat.controller.js
import asyncHandler from '../../middlewares/asyncHandler.js';
import AppError from '../../utils/AppError.js';
import { successResponse } from '../../utils/apiResponse.js';
import LiveChatSession from '../../models/usersModels/LiveChatSession.model.js';
import LiveChatMessage from '../../models/usersModels/LiveChatMessage.model.js';

// GET /api/v1/live-chat/stats
export const getStats = asyncHandler(async (req, res) => {
  const [total, waiting, active, closed, missed] = await Promise.all([
    LiveChatSession.countDocuments(),
    LiveChatSession.countDocuments({ status: 'waiting' }),
    LiveChatSession.countDocuments({ status: 'active' }),
    LiveChatSession.countDocuments({ status: 'closed' }),
    LiveChatSession.countDocuments({ status: 'missed' }),
  ]);

  const accepted = await LiveChatSession.find({
    status: { $in: ['active', 'closed'] },
    acceptedAt: { $ne: null },
  }).select('startedAt acceptedAt').lean();

  const avgWaitMs = accepted.length
    ? accepted.reduce((sum, s) => sum + (s.acceptedAt - s.startedAt), 0) / accepted.length
    : 0;
  const avgWaitSec = Math.round(avgWaitMs / 1000);

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayTotal = await LiveChatSession.countDocuments({ startedAt: { $gte: todayStart } });

  successResponse(res, 200, 'Stats fetched', { total, waiting, active, closed, missed, avgWaitSec, todayTotal });
});

// GET /api/v1/live-chat/sessions
export const getSessions = asyncHandler(async (req, res) => {
  const { status, agentId, page = 1, limit = 30, search } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (agentId) filter.agentId = agentId;
  if (search) {
    filter.$or = [
      { visitorName: { $regex: search, $options: 'i' } },
      { visitorEmail: { $regex: search, $options: 'i' } },
    ];
  }
  const skip = (Number(page) - 1) * Number(limit);
  const [sessions, total] = await Promise.all([
    LiveChatSession.find(filter)
      .populate('agentId', 'name photo')
      .sort({ startedAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    LiveChatSession.countDocuments(filter),
  ]);
  successResponse(res, 200, 'Sessions fetched', { sessions, total, page: Number(page), limit: Number(limit) });
});

// GET /api/v1/live-chat/sessions/:id
export const getSessionById = asyncHandler(async (req, res) => {
  const session = await LiveChatSession.findById(req.params.id)
    .populate('agentId', 'name photo role')
    .lean();
  if (!session) throw new AppError('Session not found', 404);
  const messages = await LiveChatMessage.find({ sessionId: session.sessionId })
    .sort({ timestamp: 1 })
    .lean();
  successResponse(res, 200, 'Session fetched', { session, messages });
});

// PATCH /api/v1/live-chat/sessions/:id
export const updateSession = asyncHandler(async (req, res) => {
  const { tags, agentNotes, status } = req.body;
  const update = {};
  if (tags !== undefined) update.tags = tags;
  if (agentNotes !== undefined) update.agentNotes = agentNotes;
  if (status) update.status = status;
  const session = await LiveChatSession.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!session) throw new AppError('Session not found', 404);
  successResponse(res, 200, 'Session updated', { session });
});

// DELETE /api/v1/live-chat/sessions/:id
export const deleteSession = asyncHandler(async (req, res) => {
  const session = await LiveChatSession.findByIdAndDelete(req.params.id);
  if (!session) throw new AppError('Session not found', 404);
  await LiveChatMessage.deleteMany({ sessionId: session.sessionId });
  successResponse(res, 200, 'Session deleted', null);
});

// GET /api/v1/live-chat/messages/:sessionId
export const getMessages = asyncHandler(async (req, res) => {
  const messages = await LiveChatMessage.find({ sessionId: req.params.sessionId })
    .sort({ timestamp: 1 })
    .lean();
  successResponse(res, 200, 'Messages fetched', { messages });
});
