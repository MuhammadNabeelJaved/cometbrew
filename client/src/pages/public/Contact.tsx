/**
 * Contact Page
 * Contact info pulled from CMS, form submits to backend API
 */
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { FAQSection } from '../../components/FAQSection';
import { MapPin, Phone, Mail, Clock, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useContent } from '../../contexts/ContentContext';
import { contactsApi } from '../../api/contacts.api';

export default function Contact() {
  const { contactInfo } = useContent();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const form = e.currentTarget;
    const data = {
      firstName: (form.elements.namedItem('firstName') as HTMLInputElement).value,
      lastName: (form.elements.namedItem('lastName') as HTMLInputElement).value,
      email: (form.elements.namedItem('email') as HTMLInputElement).value,
      subject: (form.elements.namedItem('subject') as HTMLInputElement).value,
      message: (form.elements.namedItem('message') as HTMLTextAreaElement).value,
    };

    try {
      await contactsApi.create(data);
      navigate('/contact/success');
    } catch (err: any) {
      toast.error('Submission Failed', { description: err?.response?.data?.message || 'Failed to send your message. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const faqItems = [
    { question: "How quickly do you respond?", answer: "We typically respond to all inquiries within 24 business hours. For urgent support issues, our existing clients have a dedicated hotline." },
    { question: "Can we visit your office?", answer: "We are a remote-first company, but we do have a physical presence. We welcome client visits by appointment." },
    { question: "Do you offer free consultations?", answer: "Yes, we offer a free initial 30-minute consultation to discuss your project needs and determine if we're a good fit." }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16 pt-32">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl md:text-5xl font-bold">
          Get in touch
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-xl text-muted-foreground">
          Have a project in mind? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Contact Form */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-card border border-border/50 rounded-2xl p-8 shadow-sm">
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">First Name</label>
                <Input name="firstName" placeholder="John" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Last Name</label>
                <Input name="lastName" placeholder="Doe" required />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input name="email" type="email" placeholder="john@company.com" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Subject</label>
              <Input name="subject" placeholder="Project inquiry..." required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Message</label>
              <Textarea name="message" placeholder="Tell us about your project..." className="min-h-[150px]" required />
            </div>
            <Button size="lg" className="w-full" isLoading={isSubmitting}>
              Send Message
              {!isSubmitting && <Send className="ml-2 h-4 w-4" />}
            </Button>
          </form>
        </motion.div>

        {/* Contact Info */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-muted/30 p-6 rounded-xl space-y-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Visit Us</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {contactInfo.address || 'Address not set'}
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
                  {contactInfo.email || 'Email not set'}
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
                  {contactInfo.phone || 'Phone not set'}
                </p>
              </div>
            </div>

            <div className="bg-muted/30 p-6 rounded-xl space-y-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Business Hours</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {contactInfo.businessHours || 'Hours not set'}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <FAQSection title="Common Questions" description="Quick answers before you reach out." items={faqItems} />
    </div>
  );
}
