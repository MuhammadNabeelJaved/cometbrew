/**
 * Portfolio Projects Admin Page
 * Full CRUD for portfolio projects with real API integration.
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Search, Edit, Trash2, Eye, EyeOff, Globe, Lock, Loader2, X, Save, Image as ImageIcon, CheckSquare, Square, Star, Upload, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { toast } from 'sonner';
import { adminProjectsApi } from '../../api/adminProjects.api';
import { useAuth } from '../../contexts/AuthContext';
import ConfirmDeleteDialog from '../../components/ui/ConfirmDeleteDialog';
import { useBulkSelect } from '../../hooks/useBulkSelect';
import { useDataRealtime } from '../../hooks/useDataRealtime';
import { BulkActionBar } from '../../components/BulkActionBar';
import { techName } from '../../lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

const CATEGORIES = ['Web App', 'Mobile App', 'Desktop App', 'API Development', 'UI/UX Design', 'Other'] as const;
const STATUSES = ['Draft', 'In Progress', 'Review', 'Completed', 'On Hold', 'Cancelled'] as const;
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'] as const;

const TECH_SUGGESTIONS = ['React', 'Next.js', 'TypeScript', 'Node.js', 'Express', 'MongoDB', 'PostgreSQL', 'Tailwind CSS', 'React Native', 'Flutter', 'Firebase', 'Supabase', 'Vue.js', 'Laravel', 'WordPress', 'Shopify', 'Python', 'Django', 'AWS', 'Docker', 'GraphQL', 'Stripe', 'Framer Motion', 'Figma'];
const TAG_SUGGESTIONS = ['web app', 'mobile app', 'landing page', 'dashboard', 'e-commerce', 'saas', 'portfolio', 'cms', 'api', 'ai', 'fintech', 'healthcare', 'education', 'real estate', 'branding', 'ui/ux', 'redesign', 'seo'];

/** Clickable suggestion chips that toggle items in a comma-separated input value. */
function ChipPicker({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) {
  const selected = value.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  return (
    <div className="flex flex-wrap gap-1.5 pt-1 max-h-24 overflow-y-auto">
      {options.map(opt => {
        const active = selected.includes(opt.toLowerCase());
        return (
          <button
            key={opt}
            type="button"
            onClick={() => {
              const parts = value.split(',').map(s => s.trim()).filter(Boolean);
              const next = active ? parts.filter(p => p.toLowerCase() !== opt.toLowerCase()) : [...parts, opt];
              onChange(next.join(', '));
            }}
            className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
              active
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-muted/30 text-muted-foreground border-border hover:text-foreground hover:border-primary/50'
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

interface ProjectForm {
  projectTitle: string;
  clientName: string;
  category: string;
  status: string;
  priority: string;
  yourRole: string;
  projectDescription: string;
  techStack: string;       // comma-separated input
  tags: string;            // comma-separated input
  isPublic: boolean;
  startDate: string;
  endDate: string;
  budget: string;
  durationValue: string;
  durationUnit: string;
  completionPercentage: number;
  projectLink: string;
}

const DURATION_UNITS = ['days', 'weeks', 'months', 'years'] as const;

const emptyForm: ProjectForm = {
  projectTitle: '',
  clientName: '',
  category: 'Web App',
  status: 'Completed',
  priority: 'High',
  yourRole: 'Full Stack Developer',
  projectDescription: '',
  techStack: '',
  tags: '',
  isPublic: true,
  startDate: '',
  endDate: '',
  budget: '',
  durationValue: '1',
  durationUnit: 'months',
  completionPercentage: 100,
  projectLink: '',
};

function formToPayload(form: ProjectForm, userId: string) {
  return {
    projectTitle: form.projectTitle.trim(),
    clientName: form.clientName.trim(),
    category: form.category,
    status: form.status,
    priority: form.priority,
    yourRole: form.yourRole.trim(),
    projectDescription: form.projectDescription.trim(),
    projectLink: form.projectLink.trim() || undefined,
    techStack: form.techStack.split(',').map(t => t.trim()).filter(Boolean),
    tags: form.tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean),
    isPublic: form.isPublic,
    startDate: form.startDate || new Date().toISOString(),
    endDate: form.endDate || undefined,
    budget: form.budget ? { amount: parseFloat(form.budget), currency: 'USD' } : undefined,
    duration: { value: Number(form.durationValue) || 1, unit: form.durationUnit },
    completionPercentage: form.completionPercentage,
    projectLead: userId,
    teamMembers: [{ memberId: userId, role: 'Lead', isLead: true }],
  };
}

function projectToForm(p: any): ProjectForm {
  return {
    projectTitle: p.projectTitle || '',
    clientName: p.clientName || '',
    category: p.category || 'Web App',
    status: p.status || 'Completed',
    priority: p.priority || 'High',
    yourRole: p.yourRole || '',
    projectDescription: p.projectDescription || '',
    projectLink: p.projectLink || '',
    techStack: (p.techStack || []).map(techName).filter(Boolean).join(', '),
    tags: (p.tags || []).join(', '),
    isPublic: p.isPublic ?? true,
    startDate: p.startDate ? p.startDate.substring(0, 10) : '',
    endDate: p.endDate ? p.endDate.substring(0, 10) : '',
    budget: p.budget?.amount ? String(p.budget.amount) : '',
    durationValue: p.duration?.value ? String(p.duration.value) : '1',
    durationUnit: p.duration?.unit || 'months',
    completionPercentage: p.completionPercentage ?? 100,
  };
}

const statusColors: Record<string, string> = {
  'Completed': 'bg-green-500/10 text-green-600 border-green-500/20',
  'In Progress': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  'Draft': 'bg-muted text-muted-foreground border-border',
  'Review': 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  'On Hold': 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  'Cancelled': 'bg-red-500/10 text-red-500 border-red-500/20',
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Projects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProjectForm>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const [viewProject, setViewProject] = useState<any | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isDeletingImageId, setIsDeletingImageId] = useState<string | null>(null);
  const [modalImages, setModalImages] = useState<File[]>([]);

  const showNotif = (type: 'success' | 'error', title: string, message?: string) => {
    if (type === 'success') toast.success(title, message ? { description: message } : undefined);
    else toast.error(title, message ? { description: message } : undefined);
  };

  const loadProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminProjectsApi.getAll();
      const data = res.data.data;
      setProjects(Array.isArray(data?.projects) ? data.projects : Array.isArray(data) ? data : []);
    } catch (err: any) {
      showNotif('error', 'Failed to load projects', err?.response?.data?.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useDataRealtime('projects', loadProjects);
  useEffect(() => { loadProjects(); }, [loadProjects]);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalImages([]);
    setModalOpen(true);
  };

  const openEdit = (project: any) => {
    setEditingId(project._id);
    setForm(projectToForm(project));
    setModalImages([]);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.projectTitle.trim() || !form.projectDescription.trim() || !form.clientName.trim() || !form.durationValue.trim()) {
      showNotif('error', 'Required fields missing', 'Title, client name, description, and duration are required.');
      return;
    }
    const existingImageCount = editingId ? (projects.find(p => p._id === editingId)?.projectGallery?.length || 0) : 0;
    if (!editingId && modalImages.length === 0) {
      showNotif('error', 'Image required', 'Please add at least one project image.');
      return;
    }
    if (editingId && existingImageCount === 0 && modalImages.length === 0) {
      showNotif('error', 'Image required', 'Please add at least one project image.');
      return;
    }
    if (!user?._id) { showNotif('error', 'Not authenticated'); return; }

    setIsSaving(true);
    try {
      const payload = formToPayload(form, user._id);
      let projectId = editingId;
      if (editingId) {
        await adminProjectsApi.update(editingId, payload);
      } else {
        const res = await adminProjectsApi.create(payload);
        projectId = res.data.data._id;
      }

      if (modalImages.length > 0 && projectId) {
        try {
          await adminProjectsApi.uploadImages(projectId, modalImages);
        } catch (imgErr: any) {
          showNotif('error', 'Project saved, but image upload failed', imgErr?.response?.data?.message);
        }
      }

      showNotif('success', editingId ? 'Project updated' : 'Project created');
      setModalImages([]);
      setModalOpen(false);
      loadProjects();
    } catch (err: any) {
      showNotif('error', 'Save failed', err?.response?.data?.message || err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    setDeletingId(confirmDeleteId);
    try {
      await adminProjectsApi.delete(confirmDeleteId);
      showNotif('success', 'Project deleted');
      setConfirmDeleteId(null);
      loadProjects();
    } catch (err: any) {
      showNotif('error', 'Delete failed', err?.response?.data?.message);
    } finally {
      setDeletingId(null);
    }
  };

  const togglePublic = async (project: any) => {
    try {
      await adminProjectsApi.update(project._id, { isPublic: !project.isPublic });
      showNotif('success', project.isPublic ? 'Hidden from portfolio' : 'Now visible on portfolio');
      loadProjects();
    } catch (err: any) {
      showNotif('error', 'Failed to update visibility', err?.response?.data?.message);
    }
  };

  const toggleFeaturedHome = async (project: any) => {
    try {
      await adminProjectsApi.toggleFeaturedHome(project._id);
      showNotif('success', project.featuredOnHome ? 'Removed from home page' : 'Featured on home page');
      loadProjects();
    } catch (err: any) {
      showNotif('error', 'Failed to update', err?.response?.data?.message);
    }
  };

  const filtered = projects.filter(p => {
    const matchSearch = !search || p.projectTitle?.toLowerCase().includes(search.toLowerCase()) || p.clientName?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'All' || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const bulk = useBulkSelect(filtered);

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    try {
      await adminProjectsApi.bulkDelete(bulk.ids);
      toast.success(`${bulk.count} project(s) deleted`);
      bulk.clear();
      loadProjects();
    } catch (err: any) {
      toast.error('Bulk delete failed', { description: err?.response?.data?.message });
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleBulkToggleVisibility = async (isPublic: boolean) => {
    try {
      await adminProjectsApi.bulkToggleVisibility(bulk.ids, isPublic);
      toast.success(`${bulk.count} project(s) ${isPublic ? 'published' : 'hidden'}`);
      bulk.clear();
      loadProjects();
    } catch (err: any) {
      toast.error('Failed to update visibility', { description: err?.response?.data?.message });
    }
  };

  const handleUploadImages = async (projectId: string) => {
    if (galleryFiles.length === 0) return;
    setIsUploadingImages(true);
    try {
      const res = await adminProjectsApi.uploadImages(projectId, galleryFiles);
      const updatedGallery = res.data.data;
      setGalleryFiles([]);
      setViewProject((prev: any) => prev ? { ...prev, projectGallery: updatedGallery } : prev);
      setProjects(ps => ps.map(p => p._id === projectId ? { ...p, projectGallery: updatedGallery } : p));
      showNotif('success', `${galleryFiles.length} image(s) uploaded`);
    } catch (err: any) {
      showNotif('error', 'Upload failed', err?.response?.data?.message);
    } finally {
      setIsUploadingImages(false);
    }
  };

  const handleDeleteGalleryImage = async (projectId: string, imageId: string) => {
    setIsDeletingImageId(imageId);
    try {
      const res = await adminProjectsApi.deleteGalleryImage(projectId, imageId);
      const updatedGallery = res.data.data;
      setViewProject((prev: any) => prev ? { ...prev, projectGallery: updatedGallery } : prev);
      setProjects(ps => ps.map(p => p._id === projectId ? { ...p, projectGallery: updatedGallery } : p));
      showNotif('success', 'Image deleted');
    } catch (err: any) {
      showNotif('error', 'Delete failed', err?.response?.data?.message);
    } finally {
      setIsDeletingImageId(null);
    }
  };

  const moveGalleryImage = async (projectId: string, from: number, to: number) => {
    const prev = projects.find(p => p._id === projectId)?.projectGallery || [];
    if (to < 0 || to >= prev.length) return;
    const gallery = [...prev];
    const [img] = gallery.splice(from, 1);
    gallery.splice(to, 0, img);
    setProjects(ps => ps.map(p => p._id === projectId ? { ...p, projectGallery: gallery } : p));
    setViewProject((v: any) => v && v._id === projectId ? { ...v, projectGallery: gallery } : v);
    try {
      await adminProjectsApi.update(projectId, { projectGallery: gallery });
    } catch (err: any) {
      setProjects(ps => ps.map(p => p._id === projectId ? { ...p, projectGallery: prev } : p));
      setViewProject((v: any) => v && v._id === projectId ? { ...v, projectGallery: prev } : v);
      showNotif('error', 'Reorder failed', err?.response?.data?.message);
    }
  };

  // Suggestions = presets + values already used across existing projects (deduped, case-insensitive)
  const mergeOptions = (presets: string[], used: string[]) => {
    const seen = new Set(presets.map(p => p.toLowerCase()));
    return [...presets, ...used.filter(u => u && !seen.has(u.toLowerCase()) && seen.add(u.toLowerCase()))];
  };
  const techOptions = useMemo(
    () => mergeOptions(TECH_SUGGESTIONS, [...new Set(projects.flatMap(p => (p.techStack || []).map(techName)))]),
    [projects]
  );
  const tagOptions = useMemo(
    () => mergeOptions(TAG_SUGGESTIONS, [...new Set<string>(projects.flatMap(p => p.tags || []))]),
    [projects]
  );

  const stats = {
    total: projects.length,
    public: projects.filter(p => p.isPublic).length,
    completed: projects.filter(p => p.status === 'Completed').length,
    inProgress: projects.filter(p => p.status === 'In Progress').length,
    featuredHome: projects.filter(p => p.featuredOnHome).length,
  };

  const setField = (key: keyof ProjectForm, val: any) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Portfolio Projects</h1>
          <p className="text-muted-foreground">Manage projects shown on the public portfolio page.</p>
        </div>
        <Button onClick={openAdd} className="gap-2">
          <Plus className="h-4 w-4" /> Add Project
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Projects', value: stats.total },
          { label: 'Public (Live)', value: stats.public },
          { label: 'Completed', value: stats.completed },
          { label: 'In Progress', value: stats.inProgress },
          { label: 'Featured on Home', value: stats.featuredHome, highlight: true },
        ].map(s => (
          <Card key={s.label} className={(s as any).highlight && stats.featuredHome > 0 ? 'border-amber-500/30 bg-amber-500/5' : ''}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <div className="text-3xl font-bold">{s.value}</div>
                {(s as any).highlight && <Star className="h-5 w-5 text-amber-500 fill-amber-500" />}
              </div>
              <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by title or client..." className="pl-9" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['All', ...STATUSES].map(s => (
            <Button key={s} size="sm" variant={filterStatus === s ? 'default' : 'outline'} onClick={() => setFilterStatus(s)} className="rounded-full px-4">
              {s}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              {projects.length === 0 ? 'No projects yet. Add your first project!' : 'No projects match your filters.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <button onClick={bulk.toggleAll}>
                      {bulk.allSelected ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4 text-muted-foreground" />}
                    </button>
                  </TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Visibility</TableHead>
                  <TableHead className="text-center">Home</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(project => {
                  const thumb = project.projectGallery?.[0]?.url;
                  return (
                    <TableRow key={project._id} className={bulk.isSelected(project._id) ? 'bg-primary/5' : ''}>
                      <TableCell>
                        <button onClick={() => bulk.toggle(project._id)}>
                          {bulk.isSelected(project._id) ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4 text-muted-foreground" />}
                        </button>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {thumb ? (
                            <img src={thumb} alt={project.projectTitle} className="h-10 w-16 object-cover rounded-md flex-shrink-0" />
                          ) : (
                            <div className="h-10 w-16 bg-muted rounded-md flex items-center justify-center flex-shrink-0">
                              <ImageIcon className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium line-clamp-1">{project.projectTitle}</div>
                            <div className="text-xs text-muted-foreground line-clamp-1">{(project.techStack || []).slice(0, 3).map(techName).filter(Boolean).join(', ')}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{project.clientName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{project.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[project.status] || 'bg-muted text-muted-foreground border-border'}`}>
                          {project.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <button onClick={() => togglePublic(project)} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${project.isPublic ? 'bg-green-500/10 text-green-600 hover:bg-green-500/20' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                          {project.isPublic ? <><Globe className="h-3 w-3" /> Public</> : <><Lock className="h-3 w-3" /> Hidden</>}
                        </button>
                      </TableCell>
                      <TableCell className="text-center">
                        <button
                          onClick={() => toggleFeaturedHome(project)}
                          title={project.featuredOnHome ? 'Remove from home page' : 'Feature on home page'}
                          className={`inline-flex items-center justify-center h-8 w-8 rounded-full transition-colors ${project.featuredOnHome ? 'text-amber-500 bg-amber-500/10 hover:bg-amber-500/20' : 'text-muted-foreground/40 hover:text-amber-500 hover:bg-amber-500/10'}`}
                        >
                          <Star className={`h-4 w-4 ${project.featuredOnHome ? 'fill-amber-500' : ''}`} />
                        </button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setViewProject(project); setGalleryFiles([]); }}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(project)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-red-500" onClick={() => setConfirmDeleteId(project._id)} disabled={deletingId === project._id}>
                            {deletingId === project._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 backdrop-blur-sm p-4 pt-10">
          <div className="w-full max-w-2xl bg-background border border-border rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-bold">{editingId ? 'Edit Project' : 'Add New Project'}</h2>
              <Button size="icon" variant="ghost" onClick={() => setModalOpen(false)}><X className="h-4 w-4" /></Button>
            </div>

            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Project Title *</Label>
                  <Input value={form.projectTitle} onChange={e => setField('projectTitle', e.target.value)} placeholder="FinTech Dashboard" />
                </div>
                <div className="space-y-2">
                  <Label>Client Name *</Label>
                  <Input value={form.clientName} onChange={e => setField('clientName', e.target.value)} placeholder="Acme Corp" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description *</Label>
                <Textarea value={form.projectDescription} onChange={e => setField('projectDescription', e.target.value)} rows={4} placeholder="Describe the project, challenges, and outcomes..." />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <select value={form.category} onChange={e => setField('category', e.target.value)} className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <select value={form.status} onChange={e => setField('status', e.target.value)} className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <select value={form.priority} onChange={e => setField('priority', e.target.value)} className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
                    {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Your Role</Label>
                  <Input value={form.yourRole} onChange={e => setField('yourRole', e.target.value)} placeholder="Full Stack Developer" />
                </div>
                <div className="space-y-2">
                  <Label>Budget (USD)</Label>
                  <Input type="number" value={form.budget} onChange={e => setField('budget', e.target.value)} placeholder="15000" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Duration *</Label>
                  <Input type="number" min={1} max={999} value={form.durationValue} onChange={e => setField('durationValue', e.target.value)} placeholder="3" />
                </div>
                <div className="space-y-2">
                  <Label>Duration Unit</Label>
                  <select value={form.durationUnit} onChange={e => setField('durationUnit', e.target.value)} className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
                    {DURATION_UNITS.map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input type="date" value={form.startDate} onChange={e => setField('startDate', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input type="date" value={form.endDate} onChange={e => setField('endDate', e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tech Stack <span className="text-muted-foreground text-xs">(click below or type)</span></Label>
                <Input value={form.techStack} onChange={e => setField('techStack', e.target.value)} placeholder="React, TypeScript, Node.js, MongoDB" />
                <ChipPicker value={form.techStack} options={techOptions} onChange={v => setField('techStack', v)} />
              </div>

              <div className="space-y-2">
                <Label>Tags <span className="text-muted-foreground text-xs">(click below or type)</span></Label>
                <Input value={form.tags} onChange={e => setField('tags', e.target.value)} placeholder="fintech, dashboard, analytics" />
                <ChipPicker value={form.tags} options={tagOptions} onChange={v => setField('tags', v)} />
              </div>

              <div className="space-y-2">
                <Label>Project Link <span className="text-muted-foreground text-xs">(live site or demo URL)</span></Label>
                <Input type="url" value={form.projectLink} onChange={e => setField('projectLink', e.target.value)} placeholder="https://example.com" />
              </div>

              <div className="space-y-2">
                <Label>Project Images {!editingId && '*'} <span className="text-muted-foreground text-xs">(at least 1 required)</span></Label>

                {editingId && (() => {
                  const existing = projects.find(p => p._id === editingId)?.projectGallery || [];
                  return existing.length > 0 ? (
                    <>
                    <p className="text-xs text-muted-foreground">Image #1 = hero &amp; grid, #2–3 = grid. Use arrows to reorder — saved instantly.</p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-2">
                      {existing.map((g: any, i: number) => (
                        <div key={g._id} className="group relative rounded-lg overflow-hidden border border-border aspect-video bg-muted">
                          <img src={g.url} alt="" className={`w-full h-full object-cover ${isDeletingImageId === g._id ? 'opacity-40' : ''}`} />
                          <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-black/70 text-white text-[10px] font-semibold leading-none">
                            {i === 0 ? '1 · Hero' : i + 1}
                          </span>
                          <button
                            type="button"
                            disabled={isDeletingImageId === g._id}
                            onClick={() => handleDeleteGalleryImage(editingId, g._id)}
                            className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          ><X className="h-3 w-3" /></button>
                          <div className="absolute bottom-1 inset-x-1 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              disabled={i === 0}
                              onClick={() => moveGalleryImage(editingId, i, i - 1)}
                              className="h-5 w-5 rounded-full bg-black/70 text-white flex items-center justify-center disabled:opacity-30"
                            ><ChevronLeft className="h-3 w-3" /></button>
                            <button
                              type="button"
                              disabled={i === existing.length - 1}
                              onClick={() => moveGalleryImage(editingId, i, i + 1)}
                              className="h-5 w-5 rounded-full bg-black/70 text-white flex items-center justify-center disabled:opacity-30"
                            ><ChevronRight className="h-3 w-3" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                    </>
                  ) : null;
                })()}

                <div className="border-2 border-dashed border-border rounded-xl p-4 space-y-3">
                  <input
                    type="file"
                    id="gallery-upload-modal"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={e => setModalImages(Array.from(e.target.files || []))}
                  />
                  <label htmlFor="gallery-upload-modal" className="flex flex-col items-center gap-2 cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
                    <Upload className="h-6 w-6" />
                    <span className="text-sm">Click to select images</span>
                  </label>
                  {modalImages.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {modalImages.map((f, i) => (
                        <div key={i} className="relative h-14 w-20 rounded-md overflow-hidden border border-border bg-muted">
                          <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                          <button
                            onClick={() => setModalImages(fs => fs.filter((_, idx) => idx !== i))}
                            className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full bg-black/70 text-white flex items-center justify-center"
                          ><X className="h-2.5 w-2.5" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Completion %</Label>
                <Input type="number" min={0} max={100} value={form.completionPercentage} onChange={e => setField('completionPercentage', Number(e.target.value))} />
              </div>

              <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-muted/20">
                <input type="checkbox" id="isPublic" checked={form.isPublic} onChange={e => setField('isPublic', e.target.checked)} className="h-4 w-4 rounded" />
                <label htmlFor="isPublic" className="text-sm font-medium cursor-pointer">
                  Show on public portfolio page
                  <span className="text-muted-foreground font-normal ml-2">— visible to website visitors</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-border">
              <Button onClick={handleSave} isLoading={isSaving} className="flex-1 gap-2">
                <Save className="h-4 w-4" /> {editingId ? 'Save Changes' : 'Create Project'}
              </Button>
              <Button variant="outline" onClick={() => setModalOpen(false)} className="flex-1">Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-background border border-border rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-bold">{viewProject.projectTitle}</h2>
              <Button size="icon" variant="ghost" onClick={() => setViewProject(null)}><X className="h-4 w-4" /></Button>
            </div>
            <div className="p-6 space-y-6">
              {/* Gallery Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Gallery ({viewProject.projectGallery?.length || 0} images)</span>
                </div>

                {viewProject.projectGallery?.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {viewProject.projectGallery.map((g: any) => (
                      <div key={g._id} className="relative group rounded-lg overflow-hidden border border-border aspect-video bg-muted">
                        <img src={g.url} alt="" className="w-full h-full object-cover" />
                        <button
                          onClick={() => handleDeleteGalleryImage(viewProject._id, g._id)}
                          disabled={isDeletingImageId === g._id}
                          className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        >
                          {isDeletingImageId === g._id ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload new images */}
                <div className="border-2 border-dashed border-border rounded-xl p-4 space-y-3">
                  <input
                    type="file"
                    id="gallery-upload"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={e => setGalleryFiles(Array.from(e.target.files || []))}
                  />
                  <label htmlFor="gallery-upload" className="flex flex-col items-center gap-2 cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
                    <Upload className="h-6 w-6" />
                    <span className="text-sm">Click to select images</span>
                  </label>
                  {galleryFiles.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex gap-2 flex-wrap">
                        {galleryFiles.map((f, i) => (
                          <div key={i} className="relative h-14 w-20 rounded-md overflow-hidden border border-border bg-muted">
                            <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                            <button
                              onClick={() => setGalleryFiles(fs => fs.filter((_, idx) => idx !== i))}
                              className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full bg-black/70 text-white flex items-center justify-center"
                            ><X className="h-2.5 w-2.5" /></button>
                          </div>
                        ))}
                      </div>
                      <Button size="sm" onClick={() => handleUploadImages(viewProject._id)} isLoading={isUploadingImages} className="gap-2 w-full">
                        <Upload className="h-3.5 w-3.5" /> Upload {galleryFiles.length} image{galleryFiles.length > 1 ? 's' : ''}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Client</span><div className="font-medium">{viewProject.clientName}</div></div>
                <div><span className="text-muted-foreground">Category</span><div className="font-medium">{viewProject.category}</div></div>
                <div><span className="text-muted-foreground">Status</span><div className="font-medium">{viewProject.status}</div></div>
                <div><span className="text-muted-foreground">Visibility</span><div className={`font-medium ${viewProject.isPublic ? 'text-green-600' : 'text-muted-foreground'}`}>{viewProject.isPublic ? 'Public' : 'Hidden'}</div></div>
                <div><span className="text-muted-foreground">Your Role</span><div className="font-medium">{viewProject.yourRole}</div></div>
                <div><span className="text-muted-foreground">Completion</span><div className="font-medium">{viewProject.completionPercentage}%</div></div>
              </div>
              <div>
                <span className="text-muted-foreground text-sm">Description</span>
                <p className="mt-1 text-sm leading-relaxed">{viewProject.projectDescription}</p>
              </div>
              {viewProject.techStack?.length > 0 && (
                <div>
                  <span className="text-muted-foreground text-sm">Tech Stack</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {viewProject.techStack.map(techName).filter(Boolean).map((t: string) => <Badge key={t} variant="outline">{t}</Badge>)}
                  </div>
                </div>
              )}
              {viewProject.tags?.length > 0 && (
                <div>
                  <span className="text-muted-foreground text-sm">Tags</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {viewProject.tags.map((t: string) => <Badge key={t} variant="secondary">{t}</Badge>)}
                  </div>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <Button onClick={() => { openEdit(viewProject); setViewProject(null); }} className="flex-1 gap-2">
                  <Edit className="h-4 w-4" /> Edit Project
                </Button>
                <Button variant="outline" onClick={() => togglePublic(viewProject)} className="flex-1 gap-2">
                  {viewProject.isPublic ? <><EyeOff className="h-4 w-4" /> Hide</> : <><Globe className="h-4 w-4" /> Publish</>}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDeleteDialog
        open={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleDelete}
        description="Delete this project? This action cannot be undone."
      />

      <BulkActionBar
        count={bulk.count}
        onClear={bulk.clear}
        itemLabel="project"
        actions={[
          {
            label: 'Publish',
            icon: Globe,
            onClick: () => handleBulkToggleVisibility(true),
          },
          {
            label: 'Hide',
            icon: EyeOff,
            onClick: () => handleBulkToggleVisibility(false),
          },
          {
            label: 'Delete Selected',
            icon: Trash2,
            variant: 'destructive',
            loading: isBulkDeleting,
            onClick: handleBulkDelete,
          },
        ]}
      />
    </div>
  );
}
