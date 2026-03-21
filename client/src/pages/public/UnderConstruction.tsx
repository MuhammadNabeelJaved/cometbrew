/**
 * Under Construction Page
 * "Building the Future" theme with blueprint aesthetics and progress indicators
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { ArrowLeft, Hammer, Construction, Send, HardHat } from 'lucide-react';

export default function UnderConstruction() {
  return (
    <div className="min-h-[85vh] flex items-center justify-center p-6 relative overflow-hidden bg-background">
      {/* Blueprint Grid Background */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(to right, hsl(var(--primary)) 1px, transparent 1px),
                           linear-gradient(to bottom, hsl(var(--primary)) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />

      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-0" />

      <div className="relative z-10 w-full max-w-4xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Text Content */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left order-2 lg:order-1"
          >
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-500 text-sm font-medium mb-6 border border-yellow-500/20">
              <Construction className="w-4 h-4 animate-bounce" />
              <span>Work in Progress</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
              Building the <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">
                Next Chapter.
              </span>
            </h1>
            
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed max-w-md mx-auto lg:mx-0">
              We're crafting a new digital experience. This page is currently under active development and will be launching soon.
            </p>

            {/* Notify Form */}
            <div className="max-w-sm mx-auto lg:mx-0 mb-8 space-y-4">
              <div className="flex gap-2">
                <Input 
                  placeholder="Enter your email" 
                  className="bg-muted/50 border-border/50 h-11"
                />
                <Button size="icon" className="h-11 w-11 shrink-0">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Get notified when we launch. No spam, we promise.
              </p>
            </div>

            <Link
              to="/"
              className="group inline-flex items-center h-10 px-6 rounded-full text-sm font-medium text-white bg-gradient-to-r from-[#0EA5E9] to-[#2563EB] hover:from-[#38BDF8] hover:to-[#3B82F6] shadow-[0_0_30px_-5px_rgba(14,165,233,0.6)] hover:shadow-[0_0_40px_-5px_rgba(14,165,233,0.8)] hover:scale-105 transition-all duration-300"
            >
              <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Return to Home
            </Link>
          </motion.div>

          {/* Visual Graphic */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative order-1 lg:order-2 flex justify-center"
          >
            <div className="relative w-full max-w-[400px] aspect-square">
              {/* Animated Rings */}
              <div className="absolute inset-0 border border-primary/20 rounded-full animate-[spin_20s_linear_infinite]" />
              <div className="absolute inset-8 border border-primary/10 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
              <div className="absolute inset-16 border border-dashed border-primary/30 rounded-full animate-[spin_30s_linear_infinite]" />
              
              {/* Center 3D-like Element */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-48 h-48 bg-gradient-to-br from-muted/50 to-muted/10 rounded-3xl border border-white/10 backdrop-blur-xl flex items-center justify-center transform rotate-12 shadow-2xl">
                  <HardHat className="w-24 h-24 text-primary opacity-80" />
                  
                  {/* Floating Elements */}
                  <motion.div 
                    animate={{ y: [-10, 10, -10] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -top-6 -right-6 w-16 h-16 bg-background rounded-2xl shadow-lg border border-border flex items-center justify-center"
                  >
                    <Hammer className="w-8 h-8 text-yellow-500" />
                  </motion.div>
                  
                  <motion.div 
                    animate={{ y: [10, -10, 10] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute -bottom-4 -left-4 w-12 h-12 bg-primary text-primary-foreground rounded-xl shadow-lg flex items-center justify-center font-bold"
                  >
                    85%
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
