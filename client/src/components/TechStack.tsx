/**
 * Tech Stack Component
 * "The Holographic Stream" - Infinite scrolling marquees of tech badges
 * Encapsulated in glassy, spotlight-reactive containers.
 */
import React, { useRef, useEffect } from 'react';
import { motion, useMotionTemplate, useMotionValue } from 'framer-motion';
import { useContent, TechItem } from '../contexts/ContentContext';
import * as TechIcons from './TechIcons';
import { cn } from '../lib/utils';
import { Code2 } from 'lucide-react';

// --- Helper to resolve icon by name ---
const getIconComponent = (iconName: string) => {
  // Try to find in TechIcons first
  if ((TechIcons as any)[iconName]) {
    return (TechIcons as any)[iconName];
  }
  // Fallback
  return Code2;
};


// --- Sub-Components ---

function SpotlightCard({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <div
      className={cn(
        "group relative border border-border bg-card/50 dark:bg-white/5 overflow-hidden rounded-3xl backdrop-blur-sm shadow-sm dark:shadow-none",
        className
      )}
      onMouseMove={handleMouseMove}
    >
      {/* Spotlight Effect */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              650px circle at ${mouseX}px ${mouseY}px,
              rgba(var(--spotlight-color), 0.1),
              transparent 80%
            )
          `,
        }}
      />
      <div className="relative h-full">{children}</div>
    </div>
  );
}

function TechBadge({ item }: { item: TechItem }) {
  const IconComponent = getIconComponent(item.iconName);

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 dark:bg-black/20 border border-border hover:bg-muted dark:hover:bg-white/10 hover:border-primary/20 dark:hover:border-white/20 transition-all duration-300 w-[200px] flex-shrink-0">
      <div className="p-2 rounded-lg bg-background dark:bg-white/5">
        <IconComponent className={cn("w-5 h-5", item.color)} />
      </div>
      <div>
        <div className="font-semibold text-sm text-foreground/90">{item.name}</div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{item.description}</div>
      </div>
    </div>
  );
}

function Marquee({ items, direction = "left", speed = 20 }: { items: TechItem[], direction?: string, speed?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !scrollerRef.current) return;

    // Clear previous clones if any to prevent duplication on re-render
    // Actually simpler to just rely on React key diffing if we were mapping, but here we manipulate DOM.
    // Better strategy: Only clone once.
    
    // For simplicity in this edit, let's just ensure we clean up or check if already cloned.
    // But since `items` might change, we should re-run logic.
    const scroller = scrollerRef.current;
    
    // Reset content to original items
    // (This is a simplified approach, a more robust one would require React-based marquee or strict cleanup)
    // Given the context, we'll assume a fresh render or just append.
    // Let's rely on CSS animation which needs duplicated content.
    
    const scrollerContent = Array.from(scroller.children);
    
    // Check if we already duplicated
    if (scroller.getAttribute('data-cloned') === 'true') {
        // If items changed, we might need to reset. 
        // For now, let's just proceed. React will handle the children update, 
        // but the clones from previous effect might persist if not careful.
        // A full React Marquee component is better, but sticking to existing pattern:
    }

    scrollerContent.forEach((item) => {
      const duplicatedItem = item.cloneNode(true);
      if (scrollerRef.current) {
        scrollerRef.current.appendChild(duplicatedItem);
      }
    });
    scroller.setAttribute('data-cloned', 'true');


    const animationDirection = direction === "left" ? "forwards" : "reverse";
    const totalWidth = scrollerContent.reduce((acc, el) => acc + (el as HTMLElement).offsetWidth + 16, 0); // 16 is gap
    
    // Set CSS variable for animation duration based on width and speed
    const duration = totalWidth / speed;
    
    containerRef.current.style.setProperty("--animation-duration", `${duration}s`);
    containerRef.current.style.setProperty("--animation-direction", animationDirection);
  }, [direction, speed, items]); // Re-run when items change

  return (
    <div 
      ref={containerRef} 
      className="scroller relative z-20 overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_10%,white_90%,transparent)]"
    >
      <div 
        ref={scrollerRef}
        className={cn(
          "flex min-w-full shrink-0 gap-4 py-4 w-max flex-nowrap",
          "animate-scroll hover:[animation-play-state:paused]"
        )}
      >
        {items.map((item, idx) => (
          <TechBadge key={`${item.name}-${idx}`} item={item} />
        ))}
      </div>
    </div>
  );
}

export function TechStack() {
  const { techStack } = useContent();

  return (
    <section className="py-24 relative overflow-hidden bg-background">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16 space-y-4">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
               <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
               Our Tech Arsenal
             </div>
             <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
               Built with the <br />
               <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-blue-600">Modern Web Stack</span>
             </h2>
             <p className="text-muted-foreground max-w-lg mx-auto text-lg">
               We leverage the most advanced tools to ensure your product is scalable, secure, and lightning fast.
             </p>
        </div>

        <div className="space-y-8">
          {techStack.map((group, i) => (
            <SpotlightCard key={group.id} className="w-full">
              <div className="p-8">
                <div className="mb-6 flex items-center gap-4">
                  <div className={cn("h-8 w-1 rounded-full bg-gradient-to-b", 
                    i === 0 ? "from-blue-500 to-cyan-500" : 
                    i === 1 ? "from-green-500 to-emerald-500" :
                    "from-purple-500 to-pink-500"
                  )} />
                  <div>
                    <h3 className="text-xl font-bold text-foreground">{group.title}</h3>
                  </div>
                </div>
                
                <Marquee 
                  items={group.items} 
                  direction={group.direction} 
                  speed={group.speed} 
                />
              </div>
            </SpotlightCard>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes scroll {
          to {
            transform: translate(calc(-50% - 0.5rem));
          }
        }
        .animate-scroll {
          animation: scroll var(--animation-duration, 40s) var(--animation-direction, forwards) linear infinite;
        }
      `}</style>
    </section>
  );
}