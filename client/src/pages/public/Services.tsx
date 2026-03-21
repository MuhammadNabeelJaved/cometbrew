/**
 * Enhanced Services Page
 * Creative layout with premium glassmorphism effects
 */
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Code, Palette, Rocket, Database, Smartphone, Globe, Shield, BarChart, CheckCircle2, Zap, Layout, Users, Loader2 } from 'lucide-react';
import { ServiceCard } from '../../components/ServiceCard';
import { PricingCard } from '../../components/PricingCard';
import { FAQSection } from '../../components/FAQSection';
import { Button } from '../../components/ui/button';
import { servicesApi } from '../../api/services.api';

const iconMap: Record<string, any> = {
  'web-development': Code,
  'mobile-app': Smartphone,
  'ecommerce': Globe,
  'design': Palette,
  'consulting': Rocket,
  'other': Layout,
  // legacy fallbacks
  Code,
  Palette,
  Smartphone,
  Globe,
  Layout,
};

const gradientMap: Record<string, string> = {
  'web-development': 'from-blue-500/20 to-purple-500/20',
  'mobile-app': 'from-green-500/20 to-emerald-500/20',
  'ecommerce': 'from-orange-500/20 to-yellow-500/20',
  'design': 'from-pink-500/20 to-rose-500/20',
  'consulting': 'from-purple-500/20 to-indigo-500/20',
  'other': 'from-cyan-500/20 to-blue-500/20',
};

const pricingTiers = [
  {
    name: "Starter",
    price: "$2,999",
    description: "Perfect for small businesses looking to establish a professional online presence.",
    features: [
      { text: "Custom UI/UX Design", included: true },
      { text: "5 Page Responsive Website", included: true },
      { text: "Basic SEO Optimization", included: true },
      { text: "CMS Integration", included: true },
      { text: "1 Month Support", included: true },
      { text: "AI Chatbot Integration", included: false },
      { text: "Advanced Analytics", included: false }
    ]
  },
  {
    name: "Business",
    price: "$5,999",
    description: "Comprehensive solution for growing companies needing advanced functionality.",
    popular: true,
    ctaText: "Get Started",
    features: [
      { text: "Premium UI/UX Design", included: true },
      { text: "Unlimited Pages", included: true },
      { text: "Advanced SEO & Performance", included: true },
      { text: "Custom Admin Dashboard", included: true },
      { text: "3 Months Support", included: true },
      { text: "Basic AI Integration", included: true },
      { text: "Payment Gateway", included: true }
    ]
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "Full-scale digital transformation for large organizations with complex needs.",
    features: [
      { text: "Enterprise Architecture", included: true },
      { text: "Microservices Support", included: true },
      { text: "Global CDN & Security", included: true },
      { text: "Dedicated Team", included: true },
      { text: "24/7 Priority Support", included: true },
      { text: "Advanced AI Solutions", included: true },
      { text: "SLA Guarantee", included: true }
    ]
  }
];

const processSteps = [
  { title: "Discovery", description: "We dive deep into your business goals.", icon: Users },
  { title: "Strategy", description: "Planning the perfect roadmap for success.", icon: Layout },
  { title: "Development", description: "Building with clean, scalable code.", icon: Code },
  { title: "Launch", description: "Deploying and optimizing for growth.", icon: Zap }
];

export default function Services() {
  const [apiServices, setApiServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const fetchServices = async () => {
      setIsLoading(true);
      try {
        const response = await servicesApi.getAll();
        const data = response.data.data;
        setApiServices(Array.isArray(data) ? data : []);
      } catch (err) {
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };
    fetchServices();
  }, []);

  // Map API services to ServiceCard props
  const serviceCards = apiServices.map((s: any) => ({
    title: s.title,
    description: s.description || s.shortDescription || '',
    icon: iconMap[s.category] || iconMap[s.icon] || Code,
    gradient: gradientMap[s.category] || gradientMap[s.icon] || 'from-primary/20 to-secondary/20',
    slug: s.slug,
  }));

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Hero Section */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-background">
          <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] opacity-40 animate-pulse" />
          <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[100px] opacity-30" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background/50 border border-border/50 mb-8 backdrop-blur-md shadow-sm">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
              </span>
              <span className="text-sm font-medium text-foreground">Accepting New Projects</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-8 tracking-tight leading-tight">
              We Craft <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-400 to-secondary">Digital Excellence</span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed">
              Transforming businesses through innovative design, cutting-edge development, and strategic AI integration.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-16">
            <div>
              <h2 className="text-3xl md:text-5xl font-bold mb-4">Our Expertise</h2>
              <p className="text-muted-foreground text-lg">Comprehensive solutions for the modern web.</p>
            </div>
            <Button variant="outline" className="hidden md:flex gap-2 rounded-full border-white/20 hover:bg-white/10">
              View All Services <Layout className="h-4 w-4" />
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            </div>
          ) : hasError || serviceCards.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">
                {hasError ? 'Unable to load services at this time. Please try again later.' : 'No services available yet.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {serviceCards.map((service, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <ServiceCard {...service} className="h-full" />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Process Section */}
      <section className="py-32 bg-muted/5 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">How We Work</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              A transparent, agile process designed to deliver exceptional results on time and within budget.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {processSteps.map((step, index) => (
              <div key={index} className="relative group">
                {index < processSteps.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-[60%] w-[80%] border-t-2 border-dashed border-white/10 z-0" />
                )}
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="h-24 w-24 rounded-full bg-background border border-white/10 flex items-center justify-center mb-6 group-hover:border-primary/50 group-hover:shadow-[0_0_30px_rgba(var(--primary),0.3)] transition-all duration-500">
                    <step.icon className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground text-sm">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-32 relative">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Simple, Transparent Pricing</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Choose the perfect plan for your business needs. No hidden fees.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {pricingTiers.map((tier, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                className={tier.popular ? "lg:-mt-4 lg:mb-0" : ""}
              >
                <PricingCard tier={tier} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <div className="pb-32">
        <FAQSection
          title="Frequently Asked Questions"
          description="Common questions about our services and pricing."
          items={[
            {
              question: "Do I need to have a technical background?",
              answer: "Not at all. We handle all the technical heavy lifting. We explain everything in plain English and focus on your business goals rather than technical jargon."
            },
            {
              question: "Can you help update an existing legacy system?",
              answer: "Yes, we specialize in digital transformation. We can audit your existing legacy systems and propose a strategy to modernize them using the latest reliable technologies."
            },
            {
              question: "What is your design process like?",
              answer: "Our design process is iterative and collaborative. We start with wireframes and user flows, move to high-fidelity mockups, and create interactive prototypes for your approval."
            }
          ]}
        />
      </div>
    </div>
  );
}
