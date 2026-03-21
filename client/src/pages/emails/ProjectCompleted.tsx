import React from 'react';
import { motion } from 'framer-motion';
import { PartyPopper, Star, Download } from 'lucide-react';

export default function ProjectCompleted() {
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
          <span className="text-xs font-mono text-neutral-400">COMPLETED</span>
        </div>

        <div className="p-8 md:p-12 text-center">
          <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mb-6 mx-auto text-yellow-600 dark:text-yellow-400">
            <PartyPopper className="w-8 h-8" />
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white mb-4">
            Project Delivered!
          </h1>
          
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed mb-8">
            Congratulations! The <strong>Nebula Redesign</strong> project has been officially marked as complete. We've generated a final report and invoice for your records.
          </p>

          <div className="flex justify-center gap-2 mb-8 text-yellow-500">
            <Star className="w-6 h-6 fill-current" />
            <Star className="w-6 h-6 fill-current" />
            <Star className="w-6 h-6 fill-current" />
            <Star className="w-6 h-6 fill-current" />
            <Star className="w-6 h-6 fill-current" />
          </div>

          <div className="bg-neutral-50 dark:bg-neutral-900 p-4 rounded-lg text-left mb-8 space-y-3">
             <div className="flex items-center justify-between p-3 bg-white dark:bg-black border border-neutral-100 dark:border-neutral-800 rounded hover:bg-neutral-50 transition-colors cursor-pointer group">
               <div className="flex items-center gap-3">
                 <div className="bg-red-100 dark:bg-red-900/20 p-2 rounded text-red-600">PDF</div>
                 <div className="text-sm">
                   <p className="font-medium text-neutral-900 dark:text-white">Final_Report.pdf</p>
                   <p className="text-neutral-400 text-xs">2.4 MB</p>
                 </div>
               </div>
               <Download className="w-4 h-4 text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors" />
             </div>
             
             <div className="flex items-center justify-between p-3 bg-white dark:bg-black border border-neutral-100 dark:border-neutral-800 rounded hover:bg-neutral-50 transition-colors cursor-pointer group">
               <div className="flex items-center gap-3">
                 <div className="bg-blue-100 dark:bg-blue-900/20 p-2 rounded text-blue-600">INV</div>
                 <div className="text-sm">
                   <p className="font-medium text-neutral-900 dark:text-white">Invoice_#2992.pdf</p>
                   <p className="text-neutral-400 text-xs">142 KB</p>
                 </div>
               </div>
               <Download className="w-4 h-4 text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors" />
             </div>
          </div>

          <button className="px-8 py-4 bg-black dark:bg-white text-white dark:text-black font-bold rounded-lg hover:opacity-90 transition-opacity">
            Leave Feedback
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
