/**
 * Process Component - "The Holographic Pipeline"
 * A creative, modern visualization of the development workflow.
 * Features:
 * - Vertical scrolling timeline with "active" state triggers
 * - Glassmorphic cards with glowing borders
 * - Animated connecting lines
 */
import React, { useRef } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import * as Icons from 'lucide-react';
import { cn } from '../lib/utils';
import { useContent } from '../contexts/ContentContext';
import { useLanguage } from '../contexts/LanguageContext';

// Helper to get Lucide icon
const getIcon = (name: string) => {
  const Icon = (Icons as any)[name];
  return Icon || Icons.Circle; // Fallback
};

export function Process() {
  const { processSteps } = useContent();
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const scaleY = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <section ref={containerRef} className="py-32 relative bg-background overflow-hidden">
      {/* Ambient Background Lights */}
      <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-center mb-24">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-background/50 dark:bg-white/5 border border-border dark:border-white/10 backdrop-blur-md mb-6"
          >
            <Icons.Lightbulb className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-medium text-foreground dark:text-white/90">{t('process.badge')}</span>
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold tracking-tight mb-6"
          >
            {t('process.title')}
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            {t('process.subtitle')}
          </motion.p>
        </div>

        {/* Timeline Container */}
        <div className="relative">
          
          {/* Central Line */}
          <div className="absolute left-[20px] md:left-1/2 top-0 bottom-0 w-1 bg-white/5 -translate-x-1/2 rounded-full overflow-hidden">
            <motion.div 
              className="w-full bg-gradient-to-b from-cyan-500 via-purple-500 to-pink-500 origin-top"
              style={{ scaleY, height: '100%' }} 
            />
          </div>

          <div className="space-y-12 md:space-y-24">
            {processSteps.map((step, index) => {
              const isEven = index % 2 === 0;
              const StepIcon = getIcon(step.iconName);
              const stepKey = `step${step.id}` as 'step1' | 'step2' | 'step3' | 'step4' | 'step5';
              const tTitle = t(`process.${stepKey}.title` as any) || step.title;
              const tDesc = t(`process.${stepKey}.desc` as any) || step.description;
              const tDetails = [
                t(`process.${stepKey}.d1` as any) || step.details[0],
                t(`process.${stepKey}.d2` as any) || step.details[1],
                t(`process.${stepKey}.d3` as any) || step.details[2],
              ];
              
              return (
                <div key={step.id} className={cn(
                  "relative flex flex-col md:flex-row items-center",
                  isEven ? "md:flex-row" : "md:flex-row-reverse"
                )}>
                  
                  {/* Timeline Dot */}
                  <div className="absolute left-[20px] md:left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-background border-4 border-background z-20 flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                    <div className={cn("w-full h-full rounded-full bg-gradient-to-br opacity-80 animate-pulse", step.color)} />
                    <div className="absolute inset-0 flex items-center justify-center">
                       <span className="text-xs font-bold text-white">{step.id}</span>
                    </div>
                  </div>

                  {/* Spacer for Desktop */}
                  <div className="hidden md:block w-1/2" />

                  {/* Content Card */}
                  <motion.div 
                    initial={{ opacity: 0, x: isEven ? 50 : -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className={cn(
                      "w-full md:w-[calc(50%-40px)] pl-16 md:pl-0",
                      isEven ? "md:pl-12 text-left" : "md:pr-12 md:text-right"
                    )}
                  >
                    <div className="group relative bg-card/50 dark:bg-white/5 hover:bg-card dark:hover:bg-white/10 border border-border dark:border-white/10 hover:border-primary/20 dark:hover:border-white/20 p-6 md:p-8 rounded-2xl backdrop-blur-sm transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 overflow-hidden">
                      {/* Hover Gradient Effect */}
                      <div className={cn(
                        "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-r",
                        step.color
                      )} />
                      
                      {/* Decorative Icon Blob */}
                      <div className={cn(
                        "absolute -top-12 -right-12 w-32 h-32 rounded-full blur-[50px] opacity-20",
                        step.color.split(" ")[1]?.replace("to-", "bg-") || "bg-primary"
                      )} />

                      <div className={cn(
                        "relative z-10 flex flex-col gap-4",
                        isEven ? "md:items-start" : "md:items-end"
                      )}>
                        <div className={cn(
                          "w-12 h-12 rounded-lg flex items-center justify-center bg-gradient-to-br shadow-lg mb-2",
                          step.color
                        )}>
                          <StepIcon className="w-6 h-6 text-white" />
                        </div>
                        
                        <div>
                          <h3 className="text-2xl font-bold text-foreground dark:text-white mb-2">{tTitle}</h3>
                          <p className="text-muted-foreground leading-relaxed mb-4">{tDesc}</p>
                        </div>

                        {/* Details Tags */}
                        <div className={cn(
                          "flex flex-wrap gap-2",
                          isEven ? "justify-start" : "justify-end"
                        )}>
                          {tDetails.map((detail, i) => (
                            <span
                              key={i}
                              className="px-3 py-1 rounded-full text-xs font-medium bg-background/50 dark:bg-white/5 border border-border dark:border-white/10 text-muted-foreground dark:text-white/70"
                            >
                              {detail}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
}