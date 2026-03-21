/**
 * Skeleton Showcase Page
 * "X-Ray Vision" theme showing underlying structural components
 */
import React from 'react';
import { motion } from 'framer-motion';
import { Layers, Zap, Box, Layout, Shield } from 'lucide-react';

// Reusable Skeleton Component
const Skeleton = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div 
    className={`animate-pulse rounded-md bg-muted/50 ${className}`} 
    {...props} 
  />
);

export default function SkeletonPage() {
  return (
    <div className="min-h-screen bg-background p-6 md:p-12 relative overflow-hidden">
      {/* Background Grid */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, currentColor 1px, transparent 1px),
            linear-gradient(to bottom, currentColor 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-4 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20"
          >
            <Layers className="w-4 h-4" />
            <span>UI Structure Preview</span>
          </motion.div>
          
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Interface <span className="text-primary">Skeletons</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            A collection of loading states and structural blueprints used across the platform.
            These low-fidelity representations maintain perceived performance during data fetching.
          </p>
        </div>

        {/* Section 1: Card Variants */}
        <section className="space-y-6">
          <div className="flex items-center space-x-2 text-xl font-semibold border-b border-border/50 pb-2">
            <Box className="w-5 h-5 text-primary" />
            <h2>Content Cards</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {/* Simple Card */}
            <div className="border border-border rounded-xl p-6 space-y-4 bg-card/50 backdrop-blur-sm">
              <Skeleton className="h-48 w-full rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-9 w-24 rounded-full" />
              </div>
            </div>

            {/* Profile Card */}
            <div className="border border-border rounded-xl p-6 space-y-6 bg-card/50 backdrop-blur-sm text-center">
              <div className="flex justify-center">
                <Skeleton className="h-24 w-24 rounded-full" />
              </div>
              <div className="space-y-3 flex flex-col items-center">
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
              </div>
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/50">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <Skeleton className="h-5 w-8" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                ))}
              </div>
            </div>

            {/* Metric Card */}
            <div className="border border-border rounded-xl p-6 flex flex-col justify-between bg-card/50 backdrop-blur-sm">
              <div className="flex justify-between items-start mb-6">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton className="h-5 w-16" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="mt-6 pt-6 border-t border-border/50">
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Complex Layouts */}
        <section className="space-y-6">
          <div className="flex items-center space-x-2 text-xl font-semibold border-b border-border/50 pb-2">
            <Layout className="w-5 h-5 text-primary" />
            <h2>Dashboard Layouts</h2>
          </div>

          <div className="border border-border rounded-xl overflow-hidden bg-card/50 backdrop-blur-sm">
            <div className="grid md:grid-cols-4 min-h-[400px]">
              {/* Sidebar Skeleton */}
              <div className="hidden md:block p-4 border-r border-border space-y-6">
                <div className="flex items-center gap-3 mb-8">
                  <Skeleton className="h-8 w-8 rounded-md" />
                  <Skeleton className="h-6 w-24" />
                </div>
                <div className="space-y-3">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-5 w-5" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Main Content Skeleton */}
              <div className="md:col-span-3 p-6 space-y-6">
                <div className="flex justify-between items-center mb-8">
                  <Skeleton className="h-8 w-48" />
                  <div className="flex gap-3">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <Skeleton className="h-9 w-9 rounded-full" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <Skeleton className="h-32 w-full rounded-xl" />
                  <Skeleton className="h-32 w-full rounded-xl" />
                </div>

                <div className="border border-border rounded-xl p-4 space-y-4">
                  <div className="flex justify-between mb-4">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: List Views */}
        <section className="space-y-6">
          <div className="flex items-center space-x-2 text-xl font-semibold border-b border-border/50 pb-2">
            <Zap className="w-5 h-5 text-primary" />
            <h2>Feed / List Items</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="border border-border rounded-lg p-4 flex gap-4 bg-card/50 backdrop-blur-sm">
                  <Skeleton className="h-24 w-32 rounded-md flex-shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <div className="flex gap-2 pt-2">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4">
               {/* Chat/Message Skeleton */}
               {[...Array(3)].map((_, i) => (
                <div key={i} className={`flex gap-3 ${i % 2 !== 0 ? 'flex-row-reverse' : ''}`}>
                  <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                  <div className={`space-y-2 max-w-[80%] ${i % 2 !== 0 ? 'items-end flex flex-col' : ''}`}>
                    <div className={`flex items-center gap-2 ${i % 2 !== 0 ? 'flex-row-reverse' : ''}`}>
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                    <Skeleton className={`h-16 w-full rounded-2xl ${i % 2 !== 0 ? 'rounded-tr-none' : 'rounded-tl-none'}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
