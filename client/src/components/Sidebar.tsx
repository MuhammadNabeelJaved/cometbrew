/**
 * Dashboard Sidebar — Admin
 *
 * Features:
 *  - Sidebar collapse/expand (persisted)
 *  - Category grouping with collapsible sections (persisted)
 *  - Drag items within & ACROSS categories
 *  - Drag category headers to reorder categories
 *  - Inline rename for categories and nav items (pencil icon on hover)
 *  - Pin to top (star icon on hover)
 */
import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Users, LayoutDashboard, MessageSquare, FolderKanban, Settings, LogOut, Zap,
  Bot, MessageCircle, HelpCircle, Bell, ChevronRight, Briefcase, PenTool,
  Database, Mail, LayoutList, Megaphone, X, PanelLeftClose, PanelLeftOpen,
  GripVertical, Star, Activity, ThumbsUp, ChevronDown, Pencil, Check,
  Search, Milestone, Workflow,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';
import {
  useSidebarPreferences,
  SidebarLinkDef,
  CategoryDef,
} from '../hooks/useSidebarPreferences';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  topOffset?: number;
}

const CATEGORIES: CategoryDef[] = [
  { key: 'main',          label: 'Overview',       icon: LayoutDashboard },
  { key: 'work',          label: 'Work',           icon: FolderKanban },
  { key: 'recruitment',   label: 'Recruitment',    icon: Briefcase },
  { key: 'communication', label: 'Communication',  icon: MessageSquare },
  { key: 'content',       label: 'Content',        icon: PenTool },
  { key: 'ai',            label: 'AI & Tools',     icon: Bot },
  { key: 'system',        label: 'System',         icon: Settings },
];

const DEFAULT_LINKS: SidebarLinkDef[] = [
  { name: 'Dashboard',        path: '/admin',                  icon: LayoutDashboard, category: 'main' },
  { name: 'Services',         path: '/admin/services',         icon: Zap,             category: 'work' },
  { name: 'Projects',         path: '/admin/projects',         icon: FolderKanban,    category: 'work' },
  { name: 'Clients',          path: '/admin/clients',          icon: Users,           category: 'work' },
  { name: 'Project Requests', path: '/admin/client-requests',  icon: FolderKanban,    category: 'work' },
  { name: 'Team',             path: '/admin/team',             icon: Users,           category: 'work' },
  { name: 'Jobs',             path: '/admin/jobs',             icon: Briefcase,       category: 'recruitment' },
  { name: 'Applications',     path: '/admin/job-applications', icon: Users,           category: 'recruitment' },
  { name: 'Contacts',         path: '/admin/contacts',         icon: Mail,            category: 'communication' },
  { name: 'Live Chat',        path: '/admin/live-chat',        icon: MessageCircle,   category: 'communication' },
  { name: 'Messages',         path: '/admin/messages',         icon: MessageSquare,   category: 'communication' },
  { name: 'Client Tickets',   path: '/admin/support',          icon: HelpCircle,      category: 'communication' },
  { name: 'Announcements',    path: '/admin/announcements',    icon: Megaphone,       category: 'content' },
  { name: 'Page Manager',     path: '/admin/page-manager',     icon: LayoutList,      category: 'content' },
  { name: 'Content Editor',   path: '/admin/content-editor',   icon: PenTool,         category: 'content' },
  { name: 'AI Tools',         path: '/admin/ai-tools',         icon: Bot,             category: 'ai' },
  { name: 'Chatbot Manager',  path: '/admin/chatbot-manager',  icon: MessageCircle,   category: 'ai' },
  { name: 'Database',         path: '/admin/database',         icon: Database,        category: 'system' },
  { name: 'Notifications',    path: '/admin/notifications',    icon: Bell,            category: 'system' },
  { name: 'Reviews',          path: '/admin/reviews',          icon: ThumbsUp,        category: 'system' },
  { name: 'Performance',      path: '/admin/performance',      icon: Activity,        category: 'system' },
  { name: 'Settings',         path: '/admin/settings',         icon: Settings,        category: 'system' },
  { name: 'SEO Manager',      path: '/admin/seo',              icon: Search,          category: 'content' },
  { name: 'Email Automations',path: '/admin/email-automations',icon: Workflow,        category: 'system' },
  { name: 'Milestones',       path: '/admin/milestones',       icon: Milestone,       category: 'work' },
];

