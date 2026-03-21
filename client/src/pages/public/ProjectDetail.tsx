/**
 * Project Detail Page
 * An immersive, "Scrollytelling" experience that breaks down the project lifecycle.
 * Features:
 * - 3D Tilt Hero Section
 * - "The Build Journey" Vertical Timeline
 * - Infinite Scroll Tech Stack Marquee
 * - Project Image Slider
 * - Next Project Portal
 */
import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useSpring, useMotionValue, animate } from 'framer-motion';
import { 
  ArrowLeft, ExternalLink, Calendar, Layers, User, ArrowRight, 
  CheckCircle2, Zap, Layout, Database, Smartphone, 
  Code2, Cpu, Globe, Share2, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { 
  ReactIcon, NextJsIcon, TailwindIcon, TypeScriptIcon, 
  FigmaIcon, ThreeJsIcon, NodeJsIcon, PostgresIcon,
  AwsIcon, SupabaseIcon
} from '../../components/TechIcons';
import { cn } from '../../lib/utils';

// --- Mock Data ---
const PROJECT_DATA = {
  title: "FinTech Dashboard",
  subtitle: "Reimagining personal finance with real-time analytics and predictive AI.",
  category: "Web Application",
  client: "NovaBank Intl.",
  year: "2024",
  role: "End-to-End Development",
  website: "https://novabank.demo",
  heroImage: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop",
  description: "NovaBank approached us with a critical challenge: their existing dashboard was sluggish, cluttered, and failing to engage younger demographics. They needed a complete overhaul that felt instantaneous, looked futuristic, and made complex financial data into intuitive insights.",
  
  // The "Journey" (Process) Data
  journey: [
    {
      phase: "Phase 01: The Audit",
      title: "Identifying the Friction",
      description: "We started by analyzing user sessions. The drop-off rate on the 'Investment' tab was 65%. Users were overwhelmed by raw data tables and lack of mobile responsiveness.",
      icon: SearchIcon,
      color: "text-red-400",
      bg: "bg-red-400/10",
      stats: { label: "Bounce Rate", value: "65%" }
    },
    {
      phase: "Phase 02: The Blueprint",
      title: "Modular Widget Architecture",
      description: "We moved away from a monolithic table layout to a 'Bento Box' grid system. This allowed users to customize their view, prioritizing what mattered most to them—whether it was crypto holdings or savings goals.",
      icon: Layout,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
      stats: { label: "Widgets Created", value: "24+" }
    },
    {
      phase: "Phase 03: The Engine",
      title: "WebGL Data Visualization",
      description: "Standard charting libraries couldn't handle the real-time websocket feed without dropping frames. We built a custom visualization layer using Three.js and React Fiber to render 50k+ data points at 60fps.",
      icon: Cpu,
      color: "text-purple-400",
      bg: "bg-purple-400/10",
      stats: { label: "FPS", value: "60" }
    },
    {
      phase: "Phase 04: The Polish",
      title: "Micro-Interactions & A11y",
      description: "Great UX lives in the details. We added haptic feedback for mobile users, keyboard navigation for accessibility, and subtle motion blur effects during transitions to mask data loading.",
      icon: Zap,
      color: "text-yellow-400",
      bg: "bg-yellow-400/10",
      stats: { label: "A11y Score", value: "98" }
    }
  ],

  techStack: [
    { name: "React", icon: ReactIcon },
    { name: "TypeScript", icon: TypeScriptIcon },
    { name: "Next.js", icon: NextJsIcon },
    { name: "Tailwind", icon: TailwindIcon },
    { name: "Three.js", icon: ThreeJsIcon },
    { name: "Node.js", icon: NodeJsIcon },
    { name: "PostgreSQL", icon: PostgresIcon },
    { name: "Figma", icon: FigmaIcon },
    { name: "AWS", icon: AwsIcon },
    { name: "Supabase", icon: SupabaseIcon },
  ],

  gallery: [
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2015&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1642132652859-3ef5a9216fd0?q=80&w=2060&auto=format&fit=crop"
  ],

  sliderImages: [
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1555421689-491a97ff2040?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=2032&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=2074&auto=format&fit=crop"
  ],
  
  testimonial: {
    quote: "The new dashboard isn't just a tool; it's a competitive advantage. Our user engagement has doubled since the relaunch.",
    author: "Elena Rodriguez",
    role: "VP of Product, NovaBank"
  }
};

// --- Helper Icons ---
function SearchIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

// --- Sub-Components ---

function TechTicker({ items }: { items: typeof PROJECT_DATA.techStack }) {
  // We duplicate the items to create a seamless loop
  const duplicatedItems = [...items, ...items, ...items];

  return (
    <div className="flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_20%,white_80%,transparent)]">
      <motion.div 
        className="flex gap-12 py-8 pr-12 items-center"
        animate={{ x: "-33.33%" }}
        transition={{ 
          duration: 30, 
          ease: "linear", 
          repeat: Infinity 
        }}
      >
        {duplicatedItems.map((tech, index) => (
          <div key={`${tech.name}-${index}`} className="flex flex-col items-center justify-center gap-3 group shrink-0 w-24">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:border-primary/50 group-hover:scale-110 transition-all duration-300">
              <tech.icon className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <span className="text-sm font-medium text-muted-foreground/60 group-hover:text-foreground transition-colors">{tech.name}</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

function ImageSlider({ images }: { images: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollTo = (index: number) => {
    setCurrentIndex(index);
    // In a real implementation we might auto-scroll, but here we just update state for active indicator
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="space-y-6">
      <div className="relative group rounded-3xl overflow-hidden aspect-video bg-muted/20 border border-border/50">
        <motion.img 
          key={currentIndex}
          src={images[currentIndex]} 
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full h-full object-cover"
          alt={`Project screenshot ${currentIndex + 1}`}
        />
        
        {/* Controls */}
        <div className="absolute inset-0 flex items-center justify-between p-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="outline" size="icon" onClick={prevSlide} className="rounded-full bg-background/50 backdrop-blur border-white/10 hover:bg-background/80">
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button variant="outline" size="icon" onClick={nextSlide} className="rounded-full bg-background/50 backdrop-blur border-white/10 hover:bg-background/80">
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>
        
        {/* Indicators */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {images.map((_, idx) => (
            <button 
              key={idx}
              onClick={() => scrollTo(idx)}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                idx === currentIndex ? "bg-white w-6" : "bg-white/40 hover:bg-white/60"
              )}
            />
          ))}
        </div>
      </div>

      {/* Thumbnails */}
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
        {images.map((img, idx) => (
          <button
            key={idx}
            onClick={() => scrollTo(idx)}
            className={cn(
              "relative shrink-0 w-32 h-20 rounded-lg overflow-hidden border-2 transition-all snap-start",
              idx === currentIndex ? "border-primary ring-2 ring-primary/20" : "border-transparent opacity-60 hover:opacity-100"
            )}
          >
            <img src={img} className="w-full h-full object-cover" alt="thumbnail" />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ProjectDetail() {
  const { slug } = useParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  
  // Hero Parallax
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  return (
    <div ref={containerRef} className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/30">
      
      {/* Navigation Back */}
      <div className="fixed top-8 left-8 z-50 mix-blend-difference text-white">
        <Link to="/portfolio">
          <Button variant="ghost" className="rounded-full h-12 w-12 p-0 hover:bg-white/20 hover:scale-110 transition-all">
            <ArrowLeft className="h-6 w-6" />
          </Button>
        </Link>
      </div>

      {/* --- HERO SECTION --- */}
      <section className="relative h-screen w-full flex items-center justify-center overflow-hidden">
        {/* Background Image with Parallax */}
        <motion.div 
          style={{ y: heroY, opacity: heroOpacity }}
          className="absolute inset-0 z-0"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-background z-10" />
          <img 
            src={PROJECT_DATA.heroImage} 
            alt="Hero" 
            className="w-full h-full object-cover"
          />
        </motion.div>

        {/* Hero Content */}
        <div className="relative z-20 max-w-7xl mx-auto px-6 w-full pt-20">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="flex items-center gap-3 mb-6">
              <span className="h-px w-12 bg-primary/80" />
              <span className="text-primary font-bold uppercase tracking-[0.2em] text-sm">Selected Case Study</span>
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-9xl font-black tracking-tighter text-white mb-6 leading-[0.9]">
              {PROJECT_DATA.title.split(' ').map((word, i) => (
                <span key={i} className="block">{word}</span>
              ))}
            </h1>
            <div className="flex flex-wrap items-center gap-6 mt-8 text-white/80">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                <span>{PROJECT_DATA.category}</span>
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
              <div>{PROJECT_DATA.client}</div>
              <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
              <div>{PROJECT_DATA.year}</div>
            </div>
          </motion.div>
        </div>
        
        {/* Scroll Indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2"
        >
          <span className="text-[10px] uppercase tracking-widest text-white/50">Scroll to Explore</span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-white to-transparent opacity-50" />
        </motion.div>
      </section>


      {/* --- OVERVIEW & STATS --- */}
      <section className="relative py-24 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          
          <div className="lg:col-span-7 space-y-8">
            <h3 className="text-2xl font-light text-muted-foreground leading-relaxed">
              <span className="text-foreground font-semibold">The Brief:</span> {PROJECT_DATA.description}
            </h3>
            
            <div className="flex flex-wrap gap-4 pt-4">
              <Button size="lg" className="rounded-full px-8 gap-2 bg-foreground text-background hover:bg-foreground/90">
                Visit Live Site <ExternalLink className="w-4 h-4" />
              </Button>
              <Button size="lg" variant="outline" className="rounded-full px-8 gap-2 border-border">
                Share Project <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="grid grid-cols-2 gap-4">
               {[
                 { label: "Role", value: PROJECT_DATA.role },
                 { label: "Client", value: PROJECT_DATA.client },
                 { label: "Timeline", value: "12 Weeks" },
                 { label: "Status", value: "Live" }
               ].map((stat, i) => (
                 <div key={i} className="p-6 rounded-2xl bg-muted/20 border border-border/50">
                   <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{stat.label}</p>
                   <p className="text-lg font-semibold">{stat.value}</p>
                 </div>
               ))}
            </div>
          </div>

        </div>
      </section>


      {/* --- THE BUILD JOURNEY (SCROLLYTELLING) --- */}
      <section className="py-32 bg-muted/10 relative overflow-hidden">
        {/* Connecting Line */}
        <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-primary/30 to-transparent" />

        <div className="max-w-5xl mx-auto px-6 relative">
          <div className="text-center mb-24 relative z-10">
            <Badge variant="outline" className="mb-4 border-primary/20 text-primary bg-primary/5">Development Process</Badge>
            <h2 className="text-4xl md:text-5xl font-bold">The Build Journey</h2>
          </div>

          <div className="space-y-32">
            {PROJECT_DATA.journey.map((step, index) => {
              const isEven = index % 2 === 0;
              return (
                <div key={index} className={cn(
                  "relative flex flex-col md:flex-row items-center gap-12",
                  isEven ? "" : "md:flex-row-reverse"
                )}>
                  
                  {/* Center Node */}
                  <div className="absolute left-0 md:left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-background border-2 border-primary z-20 hidden md:block">
                    <div className="absolute inset-0 bg-primary/50 blur-[10px]" />
                  </div>

                  {/* Text Content */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ margin: "-100px" }}
                    transition={{ duration: 0.6 }}
                    className="flex-1 space-y-4 text-left md:text-right"
                    style={{ textAlign: isEven ? 'right' : 'left' }}
                  >
                     <div className={cn(
                       "inline-flex items-center gap-2 mb-2 font-mono text-xs uppercase tracking-wider",
                       step.color
                     )}
                       style={{ flexDirection: isEven ? 'row-reverse' : 'row' }}
                     >
                       <span className="font-bold">{step.phase}</span>
                     </div>
                     <h3 className="text-3xl font-bold">{step.title}</h3>
                     <p className="text-muted-foreground leading-relaxed text-lg">{step.description}</p>
                  </motion.div>

                  {/* Card/Visual */}
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ margin: "-100px" }}
                    transition={{ duration: 0.6 }}
                    className="flex-1 w-full"
                  >
                    <div className="bg-background border border-border/50 p-8 rounded-3xl shadow-2xl relative overflow-hidden group hover:border-primary/30 transition-colors">
                      <div className={cn("absolute top-0 right-0 p-32 opacity-10 rounded-full blur-[60px]", step.bg.replace("bg-", "bg-"))} />
                      
                      <div className="relative z-10 flex flex-col gap-6">
                        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center", step.bg)}>
                          <step.icon className={cn("w-7 h-7", step.color)} />
                        </div>
                        
                        <div className="h-px w-full bg-border/50" />
                        
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-xs text-muted-foreground uppercase">Key Metric</p>
                            <p className="text-sm font-medium text-foreground">{step.stats.label}</p>
                          </div>
                          <p className={cn("text-4xl font-bold", step.color)}>{step.stats.value}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                </div>
              );
            })}
          </div>
        </div>
      </section>


      {/* --- TECH STACK (INFINITE MARQUEE) --- */}
      <section className="py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 mb-12 text-center">
           <h2 className="text-3xl font-bold mb-4">Powered By</h2>
           <p className="text-muted-foreground">The modern architecture behind the platform.</p>
        </div>
        
        <div className="bg-gradient-to-r from-background via-muted/10 to-background border-y border-border/30 py-12">
          <TechTicker items={PROJECT_DATA.techStack} />
        </div>
      </section>


      {/* --- GALLERY & SLIDER --- */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto space-y-24">
          
          {/* Main Gallery Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-8">
              <div className="h-[400px] md:h-[600px] w-full rounded-2xl overflow-hidden group">
                <img 
                  src={PROJECT_DATA.gallery[0]} 
                  alt="Gallery 1" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                />
              </div>
              <div className="bg-primary p-12 rounded-2xl text-primary-foreground relative overflow-hidden">
                <div className="relative z-10">
                  <span className="text-6xl font-serif opacity-30">"</span>
                  <p className="text-2xl font-medium leading-relaxed -mt-6">
                    {PROJECT_DATA.testimonial.quote}
                  </p>
                  <div className="mt-8 flex items-center gap-4">
                     <div className="w-10 h-10 rounded-full bg-white/20" />
                     <div>
                       <p className="font-bold">{PROJECT_DATA.testimonial.author}</p>
                       <p className="text-sm opacity-80">{PROJECT_DATA.testimonial.role}</p>
                     </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-8 md:pt-24">
               <div className="h-[300px] w-full rounded-2xl overflow-hidden group">
                <img 
                  src={PROJECT_DATA.gallery[1]} 
                  alt="Gallery 2" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                />
              </div>
              <div className="h-[500px] w-full rounded-2xl overflow-hidden group">
                <img 
                  src={PROJECT_DATA.gallery[2]} 
                  alt="Gallery 3" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                />
              </div>
            </div>
          </div>

          {/* New Image Slider Section */}
          <div className="pt-12 border-t border-border/50">
             <div className="text-center mb-12">
               <h3 className="text-2xl font-semibold mb-2">Interface Gallery</h3>
               <p className="text-muted-foreground">Swipe to explore key application screens.</p>
             </div>
             <ImageSlider images={PROJECT_DATA.sliderImages} />
          </div>

        </div>
      </section>


      {/* --- NEXT PROJECT PORTAL --- */}
      <Link to="/portfolio" className="block relative h-[60vh] w-full overflow-hidden group cursor-none">
        <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition-colors z-20 flex flex-col items-center justify-center text-center p-6">
          <p className="text-white/60 uppercase tracking-widest text-sm mb-4">Next Case Study</p>
          <h2 className="text-5xl md:text-8xl font-black text-white mb-8 group-hover:scale-105 transition-transform duration-500">
            AI Content Gen
          </h2>
          <div className="flex items-center gap-4 text-white font-medium group-hover:gap-8 transition-all">
            <span>View Case Study</span>
            <ArrowRight className="w-6 h-6" />
          </div>
        </div>
        
        <img 
          src={PROJECT_DATA.gallery[2]} 
          alt="Next Project" 
          className="absolute inset-0 w-full h-full object-cover grayscale group-hover:grayscale-0 scale-105 group-hover:scale-100 transition-all duration-1000 ease-out" 
        />
      </Link>

    </div>
  );
}
