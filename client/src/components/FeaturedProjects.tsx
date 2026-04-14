/**
 * Featured Projects Section
 * Implements a "Creative Glossy" Accordion Slider for desktop
 * and a stacked layout for mobile.
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ProjectCard } from './ProjectCard';
import { adminProjectsApi } from '../api/adminProjects.api';

export function FeaturedProjects() {
  const [projects, setProjects] = useState<any[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    adminProjectsApi.getPortfolio()
      .then(res => {
        const data = res.data.data.projects;
        const all = Array.isArray(data) ? data : [];
        // Show projects pinned to home page; if none pinned yet, fall back to first 3
        const featured = all.filter((p: any) => p.featuredOnHome);
        const list = featured.length > 0 ? featured : all.slice(0, 3);
        setProjects(list);
        if (list.length > 0) setActiveId(list[0]._id);
      })
      .catch(() => {});
  }, []);

  return (
    <section className="relative py-16 sm:py-24 md:py-32 overflow-hidden bg-background">
      {/* Background Ambience */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 sm:mb-12 md:mb-16 gap-4 sm:gap-6">
          <div className="space-y-4 max-w-2xl">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex items-center gap-2"
            >
              <div className="h-1 w-12 bg-primary rounded-full" />
              <span className="text-primary font-bold tracking-widest uppercase text-sm">Selected Works</span>
            </motion.div>
            
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold tracking-tight leading-tight text-foreground"
            >
              Crafting Digital <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-blue-600 dark:from-white dark:via-white dark:to-white/50">Excellence</span>
            </motion.h2>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <Link to="/portfolio">
              <Button variant="outline" className="rounded-full px-6 h-12 gap-2 border-border/50 bg-background/50 hover:bg-muted backdrop-blur-md group text-foreground">
                View All Projects 
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* Desktop Accordion Layout (Hidden on Mobile) */}
        <div className="hidden lg:flex h-[600px] gap-6">
          {projects.map((project) => (
            <AccordionItem
              key={project._id}
              project={project}
              isActive={activeId === project._id}
              onHover={() => setActiveId(project._id)}
            />
          ))}
        </div>

        {/* Mobile Stack Layout (Hidden on Desktop) */}
        <div className="grid grid-cols-1 gap-8 lg:hidden">
          {projects.map((project) => (
            <ProjectCard key={project._id} {...project} slug={project._id} title={project.projectTitle} category={project.category} description={project.projectDescription} image={project.projectGallery?.[0] || ''} tags={project.techStack || []} />
          ))}
        </div>

      </div>
    </section>
  );
}

const PLACEHOLDER = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop';

function AccordionItem({ project, isActive, onHover }: { project: any, isActive: boolean, onHover: () => void }) {
  const title = project.projectTitle || project.title || 'Untitled';
  const rawImage = project.projectGallery?.find((u: unknown) => typeof u === 'string' && u.trim() !== '') || project.image || '';
  const image = rawImage || PLACEHOLDER;
  const tags: string[] = project.techStack || project.tags || [];
  const year = project.endDate ? new Date(project.endDate).getFullYear().toString() : (project.year || '');
  const slug = project._id || project.slug;

  return (
    <motion.div
      layout
      onMouseEnter={onHover}
      className={`relative rounded-[2rem] overflow-hidden cursor-pointer transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
        isActive ? 'flex-[3]' : 'flex-[1] grayscale hover:grayscale-0'
      }`}
    >
      <Link to={`/portfolio/${slug}`} className="absolute inset-0 z-10" aria-label={title} />
      {/* Fallback gradient background when no image */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-purple-900/40 to-slate-900" />
      <img
        src={image}
        alt={title}
        onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER; }}
        className="absolute inset-0 w-full h-full object-cover transform transition-transform duration-1000"
        style={{ transform: isActive ? 'scale(1.1)' : 'scale(1.3)' }}
      />
      <div className={`absolute inset-0 bg-gradient-to-b from-black/0 via-black/20 to-black/90 transition-opacity duration-500 ${isActive ? 'opacity-80' : 'opacity-60'}`} />
      <div className="absolute inset-0 p-8 flex flex-col justify-end">
        <AnimatePresence>
          {isActive && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.4, delay: 0.2 }} className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge className="bg-primary text-primary-foreground border-0 px-3 py-1 text-xs">{project.category}</Badge>
                {year && <span className="text-white/60 text-sm font-mono">{year}</span>}
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <h3 className="text-4xl font-bold text-white mb-2 leading-tight">{title}</h3>
                  <p className="text-white/80 max-w-lg text-lg line-clamp-2">{project.projectDescription || project.description}</p>
                </div>
                <Link to={`/portfolio/${slug}`} className="relative z-20 flex-shrink-0">
                  <Button size="icon" className="rounded-full h-14 w-14 bg-white text-black hover:bg-primary hover:text-white transition-colors">
                    <ArrowUpRight className="h-6 w-6" />
                  </Button>
                </Link>
              </div>
              <div className="flex gap-2 pt-4">
                {tags.map((tag: string) => (
                  <span key={tag} className="text-xs text-white/50 border border-white/10 px-2 py-1 rounded-md bg-black/20 backdrop-blur-sm">{tag}</span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {!isActive && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute bottom-8 left-8 origin-bottom-left -rotate-90 translate-x-8">
            <h3 className="text-2xl font-bold text-white whitespace-nowrap tracking-wider">{title}</h3>
          </motion.div>
        )}
      </div>
      <div className={`absolute inset-0 border border-white/10 rounded-[2rem] pointer-events-none transition-colors duration-300 ${isActive ? 'border-white/20' : 'border-transparent'}`} />
    </motion.div>
  );
}