/**
 * Maintenance Page
 * "System Upgrade" theme with gear/mechanic aesthetics
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { ArrowLeft, Wrench, Settings, Clock, Info } from 'lucide-react';

export default function Maintenance() {
  return (
    <div className="min-h-[85vh] flex items-center justify-center p-6 relative overflow-hidden bg-background">
      {/* Abstract Background Pattern */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--primary)) 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }}
      />
      
      <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
        <Settings className="w-96 h-96 animate-[spin_60s_linear_infinite]" />
      </div>
      <div className="absolute bottom-0 left-0 p-12 opacity-5 pointer-events-none">
        <Settings className="w-64 h-64 animate-[spin_40s_linear_infinite_reverse]" />
      </div>

      <div className="relative z-10 w-full max-w-4xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Visual Graphic */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="relative order-1 flex justify-center lg:justify-end"
          >
            <div className="relative w-full max-w-[360px] aspect-square">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-full blur-3xl opacity-50" />
              
              {/* Main Gear Cluster */}
              <div className="relative w-full h-full flex items-center justify-center">
                {/* Large Gear */}
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute w-48 h-48 border-4 border-muted-foreground/20 rounded-full border-dashed flex items-center justify-center"
                >
                  <Settings className="w-40 h-40 text-primary opacity-80" />
                </motion.div>
                
                {/* Medium Gear */}
                <motion.div 
                  animate={{ rotate: -360 }}
                  transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                  className="absolute -top-4 -right-4 w-24 h-24 text-secondary opacity-60 bg-background/80 backdrop-blur rounded-full p-2 border border-border shadow-lg"
                >
                  <Settings className="w-full h-full" />
                </motion.div>
                
                {/* Small Gear */}
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  className="absolute -bottom-2 -left-2 w-16 h-16 text-accent opacity-90 bg-background/80 backdrop-blur rounded-full p-2 border border-border shadow-lg"
                >
                  <Settings className="w-full h-full" />
                </motion.div>
                
                {/* Status Card */}
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="absolute bottom-0 right-10 bg-card border border-border p-4 rounded-xl shadow-xl max-w-[200px]"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase">Status</span>
                  </div>
                  <div className="text-sm font-medium">System Upgrade in Progress</div>
                  <div className="w-full bg-muted h-1.5 rounded-full mt-3 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: "75%" }}
                      transition={{ duration: 1.5, delay: 0.8 }}
                      className="h-full bg-yellow-500" 
                    />
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Text Content */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center lg:text-left order-2"
          >
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 border border-primary/20">
              <Wrench className="w-4 h-4" />
              <span>Routine Maintenance</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-tight">
              We're tuning up <br />
              <span className="text-muted-foreground">the engine.</span>
            </h1>
            
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              We're performing some scheduled updates to improve your experience. We should be back online shortly. Thank you for your patience!
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30 border border-border/50">
                <Clock className="w-5 h-5 text-primary mt-0.5" />
                <div className="text-left">
                  <div className="font-medium text-foreground">Estimated Time</div>
                  <div className="text-sm text-muted-foreground">~30 Minutes remaining</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30 border border-border/50">
                <Info className="w-5 h-5 text-primary mt-0.5" />
                <div className="text-left">
                  <div className="font-medium text-foreground">What's New</div>
                  <div className="text-sm text-muted-foreground">Performance improvements</div>
                </div>
              </div>
            </div>

            <Link
              to="/"
              className="group inline-flex items-center h-11 px-8 rounded-full text-sm font-medium text-white bg-gradient-to-r from-[#0EA5E9] to-[#2563EB] hover:from-[#38BDF8] hover:to-[#3B82F6] shadow-[0_0_30px_-5px_rgba(14,165,233,0.6)] hover:shadow-[0_0_40px_-5px_rgba(14,165,233,0.8)] hover:scale-105 transition-all duration-300"
            >
              <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Back to Home
            </Link>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
