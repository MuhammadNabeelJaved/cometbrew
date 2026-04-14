/**
 * Modern Navigation Bar Component
 * Features:
 * - Dynamic scroll state (transparent -> glass)
 * - Premium hover effects
 * - Mobile glass menu overlay
 * - Theme & Language toggles
 * - Includes Dashboard link
 */
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useContent } from '../contexts/ContentContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { usePageVisibility } from '../hooks/usePageVisibility';
import { Button } from './ui/button';
import { Menu, X, Sun, Moon, Globe, Check, ChevronDown, ArrowRight, LayoutDashboard, LogOut, User, Settings, MessageSquare, Bell, Briefcase, FolderKanban, ClipboardList, HeadphonesIcon, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function Navbar() {
  const { theme, setTheme } = useTheme();
  const { logoUrl, announcementBars, navLinks: cmsNavLinks } = useContent();
  // Total height of all active bars (each is 40px)
  const totalBarHeight = announcementBars.filter(g => g.bar.isActive && g.items.length > 0).length * 40;
  const { lang, setLang, t } = useLanguage();
  const { user, isAuthenticated, logout } = useAuth();
  const { isVisible } = usePageVisibility();
  const [isOpen, setIsOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [showLangs, setShowLangs] = useState(false);
  const location = useLocation();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const getDashboardPath = () => {
    if (user?.role === 'admin') return '/admin';
    if (user?.role === 'team') return '/team';
    return '/user-dashboard';
  };

  const getProfileMenuItems = () => {
    if (user?.role === 'admin') return [
      { label: 'Dashboard',     icon: LayoutDashboard, to: '/admin' },
      { label: 'Messages',      icon: MessageSquare,   to: '/admin/messages' },
      { label: 'Notifications', icon: Bell,            to: '/admin/notifications' },
      { label: 'Team',          icon: Users,           to: '/admin/team' },
      { label: 'Settings',      icon: Settings,        to: '/admin/settings' },
    ];
    if (user?.role === 'team') return [
      { label: 'Dashboard',     icon: LayoutDashboard, to: '/team' },
      { label: 'Projects',      icon: FolderKanban,    to: '/team/projects' },
      { label: 'My Tasks',      icon: ClipboardList,   to: '/team/tasks' },
      { label: 'Chat',          icon: MessageSquare,   to: '/team/chat' },
      { label: 'Notifications', icon: Bell,            to: '/team/notifications' },
      { label: 'Settings',      icon: Settings,        to: '/team/settings' },
    ];
    return [
      { label: 'Dashboard',     icon: LayoutDashboard, to: '/user-dashboard' },
      { label: 'My Profile',    icon: User,            to: '/user-dashboard/profile' },
      { label: 'My Projects',   icon: Briefcase,       to: '/user-dashboard/projects' },
      { label: 'Applied Jobs',  icon: FolderKanban,    to: '/user-dashboard/applied-jobs' },
      { label: 'Support Chat',  icon: HeadphonesIcon,  to: '/user-dashboard/messages' },
      { label: 'Notifications', icon: Bell,            to: '/user-dashboard/notifications' },
    ];
  };

  const userInitials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const languages = [
    { code: 'EN' as const, name: 'English' },
    { code: 'ES' as const, name: 'Español' },
    { code: 'FR' as const, name: 'Français' },
    { code: 'DE' as const, name: 'Deutsch' },
    { code: 'JP' as const, name: '日本語' },
  ];

  const navLinks = (
    cmsNavLinks.length > 0
      ? cmsNavLinks
          .filter(l => l.isActive)
          .sort((a, b) => a.order - b.order)
          .map(l => ({ name: l.label, path: l.href, openInNewTab: l.openInNewTab }))
      : [
          { name: t('nav.services'), path: '/services', openInNewTab: false },
          { name: t('nav.portfolio'), path: '/portfolio', openInNewTab: false },
          { name: 'About', path: '/about', openInNewTab: false },
          { name: t('nav.contact'), path: '/contact', openInNewTab: false },
        ]
  ).filter(link => isVisible(link.path));

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ top: totalBarHeight }}
        className={`fixed left-0 right-0 z-50 h-16 transition-all duration-300 ease-in-out ${
          scrolled
            ? 'bg-background/70 backdrop-blur-xl border-b border-border/50 shadow-lg shadow-black/5'
            : 'bg-transparent border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex justify-between items-center h-full">
            
            {/* Logo */}
            <Link to="/" className="group flex items-center gap-3 relative z-50">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <img 
                  src={logoUrl} 
                  alt="Nabeel Logo" 
                  className="h-10 w-auto relative z-10 dark:invert transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3" 
                />
              </div>
              <div className="flex flex-col">
                <span className={`font-black text-2xl tracking-tighter leading-none transition-colors duration-300 ${
                  scrolled ? 'text-foreground' : 'text-foreground dark:text-white'
                }`}>
                  NABEEL
                </span>
                <span className={`text-[0.65rem] font-bold tracking-[0.2em] uppercase text-primary transition-all duration-300 ${
                  scrolled ? 'opacity-100' : 'opacity-80'
                } group-hover:tracking-[0.3em]`}>
                  Agency
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              <div className={`flex items-center space-x-1 px-4 py-2 rounded-full transition-all duration-500 ${
                scrolled ? 'bg-transparent' : 'bg-background/40 backdrop-blur-md border border-border/50 dark:bg-black/20 dark:border-white/10'
              }`}>
                {navLinks.map((link) => {
                  const isActive = location.pathname === link.path;
                  return (
                    <Link
                      key={link.name}
                      to={link.path}
                      target={link.openInNewTab ? '_blank' : undefined}
                      rel={link.openInNewTab ? 'noopener noreferrer' : undefined}
                      className="relative px-4 py-2 text-sm font-medium group overflow-hidden rounded-full"
                    >
                      {isActive && (
                        <motion.div
                          layoutId="nav-pill"
                          className="absolute inset-0 bg-primary/10 dark:bg-primary/20 rounded-full"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      <span className={`relative z-10 transition-colors ${
                        isActive 
                          ? 'text-primary' 
                          : scrolled 
                            ? 'text-muted-foreground group-hover:text-foreground' 
                            : 'text-foreground/80 group-hover:text-foreground dark:text-white/80 dark:group-hover:text-white'
                      }`}>
                        {link.name}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="hidden md:flex items-center space-x-3">
              {/* Theme Toggle */}
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className={`p-2.5 rounded-full transition-all duration-300 hover:scale-110 ${
                  scrolled 
                    ? 'hover:bg-accent text-muted-foreground' 
                    : 'bg-background/40 hover:bg-background/60 text-foreground dark:bg-white/10 dark:hover:bg-white/20 dark:text-white backdrop-blur-md border border-border/50 dark:border-white/10'
                }`}
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              
              {/* Language Selector */}
              <div className="relative">
                <button 
                  onClick={() => setShowLangs(!showLangs)}
                  onBlur={() => setTimeout(() => setShowLangs(false), 200)}
                  className={`flex items-center space-x-1 text-sm font-medium p-2.5 rounded-full transition-all duration-300 ${
                    scrolled
                      ? 'hover:bg-accent text-muted-foreground hover:text-foreground'
                      : 'bg-background/40 hover:bg-background/60 text-foreground dark:bg-white/10 dark:hover:bg-white/20 dark:text-white backdrop-blur-md border border-border/50 dark:border-white/10'
                  }`}
                >
                  <Globe className="h-4 w-4" />
                  <span className="text-xs uppercase ml-1">{lang}</span>
                  <ChevronDown className={`h-3 w-3 ml-1 transition-transform ${showLangs ? 'rotate-180' : ''}`} />
                </button>
                
                <AnimatePresence>
                  {showLangs && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-40 bg-popover/90 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl py-1 z-50 overflow-hidden"
                    >
                      {languages.map((l) => (
                        <button
                          key={l.code}
                          onClick={() => {
                            setLang(l.code);
                            setShowLangs(false);
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm hover:bg-primary/10 hover:text-primary transition-colors flex items-center justify-between text-foreground"
                        >
                          <span className={lang === l.code ? 'font-bold' : ''}>{l.name}</span>
                          {lang === l.code && <Check className="h-3 w-3 text-primary" />}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {isAuthenticated ? (
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setShowProfile(!showProfile)}
                    className="flex items-center gap-2 p-1 pr-3 rounded-full transition-all duration-300 hover:bg-accent border border-border/50"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden">
                      {user?.photo && user.photo !== 'default.jpg' ? (
                        <img src={user.photo} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-primary">{userInitials}</span>
                      )}
                    </div>
                    <span className="text-sm font-medium text-foreground max-w-[90px] truncate hidden lg:block">
                      {user?.name?.split(' ')[0]}
                    </span>
                    <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform ${showProfile ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {showProfile && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-3 w-60 bg-popover/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl shadow-black/10 z-50 overflow-hidden"
                      >
                        {/* Header */}
                        <div className="px-4 py-3.5 border-b border-border/50 flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-purple-600 p-[2px] shrink-0">
                            <div className="h-full w-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                              {user?.photo && user.photo !== 'default.jpg' ? (
                                <img src={user.photo} alt={user.name} className="h-full w-full object-cover" />
                              ) : (
                                <span className="text-sm font-bold text-primary">{userInitials}</span>
                              )}
                            </div>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate leading-tight">{user?.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                            <p className="text-xs text-primary/70 capitalize mt-0.5">{user?.role}</p>
                          </div>
                        </div>

                        {/* Role-based menu items */}
                        <div className="py-1.5">
                          {getProfileMenuItems().map((item) => (
                            <Link
                              key={item.to}
                              to={item.to}
                              onClick={() => setShowProfile(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                            >
                              <item.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                              {item.label}
                            </Link>
                          ))}

                          <div className="my-1 border-t border-border/50" />
                          <button
                            onClick={() => { logout(); setShowProfile(false); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <LogOut className="h-4 w-4 shrink-0" />
                            Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link to="/login">
                  <Button
                    className={`rounded-full px-6 transition-all duration-300 shadow-lg ${
                      scrolled
                        ? 'bg-primary hover:bg-primary/90 shadow-primary/25 text-primary-foreground'
                        : 'bg-foreground text-background hover:bg-foreground/90 hover:scale-105 shadow-black/10 dark:bg-white dark:text-black dark:shadow-white/10 border-0'
                    }`}
                  >
                    {t('nav.getStarted')}
                  </Button>
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center z-50">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-2 rounded-full transition-colors ${
                  isOpen || !scrolled ? 'text-foreground dark:text-white bg-background/40 dark:bg-white/10 backdrop-blur-md' : 'text-foreground'
                }`}
              >
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 md:hidden bg-background/95 backdrop-blur-3xl flex flex-col justify-center items-center"
          >
            {/* Background blobs for mobile menu */}
            <div className="absolute top-1/4 -left-20 w-80 h-80 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-secondary/20 rounded-full blur-[100px] pointer-events-none" />

            <div className="w-full max-w-sm px-6 space-y-8 relative z-10">
              <nav className="flex flex-col space-y-4 text-center">
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Link
                      to={link.path}
                      target={link.openInNewTab ? '_blank' : undefined}
                      rel={link.openInNewTab ? 'noopener noreferrer' : undefined}
                      onClick={() => setIsOpen(false)}
                      className={`text-3xl font-bold tracking-tight hover:text-primary transition-colors flex items-center justify-center space-x-3 ${
                        location.pathname === link.path ? 'text-primary' : 'text-foreground'
                      }`}
                    >
                      {link.name === 'Dashboard' && <LayoutDashboard className="w-6 h-6 opacity-50" />}
                      <span>{link.name}</span>
                    </Link>
                  </motion.div>
                ))}
              </nav>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col space-y-4"
              >
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="p-4 rounded-2xl bg-muted/50 hover:bg-muted transition-colors text-foreground"
                  >
                    {theme === 'dark' ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
                  </button>
                  <button
                    className="p-4 rounded-2xl bg-muted/50 hover:bg-muted transition-colors flex items-center space-x-2 text-foreground"
                    onClick={() => {
                      const nextLang = languages[(languages.findIndex(l => l.code === lang) + 1) % languages.length];
                      setLang(nextLang.code as any);
                    }}
                  >
                    <Globe className="h-6 w-6" />
                    <span className="font-bold">{lang}</span>
                  </button>
                </div>
                
                {isAuthenticated ? (
                  <div className="space-y-3">
                    {/* User info card */}
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-muted/50">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-purple-600 p-[2px] shrink-0">
                        <div className="h-full w-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                          {user?.photo && user.photo !== 'default.jpg' ? (
                            <img src={user.photo} alt={user.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-base font-bold text-primary">{userInitials}</span>
                          )}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">{user?.name}</p>
                        <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
                        <p className="text-xs text-primary/70 capitalize mt-0.5">{user?.role}</p>
                      </div>
                    </div>

                    {/* Role-based quick links */}
                    <div className="rounded-2xl bg-muted/30 overflow-hidden divide-y divide-border/50">
                      {getProfileMenuItems().map((item) => (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={() => setIsOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-accent transition-colors"
                        >
                          <item.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                          {item.label}
                        </Link>
                      ))}
                    </div>

                    <Button
                      variant="destructive"
                      className="w-full h-12 text-base rounded-2xl"
                      onClick={() => { logout(); setIsOpen(false); }}
                    >
                      <LogOut className="mr-2 h-5 w-5" /> Sign Out
                    </Button>
                  </div>
                ) : (
                  <Link to="/login" onClick={() => setIsOpen(false)}>
                    <Button className="w-full h-14 text-lg rounded-2xl shadow-xl shadow-primary/20">
                      {t('nav.getStarted')} <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}