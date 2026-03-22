/**
 * Job Application Success Page
 * Displayed after a candidate successfully submits an application.
 * Features:
 * - Confirmation message
 * - Next steps overview
 * - Navigation back to home/careers
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, ArrowRight, Home, Briefcase } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';

export default function JobApplicationSuccess() {
  return (
    <div className="min-h-screen pt-32 pb-20 px-4 bg-background flex items-center justify-center">
      <div className="max-w-xl mx-auto text-center space-y-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.6 }}
          className="relative inline-block"
        >
          <div className="absolute inset-0 bg-green-500/20 blur-2xl rounded-full" />
          <div className="relative w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto ring-1 ring-green-500/20">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-emerald-400">
            Application Received!
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Thank you for applying to Nabeel Agency. We've received your details and our recruitment team is already excited to review your profile.
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
                What happens next?
              </h3>
              <ul className="space-y-4">
                <li className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5 font-mono text-xs text-primary font-bold">1</div>
                  <div>
                    <span className="font-medium block text-foreground">Application Review</span>
                    <span className="text-sm text-muted-foreground">Our team will review your experience and portfolio within 3-5 business days.</span>
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5 font-mono text-xs text-primary font-bold">2</div>
                  <div>
                    <span className="font-medium block text-foreground">Initial Screening</span>
                    <span className="text-sm text-muted-foreground">If your profile matches our needs, we'll schedule a quick call to get to know you better.</span>
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5 font-mono text-xs text-primary font-bold">3</div>
                  <div>
                    <span className="font-medium block text-foreground">Technical Interview</span>
                    <span className="text-sm text-muted-foreground">Showcase your skills through a technical discussion or practical challenge.</span>
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
          <Link to="/careers">
            <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 px-8 text-base gap-2">
              <Briefcase className="h-5 w-5" />
              View Other Roles
            </Button>
          </Link>
          <Link to="/">
            <Button size="lg" className="w-full sm:w-auto h-12 px-8 text-base gap-2 shadow-lg shadow-primary/20">
              <Home className="h-5 w-5" />
              Back to Home
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
