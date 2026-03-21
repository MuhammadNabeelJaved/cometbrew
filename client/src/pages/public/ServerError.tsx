/**
 * 500 Server Error Page
 * "System Meltdown" theme with code rain and warning aesthetics
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../../components/ui/button';
import { RefreshCw, Home, AlertTriangle, Terminal } from 'lucide-react';

export default function ServerError() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 relative overflow-hidden bg-background">
      {/* Matrix-like Code Background */}
      <div className="absolute inset-0 overflow-hidden opacity-[0.03] pointer-events-none select-none font-mono text-sm leading-4 text-primary">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute top-0 text-xs md:text-sm whitespace-nowrap"
            style={{ 
              left: `${i * 5}%`,
              writingMode: 'vertical-rl'
            }}
            animate={{ 
              y: [0, 1000],
              opacity: [0, 1, 0]
            }}
            transition={{ 
              duration: 10 + Math.random() * 10,
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * 5
            }}
          >
            {Array.from({ length: 50 }).map(() => Math.random() > 0.5 ? '1' : '0').join(' ')}
          </motion.div>
        ))}
      </div>

      <div className="relative z-10 w-full max-w-2xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          
          {/* Visual Graphic */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="relative order-2 md:order-1"
          >
            <div className="relative w-full aspect-square max-w-[300px] mx-auto">
              {/* Outer Rings */}
              <div className="absolute inset-0 border-2 border-destructive/20 rounded-full animate-[spin_10s_linear_infinite]" />
              <div className="absolute inset-4 border border-destructive/40 rounded-full border-dashed animate-[spin_15s_linear_infinite_reverse]" />
              
              {/* Center Core */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 bg-destructive/10 rounded-full flex items-center justify-center backdrop-blur-md border border-destructive/30">
                  <AlertTriangle className="w-16 h-16 text-destructive animate-pulse" />
                </div>
              </div>

              {/* Orbiting Elements */}
              <motion.div 
                className="absolute top-1/2 left-1/2 w-full h-2 bg-transparent"
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              >
                <div className="w-3 h-3 bg-destructive rounded-full absolute -left-1.5 top-0 shadow-[0_0_15px_rgba(239,68,68,0.8)]" />
              </motion.div>
            </div>
          </motion.div>

          {/* Text Content */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center md:text-left order-1 md:order-2"
          >
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-destructive/10 text-destructive text-sm font-medium mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
              </span>
              <span>System Critical Error</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-2">500</h1>
            <h2 className="text-2xl font-semibold mb-4 text-foreground/80">Internal Server Error</h2>
            
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Our servers encountered an unexpected condition. The team has been notified and we're working to restore the neural link.
            </p>

            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 font-mono text-xs text-left border border-border overflow-hidden">
                <div className="flex items-center space-x-2 mb-2 border-b border-border/50 pb-2">
                  <Terminal className="w-3 h-3" />
                  <span>debug_log.txt</span>
                </div>
                <div className="text-destructive">Error: Connection refused at port 8080</div>
                <div className="text-muted-foreground">at System.Connect (Core:23:45)</div>
                <div className="text-muted-foreground">at Process.Retry (Network:12:01)</div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button onClick={() => window.location.reload()} size="lg">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry Connection
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/">
                    <Home className="mr-2 h-4 w-4" />
                    Home
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}