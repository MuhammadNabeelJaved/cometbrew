/**
 * User Projects Page
 * Live CRUD: fetch from DB, create new request with file upload, delete pending/rejected.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Search,
  Clock,
  CheckCircle,
  CreditCard,
  FileText,
  Star,
  Plus,
  Upload,
  X,
  File,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  RefreshCw,
  Trash2,
  Download,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card } from '../../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectItem } from '../../components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { projectsApi } from '../../api/projects.api';
import ConfirmDeleteDialog from '../../components/ui/ConfirmDeleteDialog';
import { useDataRealtime } from '../../hooks/useDataRealtime';
import { exportToCsv } from '../../lib/exportCsv';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Project {
  _id: string;
  projectName: string;
  projectType: string;
  budgetRange: string;
  projectDetails: string;
  status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'completed';
  progress: number;
  totalCost?: number;
  paidAmount?: number;
  dueAmount?: number;
  paymentStatus: 'unpaid' | 'partial' | 'paid';
  deadline?: string;
  attachments: { _id: string; fileName: string; fileUrl: string; fileType: string }[];
  createdAt: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  in_review: 'In Review',
  approved: 'Approved',
  rejected: 'Rejected',
  completed: 'Completed',
};

const STATUS_COLORS: Record<string, string> = {
  completed: 'bg-green-500/10 text-green-500 border-green-500/20',
  approved:  'bg-blue-500/10 text-blue-500 border-blue-500/20',
  in_review: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  pending:   'bg-amber-500/10 text-amber-500 border-amber-500/20',
  rejected:  'bg-red-500/10 text-red-500 border-red-500/20',
};

const FILTER_STATUSES = ['All', 'pending', 'in_review', 'approved', 'completed', 'rejected'];

// ─── Component ────────────────────────────────────────────────────────────────

export default function UserProjects() {
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [projects, setProjects]             = useState<Project[]>([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState<string | null>(null);
  const [searchTerm, setSearchTerm]         = useState('');
  const [filterStatus, setFilterStatus]     = useState('All');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showReviewModal, setShowReviewModal]  = useState(false);
  const [showCreateModal, setShowCreateModal]  = useState(false);
  const [deleteTargetId, setDeleteTargetId]    = useState<string | null>(null);
  const [deleting, setDeleting]             = useState(false);
  const [submitting, setSubmitting]         = useState(false);
  const [files, setFiles]                   = useState<File[]>([]);

  // Form fields
  const [formName, setFormName]         = useState('');
  const [formType, setFormType]         = useState('');
  const [formBudget, setFormBudget]     = useState('');
  const [formDetails, setFormDetails]   = useState('');
  const [formDeadline, setFormDeadline] = useState('');

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchProjects = useCallback(async () => {
    setError(null);
    try {
      const res = await projectsApi.getAll({ limit: 50 });
      const list: Project[] = res.data.data?.projects ?? res.data.data ?? [];
      setProjects(list);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Unknown error';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  // Real-time: refresh when admin updates project status/progress/assignment
  useDataRealtime('projects', fetchProjects);

  useEffect(() => {
    if (location.state?.openNewProject) {
      setShowCreateModal(true);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // ── Create ────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!formName.trim() || !formType || !formBudget || !formDetails.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (formDetails.trim().length < 20) {
      toast.error('Project details must be at least 20 characters');
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('projectName', formName.trim());
      fd.append('projectType', formType);
      fd.append('budgetRange', formBudget);
      fd.append('projectDetails', formDetails.trim());
      if (formDeadline) fd.append('deadline', formDeadline);
      files.forEach(f => fd.append('files', f));

      await projectsApi.create(fd);
      toast.success('Project request submitted!');
      setShowCreateModal(false);
      resetForm();
      await fetchProjects();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormName(''); setFormType(''); setFormBudget(''); setFormDetails('');
    setFormDeadline('');
    setFiles([]);
  };

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    setDeleting(true);
    try {
      await projectsApi.delete(deleteTargetId);
      setProjects(prev => prev.filter(p => p._id !== deleteTargetId));
      toast.success('Project deleted');
      setDeleteTargetId(null);
    } catch (err: any) {
      toast.error('Failed to delete project', { description: err?.response?.data?.message || 'Please try again.' });
    } finally {
      setDeleting(false);
    }
  };

  // ── Files ─────────────────────────────────────────────────────────────────

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
  };

  // ── Filter ────────────────────────────────────────────────────────────────

  const filtered = projects.filter(p =>
    (filterStatus === 'All' || p.status === filterStatus) &&
    p.projectName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Projects</h1>
          <p className="text-muted-foreground">Manage and track your ongoing projects.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2"
            onClick={() => {
              const rows = filtered.map(p => ({
                Project: p.projectName, Type: p.projectType, Budget: p.budgetRange,
                Status: STATUS_LABELS[p.status] ?? p.status, Progress: `${p.progress}%`,
                'Total Cost': p.totalCost ?? '', 'Paid': p.paidAmount ?? '',
                Payment: p.paymentStatus, Deadline: p.deadline ? new Date(p.deadline).toLocaleDateString() : '',
                Submitted: new Date(p.createdAt).toLocaleDateString(),
              }));
              exportToCsv(rows, 'my-projects');
              toast.success('CSV exported');
            }}
            disabled={filtered.length === 0}
          >
            <Download className="h-4 w-4" /> Export
          </Button>
          <Button className="gap-2" onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4" /> Start New Project
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-card p-4 rounded-xl border border-border/50">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          {FILTER_STATUSES.map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filterStatus === s
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              {s === 'All' ? 'All' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
          <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <p className="font-semibold text-destructive">Failed to load projects</p>
            <p className="text-xs text-muted-foreground mt-1">{error}</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchProjects}>
            <RefreshCw className="h-4 w-4 mr-2" /> Try Again
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-border/60 rounded-2xl text-muted-foreground gap-3">
          <FileText className="h-10 w-10 opacity-30" />
          <p className="text-lg font-medium">
            {searchTerm || filterStatus !== 'All' ? 'No projects match your filter' : 'No projects yet'}
          </p>
          {!searchTerm && filterStatus === 'All' && (
            <Button onClick={() => setShowCreateModal(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" /> Start your first project
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence>
            {filtered.map((project, i) => (
              <motion.div
                key={project._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.07 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow border-border/50">
                  <div className="p-6 space-y-5">
                    <div className="flex justify-between items-start">
                      <div className="min-w-0 pr-2">
                        <Badge variant="outline" className="mb-2 text-xs">{project.projectType}</Badge>
                        <h3 className="font-bold text-lg truncate">{project.projectName}</h3>
                      </div>
                      <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[project.status]}`}>
                        {STATUS_LABELS[project.status]}
                      </span>
                    </div>

                    {/* Progress */}
                    <div className="space-y-1.5">
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

                    {/* Status Stepper */}
                    {project.status !== 'rejected' ? (
                      <div className="flex items-center gap-0.5">
                        {[
                          { key: 'pending',   label: 'Submitted' },
                          { key: 'in_review', label: 'Review'    },
                          { key: 'approved',  label: 'Approved'  },
                          { key: 'completed', label: 'Done'      },
                        ].map((step, idx, arr) => {
                          const order = ['pending','in_review','approved','completed'];
                          const currentIdx = order.indexOf(project.status);
                          const stepIdx    = order.indexOf(step.key);
                          const isDone    = stepIdx < currentIdx;
                          const isActive  = stepIdx === currentIdx;
                          return (
                            <React.Fragment key={step.key}>
                              <div className="flex flex-col items-center gap-1 flex-1">
                                <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${
                                  isDone   ? 'bg-primary border-primary text-primary-foreground' :
                                  isActive ? 'bg-primary/20 border-primary text-primary' :
                                             'bg-muted border-border text-muted-foreground'
                                }`}>
                                  {isDone ? '✓' : idx + 1}
                                </div>
                                <span className={`text-[9px] font-medium leading-none text-center ${isActive ? 'text-primary' : isDone ? 'text-foreground' : 'text-muted-foreground'}`}>
                                  {step.label}
                                </span>
                              </div>
                              {idx < arr.length - 1 && (
                                <div className={`h-0.5 flex-1 mb-4 rounded-full transition-all ${stepIdx < currentIdx ? 'bg-primary' : 'bg-border'}`} />
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        <span>This request was not accepted. You can delete and resubmit.</span>
                      </div>
                    )}

                    {/* Cost */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-secondary/30 p-3 rounded-lg">
                        <p className="text-muted-foreground mb-1 text-xs">Total Cost</p>
                        <p className="font-bold">{project.totalCost ? `$${project.totalCost.toLocaleString()}` : '—'}</p>
                      </div>
                      <div className="bg-secondary/30 p-3 rounded-lg">
                        <p className="text-muted-foreground mb-1 text-xs">Budget Range</p>
                        <p className="font-bold text-xs">{project.budgetRange}</p>
                      </div>
                    </div>

                    {/* Deadline */}
                    {project.deadline && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Deadline: {new Date(project.deadline).toLocaleDateString()}</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="pt-4 border-t border-border/50 flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setSelectedProject(project)}
                      >
                        View Details
                      </Button>
                      {project.status === 'completed' ? (
                        <Button
                          variant="secondary"
                          className="flex-1 gap-2"
                          onClick={() => { setSelectedProject(project); setShowReviewModal(true); }}
                        >
                          <Star className="h-4 w-4" /> Review
                        </Button>
                      ) : (project.status === 'pending' || project.status === 'rejected') ? (
                        <Button
                          variant="outline"
                          className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
                          onClick={() => setDeleteTargetId(project._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button className="flex-1 gap-2" disabled>
                          <CreditCard className="h-4 w-4" /> Pay
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Project Details Modal */}
      <Dialog
        open={!!selectedProject && !showReviewModal}
        onOpenChange={open => !open && setSelectedProject(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedProject?.projectName}</DialogTitle>
            <DialogDescription>
              {selectedProject?.projectType} · {selectedProject?.budgetRange}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div>
              <h4 className="font-semibold mb-2">Project Details</h4>
              <p className="text-muted-foreground text-sm leading-relaxed">{selectedProject?.projectDetails}</p>
            </div>

            {selectedProject?.totalCost ? (
              <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Outstanding Balance</p>
                  <p className="text-xl font-bold text-primary">
                    ${(selectedProject.dueAmount ?? 0).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="font-semibold">${selectedProject.totalCost.toLocaleString()}</p>
                  <p className="text-xs text-green-500">Paid ${(selectedProject.paidAmount ?? 0).toLocaleString()}</p>
                </div>
              </div>
            ) : null}

            {selectedProject?.attachments?.length ? (
              <div>
                <h4 className="font-semibold mb-2">Attachments</h4>
                <div className="space-y-2">
                  {selectedProject.attachments.map(att => (
                    <a
                      key={att._id}
                      href={att.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg bg-secondary/20 hover:bg-secondary/40 transition-colors"
                    >
                      <File className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-sm truncate">{att.fileName}</span>
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      {/* Review Modal */}
      <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Write a Review</DialogTitle>
            <DialogDescription>How was your experience with "{selectedProject?.projectName}"?</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex justify-center gap-2 py-4">
              {[1, 2, 3, 4, 5].map(star => (
                <Star key={star} className="h-8 w-8 text-amber-400 fill-amber-400 cursor-pointer hover:scale-110 transition-transform" />
              ))}
            </div>
            <textarea
              className="w-full p-3 rounded-lg bg-background border border-input min-h-[100px] focus:ring-1 focus:ring-primary outline-none text-sm"
              placeholder="Share your feedback..."
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowReviewModal(false)}>Cancel</Button>
            <Button onClick={() => { setShowReviewModal(false); toast.success('Review submitted!'); }}>
              Submit Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Project Modal */}
      <Dialog open={showCreateModal} onOpenChange={open => { if (!open && !submitting) { setShowCreateModal(false); resetForm(); } }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Start New Project</DialogTitle>
            <DialogDescription>
              Tell us what you want to build. We'll review your request and get back to you within 24 hours.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="grid gap-2">
              <Label htmlFor="pname">Project Name *</Label>
              <Input
                id="pname"
                placeholder="e.g. Corporate Website Redesign"
                value={formName}
                onChange={e => setFormName(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label>Project Type *</Label>
              <Select value={formType} onValueChange={setFormType}>
                <SelectItem value="" disabled>Select a type</SelectItem>
                <SelectItem value="Web Development">Web Development</SelectItem>
                <SelectItem value="Mobile App Development">Mobile App Development</SelectItem>
                <SelectItem value="UI/UX Design">UI/UX Design</SelectItem>
                <SelectItem value="E-commerce">E-commerce</SelectItem>
                <SelectItem value="Branding">Branding</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Budget Range *</Label>
              <Select value={formBudget} onValueChange={setFormBudget}>
                <SelectItem value="" disabled>Select your budget</SelectItem>
                <SelectItem value="$100 - $500">$100 - $500</SelectItem>
                <SelectItem value="$500 - $1,000">$500 - $1,000</SelectItem>
                <SelectItem value="$1,000 - $5,000">$1,000 - $5,000</SelectItem>
                <SelectItem value="$5,000+">$5,000+</SelectItem>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="pdeadline">
                Deadline <span className="text-muted-foreground text-xs">(optional — when do you need it?)</span>
              </Label>
              <Input
                id="pdeadline"
                type="date"
                value={formDeadline}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setFormDeadline(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="pdetails">Project Details * <span className="text-muted-foreground text-xs">(min 20 chars)</span></Label>
              <Textarea
                id="pdetails"
                placeholder="Describe your project requirements, goals, and specific features..."
                className="min-h-[120px]"
                value={formDetails}
                onChange={e => setFormDetails(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label>Attachments</Label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-input rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-all"
              >
                <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                <p className="text-sm font-medium">Click to upload files</p>
                <p className="text-xs text-muted-foreground mt-1">Images, PDF, Figma, etc.</p>
                <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileChange} />
              </div>

              {files.length > 0 && (
                <div className="space-y-2">
                  {files.map((file, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg border border-border/50">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                          {file.type.startsWith('image/') ? <ImageIcon className="h-4 w-4 text-primary" /> : <File className="h-4 w-4 text-primary" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                      <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))} className="p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded transition-colors">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setShowCreateModal(false); resetForm(); }} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Submitting…</> : 'Submit Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete */}
      <ConfirmDeleteDialog
        open={!!deleteTargetId}
        onClose={() => !deleting && setDeleteTargetId(null)}
        onConfirm={handleDelete}
        loading={deleting}
        description="This will permanently delete your project request and cannot be undone."
      />
    </div>
  );
}
