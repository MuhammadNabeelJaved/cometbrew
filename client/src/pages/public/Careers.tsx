/**
 * Careers Page
 * Lists available job openings and provides company culture info.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Briefcase, MapPin, Clock, ArrowRight, Search, Heart, Globe, Zap } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '../../components/ui/card';
import { useJobs } from '../../hooks/useJobs';

export default function Careers() {
  const { jobs, loading } = useJobs();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedDept, setSelectedDept] = React.useState('All');

  const activeJobs = jobs.filter(job => job.status === 'active');
  
  const filteredJobs = activeJobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          job.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDept === 'All' || job.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  const departments = ['All', ...new Set(activeJobs.map(j => j.department))];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 -z-10" />
        <div className="absolute top-0 right-0 p-12 opacity-10 blur-3xl">
          <div className="w-96 h-96 bg-blue-500 rounded-full" />
        </div>
        
        <div className="max-w-7xl mx-auto text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium"
          >
            <Briefcase className="w-4 h-4" />
            <span>We're Hiring</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight"
          >
            Join the <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">Revolution</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            We're building the next generation of digital experiences. If you're passionate about innovation, design, and technology, we want to hear from you.
          </motion.p>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 border-y border-border/50 bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Heart, title: "Passion First", desc: "We love what we do and it shows in our work." },
              { icon: Globe, title: "Remote Friendly", desc: "Work from anywhere in the world." },
              { icon: Zap, title: "Fast Paced", desc: "We move quickly and embrace change." }
            ].map((value, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center space-y-4 p-6 rounded-2xl hover:bg-muted/50 transition-colors"
              >
                <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                  <value.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">{value.title}</h3>
                <p className="text-muted-foreground">{value.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Jobs Section */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <h2 className="text-3xl font-bold">Open Positions</h2>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search roles..." 
                className="pl-10 w-full sm:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select 
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 w-full sm:w-40"
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
            >
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">Loading positions...</div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-20 bg-muted/30 rounded-2xl border border-dashed border-border">
            <h3 className="text-xl font-semibold mb-2">No positions found</h3>
            <p className="text-muted-foreground">Try adjusting your search criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job, index) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer group flex flex-col">
                  <CardHeader>
                    <div className="flex justify-between items-start mb-4">
                      <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                        {job.department}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(job.postedDate).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold group-hover:text-primary transition-colors">{job.title}</h3>
                  </CardHeader>
                  <CardContent className="space-y-4 flex-grow">
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {job.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {job.type}
                      </div>
                    </div>
                    <p className="text-muted-foreground line-clamp-3">
                      {job.description}
                    </p>
                    {job.salaryRange && (
                       <p className="text-sm font-semibold text-foreground">
                         {job.salaryRange}
                       </p>
                    )}
                  </CardContent>
                  <CardFooter className="pt-4 border-t border-border/50 grid grid-cols-2 gap-3">
                    <Button asChild variant="outline" className="w-full">
                      <Link to={`/careers/${job.id}`}>
                        View Details
                      </Link>
                    </Button>
                    <Button asChild className="w-full group-hover:bg-primary group-hover:text-primary-foreground">
                      <Link to={`/careers/apply?role=${encodeURIComponent(job.title)}`}>
                        Apply Now
                        <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
        
        <div className="mt-20 p-8 rounded-3xl bg-gradient-to-br from-primary/20 via-purple-500/10 to-transparent border border-white/10 text-center">
          <h3 className="text-2xl font-bold mb-4">Don't see the right role?</h3>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            We're always looking for talented individuals. Send us your resume and we'll keep you on file for future openings.
          </p>
          <Button variant="outline" asChild>
            <Link to="/contact">Contact Us</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
