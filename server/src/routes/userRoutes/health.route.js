import express from "express";
import mongoose from "mongoose";
import { getRedisClient } from "../../config/redis.js";
import {
  getRequestHistory,
  getRequestTotals,
  getCacheStats,
  getVitalsStats,
  recordVital,
} from "../../utils/perfStats.js";
import { userAuthenticated, authorizeRoles } from "../../middlewares/Auth.js";

const router = express.Router();

// ─── GET /api/v1/health — public liveness probe ──────────────────────────────
router.get("/", async (_req, res) => {
  const memMB = process.memoryUsage();
  const dbState  = mongoose.connection.readyState;
  const dbStatus = dbState === 1 ? "connected" : dbState === 2 ? "connecting" : "disconnected";

  let redisStatus = "unavailable";
  try {
    const redis = getRedisClient();
    if (redis) { await redis.ping(); redisStatus = "connected"; }
  } catch { /* skip */ }

  const healthy = dbStatus === "connected";
  res.status(healthy ? 200 : 503).json({
    status: healthy ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    memory: {
      heapUsedMB:  Math.round(memMB.heapUsed  / 1024 / 1024),
      heapTotalMB: Math.round(memMB.heapTotal / 1024 / 1024),
      rssMB:       Math.round(memMB.rss       / 1024 / 1024),
    },
    services: { db: dbStatus, redis: redisStatus },
  });
});

// ─── GET /api/v1/health/stats — admin performance dashboard ──────────────────
router.get("/stats", userAuthenticated, authorizeRoles("admin"), async (_req, res) => {
  const mem = process.memoryUsage();
  const dbState  = mongoose.connection.readyState;
  const dbStatus = dbState === 1 ? "connected" : dbState === 2 ? "connecting" : "disconnected";

  let redisStatus = "unavailable";
  let redisCachedKeys = 0;
  try {
    const redis = getRedisClient();
    if (redis) {
      await redis.ping();
      redisStatus = "connected";
      let cursor = "0", total = 0;
      do {
        const [next, keys] = await redis.scan(cursor, "MATCH", "cache:GET:*", "COUNT", 100);
        cursor = next;
        total += keys.length;
      } while (cursor !== "0");
      redisCachedKeys = total;
    }
  } catch { /* skip */ }

  const uptime = Math.floor(process.uptime());

  res.json({
    timestamp: new Date().toISOString(),
    uptime,
    uptimeFormatted: _formatUptime(uptime),
    status: dbStatus === "connected" ? "ok" : "degraded",
    services: { db: dbStatus, redis: redisStatus },
    memory: {
      heapUsedMB:  Math.round(mem.heapUsed  / 1024 / 1024),
      heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
      externalMB:  Math.round(mem.external  / 1024 / 1024),
      rssMB:       Math.round(mem.rss       / 1024 / 1024),
      heapUsedPct: Math.round((mem.heapUsed / mem.heapTotal) * 100),
    },
    requests: getRequestTotals(),
    requestHistory: getRequestHistory(30),
    cache: { ...getCacheStats(), cachedKeys: redisCachedKeys },
    vitals: getVitalsStats(),
  });
});

// ─── POST /api/v1/health/vitals — receive Web Vitals from frontend ────────────
router.post("/vitals", (req, res) => {
  const { name, value, rating, delta, id } = req.body;
  if (name && value !== undefined && rating) recordVital(name, value, rating);
  if (process.env.NODE_ENV !== "production") {
    console.log(`[WebVital] ${name} = ${value} (${rating}) delta=${delta} id=${id}`);
  }
  res.status(204).end();
});

function _formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600)  / 60);
  const s = seconds % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

export default router;
