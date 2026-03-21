import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, ArrowRight } from 'lucide-react';

export default function EmailVerification() {
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
          <span className="text-xs font-mono text-neutral-400">SECURE</span>
        </div>

        <div className="p-8 md:p-12 text-center">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-6 mx-auto text-blue-600 dark:text-blue-400">
            <Shield className="w-8 h-8" />
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white mb-4">
            Verify your email
          </h1>
          
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed mb-8 max-w-sm mx-auto">
            We need to verify your email address to secure your account. Please click the button below to confirm <strong>alex@example.com</strong> is you.
          </p>

          <button className="px-8 py-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20 mb-8">
            Verify Email Address
          </button>
          
          <p className="text-xs text-neutral-400 mb-0">
            Link expires in 24 hours. If you didn't request this, please ignore this email.
          </p>
        </div>

        <div className="bg-neutral-50 dark:bg-neutral-900/50 p-6 border-t border-neutral-100 dark:border-neutral-800 text-center">
          <p className="text-xs text-neutral-400 mb-2">
            © 2024 Nabeel Agency. All rights reserved.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
