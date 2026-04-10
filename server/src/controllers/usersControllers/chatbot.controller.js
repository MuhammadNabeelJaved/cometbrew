/**
 * Chatbot Controller
 *
 * Public endpoint:
 *   POST /api/v1/chatbot/chat        — stream a Claude response (SSE)
 *   GET  /api/v1/chatbot/config/public — fetch botName + welcomeMessage + isEnabled
 *
 * Admin endpoints (all require admin role):
 *   GET    /api/v1/chatbot/stats
 *   GET    /api/v1/chatbot/sessions
 *   GET    /api/v1/chatbot/sessions/:id
 *   DELETE /api/v1/chatbot/sessions/:id
 *   PATCH  /api/v1/chatbot/sessions/:id/resolve
 *
 *   GET    /api/v1/chatbot/config
 *   PUT    /api/v1/chatbot/config
 *   POST   /api/v1/chatbot/config/keys          — add API key
 *   DELETE /api/v1/chatbot/config/keys/:keyId   — remove API key
 *   PATCH  /api/v1/chatbot/config/keys/:keyId/activate
 *
 *   GET    /api/v1/chatbot/knowledge
 *   POST   /api/v1/chatbot/knowledge
 *   PUT    /api/v1/chatbot/knowledge/:id
 *   DELETE /api/v1/chatbot/knowledge/:id
 *   POST   /api/v1/chatbot/knowledge/upload     — upload file to Cloudinary
 */

import crypto from 'crypto';
import Anthropic from '@anthropic-ai/sdk';
import asyncHandler from '../../middlewares/asyncHandler.js';
import AppError from '../../utils/AppError.js';
import { successResponse } from '../../utils/apiResponse.js';
import ChatbotConfig    from '../../models/usersModels/ChatbotConfig.model.js';
import ChatbotKnowledge from '../../models/usersModels/ChatbotKnowledge.model.js';
import ChatbotSession   from '../../models/usersModels/ChatbotSession.model.js';
import ChatbotUsage, { calcCost } from '../../models/usersModels/ChatbotUsage.model.js';
import { uploadFile }      from '../../middlewares/Cloudinary.js';
// Models used for DB queries
import PageStatus           from '../../models/usersModels/PageStatus.model.js';
import Services             from '../../models/usersModels/Services.model.js';
import AdminProject         from '../../models/usersModels/AdminProject.model.js';
import CMS                  from '../../models/usersModels/CMS.model.js';
import Jobs                 from '../../models/usersModels/Jobs.model.js';
import Reviews              from '../../models/usersModels/Reviews.model.js';
import User                 from '../../models/usersModels/User.model.js';
// Models for per-user and per-team context
import Project              from '../../models/usersModels/Project.model.js';
import JobApplication       from '../../models/usersModels/JobApplication.model.js';

// ─── Tone instructions ────────────────────────────────────────────────────────

const TONE_INSTRUCTIONS = {
  professional:
    'Maintain a professional, polished tone throughout the conversation. ' +
    'Be concise, accurate, and solution-oriented. Use proper grammar, avoid slang, ' +
    'and keep responses structured and to the point.',

  friendly:
    'Be warm, approachable, and genuinely helpful. Use a conversational tone that makes ' +
    'users feel welcome. It is fine to use light casual language, contractions, and show ' +
    'enthusiasm when relevant.',

  formal:
    'Use strictly formal language at all times. Maintain decorum and proper etiquette. ' +
    'Avoid contractions, slang, and overly casual phrasing. Structure responses clearly ' +
    'with complete sentences.',

  casual:
    'Be casual, relaxed, and natural — like chatting with a knowledgeable friend. ' +
    'Keep sentences short, use everyday language, and do not over-explain. ' +
    'Occasional light humour is welcome.',

  expert:
    'Communicate as a seasoned domain expert. Show depth of knowledge, use accurate ' +
    'technical terminology where appropriate, and provide insightful, authoritative ' +
    'answers. Back up statements with specifics from the knowledge base.',

  empathetic:
    'Lead with empathy and genuine understanding. Acknowledge the user\'s question or ' +
    'situation before answering. Show that you care about their needs and provide ' +
    'supportive, considerate responses. Never be dismissive.',
};

// ─── Anthropic model catalog ──────────────────────────────────────────────────
// Exported so the frontend config endpoint can serve this list to the admin UI.
export const ANTHROPIC_MODELS = [
  {
    id:    'claude-haiku-4-5-20251001',
    name:  'Claude Haiku 4.5',
    tier:  'fast',
    badge: '⚡ Fastest · Most Affordable',
    desc:  'Ideal for simple queries, greetings, and FAQ-style answers. Very low cost.',
  },
  {
    id:    'claude-sonnet-4-6',
    name:  'Claude Sonnet 4.6',
    tier:  'balanced',
    badge: '⚖️ Balanced · Recommended',
    desc:  'Best balance of quality and cost. Suitable for most customer queries.',
  },
  {
    id:    'claude-opus-4-6',
    name:  'Claude Opus 4.6',
    tier:  'advanced',
    badge: '🧠 Most Capable · Highest Cost',
    desc:  'Maximum reasoning depth. Use only for complex, nuanced conversations.',
  },
];

// ─── In-memory response cache ─────────────────────────────────────────────────
// Avoids repeat API calls for identical or near-identical queries.
// TTL: 1 hour · Max size: 500 entries (LRU-style eviction)
const _cache        = new Map();
const CACHE_TTL_MS  = 60 * 60 * 1000;
const CACHE_MAX     = 500;

function _cacheKey(msg) {
  return msg.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

function _cacheGet(key) {
  const entry = _cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) { _cache.delete(key); return null; }
  return entry.text;
}

function _cacheSet(key, text) {
  if (_cache.size >= CACHE_MAX) _cache.delete(_cache.keys().next().value); // evict oldest
  _cache.set(key, { text, ts: Date.now() });
}

// ─── In-memory rate limiter (per anonymised IP, 1-minute sliding window) ─────
const _rateMap = new Map();

function _isRateLimited(ip, maxPerMin = 15) {
  const now   = Date.now();
  const entry = _rateMap.get(ip) ?? { count: 0, resetAt: now + 60_000 };
  if (now > entry.resetAt) { entry.count = 0; entry.resetAt = now + 60_000; }
  entry.count++;
  _rateMap.set(ip, entry);
  return entry.count > maxPerMin;
}

// ─── Rule-based layer ─────────────────────────────────────────────────────────
// Layer 1a — Greeting detection (exact short phrases only)
const _GREETING_RE = /^(hi+|hello+|hey+|salam|salaam|assalam\s*o?\s*alaikum|good\s+(morning|afternoon|evening|day)|howdy|greetings|sup|hiya|yo|namaste|bonjour|hola|ciao)\s*[!.,]?$/i;

const _GREETING_REPLIES = [
  "Hello! 👋 I'm Nova, your AI assistant. How can I help you today? Feel free to ask about our services, projects, or team!",
  "Hi there! 😊 I'm Nova. What can I assist you with today?",
  "Hey! Welcome! I'm Nova, ready to help. Ask me anything about our services or projects!",
];

