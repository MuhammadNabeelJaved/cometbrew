import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquareQuote, Star } from 'lucide-react';

export default function FeedbackRequest() {
  const [rating, setRating] = useState(0);

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 py-12 px-4 flex items-center justify-center font-sans">
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="max-w-xl w-full bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="bg-neutral-50 dark:bg-neutral-900/50 p-6 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center">
           <img 
            src="https://vgbujcuwptvheqijyjbe.supabase.co/storage/v1/object/public/hmac-uploads/uploads/216147d0-06c1-4dee-8a5a-f933c6ef8556/1766429553723-26c2f3fe/N_Logo-01.png" 
            alt="Nabeel Logo" 
            className="h-8 w-auto dark:invert" 
          />
          <span className="text-xs font-mono text-neutral-400">SURVEY</span>
        </div>

        <div className="p-8 md:p-12 text-center">
          <div className="w-16 h-16 bg-pink-100 dark:bg-pink-900/20 rounded-full flex items-center justify-center mb-6 mx-auto text-pink-600 dark:text-pink-400">
            <MessageSquareQuote className="w-8 h-8" />
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white mb-4">
            How did we do?
          </h1>
          
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed mb-8">
            We'd love to hear about your experience working with our team on the <strong>Nebula Redesign</strong> project. Your feedback helps us improve.
          </p>

          <div className="bg-neutral-50 dark:bg-neutral-900 p-8 rounded-xl border border-neutral-100 dark:border-neutral-800 mb-8">
            <p className="text-sm font-semibold mb-4 text-neutral-900 dark:text-white">Rate your experience</p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setRating(star)}
                  className="p-1 transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star 
                    className={`w-8 h-8 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-neutral-300 dark:text-neutral-700'}`} 
                  />
                </button>
              ))}
            </div>
          </div>

          <button className="w-full bg-black dark:bg-white text-white dark:text-black font-bold py-4 rounded-lg hover:opacity-90 transition-opacity">
            Submit Review
          </button>
        </div>

        <div className="bg-neutral-50 dark:bg-neutral-900/50 p-6 border-t border-neutral-100 dark:border-neutral-800 text-center">
          <p className="text-xs text-neutral-400">
            © 2024 Nabeel Agency.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
