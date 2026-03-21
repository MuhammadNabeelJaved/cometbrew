/**
 * Service Detail Page
 * Premium detailed view with immersive header and modern UI
 */
import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, ArrowRight, Zap, Globe, Shield, Code, ChevronRight, Laptop, Sparkles, Star, Rocket } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { FAQSection } from '../../components/FAQSection';

import { ProjectCard } from '../../components/ProjectCard';

// Mock data for services (reused)
const serviceData = {
  'web-development': {
    title: 'Web Development',
    subtitle: 'Scalable, secure, and high-performance web applications built for the future.',
    description: 'We build robust web applications that drive business growth. Our team of expert developers leverages the latest technologies to create scalable, secure, and high-performance solutions tailored to your unique needs.',
    image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=2070&auto=format&fit=crop',
    icon: Code,
    faqs: [
      { question: "What tech stack do you use?", answer: "Next.js, React, Node.js, and TypeScript." },
      { question: "Is the code scalable?", answer: "Absolutely. We build with modular architecture." },
      { question: "Do you optimize for SEO?", answer: "Yes, all our apps are SEO-optimized out of the box." }
    ],
    features: [
      { title: 'Custom Web Apps', description: 'Tailored solutions built from scratch.', icon: Laptop },
      { title: 'E-commerce', description: 'Secure online stores that drive sales.', icon: Globe },
      { title: 'API Integration', description: 'Seamless third-party connections.', icon: Zap },
      { title: 'Enterprise Security', description: 'Bank-grade data protection.', icon: Shield }
    ],
    pricing: [
      { name: 'Starter', price: '$2,500', description: 'For small businesses.', features: ['5 Pages', 'Responsive', 'Basic SEO', '1 Mo Support'] },
      { name: 'Professional', price: '$5,000', description: 'For growing companies.', features: ['10 Pages', 'CMS', 'Advanced SEO', 'API Integration', '3 Mo Support'], popular: true },
      { name: 'Enterprise', price: 'Custom', description: 'For large organizations.', features: ['Unlimited', 'Custom features', 'Security audit', 'Dedicated Team'] }
    ],
    projects: [
      {
        title: "FinTech Dashboard",
        category: "Web App",
        image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop",
        tags: ["React", "D3.js", "Finance"]
      },
      {
        title: "E-Commerce Platform",
        category: "E-commerce",
        image: "https://images.unsplash.com/photo-1661956602116-aa6865609028?q=80&w=2064&auto=format&fit=crop",
        tags: ["Next.js", "Stripe", "Retail"]
      },
      {
        title: "SaaS Analytics",
        category: "SaaS",
        image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2015&auto=format&fit=crop",
        tags: ["Vue.js", "Python", "Data"]
      }
    ]
  },
  'ui-ux-design': { // Added basic fallback for other services
     title: 'UI/UX Design',
     subtitle: 'User-centric interfaces that delight and convert.',
     description: 'Our design process focuses on user needs and business goals to create intuitive, beautiful interfaces.',
     image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=2000&auto=format&fit=crop',
     icon: Palette,
     faqs: [],
     features: [],
     pricing: [],
     projects: [
      {
        title: "Mobile Banking App",
        category: "Mobile Design",
        image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=1470&auto=format&fit=crop",
        tags: ["Figma", "iOS", "Banking"]
      },
      {
        title: "Travel Booking UI",
        category: "Web Design",
        image: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021&auto=format&fit=crop",
        tags: ["UI/UX", "Travel", "Responsive"]
      }
     ]
  },
  // Add other fallbacks if needed
};

// Fallback logic inside component
import { Palette } from 'lucide-react';

