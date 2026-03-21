/**
 * Pricing Card Component
 * Premium glassmorphism design for pricing tiers
 */
import React from 'react';
import { Check } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

interface PricingFeature {
  text: string;
  included: boolean;
}

interface PricingTier {
  name: string;
  price: string;
  description: string;
  features: PricingFeature[];
  popular?: boolean;
  ctaText?: string;
}

interface PricingCardProps {
  tier: PricingTier;
  className?: string;
}

export function PricingCard({ tier, className }: PricingCardProps) {
  return (
    <div className={cn(
      "relative h-full rounded-3xl overflow-hidden transition-all duration-500 hover:-translate-y-2 group",
      tier.popular 
        ? "bg-card/80 dark:bg-white/10 border-primary/50 shadow-2xl shadow-primary/20" 
        : "bg-card/40 dark:bg-white/5 border-border/50 dark:border-white/10 hover:border-primary/30 hover:bg-card/60 dark:hover:bg-white/10 hover:shadow-xl hover:shadow-primary/10",
      "backdrop-blur-md border flex flex-col",
      className
    )}>
      {tier.popular && (
        <div className="absolute top-0 right-0 z-20">
           <div className="bg-primary text-primary-foreground text-xs font-bold px-4 py-1.5 rounded-bl-2xl shadow-lg">
             MOST POPULAR
           </div>
        </div>
      )}

      {/* Glossy Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/20 dark:from-white/5 to-transparent pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Shine Effect */}
      <div className="absolute top-0 -left-[100%] w-full h-full bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent transform -skew-x-12 group-hover:animate-shine pointer-events-none transition-all duration-1000" />

      <div className="p-8 relative z-10 flex flex-col h-full">
        <div className="mb-8">
          <h3 className="text-lg font-medium text-primary tracking-wider uppercase mb-2">{tier.name}</h3>
          <div className="flex items-baseline gap-1 mb-4">
            <span className="text-4xl md:text-5xl font-bold text-foreground dark:text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-foreground group-hover:to-muted-foreground dark:group-hover:from-white dark:group-hover:to-gray-300 transition-all">{tier.price}</span>
            {tier.price !== 'Custom' && <span className="text-muted-foreground">/mo</span>}
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed group-hover:text-foreground/80 dark:group-hover:text-gray-300 transition-colors">{tier.description}</p>
        </div>

        <div className="space-y-4 mb-8 flex-grow">
          {tier.features.map((feature, i) => (
            <div key={i} className="flex items-start gap-3 group/feature">
              <div className={cn(
                "mt-1 h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 transition-colors",
                feature.included ? "bg-primary/20 text-primary group-hover/feature:bg-primary group-hover/feature:text-white" : "bg-muted text-muted-foreground opacity-50"
              )}>
                <Check className="h-3 w-3" />
              </div>
              <span className={cn(
                "text-sm transition-colors", 
                feature.included ? "text-foreground dark:text-gray-200 group-hover/feature:text-foreground dark:group-hover/feature:text-white" : "text-muted-foreground decoration-slate-500/50"
              )}>
                {feature.text}
              </span>
            </div>
          ))}
        </div>

        <Button 
          className={cn(
            "w-full rounded-xl py-6 font-semibold tracking-wide transition-all duration-300 shadow-lg",
            tier.popular 
              ? "bg-primary hover:bg-primary/90 shadow-primary/20 hover:shadow-primary/40 hover:scale-105" 
              : "bg-background/50 dark:bg-white/10 hover:bg-background/80 dark:hover:bg-white/20 text-foreground dark:text-white border border-border/50 dark:border-white/10 hover:border-border dark:hover:border-white/20 hover:scale-105"
          )}
        >
          {tier.ctaText || "Get Started"}
        </Button>
      </div>
    </div>
  );
}