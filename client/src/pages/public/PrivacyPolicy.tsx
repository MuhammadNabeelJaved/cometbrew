/**
 * Privacy Policy Page
 * Displays the privacy policy for the Nabeel Agency website.
 */
import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, FileText, Server } from 'lucide-react';

export default function PrivacyPolicy() {
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
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Privacy Policy
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            We value your privacy and are committed to protecting your personal data.
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
                <FileText className="w-6 h-6 text-blue-500" />
              </div>
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">1. Introduction</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Welcome to Nabeel Agency. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website (regardless of where you visit it from) and tell you about your privacy rights and how the law protects you.
                </p>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section className="bg-card/30 backdrop-blur-sm border border-border/50 rounded-2xl p-8 md:p-10 hover:border-primary/20 transition-colors">
             <div className="flex items-start gap-4">
              <div className="p-2 bg-purple-500/10 rounded-lg shrink-0 mt-1">
                <Eye className="w-6 h-6 text-purple-500" />
              </div>
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">2. Data We Collect</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We may collect, use, store and transfer different kinds of personal data about you which we have grouped together follows:
                </p>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {[
                    "Identity Data (Name, username)",
                    "Contact Data (Email, phone)",
                    "Technical Data (IP address, browser)",
                    "Usage Data (How you use our site)",
                    "Marketing Data (Preferences)",
                    "Profile Data (Interests, feedback)"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground bg-background/50 p-3 rounded-lg border border-border/30">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="bg-card/30 backdrop-blur-sm border border-border/50 rounded-2xl p-8 md:p-10 hover:border-primary/20 transition-colors">
             <div className="flex items-start gap-4">
              <div className="p-2 bg-green-500/10 rounded-lg shrink-0 mt-1">
                <Server className="w-6 h-6 text-green-500" />
              </div>
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">3. How We Use Your Data</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
                </p>
                <ul className="space-y-2 list-disc pl-5 text-muted-foreground">
                  <li>Where we need to perform the contract we are about to enter into or have entered into with you.</li>
                  <li>Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.</li>
                  <li>Where we need to comply with a legal or regulatory obligation.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="bg-card/30 backdrop-blur-sm border border-border/50 rounded-2xl p-8 md:p-10 hover:border-primary/20 transition-colors">
             <div className="flex items-start gap-4">
              <div className="p-2 bg-orange-500/10 rounded-lg shrink-0 mt-1">
                <Lock className="w-6 h-6 text-orange-500" />
              </div>
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">4. Data Security</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed. In addition, we limit access to your personal data to those employees, agents, contractors and other third parties who have a business need to know.
                </p>
              </div>
            </div>
          </section>

          {/* Contact Footer */}
          <div className="text-center pt-8 border-t border-border/50">
            <p className="text-muted-foreground">
              Have questions about our Privacy Policy? <br />
              <a href="mailto:privacy@nabeel.agency" className="text-primary hover:underline font-medium mt-2 inline-block">
                Contact our Privacy Team
              </a>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
