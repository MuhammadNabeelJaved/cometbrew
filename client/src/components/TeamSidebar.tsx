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
  Users, 
  BarChart2, 
  Settings, 
  LogOut, 
  Bell,
  ChevronRight,
  Calendar,
  MessageSquare,
  Files
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';

export function TeamSidebar() {
  const location = useLocation();
  
  const links = [
    { name: 'Dashboard', path: '/team', icon: LayoutDashboard },
    { name: 'Projects', path: '/team/projects', icon: FolderKanban },
    { name: 'My Tasks', path: '/team/tasks', icon: CheckSquare },
    { name: 'Calendar', path: '/team/calendar', icon: Calendar },
    { name: 'Chat', path: '/team/chat', icon: MessageSquare },
    { name: 'Resources', path: '/team/resources', icon: Files },
    { name: 'Clients', path: '/team/clients', icon: Users },
    { name: 'Reports', path: '/team/reports', icon: BarChart2 },
    { name: 'Notifications', path: '/team/notifications', icon: Bell },
    { name: 'Settings', path: '/team/settings', icon: Settings },
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
              <span className="font-bold text-xl tracking-tight text-foreground">TEAM<span className="text-primary">DASH</span></span>
            </div>
          </Link>
      </div>
      
      {/* Navigation */}
      <div className="flex-grow py-8 px-3 space-y-2 overflow-y-auto no-scrollbar">
        <div className="px-3 mb-2 hidden lg:block">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Team Workspace</h3>
        </div>
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = link.path === '/team' 
            ? location.pathname === '/team'
            : location.pathname.startsWith(link.path);
          
          return (
            <Link
              key={link.path}
              to={link.path}
              className="relative group block"
            >
              {isActive && (
                <motion.div 
                  layoutId="activeTeamTab"
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