// Layer 1b — Off-topic detection (clearly non-business topics)
const _OFF_TOPIC_PATTERNS = [
  /\b(weather forecast|today's weather|sports (score|result)|stock price|crypto price|recipe for|how to cook|movie review|song lyrics|write me a (poem|story|essay)|celebrity gossip|personal relationship advice|dating advice|homework (help|assignment))\b/i,
  /^(what is \d+[\s+\-*/]\d+|calculate\b|solve for\b|what is the capital of\b|who won the\b|when was .+ born)\b/i,
];

const _OFF_TOPIC_REPLY = "I'm sorry, I can only assist with questions related to our business — services, projects, pricing, team, or how to get started. Is there something specific I can help you with?";

function _isGreeting(msg)  { return _GREETING_RE.test(msg.trim()); }
function _isOffTopic(msg)  { return _OFF_TOPIC_PATTERNS.some(re => re.test(msg)); }

// ─── FAQ keyword match ────────────────────────────────────────────────────────
// Tokenises the query and scores each FAQ entry by % of query words that appear
// in the FAQ title+content. Returns the best match if score ≥ 60%.
async function _matchFaq(query) {
  const words = query.toLowerCase().split(/\W+/).filter(w => w.length > 2);
  if (words.length === 0) return null;

  const faqs = await ChatbotKnowledge.find({ type: 'faq', isActive: true })
    .select('title content')
    .limit(200)
    .lean();

  if (!faqs.length) return null;

  let best = null, bestScore = 0;
  for (const faq of faqs) {
    const haystack = `${faq.title} ${faq.content}`.toLowerCase();
    const hits  = words.filter(w => haystack.includes(w)).length;
    const score = hits / words.length;
    if (score > bestScore) { bestScore = score; best = faq; }
  }

  return bestScore >= 0.6 ? best : null;
}

// ─── Smart model routing ──────────────────────────────────────────────────────
// Short queries with shallow history → cheap fast model (Haiku)
// Long / context-heavy queries → the model configured by admin (Sonnet/Opus)
function _selectModel(message, history, cfg) {
  const isSimple = message.length < 120 && history.length <= 4;
  return isSimple
    ? (cfg.simpleModel  || 'claude-haiku-4-5-20251001')
    : (cfg.activeModel  || 'claude-sonnet-4-6');
}

// ─── Session persist helper (non-blocking, called with .catch()) ──────────────
async function _persistSession(sessionId, req, userMsg, botMsg) {
  const userAgent = (req.headers['user-agent'] || '').substring(0, 300);
  const rawIp     = req.ip || '';
  const ip        = rawIp.replace(/\.\d+$/, '.0').replace(/:[^:]+$/, ':0');

  let session = await ChatbotSession.findOne({ sessionId });
  if (!session) {
    session = new ChatbotSession({
      sessionId,
      userId:   req.user?._id || null,
      metadata: { userAgent, ip },
    });
  }
  session.messages.push({ role: 'user',      content: userMsg });
  session.messages.push({ role: 'assistant', content: botMsg  });
  await session.save();
}

// ─── Usage tracking helper (non-blocking) ────────────────────────────────────
function _trackUsage({ model, inputTokens = 0, outputTokens = 0, endpoint = 'public', sessionId = null }) {
  const cost = calcCost(model, inputTokens, outputTokens);
  ChatbotUsage.create({ model, endpoint, inputTokens, outputTokens, cost, sessionId })
    .catch(e => console.error('[Chatbot] Usage track error:', e.message));
}

// ─── Encryption helpers ───────────────────────────────────────────────────────
const ALGO        = 'aes-256-gcm';
const ENC_KEY_HEX = process.env.ENCRYPTION_KEY || '';

/** Derive a 32-byte Buffer from the hex env var (or a random fallback in dev). */
function getEncKey() {
  if (ENC_KEY_HEX.length === 64) return Buffer.from(ENC_KEY_HEX, 'hex');
  // Fallback: derive from a default secret (NOT secure for production)
  return crypto.scryptSync('default-chatbot-secret', 'salt', 32);
}

function encryptKey(plaintext) {
  const key = getEncKey();
  const iv  = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Store iv + tag + ciphertext as a single hex string
  return iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted.toString('hex');
}

function decryptKey(stored) {
  try {
    const [ivHex, tagHex, encHex] = stored.split(':');
    const key       = getEncKey();
    const iv        = Buffer.from(ivHex, 'hex');
    const tag       = Buffer.from(tagHex, 'hex');
    const encrypted = Buffer.from(encHex, 'hex');
    const decipher  = crypto.createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
  } catch {
    throw new AppError('Failed to decrypt API key — ENCRYPTION_KEY may have changed', 500);
  }
}

// ─── Config helpers ───────────────────────────────────────────────────────────

/** Always returns the singleton config, creating it if absent. */
async function getOrCreateConfig() {
  let cfg = await ChatbotConfig.findOne({ singleton: 'main' });
  if (!cfg) cfg = await ChatbotConfig.create({ singleton: 'main' });
  return cfg;
}

/**
 * Return the decrypted active API key.
 * Searches by isActive flag only — provider matching is intentionally omitted
 * because the UI stores provider as 'anthropic' while activeProvider defaults
 * to 'claude', causing a mismatch.  Falls back to ANTHROPIC_API_KEY env var.
 */
function resolveApiKey(cfg) {
  const entry = cfg.apiKeys.find(k => k.isActive);
  if (entry) return decryptKey(entry.encryptedKey);
  // Fallback: use env var so the chatbot works without a DB-stored key
  return process.env.ANTHROPIC_API_KEY || null;
}

// ─── Knowledge retrieval ──────────────────────────────────────────────────────

/**
 * Returns up to `limit` active knowledge entries most relevant to `query`.
 * Uses MongoDB full-text search; falls back to returning top entries by date
 * if the query is empty.
 */
async function getRelevantKnowledge(query, limit = 5) {
  if (query && query.trim().length > 2) {
    try {
      const results = await ChatbotKnowledge.find(
        { isActive: true, $text: { $search: query } },
        { score: { $meta: 'textScore' }, title: 1, content: 1 }
      )
        .sort({ score: { $meta: 'textScore' } })
        .limit(limit)
        .lean();

      if (results.length) return results;
    } catch {
      // Text index might not be built yet — fall through to latest entries
    }
  }

  // Fallback: just return the most recently added active entries
  return ChatbotKnowledge.find({ isActive: true })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('title content')
    .lean();
}

/** Build a knowledge context string to inject into the system prompt. */
function buildKnowledgeContext(entries) {
  if (!entries.length) return '';
  const sections = entries.map(e => `### ${e.title}\n${e.content}`).join('\n\n');
  return `\n\n---\n## Business Knowledge Base\nUse the following information to answer user questions:\n\n${sections}\n---`;
}

// ─── Active public page links for navigation CTAs ─────────────────────────────

/**
 * Human-friendly CTA button labels for well-known paths.
 * Used when building the navigation section of the system prompt.
 */
const _PAGE_CTA_LABELS = {
  '/':          'Go to Homepage',
  '/services':  'View Our Services',
  '/portfolio': 'View Our Portfolio',
  '/contact':   'Get in Touch',
  '/our-team':  'Meet Our Team',
  '/careers':   'See Open Positions',
  '/privacy':   'Read Privacy Policy',
  '/terms':     'Read Terms of Service',
  '/cookies':   'Cookie Preferences',
  '/login':     'Login to Dashboard',
  '/signup':    'Create an Account',
};

/**
 * Pages that always exist (not tracked in PageStatus).
 * These are static/auth pages that the admin cannot disable via Page Manager.
 */
const _ALWAYS_ON_PAGES = [
  { path: '/login',   label: 'Login' },
  { path: '/signup',  label: 'Sign Up' },
  { path: '/privacy', label: 'Privacy Policy' },
  { path: '/terms',   label: 'Terms of Service' },
  { path: '/cookies', label: 'Cookie Settings' },
];

/**
 * Fetches active, visible public pages from the DB and merges with always-on
 * pages to build the full list of paths the chatbot may link to.
 * Pages with status !== 'active' or isHidden === true are excluded.
 */
async function getActivePublicNavLinks() {
  const dbPages = await PageStatus.find({
    category: 'public',
    status:   'active',
    isHidden: { $ne: true },
  }).select('path label').lean();

  // Combine DB pages + always-on pages (deduplicate by path)
  const seen = new Set(dbPages.map(p => p.path));
  const combined = [
    ...dbPages,
    ..._ALWAYS_ON_PAGES.filter(p => !seen.has(p.path)),
  ];

  return combined.map(p => ({
    path:     p.path,
    ctaLabel: _PAGE_CTA_LABELS[p.path] || p.label,
  }));
}

// ─── Public: GET /config/public ──────────────────────────────────────────────

export const getPublicConfig = asyncHandler(async (req, res) => {
  const cfg = await getOrCreateConfig();
  res.json({
    success: true,
    data: {
      botName:        cfg.botName,
      welcomeMessage: cfg.welcomeMessage,
      isEnabled:      cfg.isEnabled,
    },
  });
});

// ─── Public: POST /chat ───────────────────────────────────────────────────────

/**
 * Cost-optimised chat endpoint — layered decision flow:
 *
 *   Rate limit → Greeting → Off-topic → FAQ match → Cache → AI (last resort)
 *
 * SSE events emitted on all code paths:
 *   data: {"type":"delta","text":"..."}\n\n
 *   data: {"type":"done"}\n\n
 *   data: {"type":"error","message":"..."}\n\n
 */
export const chat = asyncHandler(async (req, res) => {
  const { message, sessionId, history = [] } = req.body;

  if (!message || typeof message !== 'string' || !message.trim()) {
    throw new AppError('message is required', 400);
  }
  if (!sessionId || typeof sessionId !== 'string') {
    throw new AppError('sessionId is required', 400);
  }

  // ── Rate limiting ─────────────────────────────────────────────────────────
  const rawIp = req.ip || '0.0.0.0';
  const ipKey = rawIp.replace(/\.\d+$/, '.0').replace(/:[^:]+$/, ':0');
  if (_isRateLimited(ipKey)) {
    throw new AppError('Too many messages. Please wait a moment before trying again.', 429);
  }

  const cfg = await getOrCreateConfig();
  if (!cfg.isEnabled) throw new AppError('Chatbot is currently disabled', 503);

  const userMsg  = message.trim();
  const cacheKey = _cacheKey(userMsg);

  // ── SSE setup (all code paths share this) ─────────────────────────────────
  res.setHeader('Content-Type',      'text/event-stream');
  res.setHeader('Cache-Control',     'no-cache');
  res.setHeader('Connection',        'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
    if (res.flush) res.flush();
  };

  // Sends a complete instant reply as SSE (no AI call needed)
  const sendInstant = (text) => {
    sendEvent({ type: 'delta', text });
    sendEvent({ type: 'done' });
    res.end();
  };

  // ── LAYER 1: Greeting detection (zero cost) ───────────────────────────────
  if (_isGreeting(userMsg)) {
    const reply = _GREETING_REPLIES[Math.floor(Math.random() * _GREETING_REPLIES.length)];
    sendInstant(reply);
    return;
  }

  // ── LAYER 2: Off-topic filter (zero cost) ────────────────────────────────
  if (_isOffTopic(userMsg)) {
    sendInstant(_OFF_TOPIC_REPLY);
    return;
  }

  // ── LAYER 3: FAQ keyword match (DB read, no API call) ────────────────────
  const faqHit = await _matchFaq(userMsg);
  if (faqHit) {
    sendInstant(faqHit.content);
    _persistSession(sessionId, req, userMsg, faqHit.content)
      .catch(e => console.error('[Chatbot] Session save error:', e.message));
    return;
  }

  // ── LAYER 4: In-memory response cache (zero cost) ─────────────────────────
  const cached = _cacheGet(cacheKey);
  if (cached) {
    sendInstant(cached);
    _persistSession(sessionId, req, userMsg, cached)
      .catch(e => console.error('[Chatbot] Session save error:', e.message));
    return;
  }

  // ── LAYER 5: AI API call — last resort only ───────────────────────────────
  const apiKey = resolveApiKey(cfg);
  if (!apiKey) throw new AppError('No active API key configured for the chatbot', 503);

  // Retrieve knowledge, portfolio projects, and live page statuses in parallel
  const [knowledge, publicProjects, activeNavLinks] = await Promise.all([
    getRelevantKnowledge(userMsg),
    AdminProject.find({ isPublic: true, isArchived: false })
      .select('_id projectTitle category')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean(),
    getActivePublicNavLinks(),
  ]);

  const knowledgeContext = buildKnowledgeContext(knowledge);

  // Build navigation CTA list — only pages that are currently active on the site
  const navLines = activeNavLinks.length
    ? activeNavLinks
        .map(p => `- [CTA:${p.path}|${p.ctaLabel}]`)
        .join('\n')
    : '- (No active public pages found)';

  // Also check if portfolio page is active before including individual project links
  const portfolioActive = activeNavLinks.some(p => p.path === '/portfolio');
  const projectLines = portfolioActive && publicProjects.length
    ? publicProjects
        .map(p => `- ${p.projectTitle} (${p.category}): [CTA:/portfolio/${p._id}|View ${p.projectTitle}]`)
        .join('\n')
    : portfolioActive
      ? '- (No public portfolio projects yet)'
      : '- (Portfolio page is currently unavailable)';

  const toneInstruction = TONE_INSTRUCTIONS[cfg.tone || 'professional'];

  const systemPrompt =
    cfg.systemPrompt +
    // Response length control — reduces token usage
    '\n\nIMPORTANT: Keep your answer concise (2–4 sentences) unless the user explicitly asks for more detail.' +
    `\n\n## Tone & Communication Style\n${toneInstruction}` +
    (cfg.businessContext ? `\n\n## About the Business\n${cfg.businessContext}` : '') +
    `\n\n## Navigation Links — Page References
When your answer mentions or is directly relevant to a page, append a CTA marker using EXACTLY this syntax on its own line:

[CTA:/path|Button Label]

IMPORTANT: Only use paths from the list below. These are the pages CURRENTLY ACTIVE on the website.
Do NOT link to any path not listed here — those pages may be under maintenance or not yet available.

Currently active pages:
${navLines}

## Portfolio Projects — Individual Links (only if portfolio is active above)
${projectLines}

Rules: max 3 CTAs per response · only when genuinely relevant · use ONLY the paths listed above · short action-oriented labels.` +
    knowledgeContext;

  // Smart model routing — simple queries use cheap Haiku, complex use configured model
  const model = _selectModel(userMsg, history, cfg);

  // Context optimisation — only last 5 turns (was 10) to reduce token count
  const trimmedHistory = history.slice(-5).map(m => ({
    role:    m.role === 'assistant' ? 'assistant' : 'user',
    content: String(m.content || ''),
  }));

  const messages = [
    ...trimmedHistory,
    { role: 'user', content: userMsg },
  ];

  let fullResponse = '';

  try {
    const client = new Anthropic({ apiKey });

    const stream = await client.messages.stream({
      model,
      max_tokens: cfg.maxTokens || 1024,
      system:     systemPrompt,
      messages,
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
        const text = event.delta.text || '';
        fullResponse += text;
        sendEvent({ type: 'delta', text });
      }
    }

    sendEvent({ type: 'done' });

    // Track token usage (non-blocking)
    try {
      const finalMsg = await stream.finalMessage();
      _trackUsage({
        model,
        inputTokens:  finalMsg.usage?.input_tokens  || 0,
        outputTokens: finalMsg.usage?.output_tokens || 0,
        endpoint: 'public',
        sessionId,
      });
    } catch (_) { /* non-critical */ }

    // Cache the response for future identical queries (skip very short or very long)
    if (fullResponse.length >= 20 && fullResponse.length <= 3000) {
      _cacheSet(cacheKey, fullResponse);
    }

  } catch (err) {
    console.error('[Chatbot] Anthropic error:', err.message);
    sendEvent({ type: 'error', message: 'AI service error. Please try again.' });
    res.end();
    return;
  }

  res.end();

  _persistSession(sessionId, req, userMsg, fullResponse)
    .catch(e => console.error('[Chatbot] Session save error:', e.message));
});

// ─── Shared SSE streaming helper for dashboard chatbots ──────────────────────

async function _streamDashboardChat({ req, res, sessionId, userMsg, history, systemPrompt, cfg, endpoint = 'user' }) {
  const rawIp = req.ip || '0.0.0.0';
  const ipKey = rawIp.replace(/\.\d+$/, '.0').replace(/:[^:]+$/, ':0');
  if (_isRateLimited(ipKey)) throw new AppError('Too many messages. Please wait a moment.', 429);

  const apiKey = resolveApiKey(cfg);
  if (!apiKey) throw new AppError('No active API key configured', 503);

  res.setHeader('Content-Type',      'text/event-stream');
  res.setHeader('Cache-Control',     'no-cache');
  res.setHeader('Connection',        'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
    if (res.flush) res.flush();
  };

  // Dashboard chats skip greeting/off-topic/cache layers — context is always personal & specific
  const trimmedHistory = history.slice(-5).map(m => ({
    role:    m.role === 'assistant' ? 'assistant' : 'user',
    content: String(m.content || ''),
  }));

  const model = _selectModel(userMsg, history, cfg);
  let fullResponse = '';

  try {
    const client = new Anthropic({ apiKey });
    const stream = await client.messages.stream({
      model,
      max_tokens: cfg.maxTokens || 1024,
      system:     systemPrompt,
      messages:   [...trimmedHistory, { role: 'user', content: userMsg }],
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
        const text = event.delta.text || '';
        fullResponse += text;
        sendEvent({ type: 'delta', text });
      }
    }
    sendEvent({ type: 'done' });

    // Track token usage (non-blocking)
    try {
      const finalMsg = await stream.finalMessage();
      _trackUsage({
        model,
        inputTokens:  finalMsg.usage?.input_tokens  || 0,
        outputTokens: finalMsg.usage?.output_tokens || 0,
        endpoint,
        sessionId,
      });
    } catch (_) { /* non-critical */ }

  } catch (err) {
    console.error('[Chatbot] Anthropic error:', err.message);
    sendEvent({ type: 'error', message: 'AI service error. Please try again.' });
    res.end();
    return;
  }

  res.end();
  _persistSession(sessionId, req, userMsg, fullResponse)
    .catch(e => console.error('[Chatbot] Session save error:', e.message));
}

// ─── Authenticated: POST /user-chat ──────────────────────────────────────────
/**
 * User-dashboard chatbot: has access to the user's own projects, applied jobs,
 * and profile. Context is built fresh per-request — always up to date.
 */
export const userChat = asyncHandler(async (req, res) => {
  if (!req.user) throw new AppError('Authentication required', 401);

  const { message, sessionId, history = [] } = req.body;
  if (!message?.trim() || !sessionId) throw new AppError('message and sessionId required', 400);

  const cfg = await getOrCreateConfig();
  if (!cfg.isUserChatEnabled) throw new AppError('User assistant is currently disabled', 503);

  const userId = req.user._id;
  const userMsg = message.trim();

  // ── Fetch user's live data in parallel ────────────────────────────────────
  const [userProjects, userApplications, userProfile] = await Promise.all([
    Project.find({ requestedBy: userId, isArchived: { $ne: true } })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean(),
    JobApplication.find({ email: req.user.email })
      .populate('job', 'jobTitle department')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),
    User.findById(userId).select('name email role createdAt teamProfile').lean(),
  ]);

  // ── Build personal context block ──────────────────────────────────────────
  const projectsText = userProjects.length
    ? userProjects.map(p => {
        const paid    = p.paidAmount || 0;
        const total   = p.totalCost  || 0;
        const due     = total - paid;
        const dlText  = p.deadline ? new Date(p.deadline).toLocaleDateString() : 'No deadline';
        return (
          `• [${p.status.toUpperCase()}] ${p.projectName} (${p.projectType || 'General'})\n` +
          `  Progress: ${p.progress || 0}% · Deadline: ${dlText}\n` +
          `  Budget: $${total} · Paid: $${paid} · Due: $${due}\n` +
          (p.projectDetails ? `  Details: ${p.projectDetails.slice(0, 200)}\n` : '')
        );
      }).join('\n')
    : 'No projects yet.';

  const appsText = userApplications.length
    ? userApplications.map(a => {
        const job = a.job;
        return (
          `• ${job?.jobTitle || 'Unknown Role'} (${job?.department || ''}) — Status: ${a.status}\n` +
          (a.adminNotes ? `  Admin Notes: ${a.adminNotes}\n` : '')
        );
      }).join('\n')
    : 'No job applications yet.';

  const personalContext =
    `\n\n## This User's Personal Data\n` +
    `User: ${userProfile?.name || req.user.name} (${userProfile?.email || req.user.email})\n` +
    `Member since: ${userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : 'N/A'}\n\n` +
    `### Active Projects (${userProjects.length}):\n${projectsText}\n\n` +
    `### Job Applications (${userApplications.length}):\n${appsText}\n\n` +
    `IMPORTANT: Only answer based on this user's own data shown above. ` +
    `Be specific and reference actual project names, statuses, and amounts when relevant.`;

  const toneInstruction = TONE_INSTRUCTIONS[cfg.tone || 'professional'];
  const systemPrompt =
    (cfg.userChatSystemPrompt || '') +
    `\n\n## Tone\n${toneInstruction}` +
    `\n\nKeep answers concise (2–4 sentences) unless the user asks for more detail.` +
    personalContext;

  await _streamDashboardChat({ req, res, sessionId, userMsg, history, systemPrompt, cfg, endpoint: 'user' });
});

