/**
 * Chatbot API client
 *
 * All endpoints under /api/v1/chatbot.
 * The `chat()` function uses the Fetch Streams API to receive Server-Sent
 * Events from the server and calls the provided callbacks in real-time.
 */

const BASE = '/api/v1/chatbot';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface PublicChatbotConfig {
  botName: string;
  welcomeMessage: string;
  isEnabled: boolean;
}

export type ChatbotTone = 'professional' | 'friendly' | 'formal' | 'casual' | 'expert' | 'empathetic';

export interface AnthropicModel {
  id: string;
  name: string;
  tier: 'fast' | 'balanced' | 'advanced';
  badge: string;
  desc: string;
}

export interface ChatbotConfigFull {
  activeProvider: string;
  activeModel: string;
  simpleModel: string;
  availableModels: AnthropicModel[];
  systemPrompt: string;
  businessContext: string;
  botName: string;
  welcomeMessage: string;
  isEnabled: boolean;
  tone: ChatbotTone;
  maxTokens: number;
  temperature: number;
  maxMessagesPerHour: number;
  maxMessagesPerDay: number;
  apiKeys: ApiKeyMeta[];
}

export interface ApiKeyMeta {
  _id: string;
  provider: string;
  label: string;
  isActive: boolean;
  addedAt: string;
  keyHint: string;
}

export interface KnowledgeEntry {
  _id: string;
  title: string;
  content: string;
  type: 'text' | 'faq' | 'file' | 'url' | 'auto';
  fileUrl?: string;
  fileName?: string;
  sourceUrl?: string;
  tags: string[];
  isActive: boolean;
  wordCount: number;
  createdAt: string;
  createdBy?: { name: string };
}

export interface ChatbotSession {
  _id: string;
  sessionId: string;
  totalMessages: number;
  isResolved: boolean;
  lastActivity: string;
  createdAt: string;
  userId?: { name: string; email: string };
  messages?: ChatMessage[];
}

export interface ChatbotStats {
  totalSessions: number;
  totalMessages: number;
  totalKnowledge: number;
  resolvedSessions: number;
  recentActivity: ChatbotSession[];
  dailyActivity: { _id: string; count: number }[];
}

// ─── Helper ───────────────────────────────────────────────────────────────────

async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

// ─── Public ───────────────────────────────────────────────────────────────────

/** Fetch the public widget config (botName, welcomeMessage, isEnabled). */
export async function getPublicConfig(): Promise<PublicChatbotConfig> {
  const data = await apiFetch<{ data: PublicChatbotConfig }>(`${BASE}/config/public`);
  return data.data;
}

/**
 * Stream a chat message.  Calls `onDelta` for each text chunk and `onDone`
 * when the stream ends.  Returns the full response string on completion.
 */
export async function streamChat(opts: {
  message: string;
  sessionId: string;
  history: ChatMessage[];
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (msg: string) => void;
  signal?: AbortSignal;
}): Promise<string> {
  const { message, sessionId, history, onDelta, onDone, onError, signal } = opts;

  const response = await fetch(`${BASE}/chat`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, sessionId, history }),
    signal,
  });

  if (!response.ok || !response.body) {
    const err = await response.json().catch(() => ({ message: 'Chat failed' }));
    onError(err.message || 'Chat failed');
    return '';
  }

  const reader  = response.body.getReader();
  const decoder = new TextDecoder();
  let   buffer  = '';
  let   full    = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const raw = line.slice(6).trim();
      if (!raw) continue;

      try {
        const event = JSON.parse(raw);
        if (event.type === 'delta') {
          full += event.text;
          onDelta(event.text);
        } else if (event.type === 'done') {
          onDone();
        } else if (event.type === 'error') {
          onError(event.message || 'AI error');
        }
      } catch {
        // ignore malformed SSE lines
      }
    }
  }

  return full;
}

// ─── Admin — Stats & Sessions ─────────────────────────────────────────────────

export async function getStats(): Promise<ChatbotStats> {
  const data = await apiFetch<{ data: ChatbotStats }>(`${BASE}/stats`);
  return data.data;
}

