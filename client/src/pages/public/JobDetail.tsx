/**
 * Job Detail Page
 * Displays full details for a specific job position and allows application.
 */
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Briefcase, 
  MapPin, 
  Clock, 
  ArrowLeft, 
  CheckCircle2, 
  DollarSign, 
  Calendar,
  Share2,
  Copy,
  Linkedin,
  Twitter,
  Facebook,
  Building,
  Users,
  Award,
  Zap,
  Coffee,
  Globe
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { ShareWidget } from '../../components/ShareWidget';
import { useJobs, Job } from '../../hooks/useJobs';
import { toast } from 'sonner';

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const { getJob } = useJobs();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    if (id) {
      const foundJob = getJob(id);
      if (foundJob) {
        setJob(foundJob);
      }
      setLoading(false);
    }
  }, [id, getJob]);

  const handleShare = () => {
    setShareOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-background pt-32 px-4 flex flex-col items-center justify-center text-center">
        <h1 className="text-2xl font-bold mb-4">Job Post Not Found</h1>
        <p className="text-muted-foreground mb-8">The position you are looking for might have been filled or removed.</p>
        <Link to="/careers">
          <Button>Back to Careers</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-20">
      {/* Header / Hero */}
      <div className="relative bg-muted/30 border-b border-border/50 pb-16 pt-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link 
            to="/careers" 
            className="inline-flex items-center text-muted-foreground hover:text-primary mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to all jobs
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6"
          >
            <div className="space-y-6 max-w-3xl">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 border-transparent text-sm py-1 px-3">
                  {job.department}
                </Badge>
                {job.experienceLevel && (
                  <Badge variant="outline" className="text-muted-foreground border-border bg-background/50 text-sm py-1 px-3">
                    {job.experienceLevel}
                  </Badge>
                )}
                <Badge variant="outline" className={`text-sm py-1 px-3
                  ${job.status === 'active' ? 'border-green-500/30 text-green-600 bg-green-500/5' : ''}
                  ${job.status === 'closed' ? 'border-red-500/30 text-red-600 bg-red-500/5' : ''}
                  ${job.status === 'draft' ? 'border-yellow-500/30 text-yellow-600 bg-yellow-500/5' : ''}
                `}>
                  {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                </Badge>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-tight">
                {job.title}
              </h1>

              <div className="flex flex-wrap gap-y-4 gap-x-8 text-muted-foreground text-sm md:text-base">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary/70" />
                  <span>{job.location} ({job.workMode || 'Remote'})</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary/70" />
                  <span>{job.type}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-primary/70" />
                  <span>{job.salaryRange || 'Competitive'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary/70" />
                  <span>Posted {new Date(job.createdAt || Date.now()).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <ShareWidget 
                  title={`Check out this ${job.title} role at Nabeel Agency`}
                  description={`I found this great job opportunity for a ${job.title} position.`}
                  open={shareOpen}
                  onOpenChange={setShareOpen}
                  trigger={
                    <Button variant="outline" size="lg" className="gap-2 w-full sm:w-auto">
                      <Share2 className="w-4 h-4" />
                      Share
                    </Button>
                  }
                />
                <Link to={`/careers/apply?role=${encodeURIComponent(job.title)}`} className="w-full sm:w-auto">
                    <Button size="lg" className="w-full sm:w-auto h-12 px-8 text-base shadow-lg shadow-primary/20">
                    Apply Now
                    </Button>
                </Link>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-10">
            {/* Description */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                    <Briefcase className="w-6 h-6 text-primary" />
                </div>
                About the Role
              </h2>
              <div className="prose prose-neutral dark:prose-invert max-w-none text-muted-foreground leading-relaxed text-lg">
                <p>{job.description}</p>
              </div>
            </motion.section>

            {/* Responsibilities */}
            {job.responsibilities && job.responsibilities.length > 0 && (
                <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                >
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Zap className="w-6 h-6 text-primary" />
                    </div>
                    Key Responsibilities
                </h2>
                <div className="bg-card border border-border/50 rounded-2xl p-8 shadow-sm">
                    <ul className="space-y-4">
                        {job.responsibilities.map((resp, index) => (
                        <li key={index} className="flex items-start gap-4">
                            <div className="mt-1.5 min-w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                            <span className="text-muted-foreground leading-relaxed">{resp}</span>
                        </li>
                        ))}
                    </ul>
                </div>
                </motion.section>
            )}

            {/* Requirements */}
            {job.requirements && job.requirements.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Award className="w-6 h-6 text-primary" />
                    </div>
                    Requirements
                </h2>
                <div className="bg-card border border-border/50 rounded-2xl p-8 shadow-sm">
                    <ul className="space-y-4">
                    {job.requirements.map((req, index) => (
                        <li key={index} className="flex items-start gap-4">
                        <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground leading-relaxed">{req}</span>
                        </li>
                    ))}
                    </ul>
                </div>
              </motion.section>
            )}

            {/* Benefits */}
            {job.benefits && job.benefits.length > 0 && (
                <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                >
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Coffee className="w-6 h-6 text-primary" />
                    </div>
                    Benefits & Perks
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {job.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-3 p-4 bg-muted/30 rounded-xl border border-border/50">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <span className="text-sm font-medium">{benefit}</span>
                    </div>
                    ))}
                </div>
                </motion.section>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="sticky top-24 space-y-6"
            >
              {/* Apply Card */}
              <Card className="border-primary/20 bg-primary/5 shadow-md overflow-hidden relative">
                <div className="absolute top-0 right-0 p-12 opacity-5 blur-xl">
                    <div className="w-32 h-32 bg-primary rounded-full" />
                </div>
                <CardContent className="p-8 space-y-6 relative">
                  <div className="space-y-2">
                    <h3 className="font-bold text-xl">Interested in this role?</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      If you think you're a good match, we'd love to hear from you. Take the next step in your career.
                    </p>
                  </div>
                  
                  <Link to={`/careers/apply?role=${encodeURIComponent(job.title)}`}>
                    <Button className="w-full h-12 text-base shadow-lg shadow-primary/20" size="lg">
                      Apply Now
                    </Button>
                  </Link>

                  <div className="pt-6 border-t border-border/50">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Share this role</span>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-background/80" onClick={() => setShareOpen(true)}>
                                <Copy className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-background/80" onClick={() => setShareOpen(true)}>
                                <Linkedin className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-background/80" onClick={() => setShareOpen(true)}>
                                <Twitter className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Job Summary Card */}
              <Card className="border-border/50 shadow-sm">
                <CardHeader className="pb-4 border-b border-border/50">
                    <CardTitle className="text-lg">Job Overview</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <Building className="w-5 h-5 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="text-sm font-medium">Department</p>
                                <p className="text-sm text-muted-foreground">{job.department}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Users className="w-5 h-5 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="text-sm font-medium">Level</p>
                                <p className="text-sm text-muted-foreground">{job.experienceLevel || 'Not specified'}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Globe className="w-5 h-5 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="text-sm font-medium">Work Mode</p>
                                <p className="text-sm text-muted-foreground">{job.workMode || 'Remote'}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <DollarSign className="w-5 h-5 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="text-sm font-medium">Salary</p>
                                <p className="text-sm text-muted-foreground">{job.salaryRange || 'Competitive'}</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
              </Card>

              {/* Company Info */}
              <div className="p-6 bg-muted/30 rounded-2xl border border-border/50">
                <h4 className="font-semibold mb-2">About Our Culture</h4>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    We believe in autonomy, mastery, and purpose. Join a team where your voice matches your impact.
                </p>
                <Link to="/about" className="text-sm font-medium text-primary hover:underline">
                    Learn more about us →
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
