/**
 * 404 Not Found Page
 * "Navigation Failure" theme with holographic radar and sci-fi aesthetics
 * Matches the complexity and style of the ServerError (500) page
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../../components/ui/button';
import { Home, Search, MapPinOff, Radar, Globe, RotateCcw } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 relative overflow-hidden bg-background">
      {/* Sci-Fi Grid Background */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, currentColor 1px, transparent 1px),
            linear-gradient(to bottom, currentColor 1px, transparent 1px)
          `,
          backgroundSize: '4rem 4rem',
        }}
      >
        <motion.div 
          className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* Scanning Line Effect */}
      <motion.div
        className="absolute top-0 left-0 w-full h-[2px] bg-primary/20 shadow-[0_0_20px_rgba(59,130,246,0.5)] z-0"
        animate={{ top: ['0%', '100%'] }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />

      <div className="relative z-10 w-full max-w-4xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          
          {/* Holographic Radar Graphic */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="relative order-2 md:order-1 flex justify-center"
          >
            <div className="relative w-full aspect-square max-w-[320px]">
              {/* Radar Rings */}
              {[...Array(3)].map((_, i) => (
                <div 
                  key={i}
                  className="absolute inset-0 border border-primary/20 rounded-full"
                  style={{ margin: `${i * 15}%` }}
                />
              ))}
              
              {/* Rotating Scanner */}
              <motion.div 
                className="absolute inset-4 rounded-full border-t-2 border-primary/50 bg-gradient-to-b from-primary/10 to-transparent"
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                style={{ clipPath: 'polygon(50% 50%, 100% 0, 100% 0, 100% 100%, 100% 100%, 50% 50%)' }}
              />

              {/* Ping Effects */}
              <motion.div 
                className="absolute top-1/4 right-1/4 w-2 h-2 bg-destructive rounded-full"
                animate={{ opacity: [0, 1, 0], scale: [1, 2, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              />
              <motion.div 
                className="absolute bottom-1/3 left-1/3 w-2 h-2 bg-primary rounded-full"
                animate={{ opacity: [0, 1, 0], scale: [1, 1.5, 1] }}
                transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
              />

              {/* Central Glitching Icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 bg-background/80 backdrop-blur-md rounded-full flex items-center justify-center border border-primary/30 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                  <MapPinOff className="w-10 h-10 text-primary animate-pulse" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Text Content */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center md:text-left order-1 md:order-2"
          >
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 border border-primary/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="tracking-wider uppercase text-xs">Signal Lost</span>
            </div>

            <h1 className="text-6xl md:text-7xl font-bold tracking-tighter mb-2 text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-400 to-purple-500">
              404
            </h1>
            <h2 className="text-2xl font-semibold mb-4 text-foreground/90">
              Destination Unreachable
            </h2>
            
            <p className="text-muted-foreground mb-8 leading-relaxed max-w-md mx-auto md:mx-0">
              Our navigation systems cannot locate the sector you requested. It may have been moved, deleted, or consumed by a data void.
            </p>

            <div className="space-y-6">
              {/* Mock Terminal Output */}
              <div className="bg-black/40 rounded-lg p-4 font-mono text-xs text-left border border-white/10 overflow-hidden shadow-inner">
                <div className="flex items-center space-x-2 mb-2 border-b border-white/5 pb-2 opacity-50">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="ml-2">nav_log.json</span>
                </div>
                <div className="space-y-1 text-blue-400/80">
                  <div><span className="text-purple-400">GET</span> /requested-page <span className="text-red-400">FAILED</span></div>
                  <div><span className="text-gray-500">{'>'}</span> Scanning sector... <span className="text-yellow-400">0 results</span></div>
                  <div><span className="text-gray-500">{'>'}</span> Rerouting to safe harbor... <span className="animate-pulse">_</span></div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2 justify-center md:justify-start">
                <Button asChild size="lg" className="shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] transition-shadow">
                  <Link to="/">
                    <Home className="mr-2 h-4 w-4" />
                    Return to Base
                  </Link>
                </Button>
                <Button variant="outline" size="lg" onClick={() => window.history.back()}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Go Back
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
