/**
 * Dashboard Layout
 * A modern, glassmorphic layout for the admin area.
 */
import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Menu, Sun, Moon, Settings, MessageSquare, Bell, LayoutDashboard, Home, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardSearch } from '../components/DashboardSearch';
import { useTheme } from '../contexts/ThemeContext';
import { NotificationBell } from '../components/NotificationBell';
import { useAuth } from '../contexts/AuthContext';
import { useContent } from '../contexts/ContentContext';
import { ProfileDropdown, type ProfileMenuItem } from '../components/ProfileDropdown';
import { AnnouncementBar } from '../components/AnnouncementBar';
import { toast } from 'sonner';
import { useNotifications } from '../hooks/useNotifications';
import { DashboardChatbot } from '../components/DashboardChatbot';

export function DashboardLayout() {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const { globalTheme, updateGlobalTheme, dashboardAnnouncementBars, fetchDashboardBars } = useContent();
  useNotifications();

  // Fetch dashboard-targeted announcement bars once on mount
  useEffect(() => { fetchDashboardBars(); }, [fetchDashboardBars]);

  const activeDashBars = dashboardAnnouncementBars.filter(g => g.bar.isActive && g.items.length > 0);
  const dashBarHeight = activeDashBars.length * 40;
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [savingGlobal, setSavingGlobal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() =>
    localStorage.getItem('admin-sidebar-collapsed') === 'true'
  );

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('admin-sidebar-collapsed', String(next));
      return next;
    });
  };

  const handleRefresh = () => {
    setRefreshing(true);
    window.dispatchEvent(new CustomEvent('cms:updated', { detail: { section: '*' } }));
    setTimeout(() => setRefreshing(false), 1000);
  };

  const adminMenuItems: ProfileMenuItem[] = [
    { label: 'Dashboard',     icon: LayoutDashboard, to: '/admin' },
    { label: 'Messages',      icon: MessageSquare,   to: '/admin/messages' },
    { label: 'Notifications', icon: Bell,            to: '/admin/notifications' },
    { label: 'Settings',      icon: Settings,        to: '/admin/settings', divider: true },
  ];

  const handleGlobalThemeToggle = async () => {
    const next = globalTheme === 'dark' ? 'light' : 'dark';
    setSavingGlobal(true);
    try {
      await updateGlobalTheme(next);
      toast.success(`Site theme set to ${next} for all visitors`);
    } catch {
      toast.error('Failed to update global theme');
    } finally {
      setSavingGlobal(false);
    }
  };

  // Close sidebar on route change
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30 selection:text-primary">
      {/* Abstract Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-secondary/20 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] bg-primary/5 rounded-full blur-[100px]" />
      </div>

      {/* Dashboard announcement bars — stacked above topbar */}
      {activeDashBars.map((barGroup, idx) => (
        <AnnouncementBar key={barGroup.bar._id} barGroup={barGroup} topOffset={idx * 40} />
      ))}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} collapsed={sidebarCollapsed} onToggleCollapse={toggleSidebarCollapse} topOffset={dashBarHeight} />

      <div className={`sm:pl-20 ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'} relative z-10 transition-all duration-300`}>
        {/* Topbar — shifts down when announcement bars are present */}
        <header
          className="h-16 sm:h-20 px-4 sm:px-8 flex items-center justify-between sticky z-30 backdrop-blur-md bg-background/50 border-b border-border/50"
          style={{ top: dashBarHeight }}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Hamburger — mobile only */}
            <motion.button
              onClick={() => setSidebarOpen(true)}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              className="sm:hidden p-2 rounded-xl hover:bg-accent text-muted-foreground shrink-0 transition-colors"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </motion.button>
            <DashboardSearch role="admin" />
          </div>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {/* Refresh data — hidden on mobile */}
            <div className="relative group hidden sm:block">
              <motion.button
                onClick={handleRefresh}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                className="p-2 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Refresh data"
              >
                <RefreshCw className={`h-5 w-5 transition-transform ${refreshing ? 'animate-spin' : ''}`} />
              </motion.button>
              <div className="absolute top-full right-0 mt-1 px-2 py-1 rounded-lg bg-popover border border-border text-xs text-popover-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-md">
                Refresh data
              </div>
            </div>

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

            {/* Global site theme toggle switch — hidden on mobile */}
            <div className="relative group hidden sm:flex items-center gap-2">
              <button
                onClick={handleGlobalThemeToggle}
                disabled={savingGlobal}
                aria-label="Toggle global site theme"
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-300 focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${globalTheme === 'dark' ? 'bg-primary' : 'bg-muted'}`}
              >
                <motion.span
                  animate={{ x: globalTheme === 'dark' ? 24 : 4 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  className="inline-block h-4 w-4 rounded-full bg-white shadow-md"
                  style={{ x: globalTheme === 'dark' ? 24 : 4 }}
                />
              </button>
              {/* Tooltip */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 rounded-lg bg-popover border border-border text-xs text-popover-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-md">
                Site: {globalTheme === 'dark' ? 'Dark' : globalTheme === 'light' ? 'Light' : 'Not set'}
              </div>
            </div>

            {/* Go to Website — hidden on mobile */}
            <div className="relative group hidden sm:block">
              <motion.button
                onClick={() => navigate('/')}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                className="p-2 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Go to website"
              >
                <Home className="h-5 w-5" />
              </motion.button>
              <div className="absolute top-full right-0 mt-1 px-2 py-1 rounded-lg bg-popover border border-border text-xs text-popover-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-md">
                Go to Website
              </div>
            </div>

            <NotificationBell notificationsRoute="/admin/notifications" chatRoute="/admin/messages" />

            <div className="relative flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l border-border/50">
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium text-foreground leading-tight">{user?.name ?? 'Admin'}</p>
                <p className="text-xs text-muted-foreground capitalize">{user?.role ?? 'Admin'}</p>
              </div>
              <motion.div
                onClick={() => setProfileOpen(o => !o)}
                className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-purple-600 p-[2px] cursor-pointer shrink-0"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                <div className="h-full w-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                  {user?.photo && user.photo !== 'default.jpg' ? (
                    <img src={user.photo} alt={user.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold text-primary">{user?.name?.charAt(0) ?? 'A'}</span>
                  )}
                </div>
              </motion.div>
              <ProfileDropdown
                open={profileOpen}
                onClose={() => setProfileOpen(false)}
                items={adminMenuItems}
                subLabel={user?.role ?? 'Admin'}
              />
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Outlet />
        </main>
      </div>

      <DashboardChatbot mode="admin" />
    </div>
  );
}
