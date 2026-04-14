/**
 * Portfolio Projects Admin Page
 * Full CRUD for portfolio projects with real API integration.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit, Trash2, Eye, EyeOff, Globe, Lock, Loader2, X, Save, Image as ImageIcon, CheckSquare, Square, Star } from 'lucide-react';
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

// ─── Types ────────────────────────────────────────────────────────────────────

const CATEGORIES = ['Web App', 'Mobile App', 'Desktop App', 'API Development', 'UI/UX Design', 'Other'] as const;
const STATUSES = ['Draft', 'In Progress', 'Review', 'Completed', 'On Hold', 'Cancelled'] as const;
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'] as const;

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
  galleryUrls: string;     // newline-separated image URLs
  isPublic: boolean;
  startDate: string;
  endDate: string;
  budget: string;
  completionPercentage: number;
}

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
  galleryUrls: '',
  isPublic: true,
  startDate: '',
  endDate: '',
  budget: '',
  completionPercentage: 100,
};

function formToPayload(form: ProjectForm, userId: string) {
  const galleryUrls = form.galleryUrls
    .split('\n')
    .map(u => u.trim())
    .filter(Boolean)
    .map(url => ({ url }));

  return {
    projectTitle: form.projectTitle.trim(),
    clientName: form.clientName.trim(),
    category: form.category,
    status: form.status,
    priority: form.priority,
    yourRole: form.yourRole.trim(),
    projectDescription: form.projectDescription.trim(),
    techStack: form.techStack.split(',').map(t => t.trim()).filter(Boolean),
    tags: form.tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean),
    projectGallery: galleryUrls,
    isPublic: form.isPublic,
    startDate: form.startDate || new Date().toISOString(),
    endDate: form.endDate || undefined,
    budget: form.budget ? { amount: parseFloat(form.budget), currency: 'USD' } : undefined,
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
    techStack: (p.techStack || []).join(', '),
    tags: (p.tags || []).join(', '),
    galleryUrls: (p.projectGallery || []).map((g: any) => g.url || g).join('\n'),
    isPublic: p.isPublic ?? true,
    startDate: p.startDate ? p.startDate.substring(0, 10) : '',
    endDate: p.endDate ? p.endDate.substring(0, 10) : '',
    budget: p.budget?.amount ? String(p.budget.amount) : '',
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
    setModalOpen(true);
  };

  const openEdit = (project: any) => {
    setEditingId(project._id);
    setForm(projectToForm(project));
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.projectTitle.trim() || !form.projectDescription.trim() || !form.clientName.trim()) {
      showNotif('error', 'Required fields missing', 'Title, client name, and description are required.');
      return;
    }
    if (!user?._id) { showNotif('error', 'Not authenticated'); return; }

    setIsSaving(true);
    try {
      const payload = formToPayload(form, user._id);
      if (editingId) {
        await adminProjectsApi.update(editingId, payload);
        showNotif('success', 'Project updated');
      } else {
        await adminProjectsApi.create(payload);
        showNotif('success', 'Project created');
      }
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
                            <div className="text-xs text-muted-foreground line-clamp-1">{(project.techStack || []).slice(0, 3).join(', ')}</div>
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
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setViewProject(project)}>
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
                  <Label>Start Date</Label>
                  <Input type="date" value={form.startDate} onChange={e => setField('startDate', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input type="date" value={form.endDate} onChange={e => setField('endDate', e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tech Stack <span className="text-muted-foreground text-xs">(comma separated)</span></Label>
                <Input value={form.techStack} onChange={e => setField('techStack', e.target.value)} placeholder="React, TypeScript, Node.js, MongoDB" />
              </div>

              <div className="space-y-2">
                <Label>Tags <span className="text-muted-foreground text-xs">(comma separated)</span></Label>
                <Input value={form.tags} onChange={e => setField('tags', e.target.value)} placeholder="fintech, dashboard, analytics" />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" /> Gallery Image URLs <span className="text-muted-foreground text-xs">(one URL per line)</span>
                </Label>
                <Textarea value={form.galleryUrls} onChange={e => setField('galleryUrls', e.target.value)} rows={3} placeholder="https://images.unsplash.com/...&#10;https://..." className="font-mono text-xs" />
                {form.galleryUrls.split('\n').filter(u => u.trim()).length > 0 && (
                  <div className="flex gap-2 flex-wrap pt-1">
                    {form.galleryUrls.split('\n').filter(u => u.trim()).map((url, i) => (
                      <img key={i} src={url.trim()} alt="" className="h-16 w-24 object-cover rounded-md border border-border" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    ))}
                  </div>
                )}
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
              {viewProject.projectGallery?.length > 0 && (
                <div className="flex gap-3 flex-wrap">
                  {viewProject.projectGallery.map((g: any, i: number) => (
                    <img key={i} src={g.url} alt="" className="h-36 w-full object-cover rounded-xl" />
                  ))}
                </div>
              )}
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
                    {viewProject.techStack.map((t: string) => <Badge key={t} variant="outline">{t}</Badge>)}
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
