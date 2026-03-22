/**
 * Team Projects Page
 * Shows both admin portfolio projects (assigned via AdminProject model)
 * and client project requests assigned to this team member.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Users, Clock, ArrowRight, Loader2, Briefcase, FolderKanban } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { adminProjectsApi } from '../../api/adminProjects.api';
import { projectsApi } from '../../api/projects.api';
import { toast } from 'sonner';

// ─── Admin Portfolio Project ───────────────────────────────────────────────
interface AdminProject {
  _id: string;
  projectTitle: string;
  clientName: string;
  status: string;
  yourRole: string;
  deadline?: string;
  startDate?: string;
  completionPercentage?: number;
  teamMembers?: { memberId: { name: string; email: string } | null; role: string }[];
  projectDescription?: string;
  priority?: string;
  tags?: string[];
  category?: string;
}

// ─── Client Project Request ────────────────────────────────────────────────
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
  requestedBy?: { _id: string; name: string; email: string; photo?: string };
  assignedTeam: { _id: string; name: string; email: string; photo?: string }[];
  createdAt: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function adminStatusVariant(status: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (status === 'In Progress') return 'default';
  if (status === 'Completed') return 'secondary';
  return 'outline';
}

const clientStatusConfig: Record<string, { label: string; className: string }> = {
  pending:   { label: 'Pending',     className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30' },
  in_review: { label: 'In Review',   className: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
  approved:  { label: 'Approved',    className: 'bg-green-500/10 text-green-600 border-green-500/30' },
  rejected:  { label: 'Rejected',    className: 'bg-red-500/10 text-red-600 border-red-500/30' },
  completed: { label: 'Completed',   className: 'bg-purple-500/10 text-purple-600 border-purple-500/30' },
};

function formatDate(dateStr?: string) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Component ─────────────────────────────────────────────────────────────
export default function TeamProjects() {
  const navigate = useNavigate();

  const [adminProjects, setAdminProjects]   = useState<AdminProject[]>([]);
  const [clientRequests, setClientRequests] = useState<ClientRequest[]>([]);
  const [loading, setLoading]               = useState(true);
  const [activeTab, setActiveTab]           = useState<'portfolio' | 'client'>('client');

  // ── Fetch both project sources in parallel ──
  const fetchAll = async () => {
    try {
      setLoading(true);
      const [adminRes, clientRes] = await Promise.allSettled([
        adminProjectsApi.getAll(),
        projectsApi.getAll(),
      ]);

      if (adminRes.status === 'fulfilled') {
        const d = adminRes.value.data.data;
        setAdminProjects(d?.projects || d || []);
      }
      if (clientRes.status === 'fulfilled') {
        const d = clientRes.value.data.data;
        setClientRequests(d?.projects || d || []);
      }
    } catch {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await adminProjectsApi.updateStatus(id, status);
      setAdminProjects(prev => prev.map(p => p._id === id ? { ...p, status } : p));
      toast.success('Status updated');
    } catch {
      toast.error('Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Projects</h2>
          <p className="text-muted-foreground">Your assigned portfolio projects and client requests.</p>
        </div>
      </div>

      {/* Tab Toggle */}
      <div className="flex gap-2 border-b border-border pb-1">
        <button
          onClick={() => setActiveTab('client')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
            activeTab === 'client'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <FolderKanban className="h-4 w-4" />
          Client Requests
          {clientRequests.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
              {clientRequests.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('portfolio')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
            activeTab === 'portfolio'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Briefcase className="h-4 w-4" />
          Portfolio Projects
          {adminProjects.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
              {adminProjects.length}
            </span>
          )}
        </button>
      </div>

      {/* ── Client Requests Tab ─────────────────────────────────── */}
      {activeTab === 'client' && (
        <>
          {clientRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-2">
              <FolderKanban className="h-10 w-10 opacity-30" />
              <p className="text-lg font-medium">No client requests assigned</p>
              <p className="text-sm">Projects assigned to you by admin will appear here.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {clientRequests.map((req) => {
                const sc = clientStatusConfig[req.status] ?? { label: req.status, className: '' };
                return (
                  <Card
                    key={req._id}
                    className="group hover:border-primary/50 transition-all duration-300 flex flex-col cursor-pointer"
                    onClick={() => navigate(`/team/client-requests/${req._id}`)}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start mb-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${sc.className}`}>
                          {sc.label}
                        </span>
                        <span className="text-xs text-muted-foreground">{req.projectType}</span>
                      </div>
                      <CardTitle className="line-clamp-1 group-hover:text-primary transition-colors">
                        {req.projectName}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Users className="h-3 w-3" />
                        {req.requestedBy?.name ?? 'Unknown client'}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="flex-1 flex flex-col">
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2 min-h-[40px]">
                        {req.projectDetails}
                      </p>

                      <div className="mt-auto space-y-4">
                        {/* Progress */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium">{req.progress ?? 0}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all duration-500"
                              style={{ width: `${req.progress ?? 0}%` }}
                            />
                          </div>
                        </div>

                        {/* Budget & Deadline */}
                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">{req.budgetRange}</span>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(req.deadline)}
                          </div>
                        </div>

                        {/* Assigned team avatars */}
                        {req.assignedTeam?.length > 0 && (
                          <div className="flex items-center gap-2 pt-3 border-t border-border/50">
                            <span className="text-xs text-muted-foreground">Team:</span>
                            <div className="flex -space-x-2">
                              {req.assignedTeam.slice(0, 4).map((m) => (
                                <div
                                  key={m._id}
                                  title={m.name}
                                  className="h-6 w-6 rounded-full bg-primary/10 border-2 border-background flex items-center justify-center text-[10px] font-bold text-primary overflow-hidden"
                                >
                                  {m.photo
                                    ? <img src={m.photo} alt={m.name} className="h-full w-full object-cover" />
                                    : m.name?.[0]?.toUpperCase() ?? '?'
                                  }
                                </div>
                              ))}
                              {req.assignedTeam.length > 4 && (
                                <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px] font-medium text-muted-foreground">
                                  +{req.assignedTeam.length - 4}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── Portfolio Projects Tab ──────────────────────────────── */}
      {activeTab === 'portfolio' && (
        <>
          {adminProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-2">
              <Briefcase className="h-10 w-10 opacity-30" />
              <p className="text-lg font-medium">No portfolio projects found</p>
              <p className="text-sm">Projects created by admin will appear here.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {adminProjects.map((project) => (
                <Card key={project._id} className="group hover:border-primary/50 transition-all duration-300 flex flex-col">
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant={adminStatusVariant(project.status)}>{project.status}</Badge>
                      <div className="flex gap-1">
                        {project.status === 'Draft' && (
                          <Button
                            variant="ghost" size="icon"
                            className="h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-500/10"
                            onClick={() => handleUpdateStatus(project._id, 'In Progress')}
                            title="Start Project"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <CardTitle
                      className="line-clamp-1 group-hover:text-primary transition-colors cursor-pointer"
                      onClick={() => navigate(`/team/projects/${project._id}`)}
                    >
                      {project.projectTitle}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Users className="h-3 w-3" /> {project.clientName}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1 flex flex-col">
                    <p className="text-sm text-muted-foreground mb-6 line-clamp-2 min-h-[40px]">
                      {project.projectDescription || '—'}
                    </p>

                    <div className="mt-auto space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{project.completionPercentage ?? 0}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all duration-500"
                            style={{ width: `${project.completionPercentage ?? 0}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-4 border-t border-border/50">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDate(project.deadline)}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-2">
                            {(project.teamMembers || []).slice(0, 3).map((m, i) => (
                              <div key={i} className="h-6 w-6 rounded-full bg-primary/10 border-2 border-background flex items-center justify-center text-[10px] font-bold text-primary overflow-hidden">
                                {m.memberId?.name?.[0] ?? '?'}
                              </div>
                            ))}
                          </div>
                          <Button
                            variant="ghost" size="sm"
                            className="h-6 text-xs px-2"
                            onClick={() => navigate(`/team/projects/${project._id}`)}
                          >
                            Details <ArrowRight className="h-3 w-3 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
