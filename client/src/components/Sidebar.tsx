/**
 * Dashboard Sidebar — Admin
 * Supports collapse/expand toggle (persisted in localStorage).
 * Supports drag-to-reorder and pin-to-top per item (persisted in localStorage).
 */
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Users, LayoutDashboard, MessageSquare, FolderKanban, Settings, LogOut, Zap,
  Bot, MessageCircle, HelpCircle, Bell, ChevronRight, Briefcase, PenTool,
  Database, Mail, LayoutList, Megaphone, X, PanelLeftClose, PanelLeftOpen,
  GripVertical, Star, Activity, ThumbsUp,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';
import { useSidebarPreferences } from '../hooks/useSidebarPreferences';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  topOffset?: number;
}

const DEFAULT_LINKS = [
  { name: 'Dashboard',        path: '/admin',                  icon: LayoutDashboard },
  { name: 'Services',         path: '/admin/services',         icon: Zap },
  { name: 'Projects',         path: '/admin/projects',         icon: FolderKanban },
  { name: 'Clients',          path: '/admin/clients',          icon: Users },
  { name: 'Project Requests', path: '/admin/client-requests',  icon: FolderKanban },
  { name: 'Team',             path: '/admin/team',             icon: Users },
  { name: 'Contacts',         path: '/admin/contacts',         icon: Mail },
  { name: 'Jobs',             path: '/admin/jobs',             icon: Briefcase },
  { name: 'Applications',     path: '/admin/job-applications', icon: Users },
  { name: 'Database',         path: '/admin/database',         icon: Database },
  { name: 'Announcements',    path: '/admin/announcements',    icon: Megaphone },
  { name: 'Page Manager',     path: '/admin/page-manager',     icon: LayoutList },
  { name: 'Content Editor',   path: '/admin/content-editor',   icon: PenTool },
  { name: 'AI Tools',         path: '/admin/ai-tools',         icon: Bot },
  { name: 'Chatbot Manager',  path: '/admin/chatbot-manager',  icon: MessageCircle },
  { name: 'Messages',         path: '/admin/messages',         icon: MessageSquare },
  { name: 'Client Tickets',   path: '/admin/support',          icon: HelpCircle },
  { name: 'Notifications',    path: '/admin/notifications',    icon: Bell },
  { name: 'Reviews',          path: '/admin/reviews',          icon: ThumbsUp },
  { name: 'Performance',      path: '/admin/performance',      icon: Activity },
  { name: 'Settings',         path: '/admin/settings',         icon: Settings },
];

