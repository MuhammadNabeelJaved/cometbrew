/**
 * Reusable Service Card
 * Premium glassmorphism effect with refined strokes and subtle glow
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, LucideIcon } from 'lucide-react';

interface ServiceCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  gradient?: string;
  className?: string;
}

export function ServiceCard({ title, description, icon: Icon, gradient, className }: ServiceCardProps) {
  const slug = title.toLowerCase().replace(/\s+/g, '-');
  
  return (
    <Link to={`/services/${slug}`} className={`block h-full group ${className}`}>
      <div className="relative h-full overflow-hidden rounded-3xl bg-card/40 dark:bg-white/5 backdrop-blur-md border border-border/50 dark:border-white/10 shadow-lg transition-all duration-500 hover:shadow-2xl hover:shadow-primary/20 hover:border-primary/40 hover:-translate-y-2">
        {/* Glass Sheen Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        
        {/* Animated Gradient Background Blob */}
        <div className={`absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br ${gradient || 'from-primary/20 to-secondary/20'} rounded-full blur-3xl opacity-20 group-hover:opacity-50 transition-all duration-700 group-hover:scale-125`} />
        
        <div className="relative z-10 p-8 flex flex-col h-full">
          <div className="mb-6 inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-background/50 dark:bg-white/5 border border-border/50 dark:border-white/10 shadow-inner group-hover:scale-110 group-hover:bg-primary/20 group-hover:border-primary/20 transition-all duration-500">
            <Icon className="h-7 w-7 text-primary/80 group-hover:text-primary transition-colors" />
          </div>
          
          <h3 className="text-xl md:text-2xl font-bold mb-3 text-foreground tracking-tight group-hover:text-primary transition-colors duration-300">
            {title}
          </h3>
          
          <p className="text-muted-foreground mb-8 leading-relaxed text-sm md:text-base flex-grow group-hover:text-foreground/80 dark:group-hover:text-gray-300 transition-colors">
            {description}
          </p>
          
          <div className="flex items-center text-sm font-medium text-primary/70 group-hover:text-primary transition-all duration-300 group-hover:translate-x-2">
            <span className="mr-2">Explore Service</span>
            <div className="rounded-full p-1 bg-primary/10 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
               <ArrowRight className="h-3 w-3" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}