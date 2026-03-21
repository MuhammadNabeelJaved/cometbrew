/**
 * Footer Component
 * A high-impact, modern footer with creative typography and interactions.
 * Features:
 * - Massive typography
 * - Interactive social links
 * - Animated background elements
 * - Clean, asymmetrical layout
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight, Zap, Twitter, Linkedin, Instagram, Github, Heart } from 'lucide-react';
import { Button } from './ui/button';
import { useLanguage } from '../contexts/LanguageContext';

export function Footer() {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { name: 'Twitter', icon: Twitter, href: '#' },
    { name: 'LinkedIn', icon: Linkedin, href: '#' },
    { name: 'Instagram', icon: Instagram, href: '#' },
    { name: 'GitHub', icon: Github, href: '#' },
  ];

  const footerLinks = [
    {
      title: t('footer.exploreTitle'),
      links: [
        { label: t('nav.services'), href: '/services' },
        { label: t('nav.portfolio'), href: '/portfolio' },
        { label: 'Process', href: '/#process' },
        { label: 'About', href: '/about' },
      ],
    },
    {
      title: t('footer.emailTemplatesTitle'),
      links: [
        { label: 'Signup Confirmation', href: '/emails/signup-confirmation' },
        { label: 'Email Verification', href: '/emails/email-verification' },
        { label: 'Password Reset', href: '/emails/password-reset' },
        { label: 'Project Created', href: '/emails/project-created' },
        { label: 'Project Completed', href: '/emails/project-completed' },
        { label: 'Feedback Request', href: '/emails/feedback-request' },
        { label: 'OTP Verification', href: '/otp-verification' },
      ],
    },
    {
      title: t('footer.companyTitle'),
      links: [
        { label: 'Our Team', href: '/our-team' },
        { label: 'Careers', href: '/careers' },
        { label: 'Blog', href: '/blog' },
        { label: t('nav.contact'), href: '/contact' },
        { label: t('footer.privacy'), href: '/privacy' },
        { label: 'Job Privacy Policy', href: '/careers/privacy' },
        { label: 'Team Dashboard', href: '/team' },
        { label: 'Apply Now', href: '/careers/apply' },
        { label: '404 Error', href: '/404' },
        { label: '500 Error', href: '/500' },
        { label: 'Coming Soon', href: '/coming-soon' },
        { label: 'Maintenance', href: '/maintenance' },
        { label: 'Skeleton Preview', href: '/skeleton' },
        { label: 'Loading Screen', href: '/loading' },
        { label: 'Page Loader', href: '/page-loader' },
      ],
    },
  ];

  return (
    <footer className="relative bg-background text-foreground pt-24 pb-12 overflow-hidden border-t border-border/50">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
      <div className="absolute -top-[200px] -right-[200px] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Top Section: CTA & Branding */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12 mb-24">
          <div className="space-y-6 max-w-2xl">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-6xl md:text-8xl font-bold tracking-tighter leading-[0.9] mb-6 text-foreground">
                {t('footer.letsBuild')} <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-300 to-primary animate-gradient bg-[length:200%_auto]">
                  {t('footer.theFuture')}
                </span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-md">
                {t('footer.readyToTransform')}
              </p>
            </motion.div>
            
            <motion.div
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Link to="/contact">
                <Button size="lg" className="h-16 px-8 rounded-full text-lg bg-foreground text-background hover:bg-foreground/90 hover:scale-105 transition-all duration-300">
                  {t('footer.startProject')}
                  <ArrowUpRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </motion.div>
          </div>

          <div className="flex flex-col items-start lg:items-end gap-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-medium text-green-500 uppercase tracking-wider">{t('footer.available')}</span>
            </div>
             <a href="mailto:hello@nabeel.agency" className="text-2xl md:text-3xl text-foreground hover:text-primary transition-colors border-b border-border/50 hover:border-primary pb-1">
              hello@nabeel.agency
            </a>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-border/50 mb-16" />

        {/* Middle Section: Links */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-24">
          
          {/* Brand Column */}
          <div className="md:col-span-4 space-y-6">
            <Link to="/" className="flex items-center gap-3 group mb-2">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <img 
                  src="https://vgbujcuwptvheqijyjbe.supabase.co/storage/v1/object/public/hmac-uploads/uploads/216147d0-06c1-4dee-8a5a-f933c6ef8556/1766429553723-26c2f3fe/N_Logo-01.png" 
                  alt="Nabeel Logo" 
                  className="h-12 w-auto relative z-10 dark:invert transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3" 
                />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-3xl tracking-tighter leading-none text-foreground">
                  NABEEL
                </span>
                <span className="text-xs font-bold tracking-[0.2em] uppercase text-primary group-hover:tracking-[0.3em] transition-all duration-300">
                  Agency
                </span>
              </div>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
              {t('footer.description')}
            </p>
             <div className="flex gap-4">
              {socialLinks.map((social) => (
                <a 
                  key={social.name} 
                  href={social.href}
                  className="w-10 h-10 rounded-full bg-muted/10 border border-border/50 flex items-center justify-center text-muted-foreground hover:bg-foreground hover:text-background hover:border-foreground transition-all duration-300"
                  aria-label={social.name}
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Spacer */}
          <div className="hidden md:block md:col-span-2" />

          {/* Links Columns */}
          {footerLinks.map((column) => (
            <div key={column.title} className="md:col-span-3">
              <h4 className="font-bold text-lg mb-6 text-foreground">{column.title}</h4>
              <ul className="space-y-4">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link 
                      to={link.href} 
                      className="group flex items-center text-muted-foreground hover:text-foreground transition-colors text-sm"
                    >
                      <span className="w-0 overflow-hidden group-hover:w-3 transition-all duration-300 text-primary mr-0 group-hover:mr-2">→</span>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Section: Copyright */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-muted-foreground/60 border-t border-border/50 pt-8">
          <p>© {currentYear} {t('footer.copyright')}</p>
          <div className="flex items-center gap-6">
            <Link to="/privacy" className="hover:text-foreground transition-colors">{t('footer.privacy')}</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">{t('footer.terms')}</Link>
            <Link to="/cookies" className="hover:text-foreground transition-colors">{t('footer.cookies')}</Link>
          </div>
          <div className="flex items-center gap-1.5 opacity-50 hover:opacity-100 transition-opacity">
            <span>{t('footer.madeWith')}</span>
            <Heart className="w-3 h-3 text-red-500 fill-red-500 animate-pulse" />
            <span>{t('footer.inCalifornia')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
