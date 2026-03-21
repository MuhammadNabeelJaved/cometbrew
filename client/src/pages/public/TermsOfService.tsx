/**
 * Terms of Service Page
 * Displays the terms and conditions for using the Nabeel Agency services.
 */
import React from 'react';
import { motion } from 'framer-motion';
import { Scale, FileCheck, AlertCircle, Gavel, Handshake } from 'lucide-react';

export default function TermsOfService() {
  const lastUpdated = "October 24, 2023";

  return (
    <div className="min-h-screen bg-background pb-20 pt-10">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center justify-center p-3 mb-6 bg-primary/10 rounded-full">
            <Scale className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Terms of Service
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Please read these terms carefully before using our services.
          </p>
          <p className="mt-4 text-sm text-muted-foreground/60">
            Last Updated: {lastUpdated}
          </p>
        </motion.div>

        {/* Content */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="prose prose-lg dark:prose-invert max-w-none space-y-12"
        >
          {/* Section 1 */}
          <section className="bg-card/30 backdrop-blur-sm border border-border/50 rounded-2xl p-8 md:p-10 hover:border-primary/20 transition-colors">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-blue-500/10 rounded-lg shrink-0 mt-1">
                <Handshake className="w-6 h-6 text-blue-500" />
              </div>
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">1. Agreement to Terms</h2>
                <p className="text-muted-foreground leading-relaxed">
                  By accessing our website and using our services, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
                </p>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section className="bg-card/30 backdrop-blur-sm border border-border/50 rounded-2xl p-8 md:p-10 hover:border-primary/20 transition-colors">
             <div className="flex items-start gap-4">
              <div className="p-2 bg-purple-500/10 rounded-lg shrink-0 mt-1">
                <FileCheck className="w-6 h-6 text-purple-500" />
              </div>
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">2. Use License</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Permission is granted to temporarily download one copy of the materials (information or software) on Nabeel Agency's website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
                </p>
                <ul className="space-y-2 text-muted-foreground bg-background/50 p-6 rounded-xl border border-border/30">
                  <li className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    Modify or copy the materials
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    Use the materials for any commercial purpose
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    Attempt to decompile or reverse engineer any software
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    Remove any copyright or other proprietary notations
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="bg-card/30 backdrop-blur-sm border border-border/50 rounded-2xl p-8 md:p-10 hover:border-primary/20 transition-colors">
             <div className="flex items-start gap-4">
              <div className="p-2 bg-orange-500/10 rounded-lg shrink-0 mt-1">
                <AlertCircle className="w-6 h-6 text-orange-500" />
              </div>
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">3. Disclaimer</h2>
                <p className="text-muted-foreground leading-relaxed">
                  The materials on Nabeel Agency's website are provided on an 'as is' basis. Nabeel Agency makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
                </p>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="bg-card/30 backdrop-blur-sm border border-border/50 rounded-2xl p-8 md:p-10 hover:border-primary/20 transition-colors">
             <div className="flex items-start gap-4">
              <div className="p-2 bg-slate-500/10 rounded-lg shrink-0 mt-1">
                <Gavel className="w-6 h-6 text-slate-500" />
              </div>
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">4. Governing Law</h2>
                <p className="text-muted-foreground leading-relaxed">
                  These terms and conditions are governed by and construed in accordance with the laws of California and you irrevocably submit to the exclusive jurisdiction of the courts in that State or location.
                </p>
              </div>
            </div>
          </section>

          {/* Contact Footer */}
          <div className="text-center pt-8 border-t border-border/50">
            <p className="text-muted-foreground">
              Have questions about our Terms? <br />
              <a href="mailto:legal@nabeel.agency" className="text-primary hover:underline font-medium mt-2 inline-block">
                Contact our Legal Team
              </a>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