export async function getSessions(params?: {
  page?: number; limit?: number; resolved?: boolean;
}): Promise<{ sessions: ChatbotSession[]; pagination: { total: number; pages: number; page: number } }> {
  const q = new URLSearchParams();
  if (params?.page    !== undefined) q.set('page',     String(params.page));
  if (params?.limit   !== undefined) q.set('limit',    String(params.limit));
  if (params?.resolved !== undefined) q.set('resolved', String(params.resolved));
  const data = await apiFetch<{ data: any }>(`${BASE}/sessions?${q}`);
  return data.data;
}

export async function getSession(id: string): Promise<ChatbotSession> {
  const data = await apiFetch<{ data: ChatbotSession }>(`${BASE}/sessions/${id}`);
  return data.data;
}

export async function deleteSession(id: string): Promise<void> {
  await apiFetch(`${BASE}/sessions/${id}`, { method: 'DELETE' });
}

export async function resolveSession(id: string): Promise<void> {
  await apiFetch(`${BASE}/sessions/${id}/resolve`, { method: 'PATCH' });
}

// ─── Admin — Config ───────────────────────────────────────────────────────────

export async function getConfig(): Promise<ChatbotConfigFull> {
  const data = await apiFetch<{ data: ChatbotConfigFull }>(`${BASE}/config`);
  return data.data;
}

export async function updateConfig(updates: Partial<ChatbotConfigFull>): Promise<void> {
  await apiFetch(`${BASE}/config`, { method: 'PUT', body: JSON.stringify(updates) });
}

export async function addApiKey(payload: {
  provider: string; apiKey: string; label?: string; setActive?: boolean;
}): Promise<void> {
  await apiFetch(`${BASE}/config/keys`, { method: 'POST', body: JSON.stringify(payload) });
}

export async function removeApiKey(keyId: string): Promise<void> {
  await apiFetch(`${BASE}/config/keys/${keyId}`, { method: 'DELETE' });
}

export async function activateApiKey(keyId: string): Promise<void> {
  await apiFetch(`${BASE}/config/keys/${keyId}/activate`, { method: 'PATCH' });
}

// ─── Admin — Knowledge ────────────────────────────────────────────────────────

export async function getKnowledge(params?: {
  page?: number; limit?: number; type?: string; active?: boolean;
}): Promise<{ entries: KnowledgeEntry[]; pagination: { total: number; pages: number } }> {
  const q = new URLSearchParams();
  if (params?.page   !== undefined) q.set('page',  String(params.page));
  if (params?.limit  !== undefined) q.set('limit', String(params.limit));
  if (params?.type)                 q.set('type',  params.type);
  if (params?.active !== undefined) q.set('active', String(params.active));
  const data = await apiFetch<{ data: any }>(`${BASE}/knowledge?${q}`);
  return data.data;
}

export async function createKnowledge(payload: {
  title: string; content: string; type?: string; tags?: string[];
}): Promise<KnowledgeEntry> {
  const data = await apiFetch<{ data: KnowledgeEntry }>(`${BASE}/knowledge`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data.data;
}

export async function updateKnowledge(id: string, payload: Partial<KnowledgeEntry>): Promise<KnowledgeEntry> {
  const data = await apiFetch<{ data: KnowledgeEntry }>(`${BASE}/knowledge/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return data.data;
}

export async function deleteKnowledge(id: string): Promise<void> {
  await apiFetch(`${BASE}/knowledge/${id}`, { method: 'DELETE' });
}

export async function uploadKnowledgeFile(formData: FormData): Promise<KnowledgeEntry> {
  const res = await fetch(`${BASE}/knowledge/upload`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Upload failed');
  return data.data;
}

export async function crawlUrl(payload: {
  url: string; title?: string; tags?: string[];
}): Promise<KnowledgeEntry> {
  const data = await apiFetch<{ data: KnowledgeEntry }>(`${BASE}/knowledge/crawl`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data.data;
}

export interface SyncResult {
  created: number;
  updated: number;
  total: number;
  details: { action: 'created' | 'updated'; title: string }[];
}

export async function syncFromDatabase(): Promise<SyncResult> {
  const data = await apiFetch<{ data: SyncResult }>(`${BASE}/knowledge/sync`, {
    method: 'POST',
  });
  return data.data;
}
