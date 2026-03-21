/**
 * Loading Page
 * "System Initialization" theme with hypnotic animated loader
 */
import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, Cpu, Activity, Server } from 'lucide-react';

export default function LoadingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
      
      <div className="relative z-10 flex flex-col items-center">
        {/* Main Loader Composition */}
        <div className="relative w-64 h-64 mb-12">
          {/* Ring 1 - Outer Pulsing */}
          <motion.div 
            className="absolute inset-0 border-2 border-primary/20 rounded-full"
            animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          
          {/* Ring 2 - Rotating Segment */}
          <motion.div 
            className="absolute inset-4 border-t-2 border-primary rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />

          {/* Ring 3 - Counter Rotating Dashed */}
          <motion.div 
            className="absolute inset-8 border border-secondary/40 rounded-full border-dashed"
            animate={{ rotate: -360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />

          {/* Ring 4 - Inner Rapid */}
          <motion.div 
            className="absolute inset-16 border-l-4 border-accent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />

          {/* Center Hexagon Core */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              className="w-16 h-16 bg-primary/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-primary/50 relative overflow-hidden"
              animate={{ rotate: [0, 45, 0, -45, 0] }}
              transition={{ duration: 6, repeat: Infinity }}
            >
               <Cpu className="w-8 h-8 text-primary animate-pulse" />
               <motion.div 
                  className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-transparent"
                  animate={{ y: [-50, 50] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
               />
            </motion.div>
          </div>

          {/* Orbital Particles */}
          <motion.div 
            className="absolute inset-0"
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          >
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rounded-full shadow-[0_0_10px_var(--primary)]" />
             <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-secondary rounded-full shadow-[0_0_10px_var(--secondary)]" />
          </motion.div>
        </div>

        {/* Loading Text & Status */}
        <div className="text-center space-y-6">
          <motion.h1 
            className="text-2xl md:text-3xl font-light tracking-[0.3em] uppercase text-white/90"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Initializing
          </motion.h1>

          {/* Tech Stats Row */}
          <div className="flex items-center justify-center gap-6 text-xs font-mono text-muted-foreground/60">
            <div className="flex items-center gap-2">
              <Server className="w-3 h-3" />
              <span>ESTABLISHING UPLINK</span>
            </div>
            <div className="h-3 w-[1px] bg-white/10" />
            <div className="flex items-center gap-2">
              <Activity className="w-3 h-3" />
              <span>SYNCING PROTOCOLS</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-64 h-1 bg-white/5 rounded-full overflow-hidden mx-auto">
            <motion.div 
              className="h-full bg-gradient-to-r from-primary via-secondary to-primary"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
          </div>
        </div>
      </div>

      {/* Code Rain Effect (Background) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
         <div className="flex justify-between px-10">
            {[...Array(6)].map((_, i) => (
               <motion.div
                  key={i}
                  className="w-[1px] h-[20vh] bg-gradient-to-b from-transparent via-primary to-transparent"
                  initial={{ y: -200, opacity: 0 }}
                  animate={{ y: '120vh', opacity: [0, 1, 0] }}
                  transition={{ 
                     duration: 3 + Math.random() * 2, 
                     repeat: Infinity, 
                     delay: Math.random() * 2,
                     ease: "linear"
                  }}
               />
            ))}
         </div>
      </div>
    </div>
  );
}
