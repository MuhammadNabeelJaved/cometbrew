import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export default function SignupConfirmation() {
  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 py-12 px-4 flex items-center justify-center font-sans">
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="max-w-xl w-full bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl overflow-hidden"
      >
        {/* Email Header */}
        <div className="bg-neutral-50 dark:bg-neutral-900/50 p-6 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center">
           <img 
            src="https://vgbujcuwptvheqijyjbe.supabase.co/storage/v1/object/public/hmac-uploads/uploads/216147d0-06c1-4dee-8a5a-f933c6ef8556/1766429553723-26c2f3fe/N_Logo-01.png" 
            alt="Nabeel Logo" 
            className="h-8 w-auto dark:invert" 
          />
          <span className="text-xs font-mono text-neutral-400">ORDER #99281</span>
        </div>

        {/* Email Body */}
        <div className="p-8 md:p-12">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-6 text-green-600 dark:text-green-400">
            <CheckCircle className="w-8 h-8" />
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white mb-4">
            Welcome to the Agency
          </h1>
          
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed mb-8">
            Hi Alex,<br/><br/>
            We're thrilled to have you on board. Your account has been successfully created. You now have full access to our client portal where you can track projects, view reports, and manage your team.
          </p>

          <div className="bg-neutral-50 dark:bg-neutral-900 p-6 rounded-xl mb-8 border border-neutral-100 dark:border-neutral-800">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-2 uppercase tracking-wider">Account Details</h3>
            <div className="flex flex-col gap-2 text-sm text-neutral-600 dark:text-neutral-400">
              <div className="flex justify-between">
                <span>Username:</span>
                <span className="font-mono text-neutral-900 dark:text-white">alex.design</span>
              </div>
              <div className="flex justify-between">
                <span>Plan:</span>
                <span className="font-mono text-neutral-900 dark:text-white">Enterprise</span>
              </div>
            </div>
          </div>

          <button className="w-full bg-black dark:bg-white text-white dark:text-black font-bold py-4 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
            Go to Dashboard <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Email Footer */}
        <div className="bg-neutral-50 dark:bg-neutral-900/50 p-6 border-t border-neutral-100 dark:border-neutral-800 text-center">
          <p className="text-xs text-neutral-400 mb-2">
            © 2024 Nabeel Agency. All rights reserved.
          </p>
          <div className="flex justify-center gap-4 text-xs text-neutral-400">
            <a href="#" className="hover:text-neutral-600 dark:hover:text-neutral-200">Unsubscribe</a>
            <a href="#" className="hover:text-neutral-600 dark:hover:text-neutral-200">Privacy Policy</a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
