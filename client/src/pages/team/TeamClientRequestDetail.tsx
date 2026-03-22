/**
 * Team Client Request Detail Page
 * Shows full details of a client project request assigned to this team member.
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Calendar, Clock, DollarSign, FileText,
  Loader2, Users, Paperclip, ExternalLink, User
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { projectsApi } from '../../api/projects.api';
import { toast } from 'sonner';

interface Attachment {
  _id: string;
  fileName: string;
  fileUrl: string;
  fileType: 'image' | 'pdf' | 'doc' | 'other';
}

interface ClientRequest {
  _id: string;
  projectName: string;
  projectType: string;
  budgetRange: string;
  projectDetails: string;
  status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'completed';
  progress: number;
  deadline?: string;
  totalCost?: number;
  paidAmount?: number;
  dueAmount?: number;
  paymentStatus?: 'unpaid' | 'partial' | 'paid';
  attachments: Attachment[];
  requestedBy?: { _id: string; name: string; email: string; photo?: string };
  assignedTeam: { _id: string; name: string; email: string; photo?: string }[];
  createdAt: string;
}

// ─── Status Config ─────────────────────────────────────────────────────────
const statusConfig: Record<string, { label: string; className: string }> = {
  pending:   { label: 'Pending',   className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30' },
  in_review: { label: 'In Review', className: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
  approved:  { label: 'Approved',  className: 'bg-green-500/10 text-green-600 border-green-500/30' },
  rejected:  { label: 'Rejected',  className: 'bg-red-500/10 text-red-600 border-red-500/30' },
  completed: { label: 'Completed', className: 'bg-purple-500/10 text-purple-600 border-purple-500/30' },
};

const paymentStatusConfig: Record<string, { label: string; className: string }> = {
  unpaid:  { label: 'Unpaid',   className: 'bg-red-500/10 text-red-600 border-red-500/30' },
  partial: { label: 'Partial',  className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30' },
  paid:    { label: 'Paid',     className: 'bg-green-500/10 text-green-600 border-green-500/30' },
};

function formatDate(dateStr?: string) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months > 1 ? 's' : ''} ago`;
}

function fileIcon(type: string) {
  if (type === 'pdf') return '📄';
  if (type === 'image') return '🖼️';
  if (type === 'doc') return '📝';
  return '📎';
}

// ─── Component ─────────────────────────────────────────────────────────────
export default function TeamClientRequestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<ClientRequest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    projectsApi.getById(id)
      .then(res => setProject(res.data.data))
      .catch(() => toast.error('Failed to load project details'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate('/team/projects')} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Projects
        </Button>
        <div className="text-center text-muted-foreground py-16">Project not found.</div>
      </div>
    );
  }

  const sc  = statusConfig[project.status]  ?? { label: project.status, className: '' };
  const psc = paymentStatusConfig[project.paymentStatus ?? 'unpaid'];

  return (
    <div className="space-y-6">
      {/* Back */}
      <Button variant="ghost" onClick={() => navigate('/team/projects')} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Back to Projects
      </Button>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold tracking-tight">{project.projectName}</h1>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${sc.className}`}>
              {sc.label}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1.5">
              <FileText className="h-4 w-4" /> {project.projectType}
            </span>
            <span className="flex items-center gap-1.5">
              <DollarSign className="h-4 w-4" /> {project.budgetRange}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" /> Submitted {timeAgo(project.createdAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Overall Progress</span>
          <span className="font-semibold">{project.progress ?? 0}%</span>
        </div>
        <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-700 rounded-full"
            style={{ width: `${project.progress ?? 0}%` }}
          />
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left: Details + Attachments ───────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Project Description */}
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {project.projectDetails}
              </p>
            </CardContent>
          </Card>

          {/* Attachments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Paperclip className="h-4 w-4" /> Attachments
                {project.attachments.length > 0 && (
                  <span className="ml-auto text-xs font-normal text-muted-foreground">
                    {project.attachments.length} file{project.attachments.length !== 1 ? 's' : ''}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {project.attachments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
                  <Paperclip className="h-8 w-8 opacity-30" />
                  <p className="text-sm">No attachments uploaded</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {project.attachments.map((att) => (
                    <a
                      key={att._id}
                      href={att.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group"
                    >
                      <span className="text-2xl">{fileIcon(att.fileType)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{att.fileName}</p>
                        <p className="text-xs text-muted-foreground capitalize">{att.fileType}</p>
                      </div>
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
                    </a>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assigned Team */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4" /> Assigned Team
              </CardTitle>
            </CardHeader>
            <CardContent>
              {project.assignedTeam.length === 0 ? (
                <p className="text-sm text-muted-foreground">No team members assigned.</p>
              ) : (
                <div className="space-y-3">
                  {project.assignedTeam.map((member) => (
                    <div key={member._id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
                      <Avatar className="h-9 w-9">
                        {member.photo && <AvatarImage src={member.photo} alt={member.name} />}
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                          {member.name?.[0]?.toUpperCase() ?? '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Right: Sidebar ─────────────────────────────────────── */}
        <div className="space-y-6">

          {/* Client Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4" /> Client
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  {project.requestedBy?.photo && (
                    <AvatarImage src={project.requestedBy.photo} alt={project.requestedBy.name} />
                  )}
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {project.requestedBy?.name?.[0]?.toUpperCase() ?? '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">{project.requestedBy?.name ?? 'Unknown'}</p>
                  <p className="text-xs text-muted-foreground">{project.requestedBy?.email ?? '—'}</p>
                </div>
              </div>
              <div className="flex justify-between text-xs pt-1 border-t">
                <span className="text-muted-foreground">Submitted</span>
                <span className="font-medium">{formatDate(project.createdAt)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Project Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Project Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-0 text-sm">
              {[
                { label: 'Type',    value: project.projectType },
                { label: 'Budget',  value: project.budgetRange },
                { label: 'Deadline', value: formatDate(project.deadline) },
                { label: 'Submitted', value: formatDate(project.createdAt) },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between py-2.5 border-b last:border-0">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium text-right">{value || '—'}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Payment Info */}
          {project.totalCost !== undefined && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  Payment
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${psc.className}`}>
                    {psc.label}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-0 text-sm">
                {[
                  { label: 'Total Cost', value: project.totalCost !== undefined ? `$${project.totalCost.toLocaleString()}` : '—' },
                  { label: 'Paid',       value: project.paidAmount !== undefined ? `$${project.paidAmount.toLocaleString()}` : '—' },
                  { label: 'Due',        value: project.dueAmount  !== undefined ? `$${project.dueAmount.toLocaleString()}`  : '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between py-2.5 border-b last:border-0">
                    <span className="text-muted-foreground">{label}</span>
                    <span className={`font-medium ${label === 'Due' && (project.dueAmount ?? 0) > 0 ? 'text-red-500' : ''}`}>
                      {value}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
