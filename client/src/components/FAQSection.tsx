/**
 * Reusable FAQ Section Component
 * Modern animated accordion with premium glass glossy design
 * Updated for full Light/Dark theme compatibility
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, HelpCircle } from 'lucide-react';

export interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  title?: string;
  description?: string;
  items: FAQItem[];
  className?: string;
}

const FAQCard = ({ item, isOpen, onClick, index }: { item: FAQItem, isOpen: boolean, onClick: () => void, index: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className={`group border overflow-hidden transition-all duration-500 rounded-2xl ${
        isOpen 
          ? 'bg-card/50 dark:bg-zinc-900/50 border-primary/50 shadow-2xl shadow-primary/10 backdrop-blur-md' 
          : 'bg-card/30 dark:bg-white/5 border-border/50 dark:border-white/10 hover:bg-accent/10 dark:hover:bg-white/10 hover:border-primary/30 hover:shadow-lg backdrop-blur-sm hover:-translate-y-1'
      }`}
    >
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between p-6 text-left relative z-10"
      >
        <span className={`font-semibold text-lg transition-colors duration-300 ${isOpen ? 'text-primary' : 'text-foreground group-hover:text-primary'}`}>
          {item.question}
        </span>
        <div className={`relative flex items-center justify-center w-10 h-10 rounded-full border transition-all duration-300 ${
          isOpen 
            ? 'bg-primary text-primary-foreground border-primary rotate-180 shadow-lg shadow-primary/30' 
            : 'bg-muted/50 dark:bg-white/5 text-muted-foreground border-border/50 dark:border-white/10 group-hover:border-primary/50 group-hover:text-primary group-hover:bg-primary/10'
        }`}>
          {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="px-6 pb-6 pt-0 text-muted-foreground leading-relaxed border-t border-border/10 dark:border-white/5 relative z-10">
              <div className="h-4" /> {/* Spacer */}
              <p>
                {item.answer}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Glossy gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`} />
    </motion.div>
  );
};

export const FAQSection = ({ 
  title = "Frequently Asked Questions", 
  description = "Find answers to common questions about our services and process.",
  items,
  className = ""
}: FAQSectionProps) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className={`py-24 relative overflow-hidden ${className}`}>
      {/* Background Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" />
      </div>

      <div className="max-w-4xl mx-auto px-4 relative z-10">
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-card border border-border text-primary mb-4 shadow-lg backdrop-blur-md">
            <HelpCircle className="w-7 h-7" />
          </div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">{title}</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {description}
          </p>
        </div>

        <div className="space-y-4">
          {items.map((item, index) => (
            <FAQCard
              key={index}
              index={index}
              item={item}
              isOpen={openIndex === index}
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};