/**
 * Hero Section Component
 * High-impact visual with glowing background and clear CTA
 */
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Bot, Sparkles, Zap, Globe, Code2, Smartphone, BarChart3, Fingerprint, Cloud } from 'lucide-react';
import { Button } from './ui/button';
import { Link } from 'react-router-dom';
import { useContent } from '../contexts/ContentContext';
import { useLanguage } from '../contexts/LanguageContext';

export function Hero() {
  const { heroContent } = useContent();
  const { t } = useLanguage();

  return (
    <div className="relative overflow-hidden min-h-screen flex items-center justify-center bg-background">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] mix-blend-screen opacity-50 animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-secondary/20 rounded-full blur-[120px] mix-blend-screen opacity-50 animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-border/30 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-border/30 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-border/30 rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full pt-20">
        <div className="flex flex-col items-center text-center space-y-10">
          
          {/* Badge */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-background/50 border border-border/50 backdrop-blur-md shadow-sm"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-sm font-medium text-foreground">{t('hero.badge')}</span>
          </motion.div>
          
          {/* Main Title */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-none text-foreground"
          >
            {t('hero.titleLine1')} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-blue-600 dark:from-white dark:via-white dark:to-white/50">{t('hero.titleLine2')}</span>
          </motion.h1>
          
          {/* Description */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            {t('hero.subtitle')}
          </motion.p>
          
          {/* CTA Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-4"
          >
            <Link to="/contact">
              <Button size="lg" className="h-14 px-8 text-lg rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
                {t('hero.startProject')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/portfolio">
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full border-border/50 hover:bg-muted text-foreground">
                {t('hero.viewWork')}
              </Button>
            </Link>
          </motion.div>

          {/* Floating Cards (Decorative) */}
          <div className="absolute w-full h-full top-0 left-0 pointer-events-none -z-10 overflow-hidden">
             {/* Left Card */}
             <motion.div 
               animate={{ y: [0, -20, 0], rotate: [-6, -8, -6] }}
               transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
               className="absolute top-1/3 left-[10%] bg-card/80 dark:bg-card/40 backdrop-blur-xl border border-border p-4 rounded-2xl hidden lg:block shadow-2xl dark:shadow-[0_0_30px_rgba(0,0,0,0.2)]"
             >
               <div className="flex items-center gap-3 mb-2">
                 <div className="p-2 bg-blue-500/20 rounded-lg">
                   <Code2 className="h-6 w-6 text-blue-500" />
                 </div>
                 <div className="space-y-1">
                   <div className="w-16 h-2 bg-foreground/20 rounded-full"></div>
                   <div className="w-10 h-2 bg-foreground/10 rounded-full"></div>
                 </div>
               </div>
             </motion.div>

             {/* Right Card */}
             <motion.div 
               animate={{ y: [0, 30, 0], rotate: [12, 10, 12] }}
               transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
               className="absolute top-1/4 right-[10%] bg-card/80 dark:bg-card/40 backdrop-blur-xl border border-border p-4 rounded-2xl hidden lg:block shadow-2xl dark:shadow-[0_0_30px_rgba(0,0,0,0.2)]"
             >
               <div className="flex items-center gap-3 mb-2">
                 <div className="p-2 bg-yellow-500/20 rounded-lg">
                   <Zap className="h-6 w-6 text-yellow-500" />
                 </div>
                 <div className="space-y-1">
                   <div className="w-20 h-2 bg-foreground/20 rounded-full"></div>
                   <div className="w-12 h-2 bg-foreground/10 rounded-full"></div>
                 </div>
               </div>
             </motion.div>

             {/* Analytics Floating Element */}
             <motion.div 
               animate={{ y: [0, -25, 0], x: [0, 10, 0] }}
               transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
               className="absolute bottom-1/4 left-[15%] bg-card/80 dark:bg-card/40 backdrop-blur-xl border border-border p-3 rounded-2xl hidden lg:flex items-center gap-3 shadow-2xl dark:shadow-[0_0_30px_rgba(0,0,0,0.2)]"
             >
               <div className="p-2 bg-green-500/20 rounded-lg">
                 <BarChart3 className="h-5 w-5 text-green-500" />
               </div>
               <div className="text-xs font-mono text-green-600 dark:text-green-400">+128% Growth</div>
             </motion.div>

             {/* Mobile App Element */}
             <motion.div 
               animate={{ y: [0, 20, 0], x: [0, -10, 0] }}
               transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
               className="absolute bottom-1/3 right-[15%] bg-card/80 dark:bg-card/40 backdrop-blur-xl border border-border p-4 rounded-2xl hidden lg:block shadow-2xl dark:shadow-[0_0_30px_rgba(0,0,0,0.2)]"
             >
               <div className="flex flex-col items-center gap-2">
                 <Smartphone className="h-6 w-6 text-purple-500" />
                 <div className="w-8 h-1 bg-purple-500/50 rounded-full"></div>
               </div>
             </motion.div>

             {/* Security/Auth Element */}
             <motion.div 
               animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
               transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
               className="absolute top-[20%] left-[25%] hidden lg:block"
             >
               <div className="p-3 bg-red-500/10 rounded-full border border-red-500/20 backdrop-blur-md">
                 <Fingerprint className="h-6 w-6 text-red-500" />
               </div>
             </motion.div>

             {/* Cloud Element */}
             <motion.div 
               animate={{ x: [0, 30, 0] }}
               transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
               className="absolute bottom-[20%] right-[25%] hidden lg:block"
             >
               <div className="p-3 bg-cyan-500/10 rounded-full border border-cyan-500/20 backdrop-blur-md">
                 <Cloud className="h-6 w-6 text-cyan-500" />
               </div>
             </motion.div>

             {/* AI/Bot Element (Small) */}
             <motion.div 
               animate={{ rotate: [0, 360] }}
               transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
               className="absolute top-[15%] right-[30%] hidden lg:block opacity-30"
             >
               <Bot className="h-12 w-12 text-foreground" />
             </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}