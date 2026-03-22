/**
 * User Dashboard Layout
 * Layout wrapper for user dashboard pages.
 */
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { UserSidebar } from '../components/UserSidebar';
import { PageStatusGate } from '../components/PageStatusGate';
import { Bell, Search, Check, AlertCircle, Info, Clock, X, MessageSquare, Menu } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

export function UserDashboardLayout() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  // Close notifications when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [notificationRef]);

  const notifications = [
    {
      id: 1,
      title: "Project Update",
      message: "The design phase for 'E-commerce Website' is complete.",
      time: "2 hours ago",
      type: "success",
      read: false
    },
    {
      id: 2,
      title: "New Message",
      message: "Admin: Please review the latest mockup.",
      time: "5 hours ago",
      type: "info",
      read: false
    },
    {
      id: 3,
      title: "Payment Confirmation",
      message: "Payment for Invoice #INV-2023-001 received.",
      time: "1 day ago",
      type: "success",
      read: true
    }
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <Check className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-amber-500" />;
      case 'info': return <Info className="h-4 w-4 text-blue-500" />;
      default: return <Bell className="h-4 w-4 text-primary" />;
    }
  };

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

          <div className="flex items-center gap-2 sm:gap-4 shrink-0" ref={notificationRef}>
            {/* Quick Chat Button */}
            <button
              onClick={() => navigate('/user-dashboard/messages')}
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              <MessageSquare className="h-4 w-4" />
              <span className="text-sm font-medium">Support Chat</span>
            </button>

            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative group p-2 rounded-full hover:bg-accent transition-colors outline-none"
              >
                <Bell className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)] animate-pulse"></span>
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-card border border-border/50 rounded-xl shadow-2xl backdrop-blur-xl z-50 overflow-hidden"
                  >
                    <div className="p-4 border-b border-border/50 flex items-center justify-between bg-muted/30">
                      <div>
                        <h3 className="font-semibold text-foreground">Notifications</h3>
                        <p className="text-xs text-muted-foreground">You have 2 unread notifications</p>
                      </div>
                      <button 
                        onClick={() => setShowNotifications(false)}
                        className="p-1 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                      {notifications.map((notification) => (
                        <div 
                          key={notification.id}
                          className={`p-4 border-b border-border/50 hover:bg-muted/50 transition-colors cursor-pointer flex gap-4 ${!notification.read ? 'bg-primary/5' : ''}`}
                        >
                          <div className={`mt-1 h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                            notification.type === 'success' ? 'bg-green-500/10' : 
                            notification.type === 'warning' ? 'bg-amber-500/10' : 
                            'bg-blue-500/10'
                          }`}>
                            {getIcon(notification.type)}
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <p className={`text-sm font-medium ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                                {notification.title}
                              </p>
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" /> {notification.time}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {notification.message}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="self-center">
                              <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]"></div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    <div className="p-3 bg-muted/30 border-t border-border/50 text-center">
                      <button className="text-xs font-medium text-primary hover:text-primary/80 transition-colors">
                        Mark all as read
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-6 border-l border-border/50">
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium text-foreground">Alex Morgan</p>
                <p className="text-xs text-muted-foreground">User</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-blue-600 p-[2px]">
                <div className="h-full w-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                   <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100" alt="Profile" className="h-full w-full object-cover" />
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