// ─── Authenticated: POST /team-chat ──────────────────────────────────────────
/**
 * Team-dashboard chatbot: has access to the team member's assigned client
 * projects and portfolio projects. Context built fresh per-request.
 */
export const teamChat = asyncHandler(async (req, res) => {
  if (!req.user) throw new AppError('Authentication required', 401);
  if (!['admin', 'team'].includes(req.user.role)) throw new AppError('Team access required', 403);

  const { message, sessionId, history = [] } = req.body;
  if (!message?.trim() || !sessionId) throw new AppError('message and sessionId required', 400);

  const cfg = await getOrCreateConfig();
  if (!cfg.isTeamChatEnabled) throw new AppError('Team assistant is currently disabled', 503);

  const userId  = req.user._id;
  const userMsg = message.trim();

  // ── Fetch team member's live data in parallel ─────────────────────────────
  const [clientProjects, portfolioProjects] = await Promise.all([
    Project.find({ assignedTeam: userId, isArchived: { $ne: true } })
      .populate('requestedBy', 'name email')
      .sort({ updatedAt: -1 })
      .limit(15)
      .lean(),
    AdminProject.find({ 'teamMembers.memberId': userId, isArchived: false })
      .sort({ createdAt: -1 })
      .limit(15)
      .lean(),
  ]);

  // ── Build team context block ──────────────────────────────────────────────
  const clientProjText = clientProjects.length
    ? clientProjects.map(p => {
        const client = p.requestedBy;
        const dlText = p.deadline ? new Date(p.deadline).toLocaleDateString() : 'No deadline';
        return (
          `• [${p.status.toUpperCase()}] ${p.projectName} (${p.projectType || 'General'})\n` +
          `  Client: ${client?.name || 'N/A'} · Progress: ${p.progress || 0}% · Deadline: ${dlText}\n` +
          (p.projectDetails ? `  Brief: ${p.projectDetails.slice(0, 150)}\n` : '')
        );
      }).join('\n')
    : 'No client projects assigned.';

  const portfolioText = portfolioProjects.length
    ? portfolioProjects.map(p => {
        const myRole = p.teamMembers.find(m => m.memberId?.toString() === userId.toString());
        return (
          `• [${p.status}] ${p.projectTitle} (${p.category})\n` +
          `  Role: ${myRole?.role || 'Team Member'} · Completion: ${p.completionPercentage || 0}%\n` +
          (p.techStack?.length ? `  Tech: ${p.techStack.join(', ')}\n` : '')
        );
      }).join('\n')
    : 'No portfolio projects assigned.';

  const teamContext =
    `\n\n## This Team Member's Work Context\n` +
    `Team Member: ${req.user.name} (${req.user.email}) — Role: ${req.user.role}\n\n` +
    `### Assigned Client Projects (${clientProjects.length}):\n${clientProjText}\n\n` +
    `### Portfolio Projects Involved In (${portfolioProjects.length}):\n${portfolioText}\n\n` +
    `IMPORTANT: Reference actual project names and data when answering. ` +
    `Help with project management, technical decisions, deadline tracking, and client communication.`;

  const toneInstruction = TONE_INSTRUCTIONS[cfg.tone || 'professional'];
  const systemPrompt =
    (cfg.teamChatSystemPrompt || '') +
    `\n\n## Tone\n${toneInstruction}` +
    `\n\nKeep answers concise (2–4 sentences) unless more detail is requested.` +
    teamContext;

  await _streamDashboardChat({ req, res, sessionId, userMsg, history, systemPrompt, cfg, endpoint: 'team' });
});

