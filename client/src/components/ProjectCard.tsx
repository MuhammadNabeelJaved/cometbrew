/**
 * Recent Project Card
 * Highly polished "Creative Glossy" card with glass pane details
 */
import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Badge } from './ui/badge';

interface ProjectCardProps {
  title: string;
  category: string;
  image: string;
  tags?: string[];
  slug?: string;
  onClick?: () => void;
}

export function ProjectCard({ title, category, image, tags, slug, onClick }: ProjectCardProps) {
  return (
    <motion.div
      className="group relative rounded-[2rem] overflow-hidden cursor-pointer h-[420px] w-full isolate"
      whileHover={{ y: -8, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      onClick={onClick}
    >
      {/* Full-card link */}
      {slug && <Link to={`/portfolio/${slug}`} className="absolute inset-0 z-50" aria-label={title} />}
      {/* Background Image with Zoom Effect */}
      <div className="absolute inset-0 z-0">
        <img 
          src={image} 
          alt={title} 
          className="object-cover w-full h-full transform group-hover:scale-110 transition-transform duration-700 ease-out will-change-transform"
        />
        {/* Dark gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80 z-10 transition-opacity duration-300 group-hover:opacity-90" />
      </div>

      {/* Glossy Overlay/Reflection */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-20 mix-blend-overlay" />

      {/* Glass Pane Content */}
      <div className="absolute inset-x-4 bottom-4 z-30 transform transition-all duration-500">
        <div className="relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 p-6 shadow-xl ring-1 ring-black/5 hover:bg-white/20 transition-colors">
          {/* Shimmer on Glass */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shine pointer-events-none" />

          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="bg-primary/20 text-primary border-primary/20 backdrop-blur-md px-3 py-0.5 text-[10px] font-bold tracking-wider uppercase shadow-sm">
                  {category}
                </Badge>
              </div>
              <h3 className="text-2xl font-bold text-white tracking-tight leading-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-300 transition-all">
                {title}
              </h3>
            </div>

            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-x-4 group-hover:translate-x-0">
               <div className="h-10 w-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 hover:bg-primary hover:border-primary transition-colors text-white shadow-lg">
                 <ArrowUpRight className="h-5 w-5" />
               </div>
            </div>
          </div>
          
          <div className="h-0 group-hover:h-auto overflow-hidden transition-all duration-500 ease-in-out">
            <p className="text-gray-300 text-sm mb-4 line-clamp-2 leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
              Explore the case study to see how we delivered exceptional results for this project using modern web technologies.
            </p>
            
            {tags && (
              <div className="flex flex-wrap gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-200">
                {tags.slice(0, 3).map((tag, i) => (
                  <span key={i} className="text-xs font-medium text-gray-400 bg-black/30 px-2 py-1 rounded-md border border-white/5 backdrop-blur-sm">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Outer Border Glow */}
      <div className="absolute inset-0 border border-border/50 dark:border-white/10 rounded-[2rem] group-hover:border-primary/40 transition-colors duration-500 pointer-events-none z-40" />
    </motion.div>
  );
}