/**
 * Testimonials Component
 * Premium glass cards with infinite scroll
 */
import React from 'react';
import { Star, Quote } from 'lucide-react';
import { cn } from '../lib/utils';

const testimonials = [
  {
    content: "Nova Agency transformed our digital presence. Their attention to detail is unmatched and the final result exceeded all expectations.",
    author: "Sarah Johnson",
    role: "CTO, TechFlow",
    rating: 5,
    avatar: "S"
  },
  {
    content: "The AI integration features they built significantly improved our workflow efficiency. Truly a game-changer for our operations.",
    author: "Michael Chen",
    role: "Founder, DataSphere",
    rating: 5,
    avatar: "M"
  },
  {
    content: "Professional, responsive, and incredibly talented team. They understood our vision immediately and executed it perfectly.",
    author: "Emily Rodriguez",
    role: "VP Ops, FinEdge",
    rating: 5,
    avatar: "E"
  },
  {
    content: "They delivered the project 2 weeks ahead of schedule. Exceptional quality code and beautiful design work.",
    author: "David Kim",
    role: "CEO, StartupX",
    rating: 5,
    avatar: "D"
  },
  {
    content: "The best design team we've ever worked with. They just get it. Our conversion rates doubled after the redesign.",
    author: "Lisa Patels",
    role: "Director, CreativeCo",
    rating: 5,
    avatar: "L"
  }
];

const ReviewCard = ({ data, className }: { data: typeof testimonials[0], className?: string }) => (
  <div className={cn(
    "w-[350px] md:w-[400px] p-8 rounded-3xl mx-4 flex flex-col justify-between h-[280px] transition-all duration-500 group",
    "bg-card/50 dark:bg-white/5 backdrop-blur-md border border-border/50 dark:border-white/10 hover:border-primary/40 hover:bg-card dark:hover:bg-white/10 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2",
    className
  )}>
    <div className="relative">
      <Quote className="absolute -top-2 -left-2 h-8 w-8 text-primary/20 rotate-180 group-hover:text-primary/40 transition-colors" />
      <div className="flex gap-1 mb-6 pl-2">
        {[...Array(data.rating)].map((_, i) => (
          <Star key={i} className="h-4 w-4 text-amber-400 fill-amber-400 drop-shadow-sm" />
        ))}
      </div>
      <p className="text-muted-foreground text-sm md:text-base leading-relaxed mb-6 italic relative z-10 pl-2 group-hover:text-foreground dark:group-hover:text-white transition-colors">
        "{data.content}"
      </p>
    </div>
    
    <div className="flex items-center gap-4 border-t border-border/50 dark:border-white/10 pt-6 group-hover:border-primary/20 transition-colors">
      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center font-bold text-white shadow-lg text-lg ring-2 ring-transparent group-hover:ring-primary/50 transition-all">
        {data.avatar}
      </div>
      <div>
        <div className="font-bold text-foreground dark:text-white text-base">{data.author}</div>
        <div className="text-sm text-primary/80 font-medium group-hover:text-primary transition-colors">{data.role}</div>
      </div>
    </div>
  </div>
);

export function Testimonials() {
  return (
    <section className="py-32 bg-background relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] opacity-30 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[100px] opacity-30 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-20">
        <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">Trusted by <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Innovators</span></h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Don't just take our word for it. Here's what our partners have to say about the digital experiences we build together.
        </p>
      </div>

      <div className="relative w-full overflow-hidden py-10">
        {/* Fade edges */}
        <div className="absolute inset-y-0 left-0 w-20 md:w-60 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-20 md:w-60 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
        
        <div className="flex animate-scroll w-[max-content] hover:pause-on-hover">
          {/* Triple duplication to match the scroll keyframe of 33.33% */}
          {[...testimonials, ...testimonials, ...testimonials].map((t, i) => (
            <ReviewCard key={i} data={t} />
          ))}
        </div>
      </div>
    </section>
  );
}