// ─── Admin: Stats ─────────────────────────────────────────────────────────────

export const getStats = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') throw new AppError('Admin only', 403);

  const [totalSessions, totalKnowledge, resolvedSessions, recentActivity] = await Promise.all([
    ChatbotSession.countDocuments(),
    ChatbotKnowledge.countDocuments({ isActive: true }),
    ChatbotSession.countDocuments({ isResolved: true }),
    ChatbotSession.find()
      .sort({ lastActivity: -1 })
      .limit(5)
      .select('sessionId totalMessages lastActivity isResolved userId')
      .lean(),
  ]);

  // Total messages across all sessions
  const msgAgg = await ChatbotSession.aggregate([
    { $group: { _id: null, total: { $sum: '$totalMessages' } } },
  ]);
  const totalMessages = msgAgg[0]?.total || 0;

  // Sessions per day for the past 7 days
  const since = new Date();
  since.setDate(since.getDate() - 7);
  const dailyAgg = await ChatbotSession.aggregate([
    { $match: { createdAt: { $gte: since } } },
    { $group: {
      _id:   { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
      count: { $sum: 1 },
    }},
    { $sort: { _id: 1 } },
  ]);

  successResponse(res, 'Stats retrieved', {
    totalSessions,
    totalMessages,
    totalKnowledge,
    resolvedSessions,
    recentActivity,
    dailyActivity: dailyAgg,
  });
});

