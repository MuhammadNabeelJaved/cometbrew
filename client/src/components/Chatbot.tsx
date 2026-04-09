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
import {
  MessageCircle, X, Send, Bot, Loader2,
  Paperclip, FileText, Sparkles, Minimize2, Maximize2,
  Trash2, Mic, AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { cn } from '../lib/utils';
import { streamChat, getPublicConfig } from '../api/chatbot.api';
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

// ─── Markdown renderer ────────────────────────────────────────────────────────

/**
 * Renders a subset of markdown commonly produced by Claude:
 * headings (##/###), bold (**), italic (*/_), inline code (backtick),
 * bullet lists (- / *), numbered lists (1.), horizontal rules (---), line breaks.
 * Safe — no dangerouslySetInnerHTML; builds React elements directly.
 */
function renderMarkdown(raw: string, streaming = false): React.ReactNode {
  const lines = raw.split('\n');
  const nodes: React.ReactNode[] = [];

  // Inline: bold, italic, inline-code, links
  const inline = (text: string, key: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    // regex covers: **bold**, *italic*, `code`
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

    // Collect bullet list block (- or * or •)
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

    // Collect numbered list block (1. 2. …)
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

    // Empty line → visual spacer (skip consecutive blanks)
    if (trimmed === '') {
      if (nodes.length > 0) nodes.push(<div key={`br-${i}`} className="h-2" />);
      i++; continue;
    }

    // Normal paragraph line
    nodes.push(
      <p key={i} className="leading-relaxed">{inline(trimmed, `p${i}`)}</p>
    );
    i++;
  }

  return (
    <div className="space-y-0.5 text-sm">
      {nodes}
      {streaming && (
        <span className="inline-block w-2 h-4 bg-primary/60 ml-0.5 animate-pulse rounded-sm align-middle" />
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

export function Chatbot() {
  const [isOpen,     setIsOpen]     = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [input,      setInput]      = useState('');
  const [isLoading,  setIsLoading]  = useState(false);
  const [messages,   setMessages]   = useState<Message[]>([]);
  const [config,     setConfig]     = useState<PublicChatbotConfig | null>(null);
  const [configErr,  setConfigErr]  = useState(false);

  const scrollRef    = useRef<HTMLDivElement>(null);
  const abortRef     = useRef<AbortController | null>(null);
  const sessionId    = useRef(getOrCreateSessionId());

  // ── Load public config once ───────────────────────────────────────────────
  useEffect(() => {
    getPublicConfig()
      .then(cfg => {
        setConfig(cfg);
        if (cfg.isEnabled) {
          setMessages([{
            id:        'welcome',
            role:      'assistant',
            content:   cfg.welcomeMessage,
            timestamp: new Date(),
          }]);
        }
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

    await streamChat({
      message:   text,
      sessionId: sessionId.current,
      history,
      signal:    abortRef.current.signal,

      onDelta: (chunk) => {
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantMsgId
              ? { ...m, content: m.content + chunk }
              : m
          )
        );
      },

      onDone: () => {
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantMsgId
              ? { ...m, isStreaming: false }
              : m
          )
        );
        setIsLoading(false);
      },

      onError: (errMsg) => {
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
      // AbortError — user navigated away or sent a new message
      setIsLoading(false);
    });
  };

  // ── Clear conversation ────────────────────────────────────────────────────
  const handleClear = () => {
    const welcome = config?.welcomeMessage || "Hi! I'm Nova. How can I help?";
    sessionId.current = crypto.randomUUID();
    localStorage.setItem('nova_session_id', sessionId.current);
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: welcome,
      timestamp: new Date(),
    }]);
  };

  // ── Don't render if disabled or config failed ─────────────────────────────
  if (configErr || (config !== null && !config.isEnabled)) return null;

  const botName = config?.botName || 'Nova';

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9, rotateX: 10 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              rotateX: 0,
              width:  isExpanded ? '800px' : '384px',
              height: isExpanded ? '80vh'  : '600px',
            }}
            exit={{ opacity: 0, y: 50, scale: 0.9, rotateX: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              'fixed bottom-24 right-6 max-w-[calc(100vw-3rem)] max-h-[calc(100vh-8rem)]',
              'bg-background/80 backdrop-blur-xl border border-primary/20 rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden',
              'ring-1 ring-white/10 dark:ring-white/5',
              isExpanded && 'right-1/2 translate-x-1/2 bottom-10',
            )}
            style={{ transformOrigin: 'bottom right' }}
          >
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
                  onClick={() => setIsExpanded(e => !e)}
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

            {/* Messages */}
            <div className="flex-grow overflow-y-auto p-4 space-y-6 relative z-0" ref={scrollRef}>
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
                          renderMarkdown(msg.content, msg.isStreaming)
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
            </div>

            {/* Input */}
            <div className="p-4 bg-background/50 backdrop-blur-md border-t border-border/50 z-10">
              <form
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className="relative flex items-center gap-2 bg-card border border-border/50 rounded-2xl p-2 shadow-inner focus-within:ring-2 focus-within:ring-primary/20 transition-all"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
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
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 h-16 w-16 rounded-[2rem] bg-gradient-to-br from-primary to-purple-600 text-white shadow-2xl flex items-center justify-center z-50 group border-2 border-white/20"
          >
            <div className="absolute inset-0 rounded-[2rem] bg-white/20 blur-md group-hover:blur-lg transition-all opacity-0 group-hover:opacity-100" />
            <MessageCircle className="h-8 w-8 relative z-10" />
            <span className="absolute top-0 right-0 h-4 w-4 bg-green-500 rounded-full border-2 border-background animate-pulse" />
            <div className="absolute right-full mr-4 bg-background/80 backdrop-blur border border-border px-4 py-2 rounded-xl shadow-xl text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 pointer-events-none">
              Chat with {botName}
              <div className="absolute top-1/2 -right-1.5 w-3 h-3 bg-background/80 border-t border-r border-border transform rotate-45 -translate-y-1/2" />
            </div>
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
