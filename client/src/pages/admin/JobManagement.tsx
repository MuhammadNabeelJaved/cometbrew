/**
 * Admin Job Management Page
 * Full CRUD functionality for Jobs via API
 */
import React, { useState, useEffect } from 'react';
import { Job } from '../../hooks/useJobs';
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit2,
  Trash2,
  Briefcase,
  MapPin,
  Clock,
  X,
  Save,
  CheckCircle2,
  Users,
  Building,
  DollarSign,
  Loader2
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { Badge } from '../../components/ui/badge';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Notification } from '../../components/Notification';
import { jobsApi } from '../../api/jobs.api';

export default function JobManagement() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentJob, setCurrentJob] = useState<Partial<Job>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; title: string; message?: string } | null>(null);

  const showNotification = (type: 'success' | 'error', title: string, message?: string) => {
    setNotification({ type, title, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadJobs = async () => {
    setLoading(true);
    try {
      const response = await jobsApi.getAll();
      const data = response.data.data;
      setJobs(Array.isArray(data) ? data : []);
    } catch (err: any) {
      showNotification('error', 'Failed to load jobs', err?.response?.data?.message || 'Could not connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const filteredJobs = jobs.filter(job =>
    (job.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (job.department || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddNew = () => {
    setCurrentJob({
      title: '',
      department: 'Engineering',
      location: 'Remote',
      type: 'Full-time',
      status: 'active',
      description: '',
      responsibilities: [],
      requirements: [],
      benefits: [],
      salaryRange: '',
      experienceLevel: 'Mid Level',
      workMode: 'Remote'
    });
    setIsEditing(false);
    setIsDialogOpen(true);
  };

  const handleEdit = (job: any) => {
    setCurrentJob(job);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this job?')) return;
    try {
      await jobsApi.delete(id);
      showNotification('success', 'Job deleted', 'The position has been removed.');
      loadJobs();
    } catch (err: any) {
      showNotification('error', 'Delete failed', err?.response?.data?.message || 'Could not delete the job.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentJob.title || !currentJob.description) return;
    setIsSaving(true);
    try {
      if (isEditing) {
        const id = (currentJob as any)._id || currentJob.id;
        await jobsApi.update(id, currentJob);
        showNotification('success', 'Job updated', 'Changes have been saved.');
      } else {
        await jobsApi.create(currentJob);
        showNotification('success', 'Job created', 'New position has been posted.');
      }
      setIsDialogOpen(false);
      loadJobs();
    } catch (err: any) {
      showNotification('error', 'Save failed', err?.response?.data?.message || 'Could not save the job.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusToggle = async (job: any) => {
    const id = job._id || job.id;
    const newStatus = job.status === 'active' ? 'closed' : 'active';
    try {
      await jobsApi.updateStatus(id, newStatus);
      loadJobs();
    } catch (err: any) {
      showNotification('error', 'Status update failed', err?.response?.data?.message || 'Could not update job status.');
    }
  };

  const handleArrayInput = (
    field: 'responsibilities' | 'requirements' | 'benefits',
    value: string
  ) => {
    const array = value.split('\n').filter(line => line.trim().length > 0);
    setCurrentJob({ ...currentJob, [field]: array });
  };

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {notification && (
        <Notification
          type={notification.type}
          title={notification.title}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Job Listings</h1>
          <p className="text-muted-foreground mt-1">Manage open positions and applications.</p>
        </div>
        <Button onClick={handleAddNew} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md">
          <Plus className="w-4 h-4" />
          Post New Job
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-background p-1 rounded-xl">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search jobs..."
            className="pl-10 bg-white border-border/60 h-11"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="gap-2 h-11 px-6 border-border/60 bg-white">
          <Filter className="w-4 h-4" />
          Filters
        </Button>
      </div>

      {/* Job List */}
      <div className="grid gap-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-12 border border-dashed rounded-xl bg-muted/10">
            <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">No jobs found</h3>
            <p className="text-muted-foreground">Get started by posting a new job opening.</p>
          </div>
        ) : (
          filteredJobs.map((job) => {
            const jobId = job._id || job.id;
            return (
              <div
                key={jobId}
                className="group flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-white hover:shadow-md border border-border/40 rounded-xl transition-all"
              >
                <div className="space-y-3 mb-4 sm:mb-0 w-full">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-lg text-foreground">{job.title}</h3>
                    <Badge className={`${
                      job.status === 'active' ? 'bg-[#8b5cf6] hover:bg-[#7c3aed]' : 'bg-slate-500'
                    } text-white border-none px-3 py-0.5 rounded-full font-medium text-xs`}>
                      {job.status}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-muted-foreground/70" />
                      {job.department}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground/70" />
                      {job.location} ({job.workMode || 'Remote'})
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground/70" />
                      {job.type}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:self-center self-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(job)}
                    className="text-foreground font-medium hover:bg-muted"
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="hover:bg-muted">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleStatusToggle(job)}>
                        {job.status === 'active' ? 'Close Position' : 'Activate Position'}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(jobId)}>
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Edit/Create Dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-background rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-border shadow-2xl animate-in fade-in zoom-in duration-200 my-8">
            <div className="p-6 space-y-6">
              <div className="flex justify-between items-center border-b border-border/50 pb-4">
                <div>
                  <h2 className="text-2xl font-bold">{isEditing ? 'Edit Job' : 'Post New Job'}</h2>
                  <p className="text-muted-foreground text-sm mt-1">Fill in the details for the job position.</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsDialogOpen(false)} className="rounded-full">
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <form onSubmit={handleSave} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 pb-2 border-b border-border/30">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Briefcase className="w-5 h-5 text-primary" />
                      </div>
                      <h3 className="text-lg font-medium">Basic Information</h3>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Job Title</Label>
                        <Input
                          value={currentJob.title}
                          onChange={e => setCurrentJob({...currentJob, title: e.target.value})}
                          required
                          placeholder="e.g. Senior Frontend Engineer"
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Department</Label>
                        <Input
                          value={currentJob.department}
                          onChange={e => setCurrentJob({...currentJob, department: e.target.value})}
                          required
                          placeholder="e.g. Engineering, Design, Marketing"
                          className="h-11"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Employment Type</Label>
                          <Select
                            value={currentJob.type}
                            onValueChange={(val: any) => setCurrentJob({...currentJob, type: val})}
                          >
                            <SelectTrigger className="h-11">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Full-time">Full-time</SelectItem>
                              <SelectItem value="Part-time">Part-time</SelectItem>
                              <SelectItem value="Contract">Contract</SelectItem>
                              <SelectItem value="Freelance">Freelance</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Experience Level</Label>
                          <Select
                            value={currentJob.experienceLevel}
                            onValueChange={(val: any) => setCurrentJob({...currentJob, experienceLevel: val})}
                          >
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Select Level" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Entry Level">Entry Level</SelectItem>
                              <SelectItem value="Mid Level">Mid Level</SelectItem>
                              <SelectItem value="Senior">Senior</SelectItem>
                              <SelectItem value="Lead">Lead</SelectItem>
                              <SelectItem value="Executive">Executive</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center gap-2 pb-2 border-b border-border/30">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <MapPin className="w-5 h-5 text-primary" />
                      </div>
                      <h3 className="text-lg font-medium">Location & Compensation</h3>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Work Mode</Label>
                          <Select
                            value={currentJob.workMode}
                            onValueChange={(val: any) => setCurrentJob({...currentJob, workMode: val})}
                          >
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Select Mode" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Remote">Remote</SelectItem>
                              <SelectItem value="Hybrid">Hybrid</SelectItem>
                              <SelectItem value="On-site">On-site</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Location</Label>
                          <Input
                            value={currentJob.location}
                            onChange={e => setCurrentJob({...currentJob, location: e.target.value})}
                            required
                            placeholder="e.g. San Francisco, CA"
                            className="h-11"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Salary Range</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            value={currentJob.salaryRange || ''}
                            onChange={e => setCurrentJob({...currentJob, salaryRange: e.target.value})}
                            placeholder="e.g. 140k - 180k"
                            className="pl-10 h-11"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-2 pb-2 border-b border-border/30">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-medium">Role Details</h3>
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={currentJob.description}
                      onChange={e => setCurrentJob({...currentJob, description: e.target.value})}
                      className="min-h-[120px] resize-y"
                      required
                      placeholder="Brief overview of the role..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label className="flex justify-between">
                        Responsibilities
                        <span className="text-xs text-muted-foreground font-normal">One per line</span>
                      </Label>
                      <Textarea
                        value={currentJob.responsibilities?.join('\n')}
                        onChange={e => handleArrayInput('responsibilities', e.target.value)}
                        className="min-h-[200px] font-mono text-sm"
                        placeholder="- Architect scalable applications&#10;- Collaborate with designers&#10;- Optimize performance"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex justify-between">
                        Requirements
                        <span className="text-xs text-muted-foreground font-normal">One per line</span>
                      </Label>
                      <Textarea
                        value={currentJob.requirements?.join('\n')}
                        onChange={e => handleArrayInput('requirements', e.target.value)}
                        className="min-h-[200px] font-mono text-sm"
                        placeholder="- 5+ years experience&#10;- Strong TypeScript skills&#10;- State management expert"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex justify-between">
                        Benefits
                        <span className="text-xs text-muted-foreground font-normal">One per line</span>
                      </Label>
                      <Textarea
                        value={currentJob.benefits?.join('\n')}
                        onChange={e => handleArrayInput('benefits', e.target.value)}
                        className="min-h-[200px] font-mono text-sm"
                        placeholder="- Competitive salary&#10;- Health insurance&#10;- Unlimited PTO"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-border/50 sticky bottom-0 bg-background/95 backdrop-blur py-4 z-10">
                  <Button type="button" variant="outline" size="lg" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" size="lg" className="bg-blue-600 hover:bg-blue-700 text-white min-w-[150px]" disabled={isSaving}>
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Position
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
