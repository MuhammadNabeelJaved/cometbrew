/**
 * Projects Admin Page
 * Management interface for portfolio projects
 * - Project listing with filtering
 * - Add/Edit Project Modal with comprehensive fields:
 *   - Description, Role, Duration
 *   - Tech Stack selection
 *   - Multiple image upload with preview
 *   - Client feedback selection
 */
import React, { useState, useRef } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  X,
  Upload,
  Image as ImageIcon,
  Calendar,
  User,
  FileText,
  Layers,
  MessageSquare,
  Check,
  Code2,
  Download,
  File
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';

// --- Types & Interfaces ---

interface Project {
  id: number;
  title: string;
  category: string;
  client: string;
  date: string;
  status: 'Published' | 'Draft' | 'Archived';
  images: string[];
  description: string;
  role: string;
  duration: string;
  techStack: string[];
  clientReviewId?: number;
  attachments?: { name: string; url: string; type: string; size: string }[];
}

interface ClientReview {
  id: number;
  clientName: string;
  company: string;
  rating: number;
  comment: string;
  avatar: string;
}

interface TechOption {
  id: string;
  name: string;
  logo: string; // Using placeholder or generic for now
}

// --- Mock Data ---

const AVAILABLE_TECH_STACKS: TechOption[] = [
  { id: 'react', name: 'React', logo: '⚛️' },
  { id: 'nextjs', name: 'Next.js', logo: '▲' },
  { id: 'typescript', name: 'TypeScript', logo: 'TS' },
  { id: 'node', name: 'Node.js', logo: '🟢' },
  { id: 'python', name: 'Python', logo: '🐍' },
  { id: 'aws', name: 'AWS', logo: '☁️' },
  { id: 'docker', name: 'Docker', logo: '🐳' },
  { id: 'figma', name: 'Figma', logo: '🎨' },
  { id: 'tailwind', name: 'Tailwind', logo: '🌊' },
  { id: 'mongodb', name: 'MongoDB', logo: '🍃' },
];

const MOCK_REVIEWS: ClientReview[] = [
  {
    id: 1,
    clientName: 'Sarah Johnson',
    company: 'FinanceFlow Inc.',
    rating: 5,
    comment: 'Exceptional work on our dashboard. The attention to detail and performance optimization was outstanding.',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100'
  },
  {
    id: 2,
    clientName: 'Michael Chen',
    company: 'Grand Horizon',
    rating: 5,
    comment: 'Transformed our online presence completely. Booking rates increased by 40% after launch.',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100'
  },
  {
    id: 3,
    clientName: 'Emily Davis',
    company: 'Vitality Systems',
    rating: 4,
    comment: 'Great mobile app development. Delivered on time and met all our core requirements.',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=100'
  }
];

