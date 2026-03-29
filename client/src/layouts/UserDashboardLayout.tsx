/**
 * User Dashboard Layout
 * Layout wrapper for user dashboard pages.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { UserSidebar } from '../components/UserSidebar';
import { PageStatusGate } from '../components/PageStatusGate';
import { Menu, MessageSquare, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardSearch } from '../components/DashboardSearch';
import { useTheme } from '../contexts/ThemeContext';
import { NotificationBell } from '../components/NotificationBell';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../hooks/useNotifications';

export function UserDashboardLayout() {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  useNotifications();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30 selection:text-primary">
      {/* Abstract Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/5 rounded-full blur-[120px]" />
      </div>

      <UserSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="sm:pl-20 lg:pl-72 relative z-10 transition-all duration-300">
        {/* Topbar */}
        <header className="h-16 sm:h-20 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 backdrop-blur-md bg-background/50 border-b border-border/50">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <motion.button
              onClick={() => setSidebarOpen(true)}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              className="sm:hidden p-2 rounded-xl hover:bg-accent text-muted-foreground shrink-0 transition-colors"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </motion.button>
            <DashboardSearch role="user" />
          </div>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {/* Theme toggle with animated icon swap */}
            <motion.button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              className="p-2 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition-colors relative overflow-hidden"
              aria-label="Toggle theme"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={theme}
                  initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                >
                  {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </motion.div>
              </AnimatePresence>
            </motion.button>

            {/* Quick Chat Button */}
            <motion.button
              onClick={() => navigate('/user-dashboard/messages')}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors group"
            >
              <MessageSquare className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
              <span className="text-sm font-medium">Support Chat</span>
            </motion.button>

            <NotificationBell notificationsRoute="/user-dashboard/notifications" chatRoute="/user-dashboard/messages" />

            <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l border-border/50">
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium text-foreground leading-tight">{user?.name ?? 'User'}</p>
                <p className="text-xs text-muted-foreground capitalize">{user?.role ?? 'User'}</p>
              </div>
              <motion.div
                className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-blue-600 p-[2px] cursor-pointer shrink-0"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                <div className="h-full w-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                  {user?.photo && user.photo !== 'default.jpg' ? (
                    <img src={user.photo} alt={user.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold text-primary">{user?.name?.charAt(0) ?? 'U'}</span>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          <PageStatusGate hiddenRedirectTo="/user-dashboard">
            <Outlet />
          </PageStatusGate>
        </main>
      </div>
    </div>
  );
}