// ─── Public: Get history by sessionId ─────────────────────────────────────────
// The sessionId UUID acts as the bearer key — anyone with it can read the session.

export const getHistoryBySessionId = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  if (!sessionId) throw new AppError('sessionId required', 400);

  const session = await ChatbotSession.findOne({ sessionId })
    .select('messages')
    .lean();

  if (!session) return successResponse(res, 'No history', { messages: [] });

  // Return last 100 messages (oldest first)
  const messages = (session.messages || []).slice(-100);
  successResponse(res, 'History retrieved', { messages });
});

// ─── Admin: Usage & Cost Stats ────────────────────────────────────────────────

export const getUsageStats = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') throw new AppError('Admin only', 403);

  const now   = new Date();
  const startOfToday = new Date(now); startOfToday.setHours(0,0,0,0);
  const startOfWeek  = new Date(now); startOfWeek.setDate(now.getDate() - 6); startOfWeek.setHours(0,0,0,0);
  const startOfMonth = new Date(now); startOfMonth.setDate(1); startOfMonth.setHours(0,0,0,0);
  const start30d     = new Date(now); start30d.setDate(now.getDate() - 29); start30d.setHours(0,0,0,0);

  const [allTime, today, week, month, byModel, byEndpoint, daily] = await Promise.all([
    // All-time totals
    ChatbotUsage.aggregate([
      { $group: {
        _id: null,
        totalCost:         { $sum: '$cost' },
        totalInputTokens:  { $sum: '$inputTokens' },
        totalOutputTokens: { $sum: '$outputTokens' },
        totalRequests:     { $sum: 1 },
      }},
    ]),

    // Today
    ChatbotUsage.aggregate([
      { $match: { timestamp: { $gte: startOfToday } } },
      { $group: { _id: null, cost: { $sum: '$cost' }, requests: { $sum: 1 } } },
    ]),

    // This week (last 7 days)
    ChatbotUsage.aggregate([
      { $match: { timestamp: { $gte: startOfWeek } } },
      { $group: { _id: null, cost: { $sum: '$cost' }, requests: { $sum: 1 } } },
    ]),

    // This month
    ChatbotUsage.aggregate([
      { $match: { timestamp: { $gte: startOfMonth } } },
      { $group: { _id: null, cost: { $sum: '$cost' }, requests: { $sum: 1 } } },
    ]),

    // Breakdown by model (all time)
    ChatbotUsage.aggregate([
      { $group: {
        _id:          '$model',
        totalCost:    { $sum: '$cost' },
        requests:     { $sum: 1 },
        inputTokens:  { $sum: '$inputTokens' },
        outputTokens: { $sum: '$outputTokens' },
      }},
      { $sort: { totalCost: -1 } },
    ]),

    // Breakdown by endpoint (all time)
    ChatbotUsage.aggregate([
      { $group: {
        _id:       '$endpoint',
        totalCost: { $sum: '$cost' },
        requests:  { $sum: 1 },
        inputTokens:  { $sum: '$inputTokens' },
        outputTokens: { $sum: '$outputTokens' },
      }},
      { $sort: { totalCost: -1 } },
    ]),

    // Daily cost last 30 days
    ChatbotUsage.aggregate([
      { $match: { timestamp: { $gte: start30d } } },
      { $group: {
        _id:      { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
        cost:     { $sum: '$cost' },
        requests: { $sum: 1 },
        inputTokens:  { $sum: '$inputTokens' },
        outputTokens: { $sum: '$outputTokens' },
      }},
      { $sort: { _id: 1 } },
    ]),
  ]);

  successResponse(res, 'Usage stats retrieved', {
    summary: {
      allTime:    { cost: allTime[0]?.totalCost || 0, inputTokens: allTime[0]?.totalInputTokens || 0, outputTokens: allTime[0]?.totalOutputTokens || 0, requests: allTime[0]?.totalRequests || 0 },
      today:      { cost: today[0]?.cost   || 0, requests: today[0]?.requests   || 0 },
      thisWeek:   { cost: week[0]?.cost    || 0, requests: week[0]?.requests    || 0 },
      thisMonth:  { cost: month[0]?.cost   || 0, requests: month[0]?.requests   || 0 },
    },
    byModel:   byModel.map(r => ({ model: r._id, totalCost: r.totalCost, requests: r.requests, inputTokens: r.inputTokens, outputTokens: r.outputTokens })),
    byEndpoint: byEndpoint.map(r => ({ endpoint: r._id, totalCost: r.totalCost, requests: r.requests, inputTokens: r.inputTokens, outputTokens: r.outputTokens })),
    daily:     daily.map(r => ({ date: r._id, cost: r.cost, requests: r.requests, inputTokens: r.inputTokens, outputTokens: r.outputTokens })),
  });
});