const initialProjects: Project[] = [
  {
    id: 1,
    title: 'Fintech Dashboard',
    category: 'Web App',
    client: 'FinanceFlow Inc.',
    date: '2023-10-15',
    status: 'Published',
    images: ['https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=300'],
    description: 'A comprehensive financial analytics dashboard for real-time market data visualization and portfolio management.',
    role: 'Lead Frontend Developer',
    duration: '4 months',
    techStack: ['react', 'typescript', 'tailwind'],
    clientReviewId: 1,
    attachments: [
      { name: 'Project_Brief.pdf', url: '#', type: 'application/pdf', size: '2.4 MB' },
      { name: 'Design_System.fig', url: '#', type: 'application/octet-stream', size: '15 MB' },
      { name: 'Wireframes.png', url: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?auto=format&fit=crop&q=80&w=300', type: 'image/png', size: '4.2 MB' }
    ]
  },
  {
    id: 2,
    title: 'Luxury Hotel Website',
    category: 'Website',
    client: 'Grand Horizon',
    date: '2023-09-22',
    status: 'Published',
    images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=300'],
    description: ' immersive booking experience for a 5-star luxury resort chain with virtual tours and seamless reservation system.',
    role: 'Full Stack Developer',
    duration: '3 months',
    techStack: ['nextjs', 'node', 'mongodb'],
    clientReviewId: 2
  },
  {
    id: 3,
    title: 'Health Tracker App',
    category: 'Mobile App',
    client: 'Vitality Systems',
    date: '2023-11-05',
    status: 'Draft',
    images: ['https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=300'],
    description: 'Cross-platform mobile application for tracking daily fitness activities, nutrition, and health metrics.',
    role: 'Mobile Developer',
    duration: '6 months',
    techStack: ['react', 'aws'],
    clientReviewId: 3
  },
  {
    id: 4,
    title: 'E-commerce Redesign',
    category: 'E-commerce',
    client: 'Shopify Store',
    date: '2023-08-10',
    status: 'Archived',
    images: ['https://images.unsplash.com/photo-1523206485973-27457d363c18?auto=format&fit=crop&q=80&w=300'],
    description: 'Complete overhaul of an existing e-commerce platform to improve conversion rates and user experience.',
    role: 'UI/UX Designer & Developer',
    duration: '2 months',
    techStack: ['figma', 'react', 'tailwind']
  }
];

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [viewProject, setViewProject] = useState<Project | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Omit<Project, 'id' | 'date'>>({
    title: '',
    category: 'Web App',
    client: '',
    status: 'Draft',
    description: '',
    role: '',
    duration: '',
    techStack: [],
    images: [],
    clientReviewId: undefined
  });

  const [assignedMember, setAssignedMember] = useState<string>('');
  const teamMembers = ['Sarah Jenkins', 'David Chen', 'Emily Rodriguez', 'Michael Chang'];

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenModal = (project?: Project) => {
    if (project) {
      setEditingProject(project);
      setFormData({
        title: project.title,
        category: project.category,
        client: project.client,
        status: project.status,
        description: project.description,
        role: project.role,
        duration: project.duration,
        techStack: project.techStack,
        images: project.images,
        clientReviewId: project.clientReviewId
      });
    } else {
      setEditingProject(null);
      setFormData({
        title: '',
        category: 'Web App',
        client: '',
        status: 'Draft',
        description: '',
        role: 'End-to-End Development',
        duration: '',
        techStack: [],
        images: [],
        clientReviewId: undefined
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProject(null);
  };

  const handleViewProject = (project: Project) => {
    setViewProject(project);
    setIsViewModalOpen(true);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setViewProject(null);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this project?')) {
      setProjects(projects.filter(p => p.id !== id));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Mock upload by creating object URLs
      const newImages = Array.from(e.target.files).map(file => URL.createObjectURL(file));
      setFormData(prev => ({ ...prev, images: [...prev.images, ...newImages] }));
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const toggleTechStack = (techId: string) => {
    setFormData(prev => {
      const exists = prev.techStack.includes(techId);
      if (exists) {
        return { ...prev, techStack: prev.techStack.filter(id => id !== techId) };
      } else {
        return { ...prev, techStack: [...prev.techStack, techId] };
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingProject) {
      // Update existing
      setProjects(projects.map(p => 
        p.id === editingProject.id 
          ? { ...p, ...formData, id: p.id, date: p.date } 
          : p
      ));
    } else {
      // Create new
      const newProject: Project = {
        id: Date.now(),
        ...formData,
        date: new Date().toISOString().split('T')[0],
      };
      setProjects([newProject, ...projects]);
    }
    handleCloseModal();
  };

  const filteredProjects = projects.filter(project => 
    project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.client.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Projects</h2>
          <p className="text-muted-foreground">Manage your portfolio and client projects.</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="gap-2">
          <Plus className="h-4 w-4" /> Add Project
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-9 pl-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" className="gap-2 w-full sm:w-auto">
              <Filter className="h-4 w-4" /> Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Projects Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Project</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Tech Stack</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-16 rounded overflow-hidden bg-muted shrink-0 relative">
                        {project.images.length > 0 ? (
                          <img src={project.images[0]} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-muted text-muted-foreground">
                            <ImageIcon className="h-4 w-4" />
                          </div>
                        )}
                        {project.images.length > 1 && (
                          <div className="absolute bottom-0 right-0 bg-black/60 text-white text-[10px] px-1">
                            +{project.images.length - 1}
                          </div>
                        )}
                      </div>
                      <span className="font-semibold">{project.title}</span>
                    </div>
                  </TableCell>
                  <TableCell>{project.category}</TableCell>
                  <TableCell>{project.client}</TableCell>
                  <TableCell>
                    <div className="flex -space-x-2 overflow-hidden">
                      {project.techStack.slice(0, 3).map(techId => {
                        const tech = AVAILABLE_TECH_STACKS.find(t => t.id === techId);
                        return tech ? (
                          <div key={techId} className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-background border ring-2 ring-background text-[10px]" title={tech.name}>
                            {tech.logo}
                          </div>
                        ) : null;
                      })}
                      {project.techStack.length > 3 && (
                        <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-muted border ring-2 ring-background text-[10px] font-medium">
                          +{project.techStack.length - 3}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        project.status === 'Published' ? 'success' : 
                        project.status === 'Draft' ? 'warning' : 
                        'secondary'
                      }
                    >
                      {project.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button onClick={() => handleViewProject(project)} variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button onClick={() => handleOpenModal(project)} variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-blue-500">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button onClick={() => handleDelete(project.id)} variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredProjects.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No projects found matching your search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-3xl border bg-card p-0 shadow-lg duration-200 rounded-xl z-10 max-h-[90vh] flex flex-col overflow-hidden"
            >
              <div className="p-6 pb-2 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold leading-none tracking-tight">
                    {editingProject ? 'Edit Project' : 'Add New Project'}
                  </h2>
                  <Button variant="ghost" size="icon" onClick={handleCloseModal} className="h-6 w-6">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {editingProject ? 'Make changes to your project details.' : 'Fill in the details to create a new project.'}
                </p>
              </div>

              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                <form id="project-form" onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold flex items-center gap-2 text-primary">
                      <FileText className="h-4 w-4" /> Basic Information
                    </h3>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <label htmlFor="title" className="text-sm font-medium">Project Title</label>
                        <input
                          id="title"
                          value={formData.title}
                          onChange={(e) => setFormData({...formData, title: e.target.value})}
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          required
                          placeholder="e.g. Fintech Dashboard"
                        />
                      </div>
                      <div className="grid gap-2">
                        <label htmlFor="client" className="text-sm font-medium">Client Name</label>
                        <input
                          id="client"
                          value={formData.client}
                          onChange={(e) => setFormData({...formData, client: e.target.value})}
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          placeholder="e.g. Acme Corp"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="grid gap-2">
                        <label htmlFor="category" className="text-sm font-medium">Category</label>
                        <select
                          id="category"
                          value={formData.category}
                          onChange={(e) => setFormData({...formData, category: e.target.value})}
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          <option value="Web App">Web App</option>
                          <option value="Website">Website</option>
                          <option value="Mobile App">Mobile App</option>
                          <option value="E-commerce">E-commerce</option>
                          <option value="Design">Design</option>
                        </select>
                      </div>
                      <div className="grid gap-2">
                        <label htmlFor="status" className="text-sm font-medium">Status</label>
                        <select
                          id="status"
                          value={formData.status}
                          onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          <option value="Draft">Draft</option>
                          <option value="Published">Published</option>
                          <option value="Archived">Archived</option>
                        </select>
                      </div>
                       <div className="grid gap-2">
                        <label htmlFor="duration" className="text-sm font-medium">Duration</label>
                        <div className="relative">
                          <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <input
                            id="duration"
                            value={formData.duration}
                            onChange={(e) => setFormData({...formData, duration: e.target.value})}
                            className="flex h-9 w-full rounded-md border border-input bg-transparent pl-9 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            placeholder="e.g. 3 months"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <label htmlFor="role" className="text-sm font-medium">Your Role</label>
                      <div className="relative">
                        <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <input
                          id="role"
                          value={formData.role}
                          onChange={(e) => setFormData({...formData, role: e.target.value})}
                          className="flex h-9 w-full rounded-md border border-input bg-transparent pl-9 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          placeholder="e.g. End-to-End Development"
                        />
                      </div>
                    </div>

                    <div className="grid gap-2">
                       <label className="text-sm font-medium">Assign to Team Member</label>
                       <select 
                         className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                         value={assignedMember}
                         onChange={(e) => setAssignedMember(e.target.value)}
                       >
                         <option value="">-- Unassigned --</option>
                         {teamMembers.map(member => (
                           <option key={member} value={member}>{member}</option>
                         ))}
                       </select>
                       <p className="text-xs text-muted-foreground">Select a lead for this project.</p>
                    </div>

                    <div className="grid gap-2">
                       <label className="text-sm font-medium">Assign to Team Member</label>
                       <select 
                         className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                         value={assignedMember}
                         onChange={(e) => setAssignedMember(e.target.value)}
                       >
                         <option value="">-- Unassigned --</option>
                         {teamMembers.map(member => (
                           <option key={member} value={member}>{member}</option>
                         ))}
                       </select>
                       <p className="text-xs text-muted-foreground">Select a lead for this project.</p>
                    </div>

                    <div className="grid gap-2">
                      <label htmlFor="description" className="text-sm font-medium">Project Description</label>
                      <textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        placeholder="Describe the project scope, challenges, and solutions..."
                      />
                    </div>
                  </div>

                  {/* Tech Stack */}
                  <div className="space-y-4 pt-2 border-t">
                    <h3 className="text-sm font-semibold flex items-center gap-2 text-primary">
                      <Code2 className="h-4 w-4" /> Tech Stack
                    </h3>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium text-muted-foreground">Select Technologies Used</label>
                      <div className="flex flex-wrap gap-2">
                        {AVAILABLE_TECH_STACKS.map(tech => (
                          <button
                            key={tech.id}
                            type="button"
                            onClick={() => toggleTechStack(tech.id)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border transition-all ${
                              formData.techStack.includes(tech.id)
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-background hover:bg-muted border-input'
                            }`}
                          >
                            <span>{tech.logo}</span>
                            <span>{tech.name}</span>
                            {formData.techStack.includes(tech.id) && <Check className="h-3 w-3 ml-1" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Images */}
                  <div className="space-y-4 pt-2 border-t">
                    <h3 className="text-sm font-semibold flex items-center gap-2 text-primary">
                      <ImageIcon className="h-4 w-4" /> Project Gallery
                    </h3>
                    <div className="grid gap-4">
                       <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-input rounded-md p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-all"
                      >
                        <div className="p-3 bg-muted rounded-full mb-2">
                          <Upload className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">Click to upload multiple images</p>
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          className="hidden" 
                          multiple 
                          accept="image/*"
                          onChange={handleImageUpload}
                        />
                      </div>

                      {formData.images.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          {formData.images.map((img, index) => (
                            <div key={index} className="group relative aspect-video rounded-md overflow-hidden border bg-muted">
                              <img src={img} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Client Feedback */}
                  <div className="space-y-4 pt-2 border-t">
                    <h3 className="text-sm font-semibold flex items-center gap-2 text-primary">
                      <MessageSquare className="h-4 w-4" /> Client Feedback
                    </h3>
                    <div className="grid gap-2">
                      <label htmlFor="clientReview" className="text-sm font-medium">Select Related Client Review</label>
                      <select
                        id="clientReview"
                        value={formData.clientReviewId || ''}
                        onChange={(e) => setFormData({...formData, clientReviewId: e.target.value ? Number(e.target.value) : undefined})}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        <option value="">-- No Review Selected --</option>
                        {MOCK_REVIEWS.map(review => (
                          <option key={review.id} value={review.id}>
                            {review.clientName} ({review.company}) - {review.rating} stars
                          </option>
                        ))}
                      </select>
                      
                      {formData.clientReviewId && (
                        <div className="mt-2 p-3 bg-muted/50 rounded-md text-sm border">
                          {(() => {
                            const review = MOCK_REVIEWS.find(r => r.id === formData.clientReviewId);
                            return review ? (
                              <div className="flex gap-3">
                                <div className="shrink-0">
                                  <img src={review.avatar} alt={review.clientName} className="h-8 w-8 rounded-full object-cover" />
                                </div>
                                <div>
                                  <p className="font-medium">{review.clientName}</p>
                                  <p className="text-muted-foreground italic">"{review.comment}"</p>
                                </div>
                              </div>
                            ) : null;
                          })()}
                        </div>
                      )}
                    </div>
                  </div>

                </form>
              </div>

              <div className="p-6 pt-2 border-t bg-card flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleCloseModal}>Cancel</Button>
                <Button type="submit" form="project-form">{editingProject ? 'Save Changes' : 'Create Project'}</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View Details Modal */}
      <AnimatePresence>
        {isViewModalOpen && viewProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseViewModal}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl border bg-card p-0 shadow-lg duration-200 rounded-xl z-10 max-h-[90vh] flex flex-col overflow-hidden"
            >
              {/* Header with Image Background */}
              <div className="relative h-48 sm:h-64 bg-muted">
                {viewProject.images.length > 0 ? (
                  <img src={viewProject.images[0]} alt={viewProject.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted/50">
                    <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
                <button 
                  onClick={handleCloseViewModal}
                  className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors backdrop-blur-sm"
                >
                  <X className="h-5 w-5" />
                </button>
                <div className="absolute bottom-4 left-6 right-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={viewProject.status === 'Published' ? 'success' : 'secondary'} className="shadow-sm">
                      {viewProject.status}
                    </Badge>
                    <Badge variant="outline" className="bg-background/50 backdrop-blur-sm border-white/20 text-white">
                      {viewProject.category}
                    </Badge>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{viewProject.title}</h2>
                </div>
              </div>

              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-8">
                {/* Main Info Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pb-6 border-b border-border/50">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Client</p>
                    <p className="font-medium">{viewProject.client}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Role</p>
                    <p className="font-medium">{viewProject.role}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Duration</p>
                    <p className="font-medium">{viewProject.duration}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Date</p>
                    <p className="font-medium">{viewProject.date}</p>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" /> About Project
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {viewProject.description || "No description provided."}
                  </p>
                </div>

                {/* Attachments */}
                {viewProject.attachments && viewProject.attachments.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                      <File className="h-4 w-4" /> Attached Files
                    </h3>
                    <div className="space-y-2">
                      {viewProject.attachments.map((file, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group">
                           <div className="flex items-center gap-3 overflow-hidden">
                              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                                {file.type.includes('image') ? <ImageIcon className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-sm truncate">{file.name}</p>
                                <p className="text-xs text-muted-foreground">{file.size} • {file.type.split('/')[1]?.toUpperCase() || 'FILE'}</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-2">
                              {file.type.includes('image') && (
                                <Button size="sm" variant="ghost" onClick={() => setPreviewImage(file.url)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                              )}
                              <Button size="sm" variant="outline" className="gap-2">
                                <Download className="h-4 w-4" /> <span className="hidden sm:inline">Download</span>
                              </Button>
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tech Stack */}
                <div>
                  <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                    <Code2 className="h-4 w-4" /> Technologies
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {viewProject.techStack.length > 0 ? (
                      viewProject.techStack.map(techId => {
                        const tech = AVAILABLE_TECH_STACKS.find(t => t.id === techId);
                        return tech ? (
                          <div key={techId} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 border border-border text-sm">
                            <span>{tech.logo}</span>
                            <span>{tech.name}</span>
                          </div>
                        ) : null;
                      })
                    ) : (
                      <span className="text-sm text-muted-foreground">No technologies selected.</span>
                    )}
                  </div>
                </div>

                {/* Gallery */}
                {viewProject.images.length > 1 && (
                  <div>
                    <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" /> Gallery
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      {viewProject.images.slice(1).map((img, i) => (
                        <div key={i} className="aspect-video rounded-lg overflow-hidden border bg-muted group">
                          <img src={img} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="p-4 bg-muted/30 border-t flex justify-between items-center">
                <Button variant="ghost" onClick={handleCloseViewModal}>
                  Close
                </Button>
                <Button 
                  onClick={() => window.open(`/portfolio/${viewProject.id}`, '_blank')} 
                  className="gap-2"
                >
                  View in New Tab <Eye className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Image Preview Modal */}
      <AnimatePresence>
        {previewImage && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm" onClick={() => setPreviewImage(null)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-[90vw] max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setPreviewImage(null)}
                className="absolute -top-4 -right-4 bg-white text-black rounded-full p-2 hover:bg-gray-200 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
              <img src={previewImage} alt="Preview" className="w-full h-full object-contain rounded-lg shadow-2xl" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}