import React from 'react';
import { motion } from 'framer-motion';
import { FolderPlus, ArrowRight, ExternalLink } from 'lucide-react';

export default function ProjectCreated() {
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
          <span className="text-xs font-mono text-neutral-400">NEW PROJECT</span>
        </div>

        <div className="p-8 md:p-12">
          <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mb-6 text-purple-600 dark:text-purple-400">
            <FolderPlus className="w-8 h-8" />
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white mb-4">
            Project "Nebula" initialized
          </h1>
          
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed mb-8">
            The project workspace has been set up and is ready for your team. We've initialized the repository, set up the staging environment, and invited the stakeholders.
          </p>

          <div className="bg-neutral-50 dark:bg-neutral-900 p-6 rounded-xl border border-neutral-100 dark:border-neutral-800 mb-8">
            <div className="flex items-center gap-4 mb-4">
               <div className="w-12 h-12 bg-neutral-200 dark:bg-neutral-800 rounded-lg flex items-center justify-center font-bold text-xl">
                 N
               </div>
               <div>
                 <h3 className="font-bold text-neutral-900 dark:text-white">Nebula Redesign</h3>
                 <p className="text-xs text-neutral-500">Started by Alex M. • Due Oct 24</p>
               </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                 <span className="text-neutral-500">Budget</span>
                 <span className="font-mono">$24,000</span>
              </div>
              <div className="flex justify-between text-sm">
                 <span className="text-neutral-500">Team</span>
                 <span className="font-mono">4 Members</span>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
             <button className="flex-1 bg-black dark:bg-white text-white dark:text-black font-bold py-3 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
               Open Project
             </button>
             <button className="flex-1 bg-transparent border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white font-bold py-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors flex items-center justify-center gap-2">
               View Brief <ExternalLink className="w-4 h-4" />
             </button>
          </div>
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
