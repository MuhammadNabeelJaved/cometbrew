import React from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { ArrowUp } from 'lucide-react';

export function ScrollToTop() {
  const { scrollY } = useScroll();

  // Fade + slide in between 260px–340px scroll — gradual, no hard threshold
  const rawOpacity = useTransform(scrollY, [260, 340], [0, 1]);
  const rawY = useTransform(scrollY, [260, 340], [18, 0]);

  // Spring smoothing so it never snaps or stutters
  const opacity = useSpring(rawOpacity, { stiffness: 120, damping: 25, mass: 0.4 });
  const y = useSpring(rawY, { stiffness: 120, damping: 25, mass: 0.4 });

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <motion.button
      style={{ opacity, y }}
      onClick={scrollToTop}
      aria-label="Scroll to top"
      className="fixed bottom-[6.5rem] right-6 z-50 w-11 h-11 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center hover:bg-primary/90 hover:scale-110 hover:shadow-xl hover:shadow-primary/40 active:scale-95 transition-[transform,box-shadow] duration-200 pointer-events-auto"
      whileHover={{ scale: 1.12 }}
      whileTap={{ scale: 0.92 }}
    >
      <ArrowUp className="w-5 h-5" />
    </motion.button>
  );
}
