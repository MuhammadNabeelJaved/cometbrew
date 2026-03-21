/**
 * Page Loader Showcase
 * "Kinetic Typographic" theme focusing on bold agency aesthetics
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

export default function PageLoader() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + 1;
      });
    }, 40);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-foreground text-background relative overflow-hidden flex flex-col">
      {/* Background Texture */}
      <div 
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="flex-1 flex flex-col justify-between p-6 md:p-12 relative z-10">
        {/* Header */}
        <div className="flex justify-between items-start">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2"
          >
            <div className="w-3 h-3 bg-background rounded-full animate-pulse" />
            <span className="font-mono text-sm tracking-widest uppercase">System Loading</span>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden md:flex gap-8 font-mono text-sm"
          >
            <span>EST. 2024</span>
            <span>SF, CA</span>
          </motion.div>
        </div>

        {/* Center Content - Massive Progress */}
        <div className="flex flex-col items-center justify-center flex-1">
          <div className="relative">
            <motion.h1 
              className="text-[15vw] md:text-[20vw] font-black leading-none tracking-tighter"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8 }}
            >
              {progress}
            </motion.h1>
            <motion.span 
              className="absolute top-4 right-4 md:top-12 md:right-12 text-4xl md:text-6xl font-light"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              %
            </motion.span>
          </div>

          <div className="w-full max-w-md mt-12 overflow-hidden">
            <AnimatePresence mode="wait">
              {progress < 30 && (
                <motion.p 
                  key="step1"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  className="text-center font-mono text-background/60"
                >
                  INITIALIZING ASSETS...
                </motion.p>
              )}
              {progress >= 30 && progress < 70 && (
                <motion.p 
                  key="step2"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  className="text-center font-mono text-background/60"
                >
                  ESTABLISHING SECURE CONNECTION...
                </motion.p>
              )}
              {progress >= 70 && (
                <motion.p 
                  key="step3"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  className="text-center font-mono text-background/60"
                >
                  RENDERING INTERFACE...
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-end">
          <motion.div 
            className="flex flex-col gap-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <span className="font-mono text-xs text-background/40">MEMORY USAGE</span>
            <span className="font-mono text-xl">256MB</span>
          </motion.div>

          {progress === 100 && (
            <motion.button
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.05 }}
              className="bg-background text-foreground px-8 py-4 rounded-full font-bold text-lg flex items-center gap-2 group"
            >
              ENTER SITE
              <ArrowUpRight className="w-5 h-5 group-hover:rotate-45 transition-transform" />
            </motion.button>
          )}
        </div>
      </div>
      
      {/* Loading Bar at Bottom */}
      <div className="absolute bottom-0 left-0 h-2 bg-background w-full origin-left transform" style={{ transform: `scaleX(${progress / 100})` }} />
    </div>
  );
}