// ─── Admin: Sessions ──────────────────────────────────────────────────────────

export const getSessions = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') throw new AppError('Admin only', 403);

  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 20);
  const skip  = (page - 1) * limit;

  const filter = {};
  if (req.query.resolved === 'true')  filter.isResolved = true;
  if (req.query.resolved === 'false') filter.isResolved = false;

  const [sessions, total] = await Promise.all([
    ChatbotSession.find(filter)
      .sort({ lastActivity: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name email')
      .lean(),
    ChatbotSession.countDocuments(filter),
  ]);

  successResponse(res, 'Sessions retrieved', {
    sessions,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  });
});

export const getSession = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') throw new AppError('Admin only', 403);

  const session = await ChatbotSession.findById(req.params.id)
    .populate('userId', 'name email')
    .lean();

  if (!session) throw new AppError('Session not found', 404);
  successResponse(res, 'Session retrieved', session);
});

export const deleteSession = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') throw new AppError('Admin only', 403);

  const session = await ChatbotSession.findByIdAndDelete(req.params.id);
  if (!session) throw new AppError('Session not found', 404);
  successResponse(res, 'Session deleted');
});

export const resolveSession = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') throw new AppError('Admin only', 403);

  const session = await ChatbotSession.findByIdAndUpdate(
    req.params.id,
    { isResolved: true },
    { new: true }
  );
  if (!session) throw new AppError('Session not found', 404);
  successResponse(res, 'Session resolved', session);
});

// ─── Admin: Config ────────────────────────────────────────────────────────────

export const getConfig = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') throw new AppError('Admin only', 403);

  const cfg = await getOrCreateConfig();

  // Strip encrypted keys — only return metadata (provider, label, isActive)
  const safeKeys = cfg.apiKeys.map(k => ({
    _id:       k._id,
    provider:  k.provider,
    label:     k.label,
    isActive:  k.isActive,
    addedAt:   k.addedAt,
    // Show last 4 chars of decrypted key for identification
    keyHint:   (() => {
      try { const d = decryptKey(k.encryptedKey); return '***' + d.slice(-4); }
      catch { return '***'; }
    })(),
  }));

  successResponse(res, 'Config retrieved', {
    activeProvider:       cfg.activeProvider,
    activeModel:          cfg.activeModel,
    simpleModel:          cfg.simpleModel,
    availableModels:      ANTHROPIC_MODELS,
    systemPrompt:         cfg.systemPrompt,
    businessContext:       cfg.businessContext,
    botName:               cfg.botName,
    welcomeMessage:        cfg.welcomeMessage,
    isEnabled:             cfg.isEnabled,
    isUserChatEnabled:     cfg.isUserChatEnabled,
    isTeamChatEnabled:     cfg.isTeamChatEnabled,
    userChatSystemPrompt:   cfg.userChatSystemPrompt,
    teamChatSystemPrompt:   cfg.teamChatSystemPrompt,
    userChatQuickPrompts:   cfg.userChatQuickPrompts  || [],
    teamChatQuickPrompts:   cfg.teamChatQuickPrompts  || [],
    tone:                   cfg.tone || 'professional',
    maxTokens:             cfg.maxTokens,
    temperature:           cfg.temperature,
    maxMessagesPerHour:    cfg.maxMessagesPerHour,
    maxMessagesPerDay:     cfg.maxMessagesPerDay,
    apiKeys:               safeKeys,
  });
});

export const updateConfig = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') throw new AppError('Admin only', 403);

  const allowed = [
    'activeProvider', 'activeModel', 'simpleModel', 'systemPrompt', 'businessContext',
    'botName', 'welcomeMessage', 'isEnabled', 'isUserChatEnabled', 'isTeamChatEnabled',
    'userChatSystemPrompt', 'teamChatSystemPrompt',
    'userChatQuickPrompts', 'teamChatQuickPrompts', 'tone',
    'maxTokens', 'temperature', 'maxMessagesPerHour', 'maxMessagesPerDay',
  ];

  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  const cfg = await ChatbotConfig.findOneAndUpdate(
    { singleton: 'main' },
    { $set: updates },
    { new: true, upsert: true }
  );

  successResponse(res, 'Config updated', { isEnabled: cfg.isEnabled });
});

// ─── Admin: API Keys ──────────────────────────────────────────────────────────

export const addApiKey = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') throw new AppError('Admin only', 403);

  const { provider, apiKey, label, setActive } = req.body;

  if (!provider || !apiKey) {
    throw new AppError('provider and apiKey are required', 400);
  }

  const encryptedKey = encryptKey(apiKey);

  const cfg = await getOrCreateConfig();

  // If setActive, deactivate all other keys and sync activeProvider
  if (setActive) {
    cfg.apiKeys.forEach(k => { k.isActive = false; });
    // Keep activeProvider in sync so display reflects the active key's service
    cfg.activeProvider = provider;
  }

  cfg.apiKeys.push({ provider, encryptedKey, label: label || '', isActive: !!setActive });
  await cfg.save();

  successResponse(res, 'API key added', {}, 201);
});

export const removeApiKey = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') throw new AppError('Admin only', 403);

  const cfg = await getOrCreateConfig();
  const before = cfg.apiKeys.length;
  cfg.apiKeys = cfg.apiKeys.filter(k => k._id.toString() !== req.params.keyId);

  if (cfg.apiKeys.length === before) throw new AppError('Key not found', 404);
  await cfg.save();

  successResponse(res, 'API key removed');
});

export const activateApiKey = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') throw new AppError('Admin only', 403);

  const cfg = await getOrCreateConfig();
  let found = false;

  cfg.apiKeys.forEach(k => {
    if (k._id.toString() === req.params.keyId) {
      k.isActive = true;
      found = true;
    } else {
      k.isActive = false;
    }
  });

  if (!found) throw new AppError('Key not found', 404);
  await cfg.save();

  successResponse(res, 'API key activated');
});

// ─── Admin: Knowledge Base ────────────────────────────────────────────────────

export const getKnowledge = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') throw new AppError('Admin only', 403);

  const page   = Math.max(1, parseInt(req.query.page)  || 1);
  const limit  = Math.min(100, parseInt(req.query.limit) || 20);
  const skip   = (page - 1) * limit;
  const filter = req.query.active === 'false' ? {} : { isActive: true };

  if (req.query.type) filter.type = req.query.type;
  if (req.query.tag)  filter.tags = req.query.tag;

  const [entries, total] = await Promise.all([
    ChatbotKnowledge.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'name')
      .lean(),
    ChatbotKnowledge.countDocuments(filter),
  ]);

  successResponse(res, 'Knowledge entries retrieved', {
    entries,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  });
});

export const createKnowledge = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') throw new AppError('Admin only', 403);

  const { title, content, type, fileUrl, fileName, tags } = req.body;

  if (!title || !content) throw new AppError('title and content are required', 400);

  const entry = await ChatbotKnowledge.create({
    title,
    content,
    type:      type     || 'text',
    fileUrl:   fileUrl  || '',
    fileName:  fileName || '',
    tags:      Array.isArray(tags) ? tags : [],
    isActive:  true,
    createdBy: req.user._id,
  });

  successResponse(res, 'Knowledge entry created', entry, 201);
});

export const updateKnowledge = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') throw new AppError('Admin only', 403);

  const allowed = ['title', 'content', 'type', 'fileUrl', 'fileName', 'tags', 'isActive'];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  const entry = await ChatbotKnowledge.findByIdAndUpdate(
    req.params.id, { $set: updates }, { new: true, runValidators: true }
  );

  if (!entry) throw new AppError('Entry not found', 404);
  successResponse(res, 'Knowledge entry updated', entry);
});

