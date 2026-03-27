/**
 * User Dashboard Layout
 * Layout wrapper for user dashboard pages.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { UserSidebar } from '../components/UserSidebar';
import { PageStatusGate } from '../components/PageStatusGate';
import { MessageSquare, Menu } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { NotificationBell } from '../components/NotificationBell';
import { useAuth } from '../contexts/AuthContext';

export function UserDashboardLayout() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
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
            <button
              onClick={() => setSidebarOpen(true)}
              className="sm:hidden p-2 rounded-lg hover:bg-accent text-muted-foreground shrink-0"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 truncate">
              User Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {/* Quick Chat Button */}
            <button
              onClick={() => navigate('/user-dashboard/messages')}
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              <MessageSquare className="h-4 w-4" />
              <span className="text-sm font-medium">Support Chat</span>
            </button>

            <NotificationBell notificationsRoute="/user-dashboard/notifications" />

            <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-6 border-l border-border/50">
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium text-foreground">{user?.name ?? 'User'}</p>
                <p className="text-xs text-muted-foreground capitalize">{user?.role ?? 'User'}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-blue-600 p-[2px]">
                <div className="h-full w-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                  {user?.photo && user.photo !== 'default.jpg' ? (
                    <img src={user.photo} alt={user.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold text-primary">{user?.name?.charAt(0) ?? 'U'}</span>
                  )}
                </div>
              </div>
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