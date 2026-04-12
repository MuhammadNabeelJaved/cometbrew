/**
 * Admin — Client Project Requests
 * View, filter, and manage all client-submitted project requests.
 * Admin can accept, reject, delete, edit, and assign team members.
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Search, Loader2, X, Eye, CheckCircle2, Clock, RefreshCw,
  AlertCircle, FolderKanban, FileText, Save, Trash2, Check, XCircle,
  CalendarDays, UserPlus, Users, ChevronLeft, ChevronRight, Download,
} from 'lucide-react';
import { useBulkSelect } from '../../hooks/useBulkSelect';
import { BulkActionBar } from '../../components/BulkActionBar';
import { exportToCsv } from '../../lib/exportCsv';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent } from '../../components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '../../components/ui/dialog';
import { Select, SelectItem } from '../../components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import ConfirmDeleteDialog from '../../components/ui/ConfirmDeleteDialog';
import { toast } from 'sonner';
import apiClient from '../../api/apiClient';
import { useDataRealtime } from '../../hooks/useDataRealtime';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Attachment {
  _id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
}

interface TeamMember {
  _id: string;
  name: string;
  email: string;
  photo?: string;
  teamProfile?: { position?: string; department?: string };
}

interface ProjectRequest {
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
  attachments: Attachment[];
  requestedBy: { _id: string; name: string; email: string } | null;
  assignedTeam: { _id: string; name: string; email: string; photo?: string }[];
  createdAt: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  pending:   'Pending',
  in_review: 'In Review',
  approved:  'Approved',
  rejected:  'Rejected',
  completed: 'Completed',
};

const STATUS_COLORS: Record<string, string> = {
  completed: 'bg-green-500/10 text-green-500 border-green-500/20',
  approved:  'bg-blue-500/10 text-blue-500 border-blue-500/20',
  in_review: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  pending:   'bg-amber-500/10 text-amber-500 border-amber-500/20',
  rejected:  'bg-red-500/10 text-red-500 border-red-500/20',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function ClientProjectRequests() {
  const location = useLocation();
  const autoOpenId = new URLSearchParams(location.search).get('projectId');
  const autoOpenHandled = useRef(false);

  const [requests, setRequests]         = useState<ProjectRequest[]>([]);
  const [teamMembers, setTeamMembers]   = useState<TeamMember[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [search, setSearch]             = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  // Edit dialog
  const [selected, setSelected]           = useState<ProjectRequest | null>(null);
  const [saving, setSaving]               = useState(false);
  const [editStatus, setEditStatus]       = useState('');
  const [editProgress, setEditProgress]   = useState('');
  const [editTotalCost, setEditTotalCost]   = useState('');
  const [editPaidAmount, setEditPaidAmount] = useState('');
  const [editAssignedTeam, setEditAssignedTeam] = useState<string[]>([]);

  // Pagination
  const PAGE_SIZE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  // Quick-action states
  const [approvingId, setApprovingId]   = useState<string | null>(null);
  const [rejectingId, setRejectingId]   = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting]         = useState(false);

  // Bulk select
  const bulk = useBulkSelect(filtered);
  const [bulkApproving, setBulkApproving] = useState(false);
  const [bulkRejecting, setBulkRejecting] = useState(false);
  const [bulkDeleting,  setBulkDeleting]  = useState(false);

  // ── Fetch requests ────────────────────────────────────────────────────────

  const fetchRequests = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await apiClient.get('/projects', { params: { limit: 100 } });
      const list: ProjectRequest[] = res.data.data?.projects ?? res.data.data ?? [];
      setRequests(list);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Fetch team members (admin + team roles) ───────────────────────────────

  const fetchTeamMembers = useCallback(async () => {
    try {
      const res = await apiClient.get('/users');
      const all: TeamMember[] = res.data.data ?? [];
      setTeamMembers(all.filter(u => (u as any).role === 'team' || (u as any).role === 'admin'));
    } catch {
      // non-critical — team list just won't populate
    }
  }, []);

  useEffect(() => {
    fetchRequests();
    fetchTeamMembers();
  }, [fetchRequests, fetchTeamMembers]);

  // Real-time: refresh when a user submits/deletes a project, or admin updates one
  useDataRealtime('projects', fetchRequests);

  // Auto-open a project dialog when navigated from a notification (?projectId=xxx)
  useEffect(() => {
    if (!autoOpenId || loading || autoOpenHandled.current) return;
    const target = requests.find(r => r._id === autoOpenId);
    if (target) {
      autoOpenHandled.current = true;
      openDetail(target);
      // Clear the query param from the URL without a full reload so back-nav works
      window.history.replaceState({}, '', '/admin/client-requests');
    }
  }, [autoOpenId, loading, requests]);

  // ── Quick: Approve ────────────────────────────────────────────────────────

  const handleApprove = async (id: string) => {
    setApprovingId(id);
    try {
      const res = await apiClient.patch(`/projects/${id}`, { status: 'approved' });
      const updated = res.data?.data;
      setRequests(prev => prev.map(r =>
        r._id === id ? (updated ?? { ...r, status: 'approved' as const }) : r
      ));
      toast.success('Project approved');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to approve');
    } finally {
      setApprovingId(null);
    }
  };

  // ── Quick: Reject ─────────────────────────────────────────────────────────

  const handleReject = async (id: string) => {
    setRejectingId(id);
    try {
      const res = await apiClient.patch(`/projects/${id}`, { status: 'rejected' });
      const updated = res.data?.data;
      setRequests(prev => prev.map(r =>
        r._id === id ? (updated ?? { ...r, status: 'rejected' as const }) : r
      ));
      toast.success('Project rejected');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to reject');
    } finally {
      setRejectingId(null);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/projects/${deleteTargetId}`);
      setRequests(prev => prev.filter(r => r._id !== deleteTargetId));
      toast.success('Project deleted');
      setDeleteTargetId(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  // ── Open edit dialog ─────────────────────────────────────────────────────

  const openDetail = (req: ProjectRequest) => {
    setSelected(req);
    setEditStatus(req.status);
    setEditProgress(String(req.progress));
    setEditTotalCost(req.totalCost ? String(req.totalCost) : '');
    setEditPaidAmount(req.paidAmount ? String(req.paidAmount) : '');
    setEditAssignedTeam((req.assignedTeam ?? []).map(m => m._id));
  };

  // ── Toggle team member ────────────────────────────────────────────────────

  const toggleMember = (id: string) => {
    setEditAssignedTeam(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // ── Save full edit ────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const body: Record<string, any> = {
        status:       editStatus,
        progress:     parseInt(editProgress) || 0,
        assignedTeam: editAssignedTeam,
      };
      if (editTotalCost !== '')  body.totalCost  = parseFloat(editTotalCost);
      if (editPaidAmount !== '') body.paidAmount = parseFloat(editPaidAmount);

      const res = await apiClient.patch(`/projects/${selected._id}`, body);
      setRequests(prev => prev.map(r => r._id === selected._id ? res.data.data : r));
      toast.success('Project updated & team assigned');
      setSelected(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  // ── Bulk: Approve ─────────────────────────────────────────────────────────

  const handleBulkApprove = async () => {
    setBulkApproving(true);
    try {
      await Promise.allSettled(bulk.ids.map(id => apiClient.patch(`/projects/${id}`, { status: 'approved' })));
      setRequests(prev => prev.map(r => bulk.ids.includes(r._id) ? { ...r, status: 'approved' as const } : r));
      toast.success(`${bulk.count} project${bulk.count > 1 ? 's' : ''} approved`);
      bulk.clear();
    } catch { toast.error('Some approvals failed'); }
    finally { setBulkApproving(false); }
  };

  // ── Bulk: Reject ──────────────────────────────────────────────────────────

  const handleBulkReject = async () => {
    setBulkRejecting(true);
    try {
      await Promise.allSettled(bulk.ids.map(id => apiClient.patch(`/projects/${id}`, { status: 'rejected' })));
      setRequests(prev => prev.map(r => bulk.ids.includes(r._id) ? { ...r, status: 'rejected' as const } : r));
      toast.success(`${bulk.count} project${bulk.count > 1 ? 's' : ''} rejected`);
      bulk.clear();
    } catch { toast.error('Some rejections failed'); }
    finally { setBulkRejecting(false); }
  };

  // ── Bulk: Delete ──────────────────────────────────────────────────────────

  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    try {
      await Promise.allSettled(bulk.ids.map(id => apiClient.delete(`/projects/${id}`)));
      setRequests(prev => prev.filter(r => !bulk.ids.includes(r._id)));
      toast.success(`${bulk.count} project${bulk.count > 1 ? 's' : ''} deleted`);
      bulk.clear();
    } catch { toast.error('Some deletes failed'); }
    finally { setBulkDeleting(false); }
  };

  // ── Export CSV ────────────────────────────────────────────────────────────

  const handleExport = () => {
    const rows = filtered.map(r => ({
      Project:       r.projectName,
      Type:          r.projectType,
      Client:        r.requestedBy?.name ?? '',
      Email:         r.requestedBy?.email ?? '',
      Budget:        r.budgetRange,
      Status:        STATUS_LABELS[r.status] ?? r.status,
      Progress:      `${r.progress}%`,
      'Total Cost':  r.totalCost ?? '',
      'Paid Amount': r.paidAmount ?? '',
      Payment:       r.paymentStatus,
      Deadline:      r.deadline ? new Date(r.deadline).toLocaleDateString() : '',
      Submitted:     new Date(r.createdAt).toLocaleDateString(),
    }));
    exportToCsv(rows, 'project-requests');
    toast.success('CSV exported');
  };

  // ── Stats ─────────────────────────────────────────────────────────────────

  const total     = requests.length;
  const pending   = requests.filter(r => r.status === 'pending').length;
  const active    = requests.filter(r => r.status === 'approved' || r.status === 'in_review').length;
  const completed = requests.filter(r => r.status === 'completed').length;

  // ── Filter + Pagination ───────────────────────────────────────────────────

  const filtered = requests.filter(r =>
    (filterStatus === 'All' || r.status === filterStatus) &&
    (
      r.projectName.toLowerCase().includes(search.toLowerCase()) ||
      (r.requestedBy?.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (r.requestedBy?.email ?? '').toLowerCase().includes(search.toLowerCase())
    )
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Reset to page 1 whenever filter/search changes
  React.useEffect(() => { setCurrentPage(1); }, [search, filterStatus]);

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Client Project Requests</h1>
          <p className="text-muted-foreground">Review, manage, and assign project requests to your team.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-2" disabled={filtered.length === 0}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={fetchRequests} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total',   value: total,     icon: FolderKanban, color: 'text-primary',   bg: 'bg-primary/10' },
          { label: 'Pending', value: pending,   icon: Clock,        color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { label: 'Active',  value: active,    icon: CheckCircle2, color: 'text-blue-500',  bg: 'bg-blue-500/10' },
          { label: 'Done',    value: completed, icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10' },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1">{loading ? '—' : stat.value}</p>
                </div>
                <div className={`p-2 rounded-full ${stat.bg}`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-card p-4 rounded-xl border border-border/50">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search project or client..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {['All', 'pending', 'in_review', 'approved', 'rejected', 'completed'].map(s => (
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

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <p className="font-semibold text-destructive">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchRequests}>Try Again</Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-border/60 rounded-2xl text-muted-foreground gap-2">
          <FileText className="h-10 w-10 opacity-30" />
          <p>{search || filterStatus !== 'All' ? 'No requests match your filter' : 'No project requests yet'}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border/50 overflow-hidden overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-10 pr-0">
                  <input
                    type="checkbox"
                    checked={bulk.allSelected}
                    ref={el => { if (el) el.indeterminate = bulk.someSelected; }}
                    onChange={bulk.toggleAll}
                    className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
                    title="Select all"
                  />
                </TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map(req => (
                <TableRow key={req._id} className={`hover:bg-muted/20 transition-colors ${bulk.isSelected(req._id) ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}>
                  {/* Checkbox */}
                  <TableCell className="pr-0" onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={bulk.isSelected(req._id)}
                      onChange={() => bulk.toggle(req._id)}
                      className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
                    />
                  </TableCell>
                  {/* Project */}
                  <TableCell className="font-semibold max-w-[150px]">
                    <p className="truncate">{req.projectName}</p>
                  </TableCell>

                  {/* Client */}
                  <TableCell>
                    {req.requestedBy ? (
                      <div className="flex items-center gap-2 min-w-[130px]">
                        <Avatar className="h-7 w-7 shrink-0">
                          <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
                            {req.requestedBy.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{req.requestedBy.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{req.requestedBy.email}</p>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Unknown</span>
                    )}
                  </TableCell>

                  {/* Type */}
                  <TableCell className="text-sm text-muted-foreground">{req.projectType}</TableCell>

                  {/* Budget */}
                  <TableCell className="text-sm font-medium">{req.budgetRange}</TableCell>

                  {/* Status */}
                  <TableCell>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[req.status]}`}>
                      {STATUS_LABELS[req.status]}
                    </span>
                  </TableCell>

                  {/* Assigned team */}
                  <TableCell>
                    {req.assignedTeam?.length ? (
                      <div className="flex -space-x-1.5">
                        {req.assignedTeam.slice(0, 3).map(m => (
                          <Avatar key={m._id} className="h-6 w-6 ring-2 ring-background" title={m.name}>
                            <AvatarImage src={m.photo} />
                            <AvatarFallback className="text-[9px] bg-primary/20 text-primary font-bold">
                              {m.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {req.assignedTeam.length > 3 && (
                          <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[9px] font-bold ring-2 ring-background">
                            +{req.assignedTeam.length - 3}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Unassigned</span>
                    )}
                  </TableCell>

                  {/* Progress */}
                  <TableCell>
                    <div className="flex items-center gap-2 min-w-[80px]">
                      <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${req.progress}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground w-7 text-right">{req.progress}%</span>
                    </div>
                  </TableCell>

                  {/* Submitted */}
                  <TableCell>
                    <div className="text-xs">
                      <p className="font-medium">{new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      <p className="text-muted-foreground">{timeAgo(req.createdAt)}</p>
                    </div>
                  </TableCell>

                  {/* Deadline */}
                  <TableCell>
                    {req.deadline ? (() => {
                      const daysLeft = Math.ceil((new Date(req.deadline).getTime() - Date.now()) / 86400000);
                      const isPast   = daysLeft < 0;
                      const isUrgent = daysLeft >= 0 && daysLeft <= 7;
                      return (
                        <div className="text-xs">
                          <p className={`font-medium ${isPast ? 'text-red-500' : isUrgent ? 'text-amber-500' : ''}`}>
                            {new Date(req.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                          <p className={`mt-0.5 ${isPast ? 'text-red-400' : isUrgent ? 'text-amber-400' : 'text-muted-foreground'}`}>
                            {isPast ? `${Math.abs(daysLeft)}d overdue` : daysLeft === 0 ? 'Due today' : `${daysLeft}d left`}
                          </p>
                        </div>
                      );
                    })() : (
                      <span className="text-xs text-muted-foreground italic">Not set</span>
                    )}
                  </TableCell>

                  {/* Actions */}
                  <TableCell>
                    <div className="flex items-center justify-center gap-1" onClick={e => e.stopPropagation()}>
                      {(req.status === 'pending' || req.status === 'in_review') && (
                        <Button
                          variant="ghost" size="icon"
                          className="h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-500/10"
                          title="Approve"
                          disabled={approvingId === req._id}
                          onClick={() => handleApprove(req._id)}
                        >
                          {approvingId === req._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        </Button>
                      )}
                      {(req.status === 'pending' || req.status === 'in_review' || req.status === 'approved') && (
                        <Button
                          variant="ghost" size="icon"
                          className="h-8 w-8 text-amber-500 hover:text-amber-600 hover:bg-amber-500/10"
                          title="Reject"
                          disabled={rejectingId === req._id}
                          onClick={() => handleReject(req._id)}
                        >
                          {rejectingId === req._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                        </Button>
                      )}
                      <Button
                        variant="ghost" size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        title="Edit & Assign"
                        onClick={() => openDetail(req)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        title="Delete"
                        onClick={() => setDeleteTargetId(req._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="px-4 py-3 border-t border-border/50 bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Showing {Math.min((currentPage - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length} request{filtered.length !== 1 ? 's' : ''}
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(p => p - 1)}
                  disabled={currentPage === 1}
                  className="h-7 w-7 rounded flex items-center justify-center hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-2 font-medium">{currentPage} / {totalPages}</span>
                <button
                  onClick={() => setCurrentPage(p => p + 1)}
                  disabled={currentPage === totalPages}
                  className="h-7 w-7 rounded flex items-center justify-center hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Full Edit + Assign Dialog */}
      <Dialog open={!!selected} onOpenChange={open => !open && !saving && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selected?.projectName}</DialogTitle>
            <DialogDescription>
              {selected?.requestedBy
                ? `Submitted by ${selected.requestedBy.name} · ${timeAgo(selected?.createdAt ?? '')}`
                : `Submitted ${timeAgo(selected?.createdAt ?? '')}`
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2 max-h-[65vh] overflow-y-auto pr-1">
            {/* Client card */}
            {selected?.requestedBy && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 border border-border/50">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {selected.requestedBy.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm">{selected.requestedBy.name}</p>
                  <p className="text-xs text-muted-foreground">{selected.requestedBy.email}</p>
                </div>
                <div className="ml-auto text-right text-xs text-muted-foreground">
                  <div className="flex items-center gap-1 justify-end">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {selected?.createdAt ? new Date(selected.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'}
                  </div>
                  <p className="text-muted-foreground/70 mt-0.5">{timeAgo(selected?.createdAt ?? '')}</p>
                </div>
              </div>
            )}

            {/* Project info */}
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Project Details</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{selected?.projectDetails}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-secondary/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Type</p>
                <p className="font-medium">{selected?.projectType}</p>
              </div>
              <div className="bg-secondary/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Budget</p>
                <p className="font-medium">{selected?.budgetRange}</p>
              </div>
              <div className={`rounded-lg p-3 col-span-2 ${
                selected?.deadline
                  ? (() => {
                      const d = Math.ceil((new Date(selected.deadline).getTime() - Date.now()) / 86400000);
                      return d < 0 ? 'bg-red-500/10 border border-red-500/20' : d <= 7 ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-secondary/30';
                    })()
                  : 'bg-secondary/30'
              }`}>
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" /> Client Requested Deadline
                </p>
                {selected?.deadline ? (() => {
                  const daysLeft = Math.ceil((new Date(selected.deadline).getTime() - Date.now()) / 86400000);
                  const isPast   = daysLeft < 0;
                  const isUrgent = daysLeft >= 0 && daysLeft <= 7;
                  return (
                    <div className="flex items-center justify-between">
                      <p className={`font-semibold ${isPast ? 'text-red-500' : isUrgent ? 'text-amber-500' : ''}`}>
                        {new Date(selected.deadline).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        isPast ? 'bg-red-500/20 text-red-500' : isUrgent ? 'bg-amber-500/20 text-amber-500' : 'bg-green-500/20 text-green-600'
                      }`}>
                        {isPast ? `${Math.abs(daysLeft)}d overdue` : daysLeft === 0 ? 'Due today' : `${daysLeft}d left`}
                      </span>
                    </div>
                  );
                })() : (
                  <p className="font-medium text-muted-foreground italic text-sm">No deadline set by client</p>
                )}
              </div>
            </div>

            {/* Attachments */}
            {selected?.attachments?.length ? (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Attachments</p>
                <div className="space-y-1.5">
                  {selected.attachments.map(att => (
                    <a key={att._id} href={att.fileUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2.5 rounded-lg bg-secondary/20 hover:bg-secondary/40 transition-colors text-sm">
                      <FileText className="h-4 w-4 text-primary shrink-0" />
                      <span className="truncate">{att.fileName}</span>
                    </a>
                  ))}
                </div>
              </div>
            ) : null}

            {/* ── Admin Controls ──────────────────────────────────────────── */}
            <div className="border-t border-border/50 pt-4 space-y-5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Admin Controls</p>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={editStatus} onValueChange={setEditStatus}>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_review">In Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Progress (%)</Label>
                  <Input type="number" min="0" max="100" value={editProgress}
                    onChange={e => setEditProgress(e.target.value)} placeholder="0–100" />
                </div>
                <div className="space-y-2">
                  <Label>Total Cost ($)</Label>
                  <Input type="number" min="0" value={editTotalCost}
                    onChange={e => setEditTotalCost(e.target.value)} placeholder="e.g. 2500" />
                </div>
                <div className="space-y-2">
                  <Label>Paid Amount ($)</Label>
                  <Input type="number" min="0" value={editPaidAmount}
                    onChange={e => setEditPaidAmount(e.target.value)} placeholder="e.g. 1250" />
                </div>
              </div>

              {/* ── Team Assignment ───────────────────────────────────────── */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-primary" />
                  <Label className="text-sm font-semibold">Assign Team Members</Label>
                  {editAssignedTeam.length > 0 && (
                    <span className="ml-auto text-xs text-primary font-medium bg-primary/10 px-2 py-0.5 rounded-full">
                      {editAssignedTeam.length} selected
                    </span>
                  )}
                </div>

                {teamMembers.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No team members found.</p>
                ) : (
                  <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                    {teamMembers.map(member => {
                      const isSelected = editAssignedTeam.includes(member._id);
                      return (
                        <div
                          key={member._id}
                          onClick={() => toggleMember(member._id)}
                          className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? 'border-primary bg-primary/5 shadow-sm'
                              : 'border-border/50 hover:border-primary/40 hover:bg-muted/30'
                          }`}
                        >
                          <Avatar className="h-9 w-9 shrink-0">
                            <AvatarImage src={member.photo} />
                            <AvatarFallback className={`text-sm font-bold ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'}`}>
                              {member.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{member.name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {member.teamProfile?.position || member.teamProfile?.department || member.email}
                            </p>
                          </div>
                          <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                            isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/30'
                          }`}>
                            {isSelected && <Check className="h-3 w-3 text-white" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="destructive" className="mr-auto gap-2"
              onClick={() => { setSelected(null); setDeleteTargetId(selected?._id ?? null); }}
              disabled={saving}
            >
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
            <Button variant="outline" onClick={() => setSelected(null)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <><Save className="h-4 w-4" /> Save & Assign</>}
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
        description="This will permanently delete the project request and all its attachments."
      />

      {/* Bulk Action Bar */}
      <BulkActionBar
        count={bulk.count}
        onClear={bulk.clear}
        itemLabel="request"
        actions={[
          { label: 'Approve',  icon: CheckCircle2, onClick: handleBulkApprove, loading: bulkApproving },
          { label: 'Reject',   icon: XCircle,      onClick: handleBulkReject,  loading: bulkRejecting, variant: 'destructive' },
          { label: 'Delete',   icon: Trash2,        onClick: handleBulkDelete,  loading: bulkDeleting,  variant: 'destructive' },
        ]}
      />
    </div>
  );
}
