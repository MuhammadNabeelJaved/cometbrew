/**
 * Dashboard Sidebar
 * A sleek, modern sidebar navigation
 */
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Users, 
  LayoutDashboard, 
  MessageSquare, 
  FolderKanban, 
  Settings, 
  LogOut, 
  Zap,
  CreditCard,
  Bot,
  HelpCircle,
  Bell,
  ChevronRight,
  Briefcase,
  PenTool,
  Database,
  Mail
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';

export function Sidebar() {
  const location = useLocation();
  const { theme } = useTheme();
  
  const links = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Services', path: '/admin/services', icon: Zap },
    { name: 'Projects', path: '/admin/projects', icon: FolderKanban },
    { name: 'Clients', path: '/admin/clients', icon: Users },
    { name: 'Team', path: '/admin/team', icon: Users },
    { name: 'Contacts', path: '/admin/contacts', icon: Mail },
    { name: 'Jobs', path: '/admin/jobs', icon: Briefcase },
    { name: 'Database', path: '/admin/database', icon: Database },
    { name: 'Content Editor', path: '/admin/content-editor', icon: PenTool },
    { name: 'AI Tools', path: '/admin/ai-tools', icon: Bot },
    { name: 'Messages', path: '/admin/messages', icon: MessageSquare },
    { name: 'Billing', path: '/admin/billing', icon: CreditCard },
    { name: 'Support', path: '/admin/support', icon: HelpCircle },
    { name: 'Notifications', path: '/admin/notifications', icon: Bell },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
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
      
      {/* Navigation */}
      <div className="flex-grow py-8 px-3 space-y-2 overflow-y-auto no-scrollbar">
        <div className="px-3 mb-2 hidden lg:block">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Main Menu</h3>
        </div>
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = link.path === '/admin' 
            ? location.pathname === '/admin'
            : location.pathname.startsWith(link.path);
          
          return (
            <Link
              key={link.path}
              to={link.path}
              className="relative group block"
            >
              {isActive && (
                <motion.div 
                  layoutId="activeTab"
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