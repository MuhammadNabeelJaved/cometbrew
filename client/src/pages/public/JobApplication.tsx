/**
 * Job Application Page
 * Allows candidates to apply for positions at the agency.
 * Features:
 * - Comprehensive application form
 * - File upload simulation for Resume/CV
 * - Role selection
 * - Form validation and success state
 */
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Briefcase, 
  User, 
  Mail, 
  Phone, 
  Upload, 
  CheckCircle2, 
  Send, 
  FileText, 
  ChevronRight,
  Loader2
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../../components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { useJobs } from '../../hooks/useJobs';

export default function JobApplication() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedRole = searchParams.get('role');
  const [role, setRole] = useState(preselectedRole || '');
  const { jobs } = useJobs();

  // Filter for active jobs only
  const activeJobs = jobs.filter(job => job.status === 'active');

  useEffect(() => {
    if (preselectedRole) {
      setRole(preselectedRole);
    }
  }, [preselectedRole]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSubmitting(false);
    navigate('/careers/apply/success');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-20">
      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 mb-16">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Briefcase className="w-4 h-4" />
              <span>We're Hiring</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6">
              Join the <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">Extraordinary</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We're looking for creative minds and technical wizards to help us build the future of digital experiences.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Application Form */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="space-y-1 pb-8 border-b border-border/50">
              <CardTitle className="text-2xl">Job Application</CardTitle>
              <CardDescription>
                Please fill out the form below. All fields marked with * are required.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Personal Info Section */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    Personal Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input id="firstName" placeholder="Jane" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input id="lastName" placeholder="Doe" required />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                        <Input id="email" type="email" placeholder="jane@example.com" className="pl-10" required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                        <Input id="phone" type="tel" placeholder="+1 (555) 000-0000" className="pl-10" required />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-border/50" />

                {/* Role Section */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-primary" />
                    Role & Experience
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="role">Desired Role *</Label>
                      <Select required value={role} onValueChange={setRole}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a position" />
                        </SelectTrigger>
                        <SelectContent>
                          {activeJobs.map(job => (
                            <SelectItem key={job.id} value={job.title}>{job.title}</SelectItem>
                          ))}
                          <SelectItem value="other">Other / General Application</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="experience">Relevant Experience *</Label>
                      <Select required>
                        <SelectTrigger>
                          <SelectValue placeholder="Years of experience" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="entry">0-1 Years (Entry Level)</SelectItem>
                          <SelectItem value="junior">1-3 Years (Junior)</SelectItem>
                          <SelectItem value="mid">3-5 Years (Mid-Level)</SelectItem>
                          <SelectItem value="senior">5-8 Years (Senior)</SelectItem>
                          <SelectItem value="lead">8+ Years (Lead/Principal)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="portfolio">Portfolio URL</Label>
                    <Input id="portfolio" placeholder="https://dribbble.com/yourname or https://github.com/yourname" />
                    <p className="text-xs text-muted-foreground">Link to your GitHub, Dribbble, or personal website.</p>
                  </div>
                </div>

                <div className="h-px bg-border/50" />

                {/* Documents Section */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Documents
                  </h3>

                  <div className="space-y-2">
                    <Label htmlFor="resume">Resume/CV *</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-6 hover:bg-muted/50 transition-colors text-center cursor-pointer relative">
                      <input 
                        type="file" 
                        id="resume" 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileChange}
                        required
                      />
                      <div className="flex flex-col items-center gap-2 pointer-events-none">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Upload className="w-5 h-5 text-primary" />
                        </div>
                        {fileName ? (
                          <div className="text-sm font-medium text-primary break-all">
                            {fileName}
                          </div>
                        ) : (
                          <>
                            <span className="text-sm font-medium">Click to upload or drag and drop</span>
                            <span className="text-xs text-muted-foreground">PDF, DOC, DOCX (Max 10MB)</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="coverLetter">Cover Letter / Personal Statement</Label>
                    <Textarea 
                      id="coverLetter" 
                      placeholder="Tell us why you'd be a great fit for our team..." 
                      className="min-h-[150px]"
                    />
                  </div>
                </div>

                <Button type="submit" size="lg" className="w-full h-12 text-lg" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Submitting Application...
                    </>
                  ) : (
                    <>
                      Submit Application
                      <Send className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
                
                <p className="text-xs text-center text-muted-foreground">
                  By submitting this form, you agree to our <Link to="/careers/privacy" target="_blank" className="underline hover:text-foreground">Job Privacy Policy</Link> and consent to the processing of your personal data.
                </p>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
