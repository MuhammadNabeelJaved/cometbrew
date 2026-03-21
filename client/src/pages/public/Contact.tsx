/**
 * Contact Page
 * Layout with Map and Form
 * Features:
 * - Contact Form with validation and success redirect
 * - Contact Information (Address, Email, Phone)
 * - Map visualization
 * - FAQ Section
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { FAQSection } from '../../components/FAQSection';
import { MapPin, Phone, Mail, Clock, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import { Notification } from '../../components/Notification';

export default function Contact() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      navigate('/contact/success');
    } catch {
      setSubmitError('Failed to send your message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const faqItems = [
    {
      question: "How quickly do you respond?",
      answer: "We typically respond to all inquiries within 24 business hours. For urgent support issues, our existing clients have a dedicated hotline."
    },
    {
      question: "Can we visit your office?",
      answer: "We are a remote-first company, but we do have a headquarters in San Francisco. We welcome client visits by appointment."
    },
    {
      question: "Do you offer free consultations?",
      answer: "Yes, we offer a free initial 30-minute consultation to discuss your project needs and determine if we're a good fit."
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16 pt-32">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-bold"
        >
          Get in touch
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-xl text-muted-foreground"
        >
          Have a project in mind? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Contact Form */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border/50 rounded-2xl p-8 shadow-sm"
        >
          <Notification
            type="error"
            title="Submission Failed"
            message={submitError ?? undefined}
            isVisible={!!submitError}
            onClose={() => setSubmitError(null)}
          />

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">First Name</label>
                <Input placeholder="John" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Last Name</label>
                <Input placeholder="Doe" required />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input type="email" placeholder="john@company.com" required />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Subject</label>
              <Input placeholder="Project inquiry..." required />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Message</label>
              <Textarea placeholder="Tell us about your project..." className="min-h-[150px]" required />
            </div>
            
            <Button size="lg" className="w-full" isLoading={isSubmitting}>
              Send Message
              {!isSubmitting && <Send className="ml-2 h-4 w-4" />}
            </Button>
          </form>
        </motion.div>

        {/* Contact Info & Map */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-muted/30 p-6 rounded-xl space-y-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Visit Us</h3>
                <p className="text-sm text-muted-foreground">
                  123 Tech Boulevard<br />
                  San Francisco, CA 94107
                </p>
              </div>
            </div>
            
            <div className="bg-muted/30 p-6 rounded-xl space-y-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Email Us</h3>
                <p className="text-sm text-muted-foreground">
                  hello@novaagency.com<br />
                  support@novaagency.com
                </p>
              </div>
            </div>
            
            <div className="bg-muted/30 p-6 rounded-xl space-y-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Call Us</h3>
                <p className="text-sm text-muted-foreground">
                  +1 (555) 123-4567<br />
                  Mon-Fri, 9am-6pm PST
                </p>
              </div>
            </div>

            <div className="bg-muted/30 p-6 rounded-xl space-y-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Business Hours</h3>
                <p className="text-sm text-muted-foreground">
                  Monday - Friday<br />
                  9:00 AM - 6:00 PM
                </p>
              </div>
            </div>
          </div>

          {/* Map Placeholder */}
          <div className="w-full h-[300px] bg-muted rounded-2xl relative overflow-hidden flex items-center justify-center border border-border/50">
            <div className="absolute inset-0 opacity-50 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/ec/San_Francisco_map_black_and_white.jpg')] bg-cover bg-center grayscale" />
            <div className="relative z-10 bg-background/80 backdrop-blur-sm p-4 rounded-xl border border-border shadow-lg">
              <div className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-destructive animate-bounce" />
                <span className="font-semibold">Nova HQ</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <FAQSection 
        title="Common Questions" 
        description="Quick answers before you reach out."
        items={faqItems}
      />
    </div>
  );
}
