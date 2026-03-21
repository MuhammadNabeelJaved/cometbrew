/**
 * User Projects Page
 * List of all user projects with status and payment details.
 */
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  CreditCard,
  FileText,
  Star,
  Plus,
  Upload,
  X,
  File,
  Image as ImageIcon
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';

export default function UserProjects() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const location = useLocation();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (location.state?.openNewProject) {
        setShowCreateModal(true);
        // Clear state to prevent reopening on refresh (optional, but good practice)
        window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Mock Projects Data
  const projects = [
    { 
      id: 1, 
      name: 'E-commerce Website', 
      type: 'Web Development', 
      status: 'In Progress', 
      amount: '$2,500', 
      paid: '$1,250',
      deadline: 'Nov 15, 2023',
      progress: 65,
      description: 'Full stack e-commerce solution with Stripe integration and admin dashboard.',
      tasks: [
        { name: 'Design Phase', completed: true },
        { name: 'Frontend Development', completed: true },
        { name: 'Backend Integration', completed: false },
        { name: 'Testing', completed: false },
      ]
    },
    { 
      id: 2, 
      name: 'Mobile App Design', 
      type: 'UI/UX Design', 
      status: 'Pending Review', 
      amount: '$1,800', 
      paid: '$1,800',
      deadline: 'Oct 30, 2023',
      progress: 90,
      description: 'iOS and Android app design for a fitness tracking application.',
      tasks: [
        { name: 'Wireframing', completed: true },
        { name: 'UI Design', completed: true },
        { name: 'Prototyping', completed: true },
        { name: 'Client Feedback', completed: false },
      ]
    },
    { 
      id: 3, 
      name: 'Logo Redesign', 
      type: 'Branding', 
      status: 'Completed', 
      amount: '$500', 
      paid: '$500',
      deadline: 'Sep 15, 2023',
      progress: 100,
      description: 'Modern minimalist logo redesign for corporate identity.',
      tasks: [
        { name: 'Concept Sketches', completed: true },
        { name: 'Vectorization', completed: true },
        { name: 'Final Delivery', completed: true },
      ]
    },
  ];

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Completed': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'In Progress': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'Pending Review': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      default: return 'bg-secondary text-muted-foreground';
    }
  };

  const filteredProjects = projects.filter(p => 
    (filterStatus === 'All' || p.status === filterStatus) &&
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Projects</h1>
          <p className="text-muted-foreground">Manage and track your ongoing projects.</p>
        </div>
        <Button className="gap-2" onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4" /> Start New Project
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center bg-card p-4 rounded-xl border border-border/50">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search projects..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-background border border-border focus:border-primary focus:ring-0 outline-none transition-all"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          {['All', 'In Progress', 'Pending Review', 'Completed'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filterStatus === status 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredProjects.map((project, i) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="h-full hover:shadow-lg transition-shadow border-border/50">
              <div className="p-6 space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <Badge variant="outline" className="mb-2">{project.type}</Badge>
                    <h3 className="font-bold text-xl">{project.name}</h3>
                  </div>
                  <div className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(project.status)}`}>
                    {project.status}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{project.progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-secondary/30 p-3 rounded-lg">
                    <p className="text-muted-foreground mb-1">Total Cost</p>
                    <p className="font-bold">{project.amount}</p>
                  </div>
                  <div className="bg-secondary/30 p-3 rounded-lg">
                    <p className="text-muted-foreground mb-1">Paid</p>
                    <p className={`font-bold ${project.paid === project.amount ? 'text-green-500' : 'text-amber-500'}`}>
                      {project.paid}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Deadline: {project.deadline}</span>
                </div>

                <div className="pt-4 border-t border-border/50 flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setSelectedProject(project)}>
                    View Details
                  </Button>
                  {project.status === 'Completed' ? (
                    <Button variant="secondary" className="flex-1 gap-2" onClick={() => {
                        setSelectedProject(project);
                        setShowReviewModal(true);
                    }}>
                        <Star className="h-4 w-4" /> Review
                    </Button>
                  ) : (
                    <Button className="flex-1 gap-2">
                        <CreditCard className="h-4 w-4" /> Make Payment
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Project Details Modal */}
      <Dialog open={!!selectedProject && !showReviewModal} onOpenChange={(open) => !open && setSelectedProject(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedProject?.name}</DialogTitle>
            <DialogDescription>Project ID: #{selectedProject?.id}1023</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div>
              <h4 className="font-semibold mb-2">Description</h4>
              <p className="text-muted-foreground">{selectedProject?.description}</p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Milestones</h4>
              <div className="space-y-2">
                {selectedProject?.tasks.map((task: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/20">
                    <div className={`h-5 w-5 rounded-full flex items-center justify-center border ${
                      task.completed ? 'bg-green-500 border-green-500 text-white' : 'border-muted-foreground'
                    }`}>
                      {task.completed && <CheckCircle className="h-3 w-3" />}
                    </div>
                    <span className={task.completed ? 'line-through text-muted-foreground' : ''}>{task.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 flex justify-between items-center">
                <div>
                    <p className="text-sm text-muted-foreground">Outstanding Balance</p>
                    <p className="text-xl font-bold text-primary">$1,250.00</p>
                </div>
                <Button>Pay Now</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Review Modal */}
       <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Write a Review</DialogTitle>
            <DialogDescription>How was your experience with "{selectedProject?.name}"?</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex justify-center gap-2 py-4">
                {[1, 2, 3, 4, 5].map(star => (
                    <Star key={star} className="h-8 w-8 text-amber-400 fill-amber-400 cursor-pointer hover:scale-110 transition-transform" />
                ))}
            </div>
            <textarea 
                className="w-full p-3 rounded-lg bg-background border border-input min-h-[100px] focus:ring-1 focus:ring-primary outline-none"
                placeholder="Share your feedback..."
            ></textarea>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowReviewModal(false)}>Cancel</Button>
            <Button onClick={() => setShowReviewModal(false)}>Submit Review</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Project Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Start New Project</DialogTitle>
            <DialogDescription>
              Tell us what you want to build. We'll review your request and get back to you within 24 hours.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Project Name</Label>
                <Input id="name" placeholder="e.g. Corporate Website Redesign" />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="type">Project Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="web">Web Development</SelectItem>
                    <SelectItem value="mobile">Mobile App</SelectItem>
                    <SelectItem value="design">UI/UX Design</SelectItem>
                    <SelectItem value="branding">Branding</SelectItem>
                    <SelectItem value="marketing">Digital Marketing</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="budget">Budget Range</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your budget" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">$500 - $1,000</SelectItem>
                    <SelectItem value="medium">$1,000 - $5,000</SelectItem>
                    <SelectItem value="large">$5,000 - $10,000</SelectItem>
                    <SelectItem value="enterprise">$10,000+</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Project Details</Label>
                <Textarea 
                  id="description" 
                  placeholder="Describe your project requirements, goals, and any specific features you need..." 
                  className="min-h-[120px]"
                />
              </div>

              <div className="grid gap-2">
                <Label>Attachments</Label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-input rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-all"
                >
                  <div className="p-3 bg-muted rounded-full mb-2">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium">Click to upload files</p>
                  <p className="text-xs text-muted-foreground mt-1">Images, PDF, Figma, etc.</p>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    multiple 
                    onChange={handleFileChange}
                  />
                </div>

                {files.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg border border-border/50">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                            {file.type.includes('image') ? (
                              <ImageIcon className="h-4 w-4 text-primary" />
                            ) : (
                              <File className="h-4 w-4 text-primary" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => removeFile(index)}
                          className="p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button onClick={() => {
                setShowCreateModal(false);
                setFiles([]);
                // Add toast notification logic here if needed
            }}>Submit Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}