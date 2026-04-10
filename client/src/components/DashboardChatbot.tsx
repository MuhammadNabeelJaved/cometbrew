/**
 * DashboardChatbot — AI assistant embedded in user and team dashboards.
 *
 * - mode="user"  → calls /api/v1/chatbot/user-chat  (personal context: projects, jobs, profile)
 * - mode="team"  → calls /api/v1/chatbot/team-chat  (team context: assigned projects, tasks)
 *
 * Features identical to the public Chatbot widget:
 * - SSE streaming with typewriter animation
 * - Conversation history (multi-turn)
 * - Session persistence per mode (localStorage UUID)
 * - Glassmorphism design with role-specific colour identity
 * - Hides itself when the admin disables the relevant chat
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  MessageCircle, X, Send, Bot, Loader2,
  Sparkles, Minimize2, Maximize2, Trash2, AlertCircle,
  User, Briefcase, ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { cn } from '../lib/utils';
import { streamUserChat, streamTeamChat, getPublicConfig, getChatHistory } from '../api/chatbot.api';
import type { ChatMessage } from '../api/chatbot.api';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DashboardChatMode = 'user' | 'team';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  error?: boolean;
}

// ─── Inline markdown renderer (no CTA needed in dashboard context) ────────────
function renderMarkdown(raw: string, streaming = false): React.ReactNode {
  const lines = raw.split('\n');
  const nodes: React.ReactNode[] = [];

  const inline = (text: string, key: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    const re = /(\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`)/g;
    let last = 0; let m: RegExpExecArray | null; let idx = 0;
    while ((m = re.exec(text)) !== null) {
      if (m.index > last) parts.push(text.slice(last, m.index));
      if      (m[2]) parts.push(<strong key={`${key}-b${idx}`}>{m[2]}</strong>);
      else if (m[3]) parts.push(<em key={`${key}-i${idx}`}>{m[3]}</em>);
      else if (m[4]) parts.push(
        <code key={`${key}-c${idx}`} className="bg-muted/60 px-1 py-0.5 rounded text-[11px] font-mono">{m[4]}</code>
      );
      last = m.index + m[0].length; idx++;
    }
    if (last < text.length) parts.push(text.slice(last));
    return parts.length === 1 ? parts[0] : <React.Fragment key={key}>{parts}</React.Fragment>;
  };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (/^[-*_]{3,}$/.test(trimmed)) { nodes.push(<hr key={i} className="border-border/40 my-2" />); i++; continue; }

    const hMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (hMatch) {
      const cls = hMatch[1].length === 1 ? 'text-base font-bold mt-2 mb-0.5' : 'text-sm font-bold mt-2 mb-0.5';
      nodes.push(<p key={i} className={cls}>{inline(hMatch[2], `h${i}`)}</p>);
      i++; continue;
    }

    if (/^[-*•]\s/.test(trimmed)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && /^[-*•]\s/.test(lines[i].trim())) {
        const text = lines[i].trim().replace(/^[-*•]\s+/, '');
        items.push(<li key={i} className="flex gap-2 items-start"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary/70 shrink-0" /><span>{inline(text, `li${i}`)}</span></li>);
        i++;
      }
      nodes.push(<ul key={`ul-${i}`} className="space-y-1 my-1 pl-1">{items}</ul>);
      continue;
    }

    if (/^\d+\.\s/.test(trimmed)) {
      const items: React.ReactNode[] = []; let num = 1;
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        const text = lines[i].trim().replace(/^\d+\.\s+/, '');
        items.push(<li key={i} className="flex gap-2 items-start"><span className="shrink-0 font-semibold text-primary/80 min-w-[1.2rem]">{num}.</span><span>{inline(text, `nl${i}`)}</span></li>);
        i++; num++;
      }
      nodes.push(<ol key={`ol-${i}`} className="space-y-1 my-1 pl-1">{items}</ol>);
      continue;
    }

    if (trimmed === '') { if (nodes.length > 0) nodes.push(<div key={`br-${i}`} className="h-2" />); i++; continue; }

    nodes.push(<p key={i} className="leading-relaxed">{inline(trimmed, `p${i}`)}</p>);
    i++;
  }

  return (
    <div className="space-y-0.5 text-sm">
      {nodes}
      {streaming && <span className="inline-block w-2 h-4 bg-primary/60 ml-0.5 animate-pulse rounded-sm align-middle" />}
    </div>
  );
}

// ─── Config per mode ──────────────────────────────────────────────────────────

const MODE_CONFIG = {
  user: {
    botName:      'Nova',
    subtitle:     'Your Personal AI Assistant',
    description:  'Ask about your projects, applied jobs, billing & account',
    gradient:     'from-blue-500 to-violet-600',
    accentColor:  'text-blue-400',
    storageKey:   'dashboard-user-chat-session',
    enabledField: 'isUserChatEnabled' as const,
    Icon:         User,
  },
  team: {
    botName:      'Nova',
    subtitle:     'Your Work Assistant',
    description:  'Ask about assigned projects, tasks, deadlines & team info',
    gradient:     'from-emerald-500 to-teal-600',
    accentColor:  'text-emerald-400',
    storageKey:   'dashboard-team-chat-session',
    enabledField: 'isTeamChatEnabled' as const,
    Icon:         Briefcase,
  },
};

const CHARS_PER_TICK = 4;

// ─── Component ────────────────────────────────────────────────────────────────

interface DashboardChatbotProps {
  mode: DashboardChatMode;
}

export function DashboardChatbot({ mode }: DashboardChatbotProps) {
  const cfg = MODE_CONFIG[mode];
  const streamFn = mode === 'user' ? streamUserChat : streamTeamChat;

  const [isOpen,     setIsOpen]     = useState(false);
  const [expanded,   setExpanded]   = useState(false);
  const [isEnabled,  setIsEnabled]  = useState(true);
  const [messages,   setMessages]   = useState<Message[]>([]);
  const [input,      setInput]      = useState('');
  const [isSending,  setIsSending]  = useState(false);
  const [hasHistory, setHasHistory] = useState(false);
  // Resizable panel state
  const [panelW,     setPanelW]     = useState(360);
  const [panelH,     setPanelH]     = useState(480);

  const sessionIdRef   = useRef<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLTextAreaElement>(null);
  const abortRef       = useRef<AbortController | null>(null);

  // Resize refs
  const resizingEdge  = useRef<'left' | 'top' | 'topleft' | null>(null);
  const resizeStartX  = useRef(0);
  const resizeStartY  = useRef(0);
  const resizeStartW  = useRef(360);
  const resizeStartH  = useRef(480);

  // Typewriter state
  const twBufferRef = useRef<Map<string, { buffer: string; done: boolean; displayed: number }>>(new Map());
  const twTimerRef  = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  // Init session ID + load history
  useEffect(() => {
    const stored = localStorage.getItem(cfg.storageKey);
    const sessionId = stored || crypto.randomUUID();
    if (!stored) localStorage.setItem(cfg.storageKey, sessionId);
    sessionIdRef.current = sessionId;

    getChatHistory(sessionId).then(history => {
      if (history.length > 0) {
        setMessages(history.map((m, i) => ({
          id:        `hist-${i}`,
          role:      m.role,
          content:   m.content,
          timestamp: new Date(m.timestamp),
        })));
        setHasHistory(true);
      }
    });
  }, [cfg.storageKey]);

  // Check if enabled (piggyback on public config for now; full config needs admin route)
  useEffect(() => {
    getPublicConfig().then(c => {
      // Public config only has isEnabled; fall back to true for user/team specific toggle.
      // The server-side check (cfg.isUserChatEnabled / cfg.isTeamChatEnabled) also guards.
      setIsEnabled(c.isEnabled !== false);
    }).catch(() => {});
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      twTimerRef.current.forEach(t => clearInterval(t));
      twTimerRef.current.clear();
      twBufferRef.current.clear();
    };
  }, []);

  // Resize mouse handlers
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const edge = resizingEdge.current;
      if (!edge) return;
      if (edge === 'left' || edge === 'topleft') {
        const dx = resizeStartX.current - e.clientX;
        setPanelW(Math.max(300, Math.min(700, resizeStartW.current + dx)));
      }
      if (edge === 'top' || edge === 'topleft') {
        const dy = resizeStartY.current - e.clientY;
        setPanelH(Math.max(360, Math.min(750, resizeStartH.current + dy)));
      }
    };
    const onUp = () => { resizingEdge.current = null; document.body.style.userSelect = ''; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, []);

  const startResize = (edge: 'left' | 'top' | 'topleft', e: React.MouseEvent) => {
    e.preventDefault();
    resizingEdge.current  = edge;
    resizeStartX.current  = e.clientX;
    resizeStartY.current  = e.clientY;
    resizeStartW.current  = panelW;
    resizeStartH.current  = panelH;
    document.body.style.userSelect = 'none';
  };

  const startTypewriter = useCallback((msgId: string) => {
    twBufferRef.current.set(msgId, { buffer: '', done: false, displayed: 0 });

    const timer = setInterval(() => {
      const state = twBufferRef.current.get(msgId);
      if (!state) { clearInterval(timer); return; }

      if (state.displayed >= state.buffer.length) {
        if (state.done) {
          clearInterval(timer);
          twTimerRef.current.delete(msgId);
          twBufferRef.current.delete(msgId);
          setMessages(prev => prev.map(m =>
            m.id === msgId ? { ...m, isStreaming: false } : m
          ));
        }
        return;
      }

      const nextDisplayed = Math.min(state.displayed + CHARS_PER_TICK, state.buffer.length);
      state.displayed = nextDisplayed;
      const visible = state.buffer.slice(0, nextDisplayed);

      setMessages(prev => prev.map(m =>
        m.id === msgId ? { ...m, content: visible } : m
      ));
    }, 15);

    twTimerRef.current.set(msgId, timer);
  }, []);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isSending) return;

    setInput('');
    setIsSending(true);

    const userMsgId = crypto.randomUUID();
    const asstMsgId = crypto.randomUUID();
    const now = new Date();

    const userMsg: Message = { id: userMsgId, role: 'user', content: text, timestamp: now };
    const asstMsg: Message = { id: asstMsgId, role: 'assistant', content: '', timestamp: now, isStreaming: true };

    setMessages(prev => [...prev, userMsg, asstMsg]);

    // Build history (exclude the placeholder assistant message)
    const history: ChatMessage[] = messages.map(m => ({ role: m.role, content: m.content }));

    startTypewriter(asstMsgId);

    const ac = new AbortController();
    abortRef.current = ac;

    try {
      await streamFn({
        message:   text,
        sessionId: sessionIdRef.current,
        history,
        signal:    ac.signal,
        onDelta: (chunk) => {
          const state = twBufferRef.current.get(asstMsgId);
          if (state) state.buffer += chunk;
        },
        onDone: () => {
          const state = twBufferRef.current.get(asstMsgId);
          if (state) state.done = true;
        },
        onError: (errMsg) => {
          twTimerRef.current.get(asstMsgId) && clearInterval(twTimerRef.current.get(asstMsgId)!);
          twTimerRef.current.delete(asstMsgId);
          twBufferRef.current.delete(asstMsgId);
          setMessages(prev => prev.map(m =>
            m.id === asstMsgId
              ? { ...m, content: errMsg || 'Something went wrong. Please try again.', isStreaming: false, error: true }
              : m
          ));
        },
      });
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        twTimerRef.current.get(asstMsgId) && clearInterval(twTimerRef.current.get(asstMsgId)!);
        twTimerRef.current.delete(asstMsgId);
        twBufferRef.current.delete(asstMsgId);
        setMessages(prev => prev.map(m =>
          m.id === asstMsgId
            ? { ...m, content: 'Network error. Please try again.', isStreaming: false, error: true }
            : m
        ));
      }
    } finally {
      setIsSending(false);
    }
  }, [input, isSending, messages, streamFn, startTypewriter]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleClear = () => {
    abortRef.current?.abort();
    twTimerRef.current.forEach(t => clearInterval(t));
    twTimerRef.current.clear();
    twBufferRef.current.clear();
    setMessages([]);
    setIsSending(false);
    setHasHistory(false);
    const id = crypto.randomUUID();
    sessionIdRef.current = id;
    localStorage.setItem(cfg.storageKey, id);
  };

  if (!isEnabled) return null;

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            key="fab"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className={cn(
              'fixed bottom-6 right-6 z-[60] h-14 w-14 rounded-full shadow-2xl',
              `bg-gradient-to-br ${cfg.gradient}`,
              'flex items-center justify-center',
              'hover:scale-110 active:scale-95 transition-transform duration-200',
              'ring-2 ring-white/20',
            )}
          >
            <Bot className="h-7 w-7 text-white" />
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-full animate-ping opacity-20 bg-white" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1,   y: 0  }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed bottom-6 right-6 z-[60] flex flex-col rounded-2xl overflow-hidden shadow-2xl bg-background/95 backdrop-blur-xl border border-border/50"
            style={{ width: panelW, height: panelH }}
          >
            {/* ── Resize handles ──────────────────────────────────────────── */}
            {/* Top-left corner */}
            <div
              onMouseDown={e => startResize('topleft', e)}
              className="absolute top-0 left-0 w-4 h-4 z-10 cursor-nw-resize rounded-tl-2xl"
              title="Drag to resize"
            />
            {/* Left edge */}
            <div
              onMouseDown={e => startResize('left', e)}
              className="absolute left-0 top-4 bottom-0 w-2 z-10 cursor-w-resize hover:bg-primary/10 transition-colors rounded-bl-2xl"
              title="Drag to resize width"
            />
            {/* Top edge */}
            <div
              onMouseDown={e => startResize('top', e)}
              className="absolute top-0 left-4 right-0 h-2 z-10 cursor-n-resize hover:bg-primary/10 transition-colors rounded-tr-2xl"
              title="Drag to resize height"
            />

            {/* Header */}
            <div className={cn('flex items-center justify-between px-4 py-3 shrink-0 bg-gradient-to-r', cfg.gradient)}>
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white leading-tight">{cfg.botName}</p>
                  <p className="text-[10px] text-white/80 leading-tight">{cfg.subtitle}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleClear}
                  title="Clear conversation"
                  className="p-1.5 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => { const big = panelW < 500; setPanelW(big ? 520 : 360); setPanelH(big ? 640 : 480); }}
                  title={panelW >= 500 ? 'Collapse' : 'Expand'}
                  className="p-1.5 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors"
                >
                  {panelW >= 500 ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  title="Close"
                  className="p-1.5 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth">
              {hasHistory && messages.length > 0 && (
                <div className="flex items-center gap-2 py-1">
                  <div className="flex-1 h-px bg-border/40" />
                  <span className="text-[10px] text-muted-foreground/50 font-medium whitespace-nowrap px-2">Previous conversation</span>
                  <div className="flex-1 h-px bg-border/40" />
                </div>
              )}
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-8">
                  <div className={cn('h-14 w-14 rounded-2xl bg-gradient-to-br flex items-center justify-center', cfg.gradient)}>
                    <Sparkles className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{cfg.botName} — {cfg.subtitle}</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">{cfg.description}</p>
                  </div>
                  <div className="flex flex-col gap-1.5 w-full max-w-[260px]">
                    {(mode === 'user'
                      ? ['What\'s the status of my projects?', 'Show my applied jobs', 'What\'s my outstanding balance?']
                      : ['Which projects am I assigned to?', 'What tasks are due this week?', 'Show me client project details']
                    ).map(q => (
                      <button
                        key={q}
                        onClick={() => { setInput(q); inputRef.current?.focus(); }}
                        className="text-left text-xs px-3 py-2 rounded-xl bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/30 transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className={cn('h-7 w-7 rounded-lg bg-gradient-to-br flex items-center justify-center shrink-0 mr-2 mt-0.5', cfg.gradient)}>
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <div className={cn(
                    'max-w-[80%] rounded-2xl px-3.5 py-2.5',
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-tr-none'
                      : 'bg-muted/60 border border-border/30 text-foreground rounded-tl-none',
                    msg.error && 'border-red-500/30 bg-red-500/10',
                  )}>
                    {msg.role === 'assistant' ? (
                      <div className="flex items-start gap-1.5">
                        {msg.error && <AlertCircle className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />}
                        {renderMarkdown(msg.content, msg.isStreaming)}
                      </div>
                    ) : (
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}

              {isSending && messages[messages.length - 1]?.role !== 'assistant' && (
                <div className="flex justify-start items-center gap-2">
                  <div className={cn('h-7 w-7 rounded-lg bg-gradient-to-br flex items-center justify-center', cfg.gradient)}>
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="bg-muted/60 border border-border/30 rounded-2xl rounded-tl-none px-4 py-3">
                    <div className="flex gap-1.5">
                      {[0, 1, 2].map(i => (
                        <div key={i} className="h-1.5 w-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="shrink-0 p-3 border-t border-border/40 bg-background/80">
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything…"
                  rows={1}
                  className={cn(
                    'flex-1 resize-none text-sm px-3 py-2.5 rounded-xl',
                    'bg-muted/50 border border-border/50 focus:border-primary/50',
                    'focus:outline-none focus:ring-1 focus:ring-primary/30',
                    'placeholder:text-muted-foreground text-foreground',
                    'max-h-32 leading-relaxed transition-colors',
                  )}
                  style={{ height: 'auto', minHeight: '42px' }}
                  onInput={e => {
                    const t = e.currentTarget;
                    t.style.height = 'auto';
                    t.style.height = `${Math.min(t.scrollHeight, 128)}px`;
                  }}
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isSending}
                  size="sm"
                  className={cn('h-10 w-10 p-0 rounded-xl shrink-0 bg-gradient-to-br', cfg.gradient, 'hover:opacity-90')}
                >
                  {isSending
                    ? <Loader2 className="h-4 w-4 animate-spin text-white" />
                    : <Send className="h-4 w-4 text-white" />
                  }
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground/60 text-center mt-2">
                AI responses may not be 100% accurate. Verify important info.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
