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
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowLeft, ArrowRight, Code2, Globe, Share2, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { cn, techName, optimizeCloudinaryUrl, externalUrl } from '../../lib/utils';
import { adminProjectsApi } from '../../api/adminProjects.api';


// --- Sub-Components ---

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
          <Button variant="outline" size="icon" onClick={prevSlide} className="rounded-full bg-background/80 backdrop-blur border-border hover:bg-background">
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button variant="outline" size="icon" onClick={nextSlide} className="rounded-full bg-background/80 backdrop-blur border-border hover:bg-background">
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

const PLACEHOLDER = 'https://placehold.co/1200x800/1a1a2e/ffffff?text=Project';

export default function ProjectDetail() {
  const { slug } = useParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();

  const [project, setProject] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!slug) return;
    setIsLoading(true);
    setHasError(false);
    // URL format is "project-name-<mongoId>" (or a bare id from old links) — extract the trailing id
    const id = slug.match(/[0-9a-f]{24}$/i)?.[0] || slug;
    adminProjectsApi.getPublicById(id)
      .then(res => {
        if (res.data?.data) setProject(res.data.data);
        else setHasError(true);
      })
      .catch(() => setHasError(true))
      .finally(() => setIsLoading(false));
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <div className="h-10 w-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span>Loading project…</span>
        </div>
      </div>
    );
  }

  if (hasError || !project) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
        <p className="text-muted-foreground text-lg">Project not found.</p>
        <Link to="/portfolio" className="text-primary hover:underline flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Portfolio
        </Link>
      </div>
    );
  }

  const gallery: string[] = (project.projectGallery || []).map((g: any) => optimizeCloudinaryUrl(g.url || g, 1600)).filter(Boolean);
  const heroImage = gallery[0] || PLACEHOLDER;
  const techItems = (project.techStack || []).map((item: unknown) => ({ name: techName(item) })).filter((t: { name: string }) => t.name);
  const year = project.startDate ? new Date(project.startDate).getFullYear() : new Date().getFullYear();
  const durationLabel = project.duration?.value
    ? `${project.duration.value} ${project.duration.unit}`
    : project.endDate
      ? `${Math.round((new Date(project.endDate).getTime() - new Date(project.startDate || project.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30))} months`
      : 'N/A';

  return (
    <div ref={containerRef} className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/30">

      {/* --- HERO SECTION --- */}
      <section className="relative h-screen w-full flex items-center justify-center overflow-hidden">
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-background z-10" />
          <img src={heroImage} alt="Hero" className="w-full h-full object-cover" />
        </motion.div>

        <div className="relative z-20 max-w-7xl mx-auto px-6 w-full pt-24">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="mb-8">
            <Link to="/portfolio" className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-all duration-200 group">
              <span className="flex items-center justify-center h-9 w-9 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm group-hover:bg-white/20 group-hover:border-white/40 transition-all">
                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
              </span>
              <span className="text-sm font-medium tracking-wide">Back to Portfolio</span>
            </Link>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}>
            <div className="flex items-center gap-3 mb-6">
              <span className="h-px w-12 bg-primary/80" />
              <span className="text-primary font-bold uppercase tracking-[0.2em] text-sm">Selected Case Study</span>
            </div>
            <h1 className={cn(
              "font-black tracking-tighter text-white mb-6 leading-[0.95] text-balance",
              project.projectTitle.length > 28
                ? "text-4xl md:text-5xl lg:text-7xl"
                : "text-5xl md:text-7xl lg:text-9xl"
            )}>
              {project.projectTitle}
            </h1>
            <div className="flex flex-wrap items-center gap-6 mt-8 text-white/80">
              <div className="flex items-center gap-2"><Globe className="w-5 h-5" /><span>{project.category}</span></div>
              <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
              <div>{project.clientName}</div>
              <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
              <div>{year}</div>
            </div>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 1 }} className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest text-white/50">Scroll to Explore</span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-white to-transparent opacity-50" />
        </motion.div>
      </section>


      {/* --- OVERVIEW & STATS --- */}
      <section className="relative py-24 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          <div className="lg:col-span-7 space-y-8">
            <h3 className="text-2xl font-light text-muted-foreground leading-relaxed">
              <span className="text-foreground font-semibold">The Brief:</span> {project.projectDescription}
            </h3>
            <div className="flex flex-wrap gap-4 pt-4">
              {project.projectLink && (
                <a href={externalUrl(project.projectLink)} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="rounded-full px-8 gap-2">
                    Visit Live Site <ExternalLink className="w-4 h-4" />
                  </Button>
                </a>
              )}
              <Button size="lg" variant="outline" className="rounded-full px-8 gap-2 border-border">
                Share Project <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Role", value: project.yourRole || 'Development' },
                { label: "Client", value: project.clientName },
                { label: "Timeline", value: durationLabel },
                { label: "Status", value: project.status }
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


      {/* --- TECH STACK (INFINITE MARQUEE) — only when there are tech items --- */}
      {techItems.length > 0 && (
        <section className="py-24 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 mb-12 text-center">
            <h2 className="text-3xl font-bold mb-4">Powered By</h2>
            <p className="text-muted-foreground">Technologies used to build this project.</p>
          </div>
          <div className="bg-muted/20 border-y border-border/50 py-12">
            <div className="flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_20%,white_80%,transparent)]">
              <motion.div
                className="flex gap-8 py-8 pr-8 items-center"
                animate={{ x: techItems.length > 4 ? "-50%" : 0 }}
                transition={{ duration: Math.max(techItems.length * 3, 15), ease: "linear", repeat: Infinity }}
              >
                {[...techItems, ...techItems].map((tech: any, index: number) => (
                  <div key={index} className="flex items-center justify-center gap-3 shrink-0 px-6 py-3 rounded-2xl bg-muted/50 border border-border">
                    <Code2 className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium whitespace-nowrap">{tech.name}</span>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>
      )}


      {/* --- GALLERY & SLIDER --- */}
      {gallery.length > 0 && (
        <section className="py-24 px-6">
          <div className="max-w-7xl mx-auto space-y-16">

            {/* Grid for first few images */}
            {gallery.length >= 2 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-8">
                  <div className="h-[400px] md:h-[500px] w-full rounded-2xl overflow-hidden group">
                    <img src={gallery[0]} alt="Gallery 1" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  </div>
                  {project.clientFeedback?.comment && (
                    <div className="bg-primary p-10 rounded-2xl text-primary-foreground relative overflow-hidden">
                      <div className="relative z-10">
                        <span className="text-5xl font-serif opacity-30">"</span>
                        <p className="text-xl font-medium leading-relaxed -mt-4">{project.clientFeedback.comment}</p>
                        {project.clientFeedback.rating && (
                          <div className="mt-6 flex items-center gap-1">
                            {Array.from({ length: project.clientFeedback.rating }).map((_, i) => (
                              <span key={i} className="text-yellow-300 text-lg">★</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-8 md:pt-16">
                  {gallery[1] && (
                    <div className="h-[300px] w-full rounded-2xl overflow-hidden group">
                      <img src={gallery[1]} alt="Gallery 2" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    </div>
                  )}
                  {gallery[2] && (
                    <div className="h-[400px] w-full rounded-2xl overflow-hidden group">
                      <img src={gallery[2]} alt="Gallery 3" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Full slider for all images */}
            <div className={gallery.length >= 2 ? "pt-12 border-t border-border/50" : ""}>
              <div className="text-center mb-12">
                <h3 className="text-2xl font-semibold mb-2">Project Gallery</h3>
                <p className="text-muted-foreground">Browse all project screenshots.</p>
              </div>
              <ImageSlider images={gallery} />
            </div>

          </div>
        </section>
      )}


      {/* --- BACK TO PORTFOLIO --- */}
      <Link to="/portfolio" className="block relative h-[40vh] w-full overflow-hidden group">
        <div className="absolute inset-0 bg-black/70 group-hover:bg-black/50 transition-colors z-20 flex flex-col items-center justify-center text-center p-6">
          <p className="text-white/60 uppercase tracking-widest text-sm mb-4">Explore More</p>
          <h2 className="text-4xl md:text-6xl font-black text-white mb-6 group-hover:scale-105 transition-transform duration-500">
            View All Projects
          </h2>
          <div className="flex items-center gap-4 text-white font-medium group-hover:gap-8 transition-all">
            <span>Back to Portfolio</span>
            <ArrowRight className="w-6 h-6" />
          </div>
        </div>
        <img src={heroImage} alt="Portfolio" className="absolute inset-0 w-full h-full object-cover grayscale group-hover:grayscale-0 scale-105 group-hover:scale-100 transition-all duration-1000 ease-out" />
      </Link>

    </div>
  );
}
