/**
 * User Dashboard Sidebar
 * Navigation for the user dashboard area.
 */
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  FolderKanban,
  User,
  LogOut,
  Bell,
  ChevronRight,
  PlusCircle,
  Sparkles,
  Briefcase,
  HelpCircle,
  X,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { usePageVisibility } from '../hooks/usePageVisibility';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../hooks/useNotifications';

interface UserSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function UserSidebar({ isOpen = false, onClose }: UserSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isVisible } = usePageVisibility();
  const { user, logout } = useAuth();
  const { chatUnreadCount } = useNotifications({ enableToast: false });

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  const links = [
    { name: 'Overview', path: '/user-dashboard', icon: LayoutDashboard },
    { name: 'My Projects', path: '/user-dashboard/projects', icon: FolderKanban },
    { name: 'Messages', path: '/user-dashboard/messages', icon: MessageSquare },
    { name: 'AI Assistant', path: '/user-dashboard/ai-assistant', icon: Sparkles },
    { name: 'Applied Jobs', path: '/user-dashboard/applied-jobs', icon: Briefcase },
    { name: 'Profile & Settings', path: '/user-dashboard/profile', icon: User },
    { name: 'Notifications', path: '/user-dashboard/notifications', icon: Bell },
    { name: 'Support', path: '/user-dashboard/support', icon: HelpCircle },
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
            <span className="font-bold text-xl tracking-tight text-foreground group-hover:text-primary transition-colors duration-200">NABEEL</span>
          </div>
        </Link>
      </div>

      {/* User Info - Mini Profile */}
      <div className="hidden lg:flex flex-col items-center p-6 border-b border-border/50 bg-secondary/5">
        <motion.div
          className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-blue-600 p-[2px] mb-3 cursor-pointer"
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        >
          <div className="h-full w-full rounded-full bg-background flex items-center justify-center overflow-hidden">
            {user?.photo && user.photo !== 'default.jpg' ? (
              <img src={user.photo} alt={user.name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-xl font-bold text-primary">{user?.name?.charAt(0) ?? 'U'}</span>
            )}
          </div>
        </motion.div>
        <h3 className="font-semibold text-lg">{user?.name ?? 'User'}</h3>
        <p className="text-xs text-muted-foreground capitalize">{user?.role ?? 'Client Account'}</p>
      </div>

      {/* Navigation */}
      <div className="flex-grow py-6 px-3 space-y-1 overflow-y-auto no-scrollbar">
        <div className="px-3 mb-3 hidden lg:block">
          <h3 className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-widest">Dashboard</h3>
        </div>

        {links.map((link, i) => {
          const Icon = link.icon;
          const isActive = link.path === '/user-dashboard'
            ? location.pathname === '/user-dashboard'
            : location.pathname.startsWith(link.path);

          return (
            <motion.div
              key={link.path}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, duration: 0.2 }}
            >
              <Link
                to={link.path}
                title={link.name}
                className="relative group block"
              >
                {isActive && (
                  <>
                    <motion.div
                      layoutId="activeUserTab"
                      className="absolute inset-0 bg-primary/10 rounded-xl border border-primary/20"
                      initial={false}
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                    <motion.div
                      layoutId="activeUserBar"
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
                    {link.path === '/user-dashboard/messages' && chatUnreadCount > 0 && (
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

        {/* New Order Button */}
        <div className="px-3 mt-6 hidden lg:block">
          <motion.button
            onClick={() => navigate('/user-dashboard/projects', { state: { openNewProject: true } })}
            whileHover={{ scale: 1.02, boxShadow: '0 8px 24px rgba(139,92,246,0.3)' }}
            whileTap={{ scale: 0.97 }}
            className="w-full bg-gradient-to-r from-primary to-blue-600 text-primary-foreground py-3 rounded-xl font-medium flex items-center justify-center gap-2 group transition-shadow duration-200"
          >
            <PlusCircle className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
            New Project
          </motion.button>
        </div>
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