type EditTarget = { type: 'cat' | 'link'; key: string; value: string } | null;
type DragSrc   = { type: 'item'; path: string } | { type: 'cat'; catKey: string } | null;

export function Sidebar({ isOpen = false, onClose, collapsed = false, onToggleCollapse, topOffset = 0 }: SidebarProps) {
  const location = useLocation();
  const { logout } = useAuth();
  const navigate   = useNavigate();
  const { chatUnreadCount } = useNotifications({ enableToast: false, enableSound: false });

  const {
    getOrderedCategories, getLinksForCategory, getPinnedLinks,
    isPinned, isCatCollapsed, getLinkLabel, getCatLabel,
    togglePin, toggleCatCollapsed, renameLink, renameCategory,
    moveItem, moveCategory,
  } = useSidebarPreferences('admin', DEFAULT_LINKS, CATEGORIES);

  const [waitingCount, setWaitingCount] = useState(0);
  const [editing, setEditing]           = useState<EditTarget>(null);
  const dragSrc                          = useRef<DragSrc>(null);
  const [itemDrop, setItemDrop]         = useState<string | null>(null);   // path
  const [catDrop, setCatDrop]           = useState<string | null>(null);   // catKey
  const [dragType, setDragType]         = useState<'item' | 'cat' | null>(null);

  useEffect(() => {
    fetch('/api/v1/live-chat/stats', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (d.success) setWaitingCount(d.data.waiting); })
      .catch(() => {});
  }, []);

  const showText = !collapsed;

  /* ── inline edit helpers ─────────────────────────────────────────────── */
  const startEdit = (type: 'cat' | 'link', key: string, current: string, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setEditing({ type, key, value: current });
  };
  const commitEdit = () => {
    if (!editing) return;
    if (editing.type === 'cat')  renameCategory(editing.key, editing.value);
    else                         renameLink(editing.key, editing.value);
    setEditing(null);
  };
  const cancelEdit = () => setEditing(null);

  /* ── drag helpers ────────────────────────────────────────────────────── */
  const clearDrag = () => {
    dragSrc.current = null;
    setDragType(null); setItemDrop(null); setCatDrop(null);
  };

  const onItemDragStart = (path: string) => {
    dragSrc.current = { type: 'item', path };
    setDragType('item');
  };
  const onCatDragStart = (catKey: string) => {
    dragSrc.current = { type: 'cat', catKey };
    setDragType('cat');
  };

  const onItemDragOver = (e: React.DragEvent, path: string) => {
    e.preventDefault(); e.stopPropagation();
    if (dragType === 'item') setItemDrop(path);
  };
  const onCatHeaderDragOver = (e: React.DragEvent, catKey: string) => {
    e.preventDefault(); e.stopPropagation();
    setCatDrop(catKey); setItemDrop(null);
  };

  const onItemDrop = (e: React.DragEvent, targetPath: string, targetCatKey: string) => {
    e.preventDefault(); e.stopPropagation();
    const src = dragSrc.current;
    if (src?.type === 'item') moveItem(src.path, targetPath, targetCatKey);
    clearDrag();
  };
  const onCatHeaderDrop = (e: React.DragEvent, targetCatKey: string) => {
    e.preventDefault(); e.stopPropagation();
    const src = dragSrc.current;
    if (src?.type === 'item') moveItem(src.path, null, targetCatKey);
    else if (src?.type === 'cat') moveCategory(src.catKey, targetCatKey);
    clearDrag();
  };

  /* ── render a single nav link ────────────────────────────────────────── */
  const renderLink = (link: SidebarLinkDef, catKey: string) => {
    const Icon       = link.icon;
    const isActive   = link.path === '/admin'
      ? location.pathname === '/admin'
      : location.pathname.startsWith(link.path);
    const pinned_    = isPinned(link.path);
    const isItemDrop = itemDrop === link.path && dragType === 'item' && dragSrc.current?.type === 'item' && (dragSrc.current as { path: string }).path !== link.path;
    const isEditing  = editing?.type === 'link' && editing.key === link.path;
    const displayName = getLinkLabel(link.path, link.name);

    return (
      <div
        key={link.path}
        draggable={showText}
        onDragStart={e => { e.stopPropagation(); onItemDragStart(link.path); }}
        onDragOver={e => onItemDragOver(e, link.path)}
        onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setItemDrop(null); }}
        onDrop={e => onItemDrop(e, link.path, catKey)}
        onDragEnd={clearDrag}
        className={cn(
          'relative group/item',
          isItemDrop && 'before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-primary before:rounded-full',
        )}
      >
        {/* Drag grip */}
        {showText && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 hidden lg:flex opacity-0 group-hover/item:opacity-100 cursor-grab active:cursor-grabbing z-10 text-muted-foreground/40 hover:text-muted-foreground transition-opacity pl-0.5">
            <GripVertical className="h-3.5 w-3.5" />
          </div>
        )}

        {/* Editing mode — replace link with input */}
        {isEditing ? (
          <div className="relative flex items-center gap-3 py-2 rounded-xl px-3 lg:pl-5 bg-accent/50 border border-primary/30">
            <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
            <input
              autoFocus
              value={editing!.value}
              onChange={e => setEditing(prev => prev ? { ...prev, value: e.target.value } : null)}
              onBlur={commitEdit}
              onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') cancelEdit(); }}
              onClick={e => e.stopPropagation()}
              className="flex-1 bg-transparent border-b border-primary text-sm font-medium outline-none min-w-0 text-foreground"
            />
            <button type="button" onClick={commitEdit} className="shrink-0 p-0.5 text-primary">
              <Check className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <Link to={link.path} title={displayName} className="relative group block">
            {isActive && (
              <motion.div
                layoutId="activeAdminTab"
                className="absolute inset-0 bg-primary/10 rounded-xl border border-primary/20"
                initial={false}
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              />
            )}
            <motion.div
              whileHover={{ x: 2 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className={cn(
                'relative flex items-center gap-3 py-2.5 rounded-xl transition-colors duration-150 group-hover:bg-accent/80',
                showText ? 'px-3 lg:pl-5' : 'px-3',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <div className="relative shrink-0">
                <Icon className={cn('h-5 w-5 transition-all duration-200 group-hover:scale-110', isActive && 'drop-shadow-[0_0_5px_rgba(139,92,246,0.5)]')} />
              </div>

              <AnimatePresence initial={false}>
                {showText && (
                  <motion.span
                    key={`label-${link.path}`}
                    initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.18 }}
                    className="hidden lg:flex items-center gap-1 font-medium text-sm flex-1 overflow-hidden whitespace-nowrap min-w-0"
                  >
                    <span className="flex-1 truncate min-w-0">{displayName}</span>

                    {link.path === '/admin/messages' && chatUnreadCount > 0 && (
                      <span className="shrink-0 h-5 min-w-[20px] px-1 rounded-full bg-primary text-[10px] text-primary-foreground font-bold flex items-center justify-center">
                        {chatUnreadCount > 99 ? '99+' : chatUnreadCount}
                      </span>
                    )}
                    {link.path === '/admin/live-chat' && waitingCount > 0 && (
                      <span className="shrink-0 bg-yellow-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                        {waitingCount > 9 ? '9+' : waitingCount}
                      </span>
                    )}
                    {isActive && !pinned_ && <ChevronRight className="h-4 w-4 opacity-40 shrink-0" />}

                    {/* Rename button */}
                    <button
                      type="button"
                      title="Rename"
                      onClick={e => startEdit('link', link.path, displayName, e)}
                      className="hidden lg:block opacity-0 group-hover/item:opacity-100 shrink-0 p-0.5 rounded text-muted-foreground/40 hover:text-foreground transition-all"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>

                    {/* Pin button */}
                    <button
                      type="button"
                      title={pinned_ ? 'Unpin' : 'Pin to top'}
                      onClick={e => { e.preventDefault(); e.stopPropagation(); togglePin(link.path); }}
                      className={cn(
                        'hidden lg:flex shrink-0 p-0.5 rounded transition-all',
                        pinned_ ? 'opacity-100 text-primary' : 'opacity-0 group-hover/item:opacity-100 text-muted-foreground/50 hover:text-primary',
                      )}
                    >
                      <Star className={cn('h-3.5 w-3.5', pinned_ && 'fill-primary')} />
                    </button>
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>
          </Link>
        )}
      </div>
    );
  };

  /* ── render a category section ───────────────────────────────────────── */
  const renderCategory = (catKey: string) => {
    const catDef     = CATEGORIES.find(c => c.key === catKey);
    if (!catDef) return null;

    const catLinks   = getLinksForCategory(catKey, DEFAULT_LINKS);
    const CatIcon    = catDef.icon;
    const catLabel   = getCatLabel(catKey, catDef.label);
    const collapsed_ = isCatCollapsed(catKey);
    const isDropZone = catDrop === catKey;
    const isEditCat  = editing?.type === 'cat' && editing.key === catKey;
    const isMain     = catKey === 'main';

    // For 'main' category — no header, just items
    if (isMain) {
      return (
        <div key="main" className="space-y-0.5">
          {catLinks.map(l => renderLink(l, catKey))}
        </div>
      );
    }

    return (
      <div key={catKey} className="mt-2">

        {/* Category header — expanded desktop only */}
        <AnimatePresence initial={false}>
          {showText && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              draggable
              onDragStart={e => { e.stopPropagation(); onCatDragStart(catKey); }}
              onDragOver={e => onCatHeaderDragOver(e, catKey)}
              onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setCatDrop(null); }}
              onDrop={e => onCatHeaderDrop(e, catKey)}
              onDragEnd={clearDrag}
              className={cn(
                'hidden lg:flex w-full items-center gap-1.5 px-2 py-1.5 rounded-lg transition-colors group/cat cursor-default',
                isDropZone
                  ? 'bg-primary/15 border border-primary/30 text-primary'
                  : 'hover:bg-accent/50 text-muted-foreground/50 hover:text-muted-foreground',
              )}
            >
              {/* Category drag grip */}
              <div className="opacity-0 group-hover/cat:opacity-100 cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground transition-opacity shrink-0">
                <GripVertical className="h-3.5 w-3.5" />
              </div>

              <CatIcon className="h-3.5 w-3.5 shrink-0" />

              {/* Label or edit input */}
              {isEditCat ? (
                <input
                  autoFocus
                  value={editing!.value}
                  onChange={e => setEditing(prev => prev ? { ...prev, value: e.target.value } : null)}
                  onBlur={commitEdit}
                  onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') cancelEdit(); }}
                  onClick={e => e.stopPropagation()}
                  className="flex-1 bg-transparent border-b border-primary text-[10px] font-semibold uppercase tracking-widest outline-none text-foreground min-w-0"
                />
              ) : (
                <button
                  onClick={() => toggleCatCollapsed(catKey)}
                  className="flex-1 text-[10px] font-semibold uppercase tracking-widest text-left truncate"
                >
                  {catLabel}
                </button>
              )}

              {!isEditCat && (
                <>
                  {/* Rename category */}
                  <button
                    type="button"
                    title="Rename category"
                    onClick={e => startEdit('cat', catKey, catLabel, e)}
                    className="opacity-0 group-hover/cat:opacity-100 shrink-0 p-0.5 rounded text-muted-foreground/40 hover:text-foreground transition-all"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>

                  {/* Collapse chevron */}
                  <motion.button
                    onClick={() => toggleCatCollapsed(catKey)}
                    animate={{ rotate: collapsed_ ? -90 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="shrink-0 p-0.5"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </motion.button>
                </>
              )}

              {isEditCat && (
                <button type="button" onClick={commitEdit} className="shrink-0 p-0.5 text-primary">
                  <Check className="h-3.5 w-3.5" />
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category items */}
        <AnimatePresence initial={false}>
          {(!showText || !collapsed_) && (
            <motion.div
              key={`items-${catKey}`}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="space-y-0.5 pt-0.5">
                {catLinks.map(l => renderLink(l, catKey))}

                {/* Empty drop target when all items dragged away */}
                {catLinks.length === 0 && showText && (
                  <div
                    onDragOver={e => { e.preventDefault(); setCatDrop(catKey); }}
                    onDragLeave={() => setCatDrop(null)}
                    onDrop={e => onCatHeaderDrop(e, catKey)}
                    className={cn(
                      'mx-1 h-8 rounded-lg border-2 border-dashed transition-colors flex items-center justify-center text-[10px] text-muted-foreground/40',
                      isDropZone ? 'border-primary/50 text-primary/60 bg-primary/5' : 'border-border/30',
                    )}
                  >
                    {isDropZone ? 'Drop here' : 'Empty'}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const pinnedLinks = getPinnedLinks(DEFAULT_LINKS);
  const catOrder    = getOrderedCategories();

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-30 sm:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          'fixed left-0 bg-background/80 backdrop-blur-xl border-r border-border/50 z-40 transition-all duration-300 flex flex-col w-72',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          'sm:translate-x-0 sm:w-20',
          collapsed ? 'lg:w-20' : 'lg:w-72',
        )}
        style={{ top: topOffset, height: `calc(100vh - ${topOffset}px)` }}
      >
        {isOpen && (
          <motion.button onClick={onClose} whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}
            className="absolute top-4 right-4 sm:hidden p-1.5 rounded-lg hover:bg-accent text-muted-foreground transition-colors">
            <X className="h-4 w-4" />
          </motion.button>
        )}

        {/* Logo + collapse toggle */}
        <motion.div layout className={cn('h-16 sm:h-20 flex items-center border-b border-border/50 shrink-0', showText ? 'px-3 lg:px-4 justify-between' : 'justify-center px-3')}>
          <AnimatePresence initial={false}>
            {(showText || true) && (
              <motion.div key="logo-link" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className={cn(!showText && 'lg:hidden')}>
                <Link to="/" className="flex items-center gap-2.5 group min-w-0">
                  <motion.img
                    src="/Comet Brew.svg"
                    alt="CometBrew Logo" className="h-9 w-auto shrink-0"
                    whileHover={{ scale: 1.08, rotate: -3 }} transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  />
                  <AnimatePresence initial={false}>
                    {showText && (
                      <motion.span key="logo-text" initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.22, ease: 'easeInOut' }}
                        className="hidden lg:block font-bold text-xl tracking-tight text-foreground group-hover:text-primary transition-colors duration-200 overflow-hidden whitespace-nowrap">
                        CometBrew
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>

          {onToggleCollapse && (
            <motion.button layout onClick={onToggleCollapse} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              className="hidden lg:flex p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors shrink-0">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={collapsed ? 'open' : 'close'} initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }} transition={{ duration: 0.18 }}>
                  {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                </motion.div>
              </AnimatePresence>
            </motion.button>
          )}
        </motion.div>

        {/* Navigation */}
        <div className="flex-grow py-4 px-3 overflow-y-auto no-scrollbar">

          {/* Pinned */}
          <AnimatePresence initial={false}>
            {pinnedLinks.length > 0 && (
              <motion.div key="pinned-section" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {showText && (
                  <div className="px-3 mb-1.5 hidden lg:flex items-center gap-1.5">
                    <Star className="h-3 w-3 fill-primary text-primary" />
                    <span className="text-[10px] font-semibold text-primary/70 uppercase tracking-widest">Pinned</span>
                  </div>
                )}
                <div className="space-y-0.5">
                  {pinnedLinks.map(l => renderLink(l, 'pinned'))}
                </div>
                <div className="border-t border-border/30 my-3 mx-1" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Categories */}
          {catOrder.map(catKey => renderCategory(catKey))}
        </div>

        {/* Sign out */}
        <div className="p-3 border-t border-border/50 mt-auto">
          <button onClick={async () => { await logout(); navigate('/', { replace: true }); }} title="Sign Out"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200 group">
            <LogOut className="h-5 w-5 shrink-0 group-hover:-translate-x-1 group-hover:scale-110 transition-all duration-200" />
            <AnimatePresence initial={false}>
              {showText && (
                <motion.span key="signout-text" initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} transition={{ duration: 0.18 }}
                  className="hidden lg:block font-medium text-sm overflow-hidden whitespace-nowrap">
                  Sign Out
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </aside>
    </>
  );
}
