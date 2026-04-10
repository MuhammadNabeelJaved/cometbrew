/**
 * Team AI Assistant — full-page chat powered by Nova AI.
 *
 * Uses the authenticated /api/v1/chatbot/team-chat endpoint so the AI has
 * access to the team member's assigned client projects, portfolio projects,
 * and team profile data.
 *
 * Layout:
 *   [Chat area]  |  [drag divider]  |  [Info sidebar]
 *
 * The divider can be dragged left/right to resize.  The sidebar is collapsible.
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bot, Send, Loader2, Sparkles, Trash2, Copy,
  ChevronRight, ChevronLeft, AlertCircle, ArrowRight,
  FolderKanban, CheckSquare, Users, Briefcase, RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../components/ui/button';
import { cn } from '../../lib/utils';
import { streamTeamChat, getConfig, getChatHistory } from '../../api/chatbot.api';
import type { ChatMessage } from '../../api/chatbot.api';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  error?: boolean;
}

const SESSION_KEY   = 'team-ai-page-session';
const CHARS_PER_TICK = 4;

// ─── Markdown renderer ────────────────────────────────────────────────────────
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
      else if (m[4]) parts.push(<code key={`${key}-c${idx}`} className="bg-muted/60 px-1 py-0.5 rounded text-xs font-mono">{m[4]}</code>);
      last = m.index + m[0].length; idx++;
    }
    if (last < text.length) parts.push(text.slice(last));
    return parts.length === 1 ? parts[0] : <React.Fragment key={key}>{parts}</React.Fragment>;
  };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i]; const trimmed = line.trim();
    if (/^[-*_]{3,}$/.test(trimmed)) { nodes.push(<hr key={i} className="border-border/40 my-3" />); i++; continue; }
    const hMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (hMatch) { nodes.push(<p key={i} className={hMatch[1].length === 1 ? 'text-base font-bold mt-3 mb-1' : 'text-sm font-bold mt-2 mb-0.5'}>{inline(hMatch[2], `h${i}`)}</p>); i++; continue; }
    if (/^[-*•]\s/.test(trimmed)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && /^[-*•]\s/.test(lines[i].trim())) {
        const text = lines[i].trim().replace(/^[-*•]\s+/, '');
        items.push(<li key={i} className="flex gap-2 items-start"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500/70 shrink-0" /><span>{inline(text, `li${i}`)}</span></li>);
        i++;
      }
      nodes.push(<ul key={`ul-${i}`} className="space-y-1.5 my-2 pl-1">{items}</ul>);
      continue;
    }
    if (/^\d+\.\s/.test(trimmed)) {
      const items: React.ReactNode[] = []; let num = 1;
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        const text = lines[i].trim().replace(/^\d+\.\s+/, '');
        items.push(<li key={i} className="flex gap-2 items-start"><span className="shrink-0 font-semibold text-emerald-600 min-w-[1.2rem]">{num}.</span><span>{inline(text, `nl${i}`)}</span></li>);
        i++; num++;
      }
      nodes.push(<ol key={`ol-${i}`} className="space-y-1.5 my-2 pl-1">{items}</ol>);
      continue;
    }
    if (trimmed === '') { if (nodes.length > 0) nodes.push(<div key={`br-${i}`} className="h-2" />); i++; continue; }
    nodes.push(<p key={i} className="leading-relaxed">{inline(trimmed, `p${i}`)}</p>);
    i++;
  }

  return (
    <div className="text-sm space-y-0.5">
      {nodes}
      {streaming && <span className="inline-block w-2 h-4 bg-emerald-500/60 ml-0.5 animate-pulse rounded-sm align-middle" />}
    </div>
  );
}

// ─── Defaults ─────────────────────────────────────────────────────────────────
const DEFAULT_TEAM_PROMPTS = [
  'Which projects am I assigned to?',
  'What tasks are due this week?',
  'Show me client project details',
  'Help me write a project update',
];

const CAPABILITIES = [
  { icon: FolderKanban, label: 'Assigned Client Projects', desc: 'Status, client, budget, deadlines, team'  },
  { icon: Briefcase,    label: 'Portfolio Projects',       desc: 'AdminProject entries for reference'        },
  { icon: CheckSquare,  label: 'Task Context',             desc: 'Work planning, priorities, scheduling'     },
  { icon: Users,        label: 'Team Profile',             desc: 'Your role, position, department, skills'   },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function TeamAIChat() {
  const [messages,     setMessages]     = useState<Message[]>([]);
  const [input,        setInput]        = useState('');
  const [isSending,    setIsSending]    = useState(false);
  const [sidebarOpen,  setSidebarOpen]  = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [quickPrompts, setQuickPrompts] = useState<string[]>(DEFAULT_TEAM_PROMPTS);
  const [copied,       setCopied]       = useState<string | null>(null);
  const [hasHistory,   setHasHistory]   = useState(false);

  const sessionIdRef   = useRef<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLTextAreaElement>(null);
  const abortRef       = useRef<AbortController | null>(null);
  const containerRef   = useRef<HTMLDivElement>(null);
  const dividerRef     = useRef<boolean>(false);
  const dividerStartX  = useRef<number>(0);
  const dividerStartW  = useRef<number>(280);

  const twBufferRef = useRef<Map<string, { buffer: string; done: boolean; displayed: number }>>(new Map());
  const twTimerRef  = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  // Session init + history
  useEffect(() => {
    const s = localStorage.getItem(SESSION_KEY);
    const sessionId = s || crypto.randomUUID();
    if (!s) localStorage.setItem(SESSION_KEY, sessionId);
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
  }, []);

  // Load team quick prompts from server
  useEffect(() => {
    getConfig().then(c => {
      if (c.teamChatQuickPrompts?.length) setQuickPrompts(c.teamChatQuickPrompts);
    }).catch(() => {});
  }, []);

  // Auto-scroll
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Cleanup
  useEffect(() => () => {
    abortRef.current?.abort();
    twTimerRef.current.forEach(t => clearInterval(t));
  }, []);

  // ── Resize divider ─────────────────────────────────────────────────────────
  const onDividerMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    dividerRef.current    = true;
    dividerStartX.current = e.clientX;
    dividerStartW.current = sidebarWidth;
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dividerRef.current) return;
      const delta = dividerStartX.current - e.clientX;
      const container = containerRef.current;
      const maxW = container ? container.clientWidth * 0.55 : 600;
      setSidebarWidth(Math.max(200, Math.min(maxW, dividerStartW.current + delta)));
    };
    const onUp = () => { dividerRef.current = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, []);

  // ── Typewriter ─────────────────────────────────────────────────────────────
  const startTypewriter = useCallback((msgId: string) => {
    twBufferRef.current.set(msgId, { buffer: '', done: false, displayed: 0 });
    const timer = setInterval(() => {
      const state = twBufferRef.current.get(msgId);
      if (!state) { clearInterval(timer); return; }
      if (state.displayed >= state.buffer.length) {
        if (state.done) {
          clearInterval(timer);
          twTimerRef.current.delete(msgId); twBufferRef.current.delete(msgId);
          setMessages(prev => prev.map(m => m.id === msgId ? { ...m, isStreaming: false } : m));
        }
        return;
      }
      const next = Math.min(state.displayed + CHARS_PER_TICK, state.buffer.length);
      state.displayed = next;
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: state.buffer.slice(0, next) } : m));
    }, 15);
    twTimerRef.current.set(msgId, timer);
  }, []);

  // ── Send ───────────────────────────────────────────────────────────────────
  const handleSend = useCallback(async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || isSending) return;
    setInput('');
    setIsSending(true);

    const userMsgId = crypto.randomUUID();
    const asstMsgId = crypto.randomUUID();
    const now = new Date();
    setMessages(prev => [
      ...prev,
      { id: userMsgId, role: 'user',      content: msg, timestamp: now },
      { id: asstMsgId, role: 'assistant', content: '', timestamp: now, isStreaming: true },
    ]);

    const history: ChatMessage[] = messages.map(m => ({ role: m.role, content: m.content }));
    startTypewriter(asstMsgId);
    const ac = new AbortController();
    abortRef.current = ac;

    try {
      await streamTeamChat({
        message: msg, sessionId: sessionIdRef.current, history, signal: ac.signal,
        onDelta: chunk => { const s = twBufferRef.current.get(asstMsgId); if (s) s.buffer += chunk; },
        onDone:  ()    => { const s = twBufferRef.current.get(asstMsgId); if (s) s.done = true; },
        onError: err => {
          twTimerRef.current.get(asstMsgId) && clearInterval(twTimerRef.current.get(asstMsgId)!);
          twTimerRef.current.delete(asstMsgId); twBufferRef.current.delete(asstMsgId);
          setMessages(prev => prev.map(m => m.id === asstMsgId ? { ...m, content: err, isStreaming: false, error: true } : m));
        },
      });
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        twTimerRef.current.get(asstMsgId) && clearInterval(twTimerRef.current.get(asstMsgId)!);
        twTimerRef.current.delete(asstMsgId); twBufferRef.current.delete(asstMsgId);
        setMessages(prev => prev.map(m => m.id === asstMsgId ? { ...m, content: 'Network error. Please try again.', isStreaming: false, error: true } : m));
      }
    } finally {
      setIsSending(false);
    }
  }, [input, isSending, messages, startTypewriter]);

  const handleClear = () => {
    abortRef.current?.abort();
    twTimerRef.current.forEach(t => clearInterval(t));
    twTimerRef.current.clear(); twBufferRef.current.clear();
    setMessages([]); setIsSending(false); setHasHistory(false);
    const id = crypto.randomUUID(); sessionIdRef.current = id; localStorage.setItem(SESSION_KEY, id);
  };

  const handleCopy = async (content: string, id: string) => {
    await navigator.clipboard.writeText(content).catch(() => {});
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
    toast.success('Copied to clipboard');
  };

  return (
    <div ref={containerRef} className="flex h-[calc(100vh-6rem)] gap-0 overflow-hidden rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm shadow-xl">

      {/* ── Chat area ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/40 bg-background/60 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-sm flex items-center gap-2">
                Nova — Your Work Assistant
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold border border-emerald-500/20">TEAM</span>
              </h2>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                Online · Access to your assigned projects & team data
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleClear} title="Clear conversation" className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </button>
            <button onClick={() => setSidebarOpen(o => !o)} title="Toggle info panel" className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground hidden md:flex">
              {sidebarOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 scroll-smooth">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-12">
              <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-2xl shadow-emerald-500/20">
                <Sparkles className="h-10 w-10 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Hi! I'm Nova, your work assistant.</h3>
                <p className="text-muted-foreground text-sm mt-1 max-w-sm">
                  I have access to your assigned projects, team data, and work context. Ask me anything!
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md mt-2">
                {quickPrompts.map(q => (
                  <button
                    key={q}
                    onClick={() => handleSend(q)}
                    className="text-left text-sm px-4 py-3 rounded-xl bg-muted/40 hover:bg-muted border border-border/40 hover:border-emerald-500/30 text-muted-foreground hover:text-foreground transition-all group"
                  >
                    <ArrowRight className="h-3.5 w-3.5 inline mr-1.5 text-emerald-500/60 group-hover:translate-x-0.5 transition-transform" />
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {hasHistory && messages.length > 0 && (
            <div className="flex items-center gap-2 py-1">
              <div className="flex-1 h-px bg-border/40" />
              <span className="text-[10px] text-muted-foreground/50 font-medium whitespace-nowrap px-2">Previous conversation</span>
              <div className="flex-1 h-px bg-border/40" />
            </div>
          )}

          {messages.map(msg => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group`}
            >
              {msg.role === 'assistant' && (
                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 mr-3 mt-0.5 shadow-md">
                  <Bot className="h-4 w-4 text-white" />
                </div>
              )}
              <div className="max-w-[78%] space-y-1">
                <div className={cn(
                  'rounded-2xl px-4 py-3 shadow-sm',
                  msg.role === 'user'
                    ? 'bg-emerald-600 text-white rounded-tr-none'
                    : 'bg-card border border-border/50 rounded-tl-none',
                  msg.error && 'border-red-500/30 bg-red-500/5',
                )}>
                  {msg.role === 'assistant' ? (
                    <div className="flex gap-1.5">
                      {msg.error && <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />}
                      {renderMarkdown(msg.content, msg.isStreaming)}
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  )}
                </div>
                <div className={`flex items-center gap-2 text-[10px] text-muted-foreground ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <span>{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {msg.role === 'assistant' && !msg.isStreaming && (
                    <button
                      onClick={() => handleCopy(msg.content, msg.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-foreground flex items-center gap-1"
                    >
                      <Copy className="h-3 w-3" />
                      {copied === msg.id ? 'Copied!' : 'Copy'}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}

          {isSending && messages.at(-1)?.role !== 'assistant' && (
            <div className="flex justify-start items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 shadow-md">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="bg-card border border-border/50 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
                <div className="flex gap-1.5">
                  {[0,1,2].map(i => <div key={i} className="h-2 w-2 bg-emerald-500/60 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="shrink-0 p-4 border-t border-border/40 bg-background/60 backdrop-blur-md">
          <div className="flex items-end gap-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Ask me about your projects, tasks, clients, or deadlines…"
              rows={1}
              className="flex-1 resize-none text-sm px-4 py-3 rounded-2xl bg-muted/40 border border-border/50 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 placeholder:text-muted-foreground text-foreground max-h-40 leading-relaxed transition-colors"
              style={{ minHeight: '48px' }}
              onInput={e => { const t = e.currentTarget; t.style.height = 'auto'; t.style.height = `${Math.min(t.scrollHeight, 160)}px`; }}
            />
            <Button
              onClick={() => handleSend()}
              disabled={!input.trim() || isSending}
              className="h-12 w-12 p-0 rounded-2xl shrink-0 bg-gradient-to-br from-emerald-500 to-teal-600 hover:opacity-90 shadow-lg shadow-emerald-500/25"
            >
              {isSending ? <Loader2 className="h-5 w-5 animate-spin text-white" /> : <Send className="h-5 w-5 text-white" />}
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground/50 text-center mt-2">
            Shift+Enter for new line · AI responses may not always be 100% accurate
          </p>
        </div>
      </div>

      {/* ── Resize divider ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {sidebarOpen && (
          <div
            onMouseDown={onDividerMouseDown}
            className="hidden md:flex w-1.5 cursor-col-resize items-center justify-center group shrink-0 bg-transparent hover:bg-emerald-500/20 transition-colors"
            title="Drag to resize"
          >
            <div className="w-0.5 h-12 rounded-full bg-border/50 group-hover:bg-emerald-500/40 transition-colors" />
          </div>
        )}
      </AnimatePresence>

      {/* ── Info Sidebar ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            key="sidebar"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: sidebarWidth, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="hidden md:flex flex-col border-l border-border/40 bg-background/40 backdrop-blur-md overflow-hidden shrink-0"
            style={{ width: sidebarWidth }}
          >
            <div className="flex-1 overflow-y-auto p-4 space-y-5">

              {/* Suggested Prompts */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-emerald-500" />
                  <h3 className="text-sm font-semibold">Suggested Prompts</h3>
                </div>
                <div className="space-y-1.5">
                  {quickPrompts.map(p => (
                    <button
                      key={p}
                      onClick={() => handleSend(p)}
                      disabled={isSending}
                      className="w-full text-left text-xs px-3 py-2.5 rounded-xl bg-muted/40 hover:bg-muted border border-border/30 hover:border-emerald-500/30 text-muted-foreground hover:text-foreground transition-all group disabled:opacity-50"
                    >
                      <ArrowRight className="h-3 w-3 inline mr-1.5 text-emerald-500/50 group-hover:translate-x-0.5 transition-transform" />
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* What I can access */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <RefreshCw className="h-4 w-4 text-emerald-500" />
                  <h3 className="text-sm font-semibold">What I Can Access</h3>
                </div>
                <div className="space-y-2">
                  {CAPABILITIES.map(({ icon: Icon, label, desc }) => (
                    <div key={label} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-muted/30 border border-border/20">
                      <Icon className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium">{label}</p>
                        <p className="text-[11px] text-muted-foreground">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tips */}
              <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">Tips</p>
                <p>• Ask about specific clients — "Show me the Acme Corp project"</p>
                <p>• Plan your week — "What are my upcoming deadlines?"</p>
                <p>• Get summaries — "Summarise all my in-progress projects"</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
