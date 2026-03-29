/**
 * Team Dashboard Sidebar
 * Navigation for team members
 */
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  BarChart2,
  Settings,
  LogOut,
  Bell,
  ChevronRight,
  Calendar,
  MessageSquare,
  Files,
  HelpCircle,
  X,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { usePageVisibility } from '../hooks/usePageVisibility';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';

interface TeamSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function TeamSidebar({ isOpen = false, onClose }: TeamSidebarProps) {
  const location = useLocation();
  const { isVisible } = usePageVisibility();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { chatUnreadCount } = useNotifications({ enableToast: false });

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  const links = [
    { name: 'Dashboard', path: '/team', icon: LayoutDashboard },
    { name: 'Projects', path: '/team/projects', icon: FolderKanban },
    { name: 'My Tasks', path: '/team/tasks', icon: CheckSquare },
    { name: 'Calendar', path: '/team/calendar', icon: Calendar },
    { name: 'Chat', path: '/team/chat', icon: MessageSquare },
    { name: 'Resources', path: '/team/resources', icon: Files },
    { name: 'Reports', path: '/team/reports', icon: BarChart2 },
    { name: 'Notifications', path: '/team/notifications', icon: Bell },
    { name: 'Settings', path: '/team/settings', icon: Settings },
    { name: 'Support', path: '/team/support', icon: HelpCircle },
  ].filter(link => isVisible(link.path));

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

      <aside className={cn(
        "fixed left-0 top-0 h-screen bg-background/80 backdrop-blur-xl border-r border-border/50 z-40 transition-all duration-300 flex flex-col w-72",
        isOpen ? "translate-x-0" : "-translate-x-full",
        "sm:translate-x-0 sm:w-20",
        "lg:w-72"
      )}>
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

      {/* Logo */}
      <div className="h-16 sm:h-20 flex items-center justify-center lg:justify-start lg:px-6 border-b border-border/50">
        <Link to="/" className="flex items-center gap-3 group">
          <motion.img
            src="https://vgbujcuwptvheqijyjbe.supabase.co/storage/v1/object/public/hmac-uploads/uploads/216147d0-06c1-4dee-8a5a-f933c6ef8556/1766429553723-26c2f3fe/N_Logo-01.png"
            alt="Nabeel Logo"
            className="h-10 w-auto dark:invert"
            whileHover={{ scale: 1.08, rotate: -3 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          />
          <div className="hidden lg:block">
            <span className="font-bold text-xl tracking-tight text-foreground">
              TEAM<span className="text-primary group-hover:text-primary/80 transition-colors duration-200">DASH</span>
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-grow py-8 px-3 space-y-1 overflow-y-auto no-scrollbar">
        <div className="px-3 mb-3 hidden lg:block">
          <h3 className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-widest">Team Workspace</h3>
        </div>

        {links.map((link, i) => {
          const Icon = link.icon;
          const isActive = link.path === '/team'
            ? location.pathname === '/team'
            : location.pathname.startsWith(link.path);

          return (
            <motion.div
              key={link.path}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03, duration: 0.2 }}
            >
              <Link
                to={link.path}
                title={link.name}
                className="relative group block"
              >
                {isActive && (
                  <>
                    <motion.div
                      layoutId="activeTeamTab"
                      className="absolute inset-0 bg-primary/10 rounded-xl border border-primary/20"
                      initial={false}
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                    <motion.div
                      layoutId="activeTeamBar"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full shadow-[0_0_8px_rgba(139,92,246,0.7)]"
                      initial={false}
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  </>
                )}

                <motion.div
                  whileHover={{ x: 2 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className={cn(
                    "relative flex items-center gap-3 px-3 lg:px-4 py-3 rounded-xl transition-colors duration-150",
                    "group-hover:bg-accent/80",
                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div className="relative shrink-0">
                    <Icon className={cn(
                      "h-5 w-5 transition-all duration-200",
                      "group-hover:scale-110",
                      isActive
                        ? "drop-shadow-[0_0_5px_rgba(139,92,246,0.5)]"
                        : "group-hover:text-foreground"
                    )} />
                  </div>

                  <span className="hidden lg:flex items-center font-medium text-sm flex-1">
                    {link.name}
                    {link.path === '/team/chat' && chatUnreadCount > 0 && (
                      <span className="ml-auto h-5 min-w-[20px] px-1 rounded-full bg-primary text-[10px] text-primary-foreground font-bold flex items-center justify-center">
                        {chatUnreadCount > 99 ? '99+' : chatUnreadCount}
                      </span>
                    )}
                  </span>

                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="hidden lg:block ml-auto"
                    >
                      <ChevronRight className="h-4 w-4 opacity-40" />
                    </motion.div>
                  )}
                </motion.div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-border/50 mt-auto">
        <button
          onClick={handleLogout}
          title="Sign Out"
          className="w-full flex items-center gap-3 px-3 lg:px-4 py-3 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200 group"
        >
          <LogOut className="h-5 w-5 shrink-0 group-hover:-translate-x-1 group-hover:scale-110 transition-all duration-200" />
          <span className="hidden lg:block font-medium text-sm">Sign Out</span>
        </button>
      </div>
    </aside>
    </>
  );
}