export const deleteKnowledge = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') throw new AppError('Admin only', 403);

  const entry = await ChatbotKnowledge.findByIdAndDelete(req.params.id);
  if (!entry) throw new AppError('Entry not found', 404);
  successResponse(res, 'Knowledge entry deleted');
});

/** Upload a file to Cloudinary and create a knowledge entry from it. */
export const uploadKnowledgeFile = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') throw new AppError('Admin only', 403);

  if (!req.file) throw new AppError('No file uploaded', 400);

  const result   = await uploadFile(req.file.path, 'chatbot-knowledge');
  const title    = req.body.title    || req.file.originalname;
  const content  = req.body.content  || `File: ${req.file.originalname}. [Content from uploaded file — add a description or paste the extracted text here.]`;

  const entry = await ChatbotKnowledge.create({
    title,
    content,
    type:      'file',
    fileUrl:   result.secure_url,
    fileName:  req.file.originalname,
    tags:      req.body.tags ? req.body.tags.split(',').map(t => t.trim()) : [],
    isActive:  true,
    createdBy: req.user._id,
  });

  successResponse(res, 'File uploaded and knowledge entry created', entry, 201);
});

// ─── HTML text helpers ────────────────────────────────────────────────────────

function extractTitleFromHtml(html) {
  const m = html.match(/<title[^>]*>([^<]{1,200})<\/title>/i);
  return m ? m[1].trim().replace(/\s+/g, ' ') : null;
}

/**
 * Strip HTML tags and convert a fetched page into readable plain text.
 * Designed to work without any external dependencies.
 */
function htmlToText(html) {
  return html
    // Drop entire <head> block (meta tags, scripts in head, etc.)
    .replace(/<head[\s\S]*?<\/head>/gi, '')
    // Drop scripts and styles completely
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    // Drop SVG and noscript blocks
    .replace(/<svg[\s\S]*?<\/svg>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    // Add line-breaks for block-level / structural elements
    .replace(/<\/?(p|div|h[1-6]|li|dt|dd|tr|blockquote|pre|section|article|main|header|footer|nav|aside)[^>]*>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    // Drop all remaining tags
    .replace(/<[^>]+>/g, '')
    // Decode common HTML entities
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&mdash;/gi, '—')
    .replace(/&ndash;/gi, '–')
    .replace(/&#\d+;/g, '')
    // Collapse excess whitespace
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ─── Admin: Crawl website page ────────────────────────────────────────────────

/**
 * POST /api/v1/chatbot/knowledge/crawl
 * Fetch a public web page, extract its text, and save it as a knowledge entry.
 */
export const crawlUrl = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') throw new AppError('Admin only', 403);

  const { url, title, tags } = req.body;
  if (!url || typeof url !== 'string') throw new AppError('url is required', 400);

  // Validate URL
  let parsed;
  try {
    parsed = new URL(url.trim());
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('bad protocol');
    }
  } catch {
    throw new AppError('Invalid URL — must start with http:// or https://', 400);
  }

  // Fetch with a 20-second timeout
  let html;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    const response = await fetch(parsed.href, {
      signal:  controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NovaCrawler/1.0)',
        'Accept':     'text/html,application/xhtml+xml,*/*;q=0.8',
      },
    });
    clearTimeout(timer);

    const ct = response.headers.get('content-type') || '';
    if (!response.ok) {
      throw new AppError(`Page returned HTTP ${response.status}`, 400);
    }
    if (!ct.includes('text/html') && !ct.includes('text/plain')) {
      throw new AppError('URL does not point to an HTML or text page', 400);
    }
    html = await response.text();
  } catch (err) {
    if (err instanceof AppError) throw err;
    if (err.name === 'AbortError') throw new AppError('Page took too long to load (>20 s)', 504);
    throw new AppError(`Could not fetch page: ${err.message}`, 400);
  }

  // Extract and truncate text (stay within MongoDB + token budget)
  const raw  = htmlToText(html);
  if (raw.length < 30) {
    throw new AppError('Could not extract meaningful text from this page', 400);
  }
  const MAX_CHARS = 10000;
  const content   = raw.length > MAX_CHARS
    ? raw.slice(0, MAX_CHARS) + '\n\n[Content truncated — page too long]'
    : raw;

  const pageTitle = (title && title.trim())
    || extractTitleFromHtml(html)
    || (parsed.hostname + parsed.pathname);

  const entry = await ChatbotKnowledge.create({
    title:     pageTitle.slice(0, 200),
    content,
    type:      'url',
    sourceUrl: parsed.href,
    fileUrl:   parsed.href,   // reuse so existing UI "view" links work
    tags:      Array.isArray(tags) ? tags : (typeof tags === 'string' ? tags.split(',').map(t => t.trim()).filter(Boolean) : []),
    isActive:  true,
    createdBy: req.user._id,
  });

  successResponse(res, 'Page crawled and added to knowledge base', entry, 201);
});

// ─── Database sync helpers ────────────────────────────────────────────────────

/**
 * Upsert a knowledge entry by its unique `syncKey` tag.
 * If an entry with that tag already exists it is updated; otherwise created.
 */
async function upsertKnowledgeEntry({ syncKey, title, content, type, tags, createdBy }) {
  const allTags = ['auto-sync', syncKey, ...tags];
  const existing = await ChatbotKnowledge.findOne({ tags: syncKey });
  if (existing) {
    existing.title   = title;
    existing.content = content.slice(0, 20000);
    existing.tags    = allTags;
    await existing.save();
    return { action: 'updated', title };
  }
  await ChatbotKnowledge.create({
    title, type,
    content: content.slice(0, 20000),
    tags:    allTags,
    isActive: true,
    createdBy,
  });
  return { action: 'created', title };
}

// ─── Admin: Sync knowledge from database ─────────────────────────────────────

/**
 * POST /api/v1/chatbot/knowledge/sync
 * Auto-generates / updates knowledge entries from live DB data:
 *   Services, Portfolio Projects, CMS (contact/testimonials/why-us),
 *   Active Jobs, Approved Reviews, Team Members.
 */
