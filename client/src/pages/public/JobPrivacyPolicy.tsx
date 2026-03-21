/**
 * Job Application Privacy Policy Page
 * Detailed privacy policy specifically for job applicants.
 * Explains how personal data is collected, stored, and used during the recruitment process.
 */
import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, FileText, Eye, Database, Server, Clock, Trash2, Mail } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';

export default function JobPrivacyPolicy() {
  const sections = [
    {
      icon: Database,
      title: "Data We Collect",
      content: "We collect information you voluntarily provide during the application process, including your name, contact details, resume/CV, employment history, education, and any other information included in your application materials. We may also collect information from third parties, such as professional recruiting firms, your references, and prior employers."
    },
    {
      icon: Eye,
      title: "How We Use Your Data",
      content: "Your personal data is used exclusively for recruitment and hiring purposes. This includes evaluating your qualifications, verifying your information, conducting reference checks, and communicating with you about the recruitment process. We do not use your applicant data for marketing purposes."
    },
    {
      icon: Server,
      title: "Data Storage & Security",
      content: "We implement robust technical and organizational measures to protect your personal data against unauthorized access, loss, or alteration. Your data is stored on secure servers with restricted access, available only to personnel involved in the recruitment process."
    },
    {
      icon: Clock,
      title: "Retention Period",
      content: "If you are hired, your application data will be transferred to our employee records. If you are not hired, we will retain your data for a period of 12 months to consider you for future opportunities, after which it will be securely deleted, unless you request earlier deletion."
    },
    {
      icon: Lock,
      title: "Data Sharing",
      content: "We do not sell your personal data. We may share your information with trusted third-party service providers who assist us with recruitment (e.g., applicant tracking systems) under strict confidentiality agreements. We may also disclose information if required by law."
    },
    {
      icon: FileText,
      title: "Your Rights",
      content: "You have the right to access, correct, update, or request deletion of your personal data at any time. You may also object to the processing of your data or request data portability. To exercise these rights, please contact our privacy team."
    }
  ];

  return (
    <div className="min-h-screen bg-background pt-24 pb-20">
      {/* Header Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 mb-16">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Shield className="w-4 h-4" />
              <span>Applicant Privacy</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-6">
              Candidate Privacy <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">Policy</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We value your trust and are committed to protecting your personal information throughout the recruitment process.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {sections.map((section, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-colors">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <section.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{section.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {section.content}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Detailed Text Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="prose prose-invert max-w-none bg-card/30 rounded-2xl p-8 border border-border/50"
        >
          <h3>Legal Basis for Processing</h3>
          <p>
            Our processing of your personal data is based on your consent, our legitimate interest in recruiting qualified personnel, and necessity to take steps at your request prior to entering into an employment contract.
          </p>

          <h3>Automated Decision Making</h3>
          <p>
            We do not use fully automated decision-making processes or profiling in our recruitment process. All hiring decisions are made by our human recruitment team.
          </p>
          
          <h3>International Transfers</h3>
          <p>
            As a digital agency with a global presence, your data may be processed in countries where we have operations. We ensure appropriate safeguards are in place for any international data transfers in compliance with applicable data protection laws.
          </p>
        </motion.div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mt-16 text-center space-y-6 bg-primary/5 rounded-2xl p-10 border border-primary/10"
        >
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Have Questions?</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            If you have any questions about how we handle your data or wish to exercise your privacy rights, please contact our Data Protection Officer.
          </p>
          <div className="flex justify-center gap-4">
            <Button asChild variant="outline">
              <a href="mailto:privacy@nabeel.agency">Contact Privacy Team</a>
            </Button>
            <Button asChild>
              <a href="/careers/apply">Back to Application</a>
            </Button>
          </div>
        </motion.div>

        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>
      </div>
    </div>
  );
}
