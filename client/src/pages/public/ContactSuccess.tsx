/**
 * Contact Success Page
 * Displayed after a user successfully sends a message via the contact form.
 * Features:
 * - Confirmation message
 * - Response time expectation
 * - Navigation back to home/services
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Home, Sparkles, Mail } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';

export default function ContactSuccess() {
  return (
    <div className="min-h-screen pt-32 pb-20 px-4 bg-background flex items-center justify-center">
      <div className="max-w-xl mx-auto text-center space-y-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.6 }}
          className="relative inline-block"
        >
          <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full" />
          <div className="relative w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto ring-1 ring-blue-500/20">
            <CheckCircle2 className="w-12 h-12 text-blue-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-400">
            Message Sent!
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Thanks for reaching out to Nabeel Agency. We've received your message and are looking forward to connecting with you.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-6 text-left space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                What happens now?
              </h3>
              <ul className="space-y-4">
                <li className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5 font-mono text-xs text-primary font-bold">1</div>
                  <div>
                    <span className="font-medium block text-foreground">Message Review</span>
                    <span className="text-sm text-muted-foreground">Our team will review your inquiry to ensure it gets to the right person.</span>
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5 font-mono text-xs text-primary font-bold">2</div>
                  <div>
                    <span className="font-medium block text-foreground">Response</span>
                    <span className="text-sm text-muted-foreground">We typically respond within 24 hours on business days.</span>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div 
          className="flex flex-col sm:flex-row justify-center gap-4 pt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <Button variant="outline" size="lg" asChild>
            <Link to="/services">
              <Sparkles className="mr-2 h-4 w-4" />
              Explore Services
            </Link>
          </Button>
          <Button size="lg" asChild>
            <Link to="/">
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
