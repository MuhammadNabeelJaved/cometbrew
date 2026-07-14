/**
 * Chatbot Widget — "Nova AI"
 * Claude-powered business chatbot with SSE streaming.
 *
 * Features:
 * - Real-time streaming responses from Claude via SSE
 * - Session persistence (localStorage UUID)
 * - Conversation history sent with each request for multi-turn context
 * - File attachment UI (reference only — no content sent to API)
 * - Glassmorphism & neon aesthetics preserved
 * - Disabled gracefully when admin has turned off the chatbot
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageCircle, X, Send, Bot, Loader2,
  Paperclip, FileText, Sparkles, Minimize2, Maximize2,
  Trash2, Mic, AlertCircle, ExternalLink, ArrowRight, PhoneCall,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { io, Socket } from 'socket.io-client';
import { Button } from './ui/button';
import { cn } from '../lib/utils';
import { streamChat, getPublicConfig, getChatHistory } from '../api/chatbot.api';
import { useChatbotDock, ChatbotDockTab } from './ChatbotDock';
import type { ChatMessage, PublicChatbotConfig } from '../api/chatbot.api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  error?: boolean;
}

interface LcMsg {
  id: string;
  sender: 'visitor' | 'agent' | 'system';
  senderName?: string;
  content: string;
  timestamp: Date;
  isJoin?: boolean; // highlights the "X has joined" message
}

// ─── Markdown + CTA renderer ──────────────────────────────────────────────────

// CTA marker pattern: [CTA:/path|Button Label]
const CTA_RE = /\[CTA:([^\]|]+)\|([^\]]+)\]/g;

// Renders a subset of markdown produced by Claude including [CTA:/path|Label] buttons.
// Safe — no dangerouslySetInnerHTML; builds React elements directly.
function renderMarkdown(
  raw: string,
  streaming = false,
  onNavigate?: (path: string) => void,
): React.ReactNode {
  const lines = raw.split('\n');
  const nodes: React.ReactNode[] = [];
  const ctaButtons: Array<{ path: string; label: string }> = [];

  // Inline: bold, italic, inline-code
  const inline = (text: string, key: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    const re = /(\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`)/g;
    let last = 0;
    let m: RegExpExecArray | null;
    let idx = 0;
    while ((m = re.exec(text)) !== null) {
      if (m.index > last) parts.push(text.slice(last, m.index));
      if (m[2] !== undefined) parts.push(<strong key={`${key}-b${idx}`}>{m[2]}</strong>);
      else if (m[3] !== undefined) parts.push(<em key={`${key}-i${idx}`}>{m[3]}</em>);
      else if (m[4] !== undefined) parts.push(
        <code key={`${key}-c${idx}`} className="bg-muted/60 px-1 py-0.5 rounded text-[11px] font-mono">{m[4]}</code>
      );
      last = m.index + m[0].length;
      idx++;
    }
    if (last < text.length) parts.push(text.slice(last));
    return parts.length === 1 ? parts[0] : <React.Fragment key={key}>{parts}</React.Fragment>;
  };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // CTA marker line — collect buttons, don't render text
    if (/^\[CTA:/.test(trimmed)) {
      let m2: RegExpExecArray | null;
      CTA_RE.lastIndex = 0;
      while ((m2 = CTA_RE.exec(trimmed)) !== null) {
        ctaButtons.push({ path: m2[1].trim(), label: m2[2].trim() });
      }
      i++; continue;
    }

    // Horizontal rule
    if (/^[-*_]{3,}$/.test(trimmed)) {
      nodes.push(<hr key={i} className="border-border/40 my-2" />);
      i++; continue;
    }

    // Heading ## / ###
    const hMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (hMatch) {
      const level = hMatch[1].length;
      const cls = level === 1
        ? 'text-base font-bold mt-2 mb-0.5'
        : level === 2
          ? 'text-sm font-bold mt-2 mb-0.5'
          : 'text-sm font-semibold mt-1 mb-0.5';
      nodes.push(<p key={i} className={cls}>{inline(hMatch[2], `h${i}`)}</p>);
      i++; continue;
    }

    // Bullet list block
    if (/^[-*•]\s/.test(trimmed)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && /^[-*•]\s/.test(lines[i].trim())) {
        const text = lines[i].trim().replace(/^[-*•]\s+/, '');
        items.push(
          <li key={i} className="flex gap-2 items-start">
            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary/70 shrink-0" />
            <span>{inline(text, `li${i}`)}</span>
          </li>
        );
        i++;
      }
      nodes.push(<ul key={`ul-${i}`} className="space-y-1 my-1 pl-1">{items}</ul>);
      continue;
    }

    // Numbered list block
    if (/^\d+\.\s/.test(trimmed)) {
      const items: React.ReactNode[] = [];
      let num = 1;
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        const text = lines[i].trim().replace(/^\d+\.\s+/, '');
        items.push(
          <li key={i} className="flex gap-2 items-start">
            <span className="shrink-0 font-semibold text-primary/80 min-w-[1.2rem]">{num}.</span>
            <span>{inline(text, `nl${i}`)}</span>
          </li>
        );
        i++; num++;
      }
      nodes.push(<ol key={`ol-${i}`} className="space-y-1 my-1 pl-1">{items}</ol>);
      continue;
    }

    // Empty line → spacer
    if (trimmed === '') {
      if (nodes.length > 0) nodes.push(<div key={`br-${i}`} className="h-2" />);
      i++; continue;
    }

    // Normal paragraph
    nodes.push(<p key={i} className="leading-relaxed">{inline(trimmed, `p${i}`)}</p>);
    i++;
  }

  return (
    <div className="space-y-0.5 text-sm">
      {nodes}
      {streaming && (
        <span className="inline-block w-2 h-4 bg-primary/60 ml-0.5 animate-pulse rounded-sm align-middle" />
      )}

      {/* CTA navigation buttons */}
      {!streaming && ctaButtons.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {ctaButtons.map((cta, idx) => (
            <button
              key={idx}
              onClick={() => onNavigate?.(cta.path)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold',
                'bg-primary/10 text-primary border border-primary/20',
                'hover:bg-primary hover:text-primary-foreground hover:border-primary',
                'transition-all duration-200 group',
              )}
            >
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              {cta.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Session ID ───────────────────────────────────────────────────────────────

function getOrCreateSessionId(): string {
  const key = 'nova_session_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

// ─── Component ────────────────────────────────────────────────────────────────

// ─── Typewriter speed (characters revealed per 15ms tick) ────────────────────
const CHARS_PER_TICK = 4;

export function Chatbot() {
  const navigate = useNavigate();
  const [isOpen,        setIsOpen]        = useState(false);
  const [isExpanded,    setIsExpanded]    = useState(false);
  const { hidden, hide, show }            = useChatbotDock();
  const [input,         setInput]         = useState('');
  const [isLoading,     setIsLoading]     = useState(false);
  const [messages,      setMessages]      = useState<Message[]>([]);
  const [config,        setConfig]        = useState<PublicChatbotConfig | null>(null);
  const [configErr,     setConfigErr]     = useState(false);
  const [hasHistory,    setHasHistory]    = useState(false);
  // Resizable panel
  const [panelW,        setPanelW]        = useState(384);
  const [panelH,        setPanelH]        = useState(600);

  const scrollRef        = useRef<HTMLDivElement>(null);
  const abortRef         = useRef<AbortController | null>(null);
  const sessionId        = useRef(getOrCreateSessionId());
  const historyLoadedRef = useRef(false);
  // Resize refs (no state — avoids re-renders during drag)
  const resizingEdge  = useRef<'left' | 'top' | 'topleft' | null>(null);
  const resizeStartX  = useRef(0);
  const resizeStartY  = useRef(0);
  const resizeStartW  = useRef(384);
  const resizeStartH  = useRef(600);

  // Typewriter: keyed by message id → { buffer, done, displayed }
  const twBufferRef  = useRef<Map<string, { buffer: string; done: boolean; displayed: number }>>(new Map());
  const twTimerRef   = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  // ── Live chat state ──────────────────────────────────────────────────────────
  const [liveChatMode, setLiveChatMode] = useState<'none' | 'connecting' | 'waiting' | 'active' | 'closed'>('none');
  const [lcAgent, setLcAgent] = useState<{ name: string; photo?: string } | null>(null);
  const [lcMessages, setLcMessages] = useState<LcMsg[]>([]);
  const [showHandoffForm, setShowHandoffForm] = useState(false);
  const [handoffName, setHandoffName] = useState('');
  const [handoffEmail, setHandoffEmail] = useState('');
  const [lcAgentTyping, setLcAgentTyping] = useState(false);
  const lcSocketRef = useRef<Socket | null>(null);
  const lcTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Resize mouse handlers ────────────────────────────────────────────────
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const edge = resizingEdge.current;
      if (!edge) return;
      if (edge === 'left' || edge === 'topleft') {
        const dx = resizeStartX.current - e.clientX;
        setPanelW(Math.max(320, Math.min(800, resizeStartW.current + dx)));
      }
      if (edge === 'top' || edge === 'topleft') {
        const dy = resizeStartY.current - e.clientY;
        setPanelH(Math.max(400, Math.min(window.innerHeight - 120, resizeStartH.current + dy)));
      }
    };
    const onUp = () => {
      resizingEdge.current = null;
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',   onUp);
    };
  }, []);

  const startResize = (edge: 'left' | 'top' | 'topleft', e: React.MouseEvent) => {
    e.preventDefault();
    resizingEdge.current = edge;
    resizeStartX.current = e.clientX;
    resizeStartY.current = e.clientY;
    resizeStartW.current = panelW;
    resizeStartH.current = panelH;
    document.body.style.userSelect = 'none';
  };

  // ── Load public config + history ──────────────────────────────────────────
  useEffect(() => {
    getPublicConfig()
      .then(async cfg => {
        setConfig(cfg);
        if (!cfg.isEnabled) return;

        // Load prior conversation from DB
        if (!historyLoadedRef.current) {
          historyLoadedRef.current = true;
          const history = await getChatHistory(sessionId.current);
          if (history.length > 0) {
            const restored: Message[] = history.map((m, i) => ({
              id:        `hist-${i}`,
              role:      m.role,
              content:   m.content,
              timestamp: new Date(m.timestamp),
            }));
            setMessages(restored);
            setHasHistory(true);
            return; // skip welcome message — history exists
          }
        }

        // No history — show welcome
        setMessages([{
          id:        'welcome',
          role:      'assistant',
          content:   cfg.welcomeMessage,
          timestamp: new Date(),
        }]);
      })
      .catch(() => setConfigErr(true));
  }, []);

  // ── Auto-scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen, isExpanded]);

  // ── Build history for the API (exclude the welcome msg) ──────────────────
  const buildHistory = useCallback((): ChatMessage[] => {
    return messages
      .filter(m => m.id !== 'welcome' && !m.error && m.content.trim())
      .map(m => ({ role: m.role, content: m.content }));
  }, [messages]);

  // ── Send message ─────────────────────────────────────────────────────────
  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    // ── Live chat message routing ────────────────────────────────────────────
    if (liveChatMode === 'active') {
      lcSocketRef.current?.emit('lc:message', { sessionId: sessionId.current, content: text });
      const userMsg: LcMsg = {
        id: crypto.randomUUID(),
        sender: 'visitor',
        content: text,
        timestamp: new Date(),
      };
      setLcMessages(prev => [...prev, userMsg]);
      setInput('');
      return;
    }

    // ── Handoff phrase detection ─────────────────────────────────────────────
    const HANDOFF_PATTERNS = /\b(live agent|real person|human|talk to someone|speak with|connect me|support team|real support)\b/i;
    if (liveChatMode === 'none' && HANDOFF_PATTERNS.test(text)) {
      setShowHandoffForm(true);
      const aiHandoffMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Of course! I can connect you with a live agent. Please fill in your details below to get started.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiHandoffMsg]);
      setInput('');
      return;
    }

    // Abort any previous request
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    const userMsg: Message = {
      id:        Date.now().toString(),
      role:      'user',
      content:   text,
      timestamp: new Date(),
    };

    const assistantMsgId = (Date.now() + 1).toString();
    const assistantMsg: Message = {
      id:          assistantMsgId,
      role:        'assistant',
      content:     '',
      timestamp:   new Date(),
      isStreaming: true,
    };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setInput('');
    setIsLoading(true);

    const history = buildHistory();

    // Initialise typewriter buffer for this message
    twBufferRef.current.set(assistantMsgId, { buffer: '', done: false, displayed: 0 });

    // Interval that drains the buffer character-by-character
    const twInterval = setInterval(() => {
      const entry = twBufferRef.current.get(assistantMsgId);
      if (!entry) { clearInterval(twInterval); return; }

      const { buffer, done, displayed } = entry;

      if (displayed < buffer.length) {
        // Advance the display pointer
        const next = Math.min(displayed + CHARS_PER_TICK, buffer.length);
        entry.displayed = next;
        const slice = buffer.slice(0, next);
        setMessages(prev =>
          prev.map(m => m.id === assistantMsgId ? { ...m, content: slice } : m)
        );
      } else if (done) {
        // Buffer fully shown and SSE complete → finish streaming
        clearInterval(twInterval);
        twTimerRef.current.delete(assistantMsgId);
        twBufferRef.current.delete(assistantMsgId);
        setMessages(prev =>
          prev.map(m => m.id === assistantMsgId ? { ...m, isStreaming: false } : m)
        );
        setIsLoading(false);
      }
      // else: buffer caught up but SSE not done yet — wait for more chunks
    }, 15);

    twTimerRef.current.set(assistantMsgId, twInterval);

    await streamChat({
      message:   text,
      sessionId: sessionId.current,
      history,
      signal:    abortRef.current.signal,

      onDelta: (chunk) => {
        // Accumulate into buffer only — typewriter interval handles display
        const entry = twBufferRef.current.get(assistantMsgId);
        if (entry) entry.buffer += chunk;
      },

      onDone: () => {
        // Mark buffer done — typewriter interval will finish when it catches up
        const entry = twBufferRef.current.get(assistantMsgId);
        if (entry) entry.done = true;
      },

      onError: (errMsg) => {
        // Errors bypass the typewriter — show immediately
        const timer = twTimerRef.current.get(assistantMsgId);
        if (timer) { clearInterval(timer); twTimerRef.current.delete(assistantMsgId); }
        twBufferRef.current.delete(assistantMsgId);
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantMsgId
              ? { ...m, content: errMsg || "Sorry, something went wrong. Please try again.", isStreaming: false, error: true }
              : m
          )
        );
        setIsLoading(false);
      },
    }).catch(() => {
      // AbortError — clean up typewriter
      const timer = twTimerRef.current.get(assistantMsgId);
      if (timer) { clearInterval(timer); twTimerRef.current.delete(assistantMsgId); }
      twBufferRef.current.delete(assistantMsgId);
      setIsLoading(false);
    });
  };

  // ── Cleanup typewriter timers on unmount ──────────────────────────────────
  useEffect(() => {
    return () => {
      twTimerRef.current.forEach(timer => clearInterval(timer));
      twTimerRef.current.clear();
      twBufferRef.current.clear();
    };
  }, []);

  // ── Cleanup live chat socket and typing timer on unmount ──────────────────
  useEffect(() => {
    return () => {
      if (lcSocketRef.current) {
        lcSocketRef.current.disconnect();
      }
      if (lcTypingTimeoutRef.current) {
        clearTimeout(lcTypingTimeoutRef.current);
      }
    };
  }, []);

  // ── Clear conversation ────────────────────────────────────────────────────
  const handleClear = () => {
    twTimerRef.current.forEach(timer => clearInterval(timer));
    twTimerRef.current.clear();
    twBufferRef.current.clear();
    abortRef.current?.abort();
    const welcome = config?.welcomeMessage || "Hi! I'm WEB AI. How can I help?";
    sessionId.current = crypto.randomUUID();
    localStorage.setItem('nova_session_id', sessionId.current);
    historyLoadedRef.current = false;
    setIsLoading(false);
    setHasHistory(false);
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: welcome,
      timestamp: new Date(),
    }]);
  };

  // ── Live chat connect / disconnect ───────────────────────────────────────
  const SOCKET_URL_LC = (import.meta.env.VITE_SOCKET_URL as string) || window.location.origin;

  const connectLiveChat = (name: string, email: string) => {
    setLiveChatMode('connecting');
    setShowHandoffForm(false);

    const sock = io(`${SOCKET_URL_LC}/livechat`, {
      transports: ['websocket', 'polling'],
    });
    lcSocketRef.current = sock;

    sock.on('connect', () => {
      sock.emit('lc:visitor_join', {
        sessionId: sessionId.current,
        visitorName: name || 'Anonymous',
        visitorEmail: email || null,
        pageUrl: window.location.href,
        userAgent: navigator.userAgent,
      });
      setLiveChatMode('waiting');
    });

    sock.on('lc:new_message', (msg: { sender: string; content: string; senderName?: string; timestamp: string; _id?: string }) => {
      const isJoin = msg.sender === 'system' && msg.content.includes('has joined the chat');
      const newMsg: LcMsg = {
        id: msg._id || crypto.randomUUID(),
        sender: msg.sender as LcMsg['sender'],
        senderName: msg.senderName,
        content: msg.content,
        timestamp: new Date(msg.timestamp),
        isJoin,
      };
      setLcMessages(prev => [...prev, newMsg]);
      setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }), 50);
    });

    sock.on('lc:session_update', (update: { status: string; agentName?: string; agentPhoto?: string }) => {
      if (update.status === 'active') {
        setLiveChatMode('active');
        setLcAgent({ name: update.agentName || 'Agent', photo: update.agentPhoto });
      }
      if (update.status === 'closed' || update.status === 'missed') {
        setLiveChatMode('closed');
      }
    });

    sock.on('lc:typing_indicator', ({ sender, isTyping: t }: { sender: string; isTyping: boolean }) => {
      if (sender === 'agent') {
        setLcAgentTyping(t);
      }
    });

    sock.on('disconnect', () => {
      if (lcSocketRef.current) {
        setLiveChatMode('closed');
      }
    });
  };

  const disconnectLiveChat = () => {
    if (lcSocketRef.current) {
      lcSocketRef.current.emit('lc:close', { sessionId: sessionId.current });
      lcSocketRef.current.disconnect();
      lcSocketRef.current = null;
    }
    setLiveChatMode('none');
    setLcAgent(null);
    setLcMessages([]);
  };

  // ── Don't render if disabled or config failed ─────────────────────────────
  if (configErr || (config !== null && !config.isEnabled)) return null;

  const botName = config?.botName || 'WEB AI';

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9, rotateX: 10 }}
            animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
            exit={{ opacity: 0, y: 50, scale: 0.9, rotateX: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              'fixed bottom-24 right-6',
              'bg-background/80 backdrop-blur-xl border border-primary/20 rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden',
              'ring-1 ring-white/10 dark:ring-white/5',
              isExpanded && 'right-1/2 translate-x-1/2 bottom-10',
            )}
            style={{
              width:  isExpanded ? Math.min(panelW, window.innerWidth - 48) : panelW,
              height: isExpanded ? '80vh' : panelH,
              maxWidth:  'calc(100vw - 3rem)',
              maxHeight: 'calc(100vh - 8rem)',
              transformOrigin: 'bottom right',
            }}
          >
            {/* ── Resize handles (hidden when expanded/centered) ─── */}
            {!isExpanded && (
              <>
                {/* Top-left corner */}
                <div
                  onMouseDown={e => startResize('topleft', e)}
                  className="absolute top-0 left-0 w-5 h-5 z-20 cursor-nw-resize rounded-tl-3xl"
                  title="Drag to resize"
                />
                {/* Left edge */}
                <div
                  onMouseDown={e => startResize('left', e)}
                  className="absolute left-0 top-5 bottom-0 w-2 z-20 cursor-w-resize hover:bg-primary/10 transition-colors rounded-bl-3xl"
                  title="Drag to resize width"
                />
                {/* Top edge */}
                <div
                  onMouseDown={e => startResize('top', e)}
                  className="absolute top-0 left-5 right-0 h-2 z-20 cursor-n-resize hover:bg-primary/10 transition-colors rounded-tr-3xl"
                  title="Drag to resize height"
                />
              </>
            )}
            {/* Ambient gradient bar */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-purple-500 to-blue-500" />
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-purple-500/20 rounded-full blur-[100px] pointer-events-none" />

            {/* Header */}
            <div className="relative p-4 border-b border-border/50 flex justify-between items-center bg-muted/20 backdrop-blur-md z-10">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/50 blur-lg rounded-full animate-pulse" />
                  <div className="relative p-2 bg-gradient-to-br from-primary to-purple-600 rounded-xl shadow-lg shadow-primary/25">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                    {botName}
                  </h3>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                    AI Assistant · Powered by Claude
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {liveChatMode === 'none' && !showHandoffForm && (
                  <button
                    onClick={() => setShowHandoffForm(true)}
                    title="Talk to a real person"
                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                  </button>
                )}
                <Button
                  variant="ghost" size="icon"
                  className="h-8 w-8 hover:bg-white/10 rounded-full"
                  title="Clear conversation"
                  onClick={handleClear}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost" size="icon"
                  className="h-8 w-8 hover:bg-white/10 rounded-full"
                  title={isExpanded ? 'Collapse' : 'Expand'}
                  onClick={() => {
                    if (isExpanded) {
                      // Restore to current manual size
                      setIsExpanded(false);
                    } else {
                      setIsExpanded(true);
                    }
                  }}
                >
                  {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost" size="icon"
                  className="h-8 w-8 hover:bg-red-500/10 hover:text-red-500 rounded-full"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Live chat status bar */}
            {liveChatMode !== 'none' && (
              <div className={cn(
                'flex-shrink-0 px-4 py-2 text-xs flex items-center gap-2 border-b',
                liveChatMode === 'waiting' && 'bg-yellow-500/5 border-yellow-500/20 text-yellow-400',
                liveChatMode === 'connecting' && 'bg-white/5 border-white/10 text-muted-foreground',
                liveChatMode === 'active' && 'bg-green-500/5 border-green-500/20 text-green-400',
                liveChatMode === 'closed' && 'bg-white/5 border-white/10 text-muted-foreground',
              )}>
                {liveChatMode === 'connecting' && (
                  <><Loader2 className="w-3 h-3 animate-spin" /> Connecting to support…</>
                )}
                {liveChatMode === 'waiting' && (
                  <><Loader2 className="w-3 h-3 animate-spin" /> Waiting for an agent to join…</>
                )}
                {liveChatMode === 'active' && (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
                    Live chat · {lcAgent?.name ?? 'Agent'}
                  </>
                )}
                {liveChatMode === 'closed' && (
                  <>
                    <span className="flex-1">Session ended</span>
                    <button onClick={disconnectLiveChat}
                      className="text-primary hover:text-primary/80 font-medium transition-colors">
                      Back to Nova AI →
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Messages */}
            <div className="flex-grow overflow-y-auto p-4 space-y-6 relative z-0" ref={scrollRef}>
              {hasHistory && messages.length > 0 && (
                <div className="flex items-center gap-2 py-1">
                  <div className="flex-1 h-px bg-border/40" />
                  <span className="text-[10px] text-muted-foreground/50 font-medium whitespace-nowrap px-2">Previous conversation</span>
                  <div className="flex-1 h-px bg-border/40" />
                </div>
              )}
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Avatar */}
                    <div className={cn(
                      'h-8 w-8 rounded-full flex items-center justify-center shrink-0 shadow-lg',
                      msg.role === 'user'
                        ? 'bg-gradient-to-br from-blue-500 to-cyan-500'
                        : msg.error
                          ? 'bg-gradient-to-br from-red-500 to-orange-500'
                          : 'bg-gradient-to-br from-primary to-purple-600'
                    )}>
                      {msg.role === 'user'
                        ? <span className="text-white text-xs font-bold">U</span>
                        : msg.error
                          ? <AlertCircle className="h-4 w-4 text-white" />
                          : <Bot className="h-4 w-4 text-white" />
                      }
                    </div>

                    <div className="space-y-1">
                      {/* Bubble */}
                      <div className={cn(
                        'rounded-2xl px-5 py-3 shadow-sm backdrop-blur-sm border',
                        msg.role === 'user'
                          ? 'bg-primary/90 text-primary-foreground rounded-tr-none border-primary/20'
                          : msg.error
                            ? 'bg-red-500/10 text-red-400 rounded-tl-none border-red-500/20'
                            : 'bg-card/50 text-foreground rounded-tl-none border-border/50'
                      )}>
                        {msg.role === 'user' ? (
                          <p className="text-sm leading-relaxed">{msg.content}</p>
                        ) : (
                          renderMarkdown(msg.content, msg.isStreaming, (path) => {
                            setIsOpen(false);
                            navigate(path);
                          })
                        )}
                      </div>
                      <div className={cn(
                        'text-[10px] text-muted-foreground opacity-50 px-1',
                        msg.role === 'user' ? 'text-right' : 'text-left'
                      )}>
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Loading dots (while waiting for first chunk) */}
              {isLoading && messages.at(-1)?.content === '' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <div className="bg-card/50 border border-border/50 px-4 py-3 rounded-2xl rounded-tl-none flex items-center space-x-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">{botName} is thinking…</span>
                  </div>
                </motion.div>
              )}

              {/* Handoff connect form */}
              {showHandoffForm && liveChatMode === 'none' && (
                <div className="mx-3 my-2 p-3 bg-white/5 border border-white/10 rounded-2xl space-y-2">
                  <p className="text-xs font-medium text-foreground">Connect with a live agent</p>
                  <input
                    value={handoffName}
                    onChange={e => setHandoffName(e.target.value)}
                    placeholder="Your name *"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary/50"
                  />
                  <input
                    value={handoffEmail}
                    onChange={e => setHandoffEmail(e.target.value)}
                    placeholder="Email (optional)"
                    type="email"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary/50"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => { if (handoffName.trim()) connectLiveChat(handoffName, handoffEmail); }}
                      disabled={!handoffName.trim()}
                      className="flex-1 bg-primary text-white rounded-lg py-1.5 text-sm font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors"
                    >
                      Connect →
                    </button>
                    <button
                      onClick={() => setShowHandoffForm(false)}
                      className="px-3 rounded-lg bg-white/5 hover:bg-white/10 text-sm transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Live chat messages */}
              {lcMessages.map(msg => {
                // ── Agent joined highlight ───────────────────────────────────
                if (msg.isJoin) return (
                  <motion.div key={msg.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="flex justify-center">
                    <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 rounded-full px-4 py-1.5 text-xs font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
                      {msg.content}
                    </div>
                  </motion.div>
                );
                // ── Other system messages ────────────────────────────────────
                if (msg.sender === 'system') return (
                  <motion.div key={msg.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex justify-center">
                    <span className="text-xs text-muted-foreground/60 italic px-3 py-0.5">
                      {msg.content}
                    </span>
                  </motion.div>
                );
                // ── Agent message ────────────────────────────────────────────
                if (msg.sender === 'agent') return (
                  <motion.div key={msg.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start gap-2">
                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shrink-0 shadow-md mt-1">
                      <span className="text-white text-[10px] font-bold">{(msg.senderName || 'A')[0].toUpperCase()}</span>
                    </div>
                    <div className="space-y-0.5 max-w-[78%]">
                      <p className="text-[10px] text-green-400 font-medium px-1">{msg.senderName || 'Agent'}</p>
                      <div className="bg-card/60 border border-border/40 rounded-2xl rounded-tl-none px-4 py-2.5 text-sm text-foreground shadow-sm">
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      </div>
                      <p className="text-[10px] text-muted-foreground/50 px-1">
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </motion.div>
                );
                // ── Visitor message ──────────────────────────────────────────
                return (
                  <motion.div key={msg.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    className="flex justify-end">
                    <div className="space-y-0.5 max-w-[78%]">
                      <div className="bg-primary/90 text-primary-foreground rounded-2xl rounded-tr-none px-4 py-2.5 text-sm shadow-sm border border-primary/20">
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      </div>
                      <p className="text-[10px] text-muted-foreground/50 text-right px-1">
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </motion.div>
                );
              })}

              {/* Live chat agent typing indicator */}
              {lcAgentTyping && liveChatMode === 'active' && (
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }} className="flex justify-start gap-2 items-end">
                  <div className="h-7 w-7 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shrink-0 shadow-md">
                    <span className="text-white text-[10px] font-bold">{(lcAgent?.name || 'A')[0].toUpperCase()}</span>
                  </div>
                  <div className="bg-card/60 border border-border/40 rounded-2xl rounded-tl-none px-4 py-2.5 flex items-center gap-1.5">
                    {[0, 1, 2].map(i => (
                      <span key={i} className="w-1.5 h-1.5 bg-green-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 bg-background/50 backdrop-blur-md border-t border-border/50 z-10">
              <form
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className="relative flex items-center gap-2 bg-card border border-border/50 rounded-2xl p-2 shadow-inner focus-within:ring-2 focus-within:ring-primary/20 transition-all"
              >
                <input
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    // emit typing when in live chat
                    if (liveChatMode === 'active' && lcSocketRef.current) {
                      lcSocketRef.current.emit('lc:typing', { sessionId: sessionId.current, isTyping: true });
                      if (lcTypingTimeoutRef.current) clearTimeout(lcTypingTimeoutRef.current);
                      lcTypingTimeoutRef.current = setTimeout(() => {
                        lcSocketRef.current?.emit('lc:typing', { sessionId: sessionId.current, isTyping: false });
                      }, 1500);
                    }
                  }}
                  placeholder={`Ask ${botName} about our services…`}
                  disabled={isLoading}
                  className="flex-grow bg-transparent border-none outline-none px-2 h-10 text-sm placeholder:text-muted-foreground disabled:opacity-50"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim() || isLoading}
                  className={cn(
                    'h-10 w-10 rounded-xl transition-all duration-300',
                    input.trim() && !isLoading
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/40'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {isLoading
                    ? <Loader2 className="h-5 w-5 animate-spin" />
                    : <Send className="h-5 w-5" />
                  }
                </Button>
              </form>
              <p className="text-center text-[10px] text-muted-foreground/50 mt-2">
                Powered by Claude · Answers are limited to business topics
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trigger Button */}
      <AnimatePresence>
        {!isOpen && !hidden && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            className="fixed bottom-6 right-6 z-50 group"
          >
            <motion.button
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsOpen(true)}
              className="relative h-16 w-16 rounded-[2rem] bg-gradient-to-br from-primary to-purple-600 text-white shadow-2xl flex items-center justify-center border-2 border-white/20"
            >
              <div className="absolute inset-0 rounded-[2rem] bg-white/20 blur-md group-hover:blur-lg transition-all opacity-0 group-hover:opacity-100" />
              <MessageCircle className="h-8 w-8 relative z-10" />
              <span className="absolute top-0 right-0 h-4 w-4 bg-green-500 rounded-full border-2 border-background animate-pulse" />
              <div className="absolute right-full mr-4 bg-background/80 backdrop-blur border border-border px-4 py-2 rounded-xl shadow-xl text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 pointer-events-none">
                Chat with {botName}
                <div className="absolute top-1/2 -right-1.5 w-3 h-3 bg-background/80 border-t border-r border-border transform rotate-45 -translate-y-1/2" />
              </div>
            </motion.button>
            {/* Hide-widget badge — appears on hover */}
            <button
              onClick={hide}
              title="Hide chatbot"
              className="absolute -top-1.5 -left-1.5 h-6 w-6 rounded-full bg-background border border-border shadow flex items-center justify-center text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Docked tab when hidden */}
      <AnimatePresence>
        {hidden && !isOpen && <ChatbotDockTab onClick={show} />}
      </AnimatePresence>
    </>
  );
}