export function Sidebar({ isOpen = false, onClose, collapsed = false, onToggleCollapse, topOffset = 0 }: SidebarProps) {
  const location = useLocation();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { chatUnreadCount } = useNotifications();
  const { getOrderedLinks, isPinned, togglePin, handleDragStart, handleDrop } = useSidebarPreferences('admin', DEFAULT_LINKS);
  const [dragOverPath, setDragOverPath] = useState<string | null>(null);

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  const showText = !collapsed;
  const { pinned, rest } = getOrderedLinks(DEFAULT_LINKS);

  const renderLink = (link: typeof DEFAULT_LINKS[0], section: 'pinned' | 'rest') => {
    const Icon = link.icon;
    const isActive = link.path === '/admin'
      ? location.pathname === '/admin'
      : location.pathname.startsWith(link.path);
    const pinned_ = isPinned(link.path);
    const isDragOver = dragOverPath === link.path;

    return (
      <div
        key={link.path}
        draggable={showText}
        onDragStart={() => handleDragStart(link.path)}
        onDragOver={(e) => { e.preventDefault(); setDragOverPath(link.path); }}
        onDragLeave={() => setDragOverPath(prev => prev === link.path ? null : prev)}
        onDrop={(e) => { e.preventDefault(); handleDrop(link.path); setDragOverPath(null); }}
        className={cn(
          'relative group/item',
          isDragOver && 'before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-primary before:rounded-full',
        )}
      >
        {/* Drag grip — desktop expanded only */}
        {showText && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 hidden lg:flex opacity-0 group-hover/item:opacity-100 cursor-grab active:cursor-grabbing z-10 text-muted-foreground/40 hover:text-muted-foreground transition-opacity pl-0.5">
            <GripVertical className="h-3.5 w-3.5" />
          </div>
        )}

        <Link to={link.path} title={link.name} className="relative group block">
          {isActive && (
            <>
              <motion.div
                layoutId="activeAdminTab"
                className="absolute inset-0 bg-primary/10 rounded-xl border border-primary/20"
                initial={false}
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              />
            </>
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
              <Icon className={cn('h-5 w-5 transition-all duration-200 group-hover:scale-110', isActive ? 'drop-shadow-[0_0_5px_rgba(139,92,246,0.5)]' : '')} />
            </div>

            <AnimatePresence initial={false}>
              {showText && (
                <motion.span
                  key={`label-${link.path}`}
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.18 }}
                  className="hidden lg:flex items-center gap-1 font-medium text-sm flex-1 overflow-hidden whitespace-nowrap"
                >
                  {link.name}
                  {link.path === '/admin/messages' && chatUnreadCount > 0 && (
                    <span className="ml-auto h-5 min-w-[20px] px-1 rounded-full bg-primary text-[10px] text-primary-foreground font-bold flex items-center justify-center">
                      {chatUnreadCount > 99 ? '99+' : chatUnreadCount}
                    </span>
                  )}
                  {isActive && !pinned_ && <ChevronRight className="h-4 w-4 opacity-40 ml-auto" />}

                  {/* Pin / star button */}
                  <button
                    type="button"
                    title={pinned_ ? 'Unpin' : 'Pin to top'}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); togglePin(link.path); }}
                    className={cn(
                      'hidden lg:flex shrink-0 p-0.5 rounded transition-all ml-auto',
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
      </div>
    );
  };

  return (
    <>
      {/* Mobile backdrop */}
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
        {/* Mobile close */}
        {isOpen && (
          <motion.button
            onClick={onClose}
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            className="absolute top-4 right-4 sm:hidden p-1.5 rounded-lg hover:bg-accent text-muted-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </motion.button>
        )}

        {/* Logo + collapse toggle */}
        <motion.div
          layout
          className={cn(
            'h-16 sm:h-20 flex items-center border-b border-border/50 shrink-0',
            showText ? 'px-3 lg:px-4 justify-between' : 'justify-center px-3',
          )}
        >
          {/* Logo — hidden at lg+ when collapsed */}
          <AnimatePresence initial={false}>
            {(showText || true) && (
              <motion.div
                key="logo-link"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className={cn(!showText && 'lg:hidden')}
              >
                <Link to="/" className="flex items-center gap-2.5 group min-w-0">
                  <motion.img
                    src="https://vgbujcuwptvheqijyjbe.supabase.co/storage/v1/object/public/hmac-uploads/uploads/216147d0-06c1-4dee-8a5a-f933c6ef8556/1766429553723-26c2f3fe/N_Logo-01.png"
                    alt="Nabeel Logo"
                    className="h-9 w-auto dark:invert shrink-0"
                    whileHover={{ scale: 1.08, rotate: -3 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  />
                  <AnimatePresence initial={false}>
                    {showText && (
                      <motion.span
                        key="logo-text"
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.22, ease: 'easeInOut' }}
                        className="hidden lg:block font-bold text-xl tracking-tight text-foreground group-hover:text-primary transition-colors duration-200 overflow-hidden whitespace-nowrap"
                      >
                        NABEEL
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>

          {onToggleCollapse && (
            <motion.button
              layout
              onClick={onToggleCollapse}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="hidden lg:flex p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={collapsed ? 'open' : 'close'}
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 90 }}
                  transition={{ duration: 0.18 }}
                >
                  {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                </motion.div>
              </AnimatePresence>
            </motion.button>
          )}
        </motion.div>

        {/* Navigation */}
        <div className="flex-grow py-4 px-3 overflow-y-auto no-scrollbar">

          {/* ── Pinned section ─────────────────────────────────────────────── */}
          <AnimatePresence initial={false}>
            {pinned.length > 0 && (
              <motion.div key="pinned-section" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {showText && (
                  <div className="px-3 mb-1.5 hidden lg:flex items-center gap-1.5">
                    <Star className="h-3 w-3 fill-primary text-primary" />
                    <span className="text-[10px] font-semibold text-primary/70 uppercase tracking-widest">Pinned</span>
                  </div>
                )}
                <div className="space-y-0.5">
                  {pinned.map(link => renderLink(link, 'pinned'))}
                </div>
                <div className="border-t border-border/30 my-3 mx-1" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Main menu ──────────────────────────────────────────────────── */}
          <AnimatePresence initial={false}>
            {showText && (
              <motion.div
                key="menu-label"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="px-3 mb-1.5 hidden lg:flex items-center gap-1.5"
              >
                <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest">Main Menu</span>
                <span className="text-[10px] text-muted-foreground/40 hidden lg:inline">· drag to reorder · ★ to pin</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-0.5">
            {rest.map(link => renderLink(link, 'rest'))}
          </div>
        </div>

        {/* Sign out */}
        <div className="p-3 border-t border-border/50 mt-auto">
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200 group"
          >
            <LogOut className="h-5 w-5 shrink-0 group-hover:-translate-x-1 group-hover:scale-110 transition-all duration-200" />
            <AnimatePresence initial={false}>
              {showText && (
                <motion.span
                  key="signout-text"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.18 }}
                  className="hidden lg:block font-medium text-sm overflow-hidden whitespace-nowrap"
                >
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
