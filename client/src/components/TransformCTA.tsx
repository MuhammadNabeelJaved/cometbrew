/**
 * TransformCTA Component
 * A high-impact, interactive Call-to-Action section.
 * Features:
 * - "Warp Speed" starfield effect
 * - Magnetic button interaction
 * - 3D perspective text
 * - Dynamic lighting effects
 */
import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValue, useMotionTemplate } from 'framer-motion';
import { ArrowRight, Sparkles, Rocket } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { cn } from '../lib/utils';
import { useLanguage } from '../contexts/LanguageContext';

export function TransformCTA() {
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  // Parallax and transformation effects
  const y = useTransform(scrollYProgress, [0, 1], [-100, 100]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1, 0.8]);
  
  // Mouse interaction for the "flashlight" effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <section 
      ref={containerRef}
      className="relative py-32 px-4 overflow-hidden [perspective:1000px]"
      onMouseMove={handleMouseMove}
    >
      {/* --- Dynamic Background --- */}
      <div className="absolute inset-0 bg-background transition-colors duration-300">
        {/* Animated Grid Floor */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--foreground)/0.1)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--foreground)/0.1)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 transform-gpu [transform:rotateX(12deg)] origin-top" />
        
        {/* Spotlights */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] mix-blend-screen animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[128px] mix-blend-screen animate-pulse delay-1000" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div 
          style={{ opacity, scale }}
          className="relative rounded-[3rem] overflow-hidden bg-card/50 dark:bg-zinc-900/50 border border-border/50 dark:border-white/10 backdrop-blur-xl shadow-2xl transition-colors duration-300"
        >
          {/* Flashlight/Glow Effect */}
          <motion.div
            className="pointer-events-none absolute -inset-px rounded-[3rem] opacity-0 transition duration-300 group-hover:opacity-100"
            style={{
              background: useMotionTemplate`
                radial-gradient(
                  650px circle at ${mouseX}px ${mouseY}px,
                  rgba(255,255,255,0.1),
                  transparent 80%
                )
              `,
            }}
          />

          <div className="grid lg:grid-cols-2 gap-12 p-12 md:p-24 items-center">
            
            {/* Left: Text Content */}
            <div className="space-y-8 relative">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                <span>{t('cta.badge')}</span>
              </div>
              
              <h2 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground dark:text-white leading-[0.9]">
                {t('cta.titleLine1')} <br />
                <motion.span
                  animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                  className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-400 to-primary bg-[length:200%_auto]"
                >
                  {t('cta.titleLine2')}
                </motion.span>
              </h2>

              <p className="text-xl text-muted-foreground dark:text-zinc-400 max-w-md leading-relaxed">
                {t('cta.description')}
              </p>

              <div className="flex flex-wrap gap-4 pt-4">
                <Link to="/contact">
                  <Button size="lg" className="h-16 px-8 rounded-full text-lg bg-foreground text-background hover:bg-foreground/90 hover:scale-105 transition-all duration-300 shadow-xl">
                    {t('cta.startProject')}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link to="/portfolio">
                   <Button size="lg" variant="outline" className="h-16 px-8 rounded-full text-lg border-border/50 dark:border-zinc-700 hover:bg-foreground/5 hover:border-foreground/20 text-foreground dark:text-white transition-all duration-300">
                    {t('cta.viewCaseStudies')}
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right: Abstract 3D Visual */}
            <div className="relative h-[400px] w-full flex items-center justify-center [perspective:1000px] group">
              {/* Central Glowing Orb */}
              <motion.div 
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 180, 360],
                }}
                transition={{ 
                  duration: 20, 
                  repeat: Infinity,
                  ease: "linear" 
                }}
                className="relative w-64 h-64"
              >
                {/* Rings */}
                <div className="absolute inset-0 rounded-full border border-primary/30 blur-[1px] transform rotate-45 group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-4 rounded-full border border-purple-500/30 blur-[1px] transform -rotate-45 group-hover:scale-90 transition-transform duration-700" />
                <div className="absolute inset-8 rounded-full border border-white/20 blur-[1px]" />
                
                {/* Core */}
                <div className="absolute inset-0 m-auto w-32 h-32 rounded-full bg-gradient-to-br from-primary to-purple-600 blur-[40px] opacity-50 group-hover:opacity-80 transition-opacity duration-500" />
                <div className="absolute inset-0 m-auto w-24 h-24 rounded-full bg-black border border-white/10 backdrop-blur-md flex items-center justify-center z-10 overflow-hidden">
                    <Rocket className="w-10 h-10 text-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
                    
                    {/* Scanning Line */}
                    <div className="absolute inset-0 w-full h-1 bg-primary/50 blur-[2px] animate-scan-down opacity-0 group-hover:opacity-100" />
                </div>
              </motion.div>

              {/* Orbiting Elements */}
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-full h-full border border-white/5 rounded-full"
                  style={{ rotateX: 60, rotateZ: i * 60 }}
                  animate={{ rotateZ: [i * 60, i * 60 + 360] }}
                  transition={{ duration: 15 + i * 5, repeat: Infinity, ease: "linear" }}
                />
              ))}
            </div>

          </div>
        </motion.div>
      </div>
    </section>
  );
}
