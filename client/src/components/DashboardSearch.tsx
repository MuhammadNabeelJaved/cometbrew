/**
 * DashboardSearch — Command Palette
 *
 * A Cmd+K / Ctrl+K searchable command palette for all three dashboards.
 * The modal is rendered via createPortal at document.body to avoid z-index /
 * backdrop-filter stacking-context issues with the sticky header.
 *
 * Usage:
 *   <DashboardSearch role="admin" />
 *   <DashboardSearch role="team" />
 *   <DashboardSearch role="user" />
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ArrowRight, CornerDownLeft } from 'lucide-react';
import {
  LayoutDashboard, FolderKanban, Users, Mail, Briefcase, Database,
  Megaphone, LayoutList, PenTool, Bot, MessageSquare, MessageCircle, CreditCard,
  HelpCircle, Bell, Settings, Zap, CheckSquare, Calendar, Files,
  BarChart2, Sparkles, User, Activity, Globe, FileText, Star, Package,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SearchItem {
  id: string;
  label: string;
  description?: string;
  path: string;
  icon: React.ElementType;
  group: string;
  keywords?: string[];
}

// ─── Item registries ──────────────────────────────────────────────────────────

const ADMIN_ITEMS: SearchItem[] = [
  { id: 'a-home',        label: 'Dashboard',              description: 'Overview & key metrics',         path: '/admin',                  icon: LayoutDashboard, group: 'Pages',   keywords: ['home', 'overview', 'stats'] },
  { id: 'a-messages',    label: 'Messages',               description: 'User & team chat',               path: '/admin/messages',          icon: MessageSquare,   group: 'Pages',   keywords: ['chat', 'inbox', 'dm'] },
  { id: 'a-projects',    label: 'Projects',               description: 'Portfolio projects',             path: '/admin/projects',          icon: FolderKanban,    group: 'Pages',   keywords: ['portfolio', 'work'] },
  { id: 'a-requests',    label: 'Project Requests',       description: 'Client project submissions',     path: '/admin/client-requests',   icon: Package,         group: 'Pages',   keywords: ['client', 'requests', 'submissions'] },
  { id: 'a-clients',     label: 'Clients',                description: 'CRM — manage agency clients',    path: '/admin/clients',           icon: Users,           group: 'Pages',   keywords: ['crm', 'accounts', 'customers'] },
  { id: 'a-services',    label: 'Services',               description: 'Agency services catalogue',      path: '/admin/services',          icon: Zap,             group: 'Pages',   keywords: ['offerings', 'packages'] },
  { id: 'a-team',        label: 'Team Management',        description: 'Manage team members',            path: '/admin/team',              icon: Users,           group: 'Pages',   keywords: ['staff', 'members', 'hr'] },
  { id: 'a-contacts',    label: 'Contacts',               description: 'Contact form submissions',       path: '/admin/contacts',          icon: Mail,            group: 'Pages',   keywords: ['leads', 'inquiries', 'forms'] },
  { id: 'a-jobs',        label: 'Job Postings',           description: 'Manage open positions',          path: '/admin/jobs',              icon: Briefcase,       group: 'Pages',   keywords: ['careers', 'hiring', 'positions'] },
  { id: 'a-apps',        label: 'Job Applications',       description: 'Review applicants',              path: '/admin/job-applications',  icon: FileText,        group: 'Pages',   keywords: ['applicants', 'candidates', 'hiring'] },
  { id: 'a-ai',          label: 'AI Tools',               description: 'AI-powered features',            path: '/admin/ai-tools',          icon: Bot,             group: 'Pages',   keywords: ['artificial intelligence', 'gpt', 'automation'] },
  { id: 'a-chatbot',     label: 'Chatbot Manager',        description: 'WEB AI config, knowledge & logs', path: '/admin/chatbot-manager',              icon: MessageCircle,   group: 'Pages',   keywords: ['webai', 'web ai', 'chatbot', 'claude', 'ai', 'knowledge', 'sessions'] },
  { id: 'a-chatbot-kb',  label: 'Chatbot Knowledge Base', description: 'Add/edit knowledge entries',        path: '/admin/chatbot-manager?tab=knowledge', icon: MessageCircle,   group: 'Pages',   keywords: ['knowledge', 'faq', 'documents', 'rag'] },
  { id: 'a-chatbot-cfg', label: 'Chatbot Config',         description: 'API keys, system prompt, model',   path: '/admin/chatbot-manager?tab=config',    icon: MessageCircle,   group: 'Pages',   keywords: ['api key', 'claude', 'model', 'prompt', 'config'] },
  { id: 'a-chatbot-logs',    label: 'Conversation Logs',  description: 'View & manage chat sessions',          path: '/admin/chatbot-manager?tab=logs',     icon: MessageCircle,   group: 'Pages',   keywords: ['sessions', 'conversations', 'logs', 'history'] },
  { id: 'a-chatbot-userbot', label: 'User Bot Settings', description: 'Manage client dashboard AI assistant', path: '/admin/chatbot-manager?tab=user-bot', icon: MessageCircle,   group: 'Pages',   keywords: ['user chatbot', 'client assistant', 'user dashboard bot'] },
  { id: 'a-chatbot-teambot', label: 'Team Bot Settings', description: 'Manage team dashboard AI assistant',   path: '/admin/chatbot-manager?tab=team-bot', icon: MessageCircle,   group: 'Pages',   keywords: ['team chatbot', 'team assistant', 'team dashboard bot'] },
  { id: 'a-chatbot-cost',   label: 'Chatbot Cost & Usage', description: 'API spend, token usage & pricing',   path: '/admin/chatbot-manager?tab=cost',     icon: MessageCircle,   group: 'Pages',   keywords: ['cost', 'usage', 'billing', 'tokens', 'api spend', 'pricing'] },
  { id: 'a-support',     label: 'Client Tickets',         description: 'Manage client support tickets',  path: '/admin/support',           icon: HelpCircle,      group: 'Pages',   keywords: ['help', 'tickets', 'issues', 'support', 'client'] },
  { id: 'a-notifs',      label: 'Notifications',          description: 'Notification centre',            path: '/admin/notifications',     icon: Bell,            group: 'Pages',   keywords: ['alerts', 'updates'] },
  { id: 'a-performance', label: 'Performance Monitor',    description: 'Server health, cache & Web Vitals', path: '/admin/performance',      icon: Activity,        group: 'Pages',   keywords: ['health', 'uptime', 'memory', 'redis', 'cache', 'web vitals', 'metrics', 'monitoring', 'lcp', 'cls', 'ttfb'] },
  { id: 'a-settings',    label: 'Settings',               description: 'Account & system settings',      path: '/admin/settings',          icon: Settings,        group: 'Pages',   keywords: ['config', 'preferences', 'account'] },
  { id: 'a-content',     label: 'Content Editor',         description: 'Edit public website content',    path: '/admin/content-editor',    icon: PenTool,         group: 'Pages',   keywords: ['cms', 'copy', 'text', 'website'] },
  { id: 'a-nav-footer',  label: 'Nav & Footer Manager',   description: 'Manage navbar & footer links',   path: '/admin/nav-footer',        icon: Package,         group: 'Pages',   keywords: ['navbar', 'footer', 'links', 'navigation', 'menu'] },
  { id: 'a-pages',       label: 'Page Manager',           description: 'Control page visibility',        path: '/admin/page-manager',      icon: LayoutList,      group: 'Pages',   keywords: ['visibility', 'maintenance', 'coming soon'] },
  { id: 'a-announce',    label: 'Announcements',          description: 'Manage announcement bar',        path: '/admin/announcements',     icon: Megaphone,       group: 'Pages',   keywords: ['banner', 'ticker', 'notice'] },
  { id: 'a-database',    label: 'Database Manager',       description: 'Monitor & query MongoDB',        path: '/admin/database',          icon: Database,        group: 'Pages',   keywords: ['mongo', 'collections', 'query', 'stats'] },
  { id: 'a-categories',  label: 'Categories',             description: 'Manage service categories',      path: '/admin/categories',        icon: Star,            group: 'Pages',   keywords: ['tags', 'taxonomy'] },
  // Content Editor — individual sections (deep-link via ?tab=)
  { id: 'a-ce-hero',       label: 'Hero Section',           description: 'Content Editor → Hero',         path: '/admin/content-editor?tab=hero',         icon: PenTool,   group: 'Content Sections', keywords: ['homepage', 'banner', 'headline', 'badge', 'title'] },
  { id: 'a-ce-logo',       label: 'Logo',                   description: 'Content Editor → Logo',         path: '/admin/content-editor?tab=logo',         icon: PenTool,   group: 'Content Sections', keywords: ['brand', 'image', 'logo url'] },
  { id: 'a-ce-tech',       label: 'Tech Stack',             description: 'Content Editor → Tech Stack',   path: '/admin/content-editor?tab=tech',         icon: PenTool,   group: 'Content Sections', keywords: ['technologies', 'tools', 'stack', 'icons'] },
  { id: 'a-ce-process',    label: 'Process Steps',          description: 'Content Editor → Process',      path: '/admin/content-editor?tab=process',      icon: PenTool,   group: 'Content Sections', keywords: ['steps', 'workflow', 'concept to reality', 'how we work'] },
  { id: 'a-ce-why',        label: 'Why Choose Us',          description: 'Content Editor → Why Choose Us',path: '/admin/content-editor?tab=why',          icon: PenTool,   group: 'Content Sections', keywords: ['features', 'cards', 'benefits', 'selling points'] },
  { id: 'a-ce-testimonials',label: 'Testimonials',          description: 'Content Editor → Testimonials', path: '/admin/content-editor?tab=testimonials', icon: PenTool,   group: 'Content Sections', keywords: ['reviews', 'quotes', 'clients', 'feedback'] },
  { id: 'a-ce-contact',    label: 'Contact Info',           description: 'Content Editor → Contact Info', path: '/admin/content-editor?tab=contact',      icon: PenTool,   group: 'Content Sections', keywords: ['address', 'email', 'phone', 'business hours'] },
  { id: 'a-ce-social',     label: 'Social Links',           description: 'Content Editor → Social Links', path: '/admin/content-editor?tab=social',       icon: PenTool,   group: 'Content Sections', keywords: ['twitter', 'linkedin', 'instagram', 'github', 'social media'] },
  { id: 'a-ce-nav-footer', label: 'Nav & Footer Links',     description: 'Content Editor → Nav & Footer', path: '/admin/content-editor?tab=nav-footer',   icon: PenTool,   group: 'Content Sections', keywords: ['navbar', 'footer', 'links', 'navigation', 'menu', 'sections'] },
  // Quick actions
  { id: 'a-new-job',     label: 'Post a New Job',         description: 'Create a new job listing',       path: '/admin/jobs',              icon: Briefcase,       group: 'Actions', keywords: ['hire', 'new position'] },
  { id: 'a-new-project', label: 'New Portfolio Project',  description: 'Add to portfolio',               path: '/admin/projects',          icon: FolderKanban,    group: 'Actions', keywords: ['add', 'create project'] },
  { id: 'a-db-query',    label: 'Run a DB Query',         description: 'Go to database query builder',   path: '/admin/database',          icon: Activity,        group: 'Actions', keywords: ['sql', 'mongo', 'find'] },
  { id: 'a-goto-site',   label: 'View Public Site',       description: 'Open the public website',        path: '/',                        icon: Globe,           group: 'Actions', keywords: ['website', 'frontend', 'public'] },
];

const TEAM_ITEMS: SearchItem[] = [
  { id: 't-home',      label: 'Dashboard',        description: 'Your team overview',             path: '/team',               icon: LayoutDashboard, group: 'Pages',   keywords: ['home', 'overview'] },
  { id: 't-projects',  label: 'Projects',         description: 'Client & portfolio projects',    path: '/team/projects',      icon: FolderKanban,    group: 'Pages',   keywords: ['portfolio', 'work', 'assignments'] },
  { id: 't-tasks',     label: 'My Tasks',         description: 'Kanban board & task list',       path: '/team/tasks',         icon: CheckSquare,     group: 'Pages',   keywords: ['kanban', 'todos', 'board'] },
  { id: 't-calendar',  label: 'Calendar',         description: 'Schedule & deadlines',           path: '/team/calendar',      icon: Calendar,        group: 'Pages',   keywords: ['schedule', 'deadlines', 'events'] },
  { id: 't-chat',      label: 'Team Chat',        description: 'Direct messages with admin',     path: '/team/chat',          icon: MessageSquare,   group: 'Pages',   keywords: ['messages', 'dm', 'inbox'] },
  { id: 't-resources', label: 'Resources',        description: 'Shared files & documents',       path: '/team/resources',     icon: Files,           group: 'Pages',   keywords: ['files', 'documents', 'shared', 'assets'] },
  { id: 't-reports',   label: 'Reports',          description: 'Performance & analytics',        path: '/team/reports',       icon: BarChart2,       group: 'Pages',   keywords: ['analytics', 'performance', 'metrics'] },
  { id: 't-notifs',    label: 'Notifications',    description: 'Alerts & updates',               path: '/team/notifications', icon: Bell,            group: 'Pages',   keywords: ['alerts', 'updates'] },
  { id: 't-settings',  label: 'Settings',         description: 'Profile & preferences',          path: '/team/settings',      icon: Settings,        group: 'Pages',   keywords: ['profile', 'account', 'preferences'] },
  { id: 't-ai',        label: 'AI Assistant',     description: 'Your AI-powered team assistant',  path: '/team/ai-assistant',  icon: Sparkles,        group: 'Pages',   keywords: ['gpt', 'ai', 'assistant', 'bot', 'nova'] },
  { id: 't-applied',   label: 'Applied Jobs',     description: 'Your job applications & status', path: '/team/applied-jobs',  icon: Briefcase,       group: 'Pages',   keywords: ['careers', 'applications', 'hiring', 'jobs'] },
  { id: 't-support',   label: 'Support',          description: 'Internal help & tickets',        path: '/team/support',       icon: HelpCircle,      group: 'Pages',   keywords: ['help', 'hr', 'it', 'tickets'] },
  { id: 't-new-task',  label: 'Go to My Tasks',   description: 'View & manage your tasks',       path: '/team/tasks',         icon: CheckSquare,     group: 'Actions', keywords: ['add task', 'create task'] },
  { id: 't-new-msg',   label: 'Open Team Chat',   description: 'Message the admin',              path: '/team/chat',          icon: MessageSquare,   group: 'Actions', keywords: ['send message', 'dm'] },
  { id: 't-goto-site', label: 'View Public Site', description: 'Open the public website',        path: '/',                   icon: Globe,           group: 'Actions', keywords: ['website', 'frontend'] },
];

const USER_ITEMS: SearchItem[] = [
  { id: 'u-home',      label: 'Overview',              description: 'Your dashboard home',           path: '/user-dashboard',               icon: LayoutDashboard, group: 'Pages',   keywords: ['home', 'stats', 'summary'] },
  { id: 'u-projects',  label: 'My Projects',           description: 'Track your project requests',   path: '/user-dashboard/projects',      icon: FolderKanban,    group: 'Pages',   keywords: ['requests', 'work', 'status'] },
  { id: 'u-messages',  label: 'Messages',              description: 'Chat with support',             path: '/user-dashboard/messages',      icon: MessageSquare,   group: 'Pages',   keywords: ['support', 'chat', 'help'] },
  { id: 'u-ai',        label: 'AI Assistant',          description: 'Your AI-powered assistant',     path: '/user-dashboard/ai-assistant',  icon: Sparkles,        group: 'Pages',   keywords: ['gpt', 'ai', 'assistant', 'bot'] },
  { id: 'u-jobs',      label: 'Applied Jobs',          description: 'Your job applications',         path: '/user-dashboard/applied-jobs',  icon: Briefcase,       group: 'Pages',   keywords: ['careers', 'applications', 'hiring'] },
  { id: 'u-billing',   label: 'Billing & Payments',   description: 'Project invoices & payment status', path: '/user-dashboard/billing',   icon: CreditCard,      group: 'Pages',   keywords: ['invoices', 'payments', 'cost', 'billing'] },
  { id: 'u-profile',   label: 'Profile & Settings',   description: 'Edit your profile & password',  path: '/user-dashboard/profile',       icon: User,            group: 'Pages',   keywords: ['account', 'avatar', 'password', 'email'] },
  { id: 'u-notifs',    label: 'Notifications',         description: 'Alerts & updates',              path: '/user-dashboard/notifications', icon: Bell,            group: 'Pages',   keywords: ['alerts', 'updates'] },
  { id: 'u-support',   label: 'Support',               description: 'Get help & raise tickets',      path: '/user-dashboard/support',       icon: HelpCircle,      group: 'Pages',   keywords: ['help', 'faq', 'tickets'] },
  { id: 'u-chat-now',  label: 'Chat with Support',     description: 'Open the support chat',         path: '/user-dashboard/messages',      icon: MessageSquare,   group: 'Actions', keywords: ['contact', 'message'] },
  { id: 'u-new-proj',  label: 'New Project Request',   description: 'Submit a project request',      path: '/user-dashboard/projects',      icon: FolderKanban,    group: 'Actions', keywords: ['create', 'request', 'submit'] },
  { id: 'u-careers',   label: 'Browse Jobs',           description: 'Open careers page',             path: '/careers',                      icon: Briefcase,       group: 'Actions', keywords: ['jobs', 'apply', 'career'] },
  { id: 'u-goto-site', label: 'View Public Site',      description: 'Open the public website',       path: '/',                             icon: Globe,           group: 'Actions', keywords: ['website', 'home'] },
];

const ITEMS_BY_ROLE: Record<string, SearchItem[]> = {
  admin: ADMIN_ITEMS,
  team:  TEAM_ITEMS,
  user:  USER_ITEMS,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function score(item: SearchItem, query: string): number {
  const q   = query.toLowerCase();
  const lbl = item.label.toLowerCase();
  const dsc = (item.description ?? '').toLowerCase();
  const kw  = (item.keywords ?? []).join(' ').toLowerCase();
  if (lbl === q)          return 100;
  if (lbl.startsWith(q))  return 80;
  if (lbl.includes(q))    return 60;
  if (dsc.includes(q))    return 40;
  if (kw.includes(q))     return 30;
  return 0;
}

function filterAndSort(items: SearchItem[], query: string): SearchItem[] {
  if (!query.trim()) return items;
  return items
    .map(item => ({ item, s: score(item, query) }))
    .filter(({ s }) => s > 0)
    .sort((a, b) => b.s - a.s)
    .map(({ item }) => item);
}

function groupItems(items: SearchItem[]): { group: string; items: SearchItem[] }[] {
  const map = new Map<string, SearchItem[]>();
  for (const item of items) {
    if (!map.has(item.group)) map.set(item.group, []);
    map.get(item.group)!.push(item);
  }
  return Array.from(map.entries()).map(([group, items]) => ({ group, items }));
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  role: 'admin' | 'team' | 'user';
}

const PLACEHOLDERS: Record<string, string> = {
  admin: 'Search pages, features, settings…',
  team:  'Search tasks, projects, resources…',
  user:  'Search your dashboard…',
};

export function DashboardSearch({ role }: Props) {
  const navigate  = useNavigate();
  const [open, setOpen]         = useState(false);
  const [query, setQuery]       = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef  = useRef<HTMLInputElement>(null);
  const listRef   = useRef<HTMLDivElement>(null);

  const allItems  = ITEMS_BY_ROLE[role] ?? ADMIN_ITEMS;
  const filtered  = filterAndSort(allItems, query);
  const grouped   = groupItems(filtered);

  // ── Open / close ─────────────────────────────────────────────────────────────
  const openPalette = useCallback(() => {
    setQuery('');
    setActiveIdx(0);
    setOpen(true);
  }, []);

  const closePalette = useCallback(() => {
    setOpen(false);
    setQuery('');
  }, []);

  // ── Cmd/Ctrl+K shortcut ───────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => {
          if (!prev) { setQuery(''); setActiveIdx(0); }
          return !prev;
        });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // ── Focus input when opened ───────────────────────────────────────────────────
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(t);
    }
  }, [open]);

  // ── Lock body scroll while open ───────────────────────────────────────────────
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

  // ── Reset active index on query change ───────────────────────────────────────
  useEffect(() => { setActiveIdx(0); }, [query]);

  // ── Scroll active item into view ─────────────────────────────────────────────
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${activeIdx}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIdx]);

  // ── Keyboard navigation ───────────────────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[activeIdx]) selectItem(filtered[activeIdx]);
    } else if (e.key === 'Escape') {
      closePalette();
    }
  };

  // ── Navigate ──────────────────────────────────────────────────────────────────
  const selectItem = (item: SearchItem) => {
    closePalette();
    navigate(item.path);
  };

  // ── Portal content ────────────────────────────────────────────────────────────
  const portal = ReactDOM.createPortal(
    <>
      {/* Backdrop — separate AnimatePresence so it doesn't fight the panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="ds-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            style={{ zIndex: 9998 }}
            onClick={closePalette}
          />
        )}
      </AnimatePresence>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="ds-panel"
            initial={{ opacity: 0, scale: 0.96, y: -16, x: '-50%' }}
            animate={{ opacity: 1, scale: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, scale: 0.96, y: -16, x: '-50%' }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-1/2"
            style={{ top: '10vh', zIndex: 9999, width: 'min(92vw, 640px)' }}
          >
            <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">

              {/* Search row */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={PLACEHOLDERS[role]}
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  autoComplete="off"
                  spellCheck={false}
                />
                {query ? (
                  <button
                    onClick={() => setQuery('')}
                    className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    tabIndex={-1}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : null}
                <button
                  onClick={closePalette}
                  className="text-[10px] text-muted-foreground bg-muted px-2 py-1 rounded border border-border hover:border-primary/40 transition-colors"
                  tabIndex={-1}
                >
                  Esc
                </button>
              </div>

              {/* Results list */}
              <div ref={listRef} className="overflow-y-auto py-1.5" style={{ maxHeight: '55vh' }}>
                {filtered.length === 0 ? (
                  <div className="px-4 py-10 text-center">
                    <p className="text-sm text-muted-foreground">
                      No results for{' '}
                      <span className="text-foreground font-medium">"{query}"</span>
                    </p>
                  </div>
                ) : (
                  grouped.map(({ group, items: gItems }) => (
                    <div key={group}>
                      <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 select-none">
                        {group}
                      </p>
                      {gItems.map(item => {
                        const flatIdx  = filtered.indexOf(item);
                        const isActive = flatIdx === activeIdx;
                        const Icon     = item.icon;
                        return (
                          <button
                            key={item.id}
                            data-idx={flatIdx}
                            onMouseDown={e => { e.preventDefault(); selectItem(item); }}
                            onMouseEnter={() => setActiveIdx(flatIdx)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                              isActive
                                ? 'bg-primary/10'
                                : 'hover:bg-muted/40'
                            }`}
                          >
                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                              isActive ? 'bg-primary/20' : 'bg-muted'
                            }`}>
                              <Icon className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium truncate ${isActive ? 'text-primary' : 'text-foreground'}`}>
                                {item.label}
                              </p>
                              {item.description && (
                                <p className="text-xs text-muted-foreground truncate mt-0.5">
                                  {item.description}
                                </p>
                              )}
                            </div>
                            <ArrowRight className={`h-3.5 w-3.5 shrink-0 transition-opacity ${isActive ? 'opacity-100 text-primary' : 'opacity-0'}`} />
                          </button>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2 border-t border-border flex items-center gap-4 text-[11px] text-muted-foreground/60 select-none">
                <span className="flex items-center gap-1">
                  <CornerDownLeft className="h-3 w-3" /> select
                </span>
                <span className="flex items-center gap-1">
                  <span className="font-mono text-xs">↑↓</span> navigate
                </span>
                <span className="flex items-center gap-1">
                  <span className="font-mono text-xs">Esc</span> close
                </span>
                <span className="ml-auto">
                  {filtered.length} result{filtered.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>,
    document.body
  );

  return (
    <>
      {/* Trigger button in the topbar */}
      <button
        onClick={openPalette}
        className="relative hidden sm:flex flex-1 max-w-xl items-center gap-3 px-4 py-2.5 rounded-full bg-muted/50 border border-border/50 hover:border-primary/40 hover:bg-muted transition-all cursor-pointer group"
        aria-label="Open command palette"
        type="button"
      >
        <Search className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
        <span className="text-sm text-muted-foreground flex-1 text-left truncate">
          {PLACEHOLDERS[role]}
        </span>
        <div className="flex items-center gap-1 shrink-0 pointer-events-none">
          <kbd className="text-[10px] text-muted-foreground bg-background px-1.5 py-0.5 rounded border border-border/50">⌘</kbd>
          <kbd className="text-[10px] text-muted-foreground bg-background px-1.5 py-0.5 rounded border border-border/50">K</kbd>
        </div>
      </button>

      {portal}
    </>
  );
}