export default function ServiceDetail() {
  const { slug } = useParams<{ slug: string }>();
  // Use a fallback if data is missing, or default to web-development if slug is weird (simulating API)
  const service = serviceData[slug as keyof typeof serviceData] || serviceData['web-development'];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  return (
    <div className="min-h-screen pb-20 bg-background">
      {/* Immersive Header Banner */}
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={service.image} 
            alt={service.title} 
            className="w-full h-full object-cover opacity-30 scale-105 animate-pulse-slow" 
            style={{ animationDuration: '20s' }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/60 to-background" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent opacity-70" />
        </div>
        
        <div className="container relative z-10 px-4 text-center max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 py-1 px-4 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8 border border-primary/20 backdrop-blur-sm">
              <Sparkles className="h-4 w-4" />
              <span>Premium Service</span>
            </div>
            <h1 className="text-5xl md:text-8xl font-bold mb-8 tracking-tight text-foreground drop-shadow-sm">
              {service.title}
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              {service.subtitle}
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="rounded-full px-8 h-12 text-lg">Start Project</Button>
              <Button size="lg" variant="outline" className="rounded-full px-8 h-12 text-lg bg-background/50 backdrop-blur-md">View Case Studies</Button>
            </div>
          </motion.div>
        </div>
        
        {/* Scroll Indicator */}
        <motion.div 
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-muted-foreground"
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <div className="w-6 h-10 border-2 border-muted-foreground rounded-full flex justify-center p-1">
            <div className="w-1 h-2 bg-muted-foreground rounded-full" />
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y border-border/50 bg-card/50 backdrop-blur-sm -mt-20 relative z-20 mx-4 md:mx-auto max-w-7xl rounded-2xl shadow-xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-border/50">
          {[
            { label: "Success Rate", value: "99%" },
            { label: "Projects", value: "250+" },
            { label: "Expert Team", value: "Top 1%" },
            { label: "Support", value: "24/7" }
          ].map((stat, i) => (
            <div key={i} className="p-2">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground uppercase tracking-wider font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Description & Features Split */}
      <section className="py-32">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-8">
              <h2 className="text-3xl md:text-5xl font-bold leading-tight">
                Transforming ideas into <span className="text-primary">digital reality</span>
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {service.description}
              </p>
              <ul className="space-y-4">
                {[
                  "Agile Development Methodology",
                  "User-Centric Design Principles",
                  "Cloud-Native Architecture",
                  "Continuous Integration & Deployment"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                      <Check className="h-4 w-4" />
                    </div>
                    <span className="font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {service.features && service.features.slice(0, 4).map((feature: any, index: number) => (
                 <div key={index} className="bg-card border border-border/50 p-6 rounded-2xl hover:border-primary/50 transition-colors shadow-sm group">
                   <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform">
                     {feature.icon && <feature.icon className="h-6 w-6" />}
                   </div>
                   <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                   <p className="text-sm text-muted-foreground">{feature.description}</p>
                 </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Related Projects Section */}
      {service.projects && service.projects.length > 0 && (
        <section className="py-24 bg-muted/5">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">Related Projects</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                See how we've helped other clients achieve their goals with our {service.title} services.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {service.projects.map((project: any, index: number) => (
                <ProjectCard key={index} {...project} />
              ))}
            </div>
            <div className="mt-12 text-center">
               <Link to="/portfolio">
                 <Button variant="outline" size="lg" className="rounded-full">View All Projects <ArrowRight className="ml-2 h-4 w-4"/></Button>
               </Link>
            </div>
          </div>
        </section>
      )}

      {/* Pricing Section */}
      <section className="py-20 bg-muted/10">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Simple, Transparent Pricing</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              No hidden fees. Choose the plan that fits your growth stage.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {service.pricing && service.pricing.map((plan: any, index: number) => (
              <motion.div
                key={index}
                whileHover={{ y: -10 }}
                className={`relative bg-card border ${plan.popular ? 'border-primary shadow-2xl shadow-primary/10' : 'border-border'} p-8 rounded-3xl flex flex-col`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-purple-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                    MOST POPULAR
                  </div>
                )}
                
                <div className="mb-8 text-center">
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">{plan.name}</h3>
                  <div className="text-4xl font-bold mb-4">{plan.price}</div>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>

                <div className="space-y-4 mb-8 flex-grow border-t border-border/50 pt-8">
                  {plan.features.map((feature: string, i: number) => (
                    <div key={i} className="flex items-center space-x-3">
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button 
                  variant={plan.popular ? "default" : "outline"} 
                  className={`w-full rounded-full h-12 ${plan.popular ? 'bg-primary hover:bg-primary/90' : ''}`}
                >
                  Choose Plan
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      {service.faqs && service.faqs.length > 0 && (
        <FAQSection 
          title="Frequently Asked Questions"
          description={`Everything you need to know about our ${service.title} services.`}
          items={service.faqs}
          className="bg-background"
        />
      )}
    </div>
  );
}
