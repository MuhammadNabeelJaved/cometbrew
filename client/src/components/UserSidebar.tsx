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
  Sparkles
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';

import { useNavigate } from 'react-router-dom';

export function UserSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const links = [
    { name: 'Overview', path: '/user-dashboard', icon: LayoutDashboard },
    { name: 'My Projects', path: '/user-dashboard/projects', icon: FolderKanban },
    { name: 'Messages', path: '/user-dashboard/messages', icon: MessageSquare },
    { name: 'AI Assistant', path: '/user-dashboard/ai-assistant', icon: Sparkles },
    { name: 'Profile & Settings', path: '/user-dashboard/profile', icon: User },
    { name: 'Notifications', path: '/user-dashboard/notifications', icon: Bell },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-20 lg:w-72 bg-background/80 backdrop-blur-xl border-r border-border/50 z-40 transition-all duration-300 flex flex-col">
      {/* Logo */}
      <div className="h-20 flex items-center justify-center lg:justify-start lg:px-6 border-b border-border/50">
         <Link to="/" className="flex items-center gap-3 group">
             <img 
                src="https://vgbujcuwptvheqijyjbe.supabase.co/storage/v1/object/public/hmac-uploads/uploads/216147d0-06c1-4dee-8a5a-f933c6ef8556/1766429553723-26c2f3fe/N_Logo-01.png" 
                alt="Nabeel Logo" 
                className="h-10 w-auto dark:invert" 
              />
            <div className="hidden lg:block">
              <span className="font-bold text-xl tracking-tight text-foreground">NABEEL</span>
            </div>
          </Link>
      </div>
      
      {/* User Info - Mini Profile */}
      <div className="hidden lg:flex flex-col items-center p-6 border-b border-border/50 bg-secondary/5">
        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-blue-600 p-[2px] mb-3">
            <div className="h-full w-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100" alt="User Profile" className="h-full w-full object-cover" />
            </div>
        </div>
        <h3 className="font-semibold text-lg">Alex Morgan</h3>
        <p className="text-xs text-muted-foreground">Client Account</p>
      </div>
      
      {/* Navigation */}
      <div className="flex-grow py-6 px-3 space-y-2 overflow-y-auto no-scrollbar">
        <div className="px-3 mb-2 hidden lg:block">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dashboard</h3>
        </div>
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = link.path === '/user-dashboard' 
            ? location.pathname === '/user-dashboard'
            : location.pathname.startsWith(link.path);
          
          return (
            <Link
              key={link.path}
              to={link.path}
              className="relative group block"
            >
              {isActive && (
                <motion.div 
                  layoutId="activeUserTab"
                  className="absolute inset-0 bg-primary/10 rounded-xl"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <div className={cn(
                "relative flex items-center gap-3 px-3 lg:px-4 py-3 rounded-xl transition-all duration-300 group-hover:bg-accent",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}>
                <Icon className={cn("h-5 w-5 transition-colors", isActive && "fill-primary/20")} />
                <span className="hidden lg:block font-medium">{link.name}</span>
                {isActive && <ChevronRight className="hidden lg:block ml-auto h-4 w-4 opacity-50" />}
              </div>
            </Link>
          );
        })}

        {/* New Order Button */}
        <div className="px-3 mt-6 hidden lg:block">
            <button 
                onClick={() => navigate('/user-dashboard/projects', { state: { openNewProject: true } })}
                className="w-full bg-gradient-to-r from-primary to-blue-600 text-primary-foreground hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 py-3 rounded-xl font-medium flex items-center justify-center gap-2 group"
            >
                <PlusCircle className="h-5 w-5 group-hover:rotate-90 transition-transform" />
                New Project
            </button>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-border/50 mt-auto">
        <Link 
          to="/" 
          className="flex items-center gap-3 px-3 lg:px-4 py-3 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors group"
        >
          <LogOut className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
          <span className="hidden lg:block font-medium">Sign Out</span>
        </Link>
      </div>
    </aside>
  );
}