export const syncFromDatabase = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') throw new AppError('Admin only', 403);

  const results = [];
  const errors  = [];
  const adminId = req.user._id;

  const tryUpsert = async (label, opts) => {
    try {
      results.push(await upsertKnowledgeEntry(opts));
    } catch (e) {
      errors.push({ section: label, error: e.message });
    }
  };

  // ── 1. Services ────────────────────────────────────────────────────────────
  try {
    const services = await Services.find({ isActive: true }).lean();
    for (const svc of services) {
      const pricingText = (svc.pricingPlans || [])
        .map(p => {
          const amt = p.price?.amount;
          const priceStr = amt ? `$${amt}${p.price.currency ? ' ' + p.price.currency : ''}` : 'Contact for pricing';
          return `  • ${p.name || 'Plan'}: ${priceStr} — ${p.description || ''}`;
        })
        .join('\n');
      const faqText = (svc.faqs || [])
        .map(f => `  Q: ${f.question}\n  A: ${f.answer}`)
        .join('\n');
      const featuresText = (svc.features || []).map(f => `  • ${f.title || String(f)}`).join('\n');

      const content =
        `Service: ${svc.title}\n` +
        (svc.subtitle        ? `Tagline: ${svc.subtitle}\n`          : '') +
        (svc.description     ? `Description: ${svc.description}\n`   : '') +
        (svc.category        ? `Category: ${svc.category}\n`         : '') +
        (svc.deliveryTime    ? `Delivery Time: ${svc.deliveryTime}\n` : '') +
        (featuresText        ? `\nKey Features:\n${featuresText}\n`   : '') +
        (pricingText         ? `\nPricing Plans:\n${pricingText}\n`   : '') +
        (faqText             ? `\nFrequently Asked Questions:\n${faqText}\n` : '');

      await tryUpsert(`service:${svc.title}`, {
        syncKey:   `sync:service:${svc.slug || svc._id}`,
        title:     `Service — ${svc.title}`,
        content,
        type:      'auto',
        tags:      ['service', svc.category || ''].filter(Boolean),
        createdBy: adminId,
      });
    }
  } catch (e) { errors.push({ section: 'services-fetch', error: e.message }); }

  // ── 2. Portfolio Projects (public only) ────────────────────────────────────
  try {
    const projects = await AdminProject.find({ isPublic: true, isArchived: false }).lean();
    for (const proj of projects) {
      const content =
        `Portfolio Project: ${proj.projectTitle}\n` +
        (proj.clientName         ? `Client: ${proj.clientName}\n`          : '') +
        (proj.category           ? `Category: ${proj.category}\n`          : '') +
        (proj.yourRole           ? `Our Role: ${proj.yourRole}\n`          : '') +
        (proj.projectDescription ? `Description: ${proj.projectDescription}\n` : '') +
        (proj.techStack?.length  ? `Technologies: ${proj.techStack.join(', ')}\n` : '') +
        (proj.tags?.length       ? `Tags: ${proj.tags.join(', ')}\n`       : '') +
        (proj.clientFeedback?.comment ? `\nClient Feedback: "${proj.clientFeedback.comment}" (${proj.clientFeedback.rating}/5 stars)\n` : '');

      await tryUpsert(`project:${proj.projectTitle}`, {
        syncKey:   `sync:project:${proj._id}`,
        title:     `Portfolio — ${proj.projectTitle}`,
        content,
        type:      'auto',
        tags:      ['portfolio', 'project', proj.category || ''].filter(Boolean),
        createdBy: adminId,
      });
    }
  } catch (e) { errors.push({ section: 'projects-fetch', error: e.message }); }

  // ── 3. CMS — Contact Info + Why Choose Us + Testimonials ──────────────────
  try {
    const cms = await CMS.findOne().lean();
    if (cms) {
      if (cms.contactInfo) {
        const ci = cms.contactInfo;
        const content =
          `Business Contact Information\n` +
          (ci.email         ? `Email: ${ci.email}\n`                : '') +
          (ci.phone         ? `Phone: ${ci.phone}\n`                : '') +
          (ci.address       ? `Address: ${ci.address}\n`            : '') +
          (ci.businessHours ? `Business Hours: ${ci.businessHours}\n` : '') +
          (cms.socialLinks?.linkedin  ? `LinkedIn: ${cms.socialLinks.linkedin}\n`  : '') +
          (cms.socialLinks?.twitter   ? `Twitter/X: ${cms.socialLinks.twitter}\n`  : '') +
          (cms.socialLinks?.instagram ? `Instagram: ${cms.socialLinks.instagram}\n` : '') +
          (cms.socialLinks?.github    ? `GitHub: ${cms.socialLinks.github}\n`       : '');
        await tryUpsert('cms:contact', {
          syncKey: 'sync:cms:contact', title: 'Contact Information',
          content, type: 'auto', tags: ['contact', 'location', 'hours'], createdBy: adminId,
        });
      }

      if (cms.whyChooseUs) {
        const wcu = cms.whyChooseUs;
        const points = (wcu.keyPoints || []).map(p => `  • ${p.title}: ${p.description || ''}`).join('\n');
        const content =
          `Why Choose Us\n` +
          (wcu.titleLine1   ? `${wcu.titleLine1} ${wcu.titleLine2Highlighted || ''}\n` : '') +
          (wcu.description  ? `${wcu.description}\n` : '') +
          (points           ? `\nKey Advantages:\n${points}` : '');
        await tryUpsert('cms:why-us', {
          syncKey: 'sync:cms:why-us', title: 'Why Choose Us',
          content, type: 'auto', tags: ['about', 'why-us', 'advantages'], createdBy: adminId,
        });
      }

      if (cms.testimonials?.length) {
        const testimonialText = cms.testimonials
          .slice(0, 10)
          .map(t => `"${t.quote || t.text || ''}" — ${t.name || t.author || 'Client'}${t.company ? `, ${t.company}` : ''}`)
          .join('\n\n');
        await tryUpsert('cms:testimonials', {
          syncKey: 'sync:cms:testimonials', title: 'Client Testimonials',
          content: `Client Testimonials & Reviews\n\n${testimonialText}`,
          type: 'auto', tags: ['testimonials', 'reviews', 'clients'], createdBy: adminId,
        });
      }
    }
  } catch (e) { errors.push({ section: 'cms-fetch', error: e.message }); }

  // ── 4. Active Job Postings ─────────────────────────────────────────────────
  try {
    const jobs = await Jobs.find({ status: 'Active' }).lean();
    if (jobs.length) {
      const jobsText = jobs.map(j => {
        const salary = j.salaryRange?.min
          ? `$${Math.round(j.salaryRange.min / 1000)}k–$${Math.round(j.salaryRange.max / 1000)}k`
          : 'Competitive';
        return `• ${j.jobTitle} (${j.department || 'General'}) — ${j.employmentType || ''}, ${j.workMode || ''}, ${salary}`;
      }).join('\n');
      await tryUpsert('jobs:active', {
        syncKey: 'sync:jobs:active', title: 'Current Job Openings',
        content: `We Are Hiring! Current Open Positions:\n\n${jobsText}\n\nVisit our Careers page to apply.`,
        type: 'auto', tags: ['jobs', 'hiring', 'careers'], createdBy: adminId,
      });
    }
  } catch (e) { errors.push({ section: 'jobs-fetch', error: e.message }); }

  // ── 5. Approved Reviews ────────────────────────────────────────────────────
  try {
    const reviews = await Reviews.find({ status: 'approved' }).populate('client', 'name').lean();
    if (reviews.length) {
      const reviewsText = reviews
        .slice(0, 10)
        .map(r => `★${r.rating}/5 — "${r.reviewText}" — ${r.client?.name || 'Client'}`)
        .join('\n\n');
      await tryUpsert('reviews', {
        syncKey: 'sync:reviews', title: 'Client Reviews & Ratings',
        content: `Client Reviews\n\n${reviewsText}`,
        type: 'auto', tags: ['reviews', 'testimonials', 'ratings'], createdBy: adminId,
      });
    }
  } catch (e) { errors.push({ section: 'reviews-fetch', error: e.message }); }

  // ── 6. Team Members ────────────────────────────────────────────────────────
  try {
    const team = await User.find({ role: 'team', deletedAt: { $in: [null, undefined] } })
      .select('name teamProfile')
      .lean();
    if (team.length) {
      const teamText = team.map(m => {
        const tp = m.teamProfile || {};
        return `• ${m.name}` +
          (tp.position  ? ` — ${tp.position}`  : '') +
          (tp.department ? ` (${tp.department})` : '') +
          (tp.bio       ? `\n  ${tp.bio}`       : '') +
          (tp.skills?.length ? `\n  Skills: ${tp.skills.join(', ')}` : '');
      }).join('\n\n');
      await tryUpsert('team', {
        syncKey: 'sync:team', title: 'Our Team',
        content: `Our Team Members\n\n${teamText}`,
        type: 'auto', tags: ['team', 'people', 'staff'], createdBy: adminId,
      });
    }
  } catch (e) { errors.push({ section: 'team-fetch', error: e.message }); }

  const created = results.filter(r => r?.action === 'created').length;
  const updated = results.filter(r => r?.action === 'updated').length;

  successResponse(res, `Sync complete — ${created} created, ${updated} updated`, {
    created, updated, total: results.length,
    details: results.filter(Boolean),
    ...(errors.length ? { warnings: errors } : {}),
  });
});
