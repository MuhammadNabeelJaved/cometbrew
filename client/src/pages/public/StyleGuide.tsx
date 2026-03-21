/**
 * Design System / Style Guide Page
 * Visualizes the project's design principles, color palette, typography, and core components.
 * Serves as a living documentation for the "Creative Glossy" aesthetic.
 */
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Zap, ArrowRight, Check, Shield, Activity } from 'lucide-react';

export default function StyleGuide() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 bg-background relative overflow-hidden">
      {/* Background Decor */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-[100px]" />
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-6xl mx-auto space-y-16"
      >
        {/* Header */}
        <div className="text-center space-y-4">
          <motion.h1 variants={itemVariants} className="text-5xl font-bold tracking-tight">
            Design <span className="text-primary">System</span>
          </motion.h1>
          <motion.p variants={itemVariants} className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A guide to the "Creative Glossy" aesthetic: Glassmorphism, Neon Accents, and Smooth Motion.
          </motion.p>
        </div>

        {/* Colors Section */}
        <section className="space-y-6">
          <motion.h2 variants={itemVariants} className="text-2xl font-semibold border-b border-border pb-2">
            Color Palette
          </motion.h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ColorCard name="Primary" color="bg-primary" text="text-primary-foreground" />
            <ColorCard name="Secondary" color="bg-secondary" text="text-secondary-foreground" />
            <ColorCard name="Accent" color="bg-accent" text="text-accent-foreground" />
            <ColorCard name="Destructive" color="bg-destructive" text="text-destructive-foreground" />
            <ColorCard name="Background" color="bg-background" text="text-foreground" border />
            <ColorCard name="Card" color="bg-card" text="text-card-foreground" border />
            <ColorCard name="Muted" color="bg-muted" text="text-muted-foreground" />
            <ColorCard name="Popver" color="bg-popover" text="text-popover-foreground" border />
          </div>
        </section>

        {/* Typography Section */}
        <section className="space-y-6">
          <motion.h2 variants={itemVariants} className="text-2xl font-semibold border-b border-border pb-2">
            Typography
          </motion.h2>
          <div className="space-y-4 p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Heading 1</span>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">The quick brown fox jumps</h1>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Heading 2</span>
              <h2 className="text-3xl font-bold tracking-tight">Over the lazy dog</h2>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Body Large</span>
              <p className="text-lg text-muted-foreground">
                Modern web design balances aesthetics with usability. It uses hierarchy to guide the user's eye.
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Body Regular</span>
              <p className="text-base text-muted-foreground">
                Small details like tracking, line-height, and contrast ratios make the difference between "good" and "professional".
              </p>
            </div>
          </div>
        </section>

        {/* Components Showcase */}
        <section className="space-y-8">
          <motion.h2 variants={itemVariants} className="text-2xl font-semibold border-b border-border pb-2">
            Interactive Components
          </motion.h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Buttons & Inputs */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium">Buttons & Actions</h3>
              <div className="flex flex-wrap gap-4">
                <Button>Default Button</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button className="rounded-full">Rounded Full</Button>
                <Button size="icon"><Zap className="h-4 w-4" /></Button>
              </div>

              <div className="space-y-2">
                 <h3 className="text-lg font-medium">Glass Cards</h3>
                 <div className="p-6 rounded-2xl bg-white/10 dark:bg-black/20 backdrop-blur-xl border border-white/20 shadow-xl">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 rounded-full bg-primary/20 text-primary">
                        <Activity className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="font-bold">Glassmorphism Effect</h4>
                        <p className="text-sm text-muted-foreground">Blur + Translucency + Border</p>
                      </div>
                    </div>
                 </div>
              </div>
            </div>

            {/* Feature Cards */}
            <div className="space-y-6">
               <h3 className="text-lg font-medium">Visual Elements</h3>
               <div className="grid gap-4">
                  <Card className="p-4 flex items-center justify-between hover:border-primary/50 transition-colors cursor-pointer group">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white">
                        <Shield className="h-5 w-5" />
                      </div>
                      <span className="font-medium group-hover:text-primary transition-colors">Gradient Icons</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </Card>

                  <Card className="p-4 flex items-center justify-between hover:border-primary/50 transition-colors cursor-pointer group">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white">
                        <Zap className="h-5 w-5" />
                      </div>
                      <span className="font-medium group-hover:text-primary transition-colors">Hover Effects</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </Card>
               </div>
            </div>
          </div>
        </section>

      </motion.div>
    </div>
  );
}

function ColorCard({ name, color, text, border = false }: { name: string, color: string, text: string, border?: boolean }) {
  return (
    <div className={`p-4 rounded-xl ${color} ${border ? 'border border-border' : ''} space-y-2`}>
      <div className={`text-xs font-medium opacity-80 ${text}`}>{name}</div>
      <div className={`font-bold ${text}`}>Aa</div>
    </div>
  );
}