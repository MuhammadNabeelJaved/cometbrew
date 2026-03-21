/**
 * Home Page Component
 * Assembles all public sections with enhanced layouts
 */
import React from 'react';
import { Code, Palette, Rocket, CheckCircle, Zap, Shield, Clock, Users, ArrowRight } from 'lucide-react';
import { Hero } from '../../components/Hero';
import { ServiceCard } from '../../components/ServiceCard';
import { ProjectCard } from '../../components/ProjectCard';
import { FeaturedProjects } from '../../components/FeaturedProjects';
import { TechStack } from '../../components/TechStack';
import { Process } from '../../components/Process';
import { Testimonials } from '../../components/Testimonials';
import { FAQSection } from '../../components/FAQSection';
import { TransformCTA } from '../../components/TransformCTA';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Link } from 'react-router-dom';

import { useContent } from '../../contexts/ContentContext';
import { useLanguage } from '../../contexts/LanguageContext';
import * as Icons from 'lucide-react';

// Helper to get Lucide icon
const getIcon = (name: string) => {
  const Icon = (Icons as any)[name];
  return Icon || Icons.Circle; // Fallback
};

export default function Home() {
  const { whyChooseUs } = useContent();
  const { t } = useLanguage();

  const faqItems = [
    { question: t('faq.q1'), answer: t('faq.a1') },
    { question: t('faq.q2'), answer: t('faq.a2') },
    { question: t('faq.q3'), answer: t('faq.a3') },
    { question: t('faq.q4'), answer: t('faq.a4') },
  ];

  const services = [
    {
      title: t('home.webDevTitle'),
      description: t('home.webDevDesc'),
      icon: Code,
      gradient: "from-blue-500/20 to-purple-500/20"
    },
    {
      title: t('home.uiuxTitle'),
      description: t('home.uiuxDesc'),
      icon: Palette,
      gradient: "from-purple-500/20 to-pink-500/20"
    },
    {
      title: t('home.aiTitle'),
      description: t('home.aiDesc'),
      icon: Rocket,
      gradient: "from-green-500/20 to-teal-500/20"
    }
  ];

  const projects = [
    {
      title: "FinTech Dashboard",
      category: "Web App",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop",
      tags: ["React", "D3.js", "Finance"]
    },
    {
      title: "AI Content Generator",
      category: "SaaS Platform",
      image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=2070&auto=format&fit=crop",
      tags: ["AI", "Next.js", "Stripe"]
    },
    {
      title: "E-Commerce Rebrand",
      category: "UI/UX Design",
      image: "https://images.unsplash.com/photo-1661956602116-aa6865609028?q=80&w=2064&auto=format&fit=crop",
      tags: ["Figma", "Design", "Retail"]
    }
  ];

  const features = [
    { title: t('feature.support'), icon: Clock, desc: t('feature.supportDesc') },
    { title: t('feature.security'), icon: Shield, desc: t('feature.securityDesc') },
    { title: t('feature.team'), icon: Users, desc: t('feature.teamDesc') },
    { title: t('feature.delivery'), icon: Zap, desc: t('feature.deliveryDesc') },
    { title: t('feature.scalable'), icon: Rocket, desc: t('feature.scalableDesc') },
    { title: t('feature.stack'), icon: Code, desc: t('feature.stackDesc') },
  ];

  const FeatureCard = ({ title, icon: Icon, desc }: any) => (
    <div className="group relative overflow-hidden rounded-2xl bg-card/40 dark:bg-white/5 backdrop-blur-md border border-border/50 dark:border-white/10 p-6 mb-6 hover:border-primary/40 hover:bg-card/60 dark:hover:bg-white/10 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300">
      {/* Glossy sheen effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      <div className="relative z-10 flex items-start gap-4">
        <div className="h-12 w-12 rounded-xl bg-background/50 dark:bg-white/5 border border-border/50 dark:border-white/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:bg-primary/20 group-hover:border-primary/20 transition-all duration-300 shadow-inner">
          <Icon className="h-6 w-6 text-primary group-hover:text-primary transition-colors" />
        </div>
        <div>
          <h4 className="font-bold text-lg mb-1 text-foreground group-hover:text-primary transition-colors">{title}</h4>
          <p className="text-sm text-muted-foreground leading-relaxed group-hover:text-foreground/80 dark:group-hover:text-gray-300 transition-colors">{desc}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-32 pb-20 overflow-x-hidden bg-background">
      <Hero />

      <TechStack />

      <Process />

      {/* Services Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">{t('home.servicesTitle')}</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t('home.servicesSubtitle')}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <ServiceCard key={index} {...service} />
          ))}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="bg-muted/5 py-24 relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Left Side Content */}
            <div className="space-y-8">
              <h2 className="text-3xl md:text-5xl font-bold leading-tight tracking-tight">
                {t('whyUs.titleLine1')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">{t('whyUs.titleLine2')}</span>
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {t('whyUs.description')}
              </p>
              
              <div className="space-y-4">
                {[t('whyUs.point1'), t('whyUs.point2'), t('whyUs.point3'), t('whyUs.point4')].map((item, i) => (
                  <div key={i} className="flex items-center space-x-3 group">
                    <div className="h-6 w-6 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    </div>
                    <span className="text-lg font-medium group-hover:text-foreground/80 transition-colors">{item}</span>
                  </div>
                ))}
              </div>

              <Link to="/contact" className="inline-block">
                <Button size="lg" className="rounded-full px-8 h-12 text-base shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-1 transition-all duration-300">
                  {t('whyUs.scheduleConsult')}
                </Button>
              </Link>
            </div>
            
            {/* Right Side - Vertical Scroll Animation */}
            <div className="relative h-[600px] overflow-hidden rounded-3xl bg-gradient-to-br from-card/30 to-card/10 dark:from-white/5 dark:to-white/0 border border-border/50 dark:border-white/10 p-8 shadow-2xl backdrop-blur-sm">
               
               <div className="grid grid-cols-2 gap-6 h-full">
                 {/* Column 1 - Scroll Up */}
                 <div className="flex flex-col animate-scroll-vertical gap-6">
                   {[...whyChooseUs.features, ...whyChooseUs.features, ...whyChooseUs.features].map((f, i) => (
                     <FeatureCard key={`col1-${i}`} title={f.title} icon={getIcon(f.iconName)} desc={f.desc} />
                   ))}
                 </div>
                 
                 {/* Column 2 - Scroll Down (Reverse) */}
                 <div className="flex flex-col animate-scroll-vertical-reverse gap-6 -mt-32">
                   {[...whyChooseUs.features, ...whyChooseUs.features, ...whyChooseUs.features].map((f, i) => (
                     <FeatureCard key={`col2-${i}`} title={f.title} icon={getIcon(f.iconName)} desc={f.desc} />
                   ))}
                 </div>
               </div>
            </div>

          </div>
        </div>
      </section>

      {/* Featured Projects Section */}
      <FeaturedProjects />

      <Testimonials />

      <FAQSection items={faqItems} className="bg-muted/5" />

      {/* CTA Section */}
      <TransformCTA />
    </div>
  );
}
