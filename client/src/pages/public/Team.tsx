/**
 * Team Page
 * Public facing team directory
 */
import React from 'react';
import { motion } from 'framer-motion';
import { Github, Twitter, Linkedin, Mail, ArrowUpRight } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { TransformCTA } from '../../components/TransformCTA';

export default function Team() {
  const team = [
    {
      name: "Sarah Jenkins",
      role: "Founder & CEO",
      bio: "Visionary leader with 15+ years in digital transformation and product strategy. Previously led design at TechCorp.",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=800",
      social: { twitter: "#", linkedin: "#", github: "#" },
      tags: ["Strategy", "Leadership", "Design"]
    },
    {
      name: "David Chen",
      role: "CTO",
      bio: "Full-stack architect obsessed with scalability and performance. Expert in React, Node.js and Cloud Infrastructure.",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800",
      social: { twitter: "#", linkedin: "#", github: "#" },
      tags: ["Engineering", "Cloud", "Architecture"]
    },
    {
      name: "Emily Rodriguez",
      role: "Head of Design",
      bio: "Award-winning creative director crafting immersive digital experiences. Believes in design that works as good as it looks.",
      image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800",
      social: { twitter: "#", linkedin: "#", github: "#" },
      tags: ["UI/UX", "Brand", "Creative"]
    },
    {
      name: "Michael Chang",
      role: "Lead Developer",
      bio: "Frontend specialist focusing on animation and micro-interactions. Turns complex designs into buttery smooth interfaces.",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=800",
      social: { twitter: "#", linkedin: "#", github: "#" },
      tags: ["Frontend", "React", "Motion"]
    },
    {
      name: "Jessica Kim",
      role: "Product Manager",
      bio: "Bridging the gap between client needs and technical execution. Ensures every project is delivered on time and on budget.",
      image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=800",
      social: { twitter: "#", linkedin: "#", github: "#" },
      tags: ["Product", "Agile", "Scrum"]
    },
    {
      name: "James Wilson",
      role: "AI Engineer",
      bio: "Machine learning expert integrating cutting-edge AI solutions into practical business applications.",
      image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=800",
      social: { twitter: "#", linkedin: "#", github: "#" },
      tags: ["AI", "ML", "Python"]
    }
  ];

  return (
    <div className="bg-background min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="outline" className="mb-6 px-4 py-1 text-sm border-primary/20 bg-primary/5 text-primary">
              The Dream Team
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
              Meet the minds behind <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-secondary">
                the magic.
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              We are a diverse group of thinkers, creators, and builders united by a single passion: crafting exceptional digital experiences.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Team Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {team.map((member, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="group overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5">
                <CardContent className="p-0">
                  <div className="relative overflow-hidden aspect-[4/5]">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10 opacity-60 group-hover:opacity-40 transition-opacity duration-500" />
                    <img 
                      src={member.image} 
                      alt={member.name} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    
                    {/* Hover Overlay Content */}
                    <div className="absolute inset-0 z-20 p-6 flex flex-col justify-end translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                          {member.tags.map((tag, i) => (
                            <span key={i} className="text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white backdrop-blur-md px-2 py-1 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                        <h3 className="text-2xl font-bold text-white">{member.name}</h3>
                        <p className="text-primary-foreground/80 font-medium">{member.role}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {member.bio}
                    </p>
                    
                    <div className="flex items-center gap-4 pt-2 border-t border-border/50">
                      <a href={member.social.twitter} className="text-muted-foreground hover:text-primary transition-colors">
                        <Twitter className="h-4 w-4" />
                      </a>
                      <a href={member.social.linkedin} className="text-muted-foreground hover:text-primary transition-colors">
                        <Linkedin className="h-4 w-4" />
                      </a>
                      <a href={member.social.github} className="text-muted-foreground hover:text-primary transition-colors">
                        <Github className="h-4 w-4" />
                      </a>
                      <Button variant="ghost" size="sm" className="ml-auto text-xs gap-1 hover:text-primary">
                        Contact <ArrowUpRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Join Team CTA */}
      <section className="bg-muted/30 py-24 border-y border-border/50">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-8">
          <h2 className="text-3xl md:text-4xl font-bold">Want to join the team?</h2>
          <p className="text-lg text-muted-foreground">
            We're always looking for talented individuals to help us build the future of digital products.
            Check out our open positions.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="rounded-full px-8">View Open Roles</Button>
            <Button size="lg" variant="outline" className="rounded-full px-8">Culture & Perks</Button>
          </div>
        </div>
      </section>

      <TransformCTA />
    </div>
  );
}