/**
 * Team Dashboard Home
 * Fetches real tasks and projects from DB.
 */
import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  FolderKanban,
  Clock,
  Target,
  ArrowRight,
  Activity,
  CheckCircle2,
  Circle,
  Timer,
  AlertCircle,
  ArrowUpRight,
  MoreHorizontal,
  Loader2,
  Smile, Meh, Frown, Zap, ShieldAlert,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { tasksApi } from '../../api/tasks.api';
import { adminProjectsApi } from '../../api/adminProjects.api';
import { standupApi, StandupNote, AvailabilityStatus } from '../../api/standup.api';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Task {
  _id: string;
  title: string;
  status: 'todo' | 'in_progress' | 'in_review' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  tags?: string[];
  project?: { _id: string; projectTitle: string } | null;
  createdAt?: string;
  updatedAt?: string;
}

interface Project {
  _id: string;
  projectTitle: string;
  clientName: string;
  status: string;
  completionPercentage?: number;
  deadline?: string;
  teamMembers?: { memberId: { _id: string; name: string } | null; role: string }[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDue(dateStr?: string): { label: string; isToday: boolean; isOverdue: boolean } {
  if (!dateStr) return { label: '—', isToday: false, isOverdue: false };
  const due = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const diff = Math.round((dueDay.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return { label: 'Today', isToday: true, isOverdue: false };
  if (diff === 1) return { label: 'Tomorrow', isToday: false, isOverdue: false };
  if (diff === -1) return { label: 'Yesterday', isToday: false, isOverdue: true };
  if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, isToday: false, isOverdue: true };
  if (diff <= 7) return { label: `In ${diff} days`, isToday: false, isOverdue: false };
  return {
    label: due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    isToday: false,
    isOverdue: false,
  };
}

function timeAgo(dateStr?: string): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const STATUS_MAP: Record<Task['status'], string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  in_review: 'In Review',
  completed: 'Completed',
};

const NEXT_STATUS: Record<Task['status'], Task['status']> = {
  todo: 'in_progress',
  in_progress: 'in_review',
  in_review: 'completed',
  completed: 'todo',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function TeamDashboardHome() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Standup state ─────────────────────────────────────────────────────────
  const [standup, setStandup] = useState<StandupNote | null>(null);
  const [standupForm, setStandupForm] = useState({ didYesterday: '', doingToday: '', blockers: '', mood: 'good' as StandupNote['mood'] });
  const [isSavingStandup, setIsSavingStandup] = useState(false);
  const [standupSaved, setStandupSaved] = useState(false);
  const [myStatus, setMyStatus] = useState<AvailabilityStatus>('available');

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchAll = async () => {
    try {
      const [tasksRes, projectsRes, standupRes] = await Promise.all([
        tasksApi.getAll(),
        adminProjectsApi.getAll(),
        standupApi.getTodayStandup(),
      ]);
      // getAll returns { tasks: [...], pagination: {} }
      const allTasks: Task[] = tasksRes.data.data?.tasks ?? tasksRes.data.data ?? [];
      setTasks(allTasks);
      const pd = projectsRes.data.data;
      setProjects(pd?.projects || pd || []);
      const existingStandup = standupRes.data.data;
      if (existingStandup) {
        setStandup(existingStandup);
        setStandupForm({
          didYesterday: existingStandup.didYesterday,
          doingToday: existingStandup.doingToday,
          blockers: existingStandup.blockers,
          mood: existingStandup.mood,
        });
        setStandupSaved(true);
      }
    } catch (err: any) {
      toast.error('Failed to load dashboard data', { description: err?.response?.data?.message || 'Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleSaveStandup = async () => {
    setIsSavingStandup(true);
    try {
      const res = await standupApi.upsertStandup(standupForm);
      setStandup(res.data.data);
      setStandupSaved(true);
      toast.success('Standup saved!');
    } catch { toast.error('Failed to save standup'); }
    finally { setIsSavingStandup(false); }
  };

  const STATUS_OPTS: { value: AvailabilityStatus; label: string; color: string; emoji: string }[] = [
    { value: 'available', label: 'Available', color: 'bg-green-500', emoji: '🟢' },
    { value: 'busy', label: 'Busy', color: 'bg-red-500', emoji: '🔴' },
    { value: 'meeting', label: 'In Meeting', color: 'bg-amber-500', emoji: '🟡' },
    { value: 'away', label: 'Away', color: 'bg-gray-400', emoji: '⚪' },
    { value: 'wfh', label: 'WFH', color: 'bg-blue-500', emoji: '🔵' },
    { value: 'offline', label: 'Offline', color: 'bg-slate-500', emoji: '⚫' },
  ];

  const MOOD_OPTS: { value: StandupNote['mood']; emoji: string; label: string }[] = [
    { value: 'great', emoji: '🚀', label: 'Great' },
    { value: 'good', emoji: '😊', label: 'Good' },
    { value: 'okay', emoji: '😐', label: 'Okay' },
    { value: 'stressed', emoji: '😰', label: 'Stressed' },
    { value: 'blocked', emoji: '🚫', label: 'Blocked' },
  ];

  // ── Status update ─────────────────────────────────────────────────────────

  const handleStatusUpdate = async (task: Task, newStatus: Task['status']) => {
    try {
      await tasksApi.updateStatus(task._id, newStatus);
      setTasks(prev => prev.map(t => t._id === task._id ? { ...t, status: newStatus } : t));
    } catch (err: any) {
      toast.error('Failed to update status', { description: err?.response?.data?.message || 'Please try again.' });
    }
  };

  // ── Derived stats ─────────────────────────────────────────────────────────

  const activeTasks     = tasks.filter(t => t.status !== 'completed');
  const completedTasks  = tasks.filter(t => t.status === 'completed');
  const dueTodayCount   = tasks.filter(t => t.dueDate && formatDue(t.dueDate).isToday).length;
  const activeProjects  = projects.filter(p => p.status === 'In Progress' || p.status === 'Active');
  const efficiency      = tasks.length > 0
    ? Math.round((completedTasks.length / tasks.length) * 100)
    : 0;

  // Recent 4 tasks as "activity" (sorted by updatedAt desc)
  const recentActivity = [...tasks]
    .sort((a, b) => new Date(b.updatedAt || '').getTime() - new Date(a.updatedAt || '').getTime())
    .slice(0, 4);

  const userInitials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'completed':  return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'in_progress': return <Timer className="h-4 w-4 text-blue-500" />;
      case 'in_review':  return <AlertCircle className="h-4 w-4 text-amber-500" />;
      default:           return <Circle className="h-4 w-4 text-slate-400" />;
    }
  };

  const getPriorityDot = (priority: Task['priority']) => {
    if (priority === 'high')   return 'bg-red-500';
    if (priority === 'medium') return 'bg-amber-500';
    return 'bg-blue-500';
  };

  const getActivityLabel = (status: Task['status']) => {
    if (status === 'completed')   return 'completed task';
    if (status === 'in_progress') return 'started working on';
    if (status === 'in_review')   return 'submitted for review';
    return 'created task';
  };

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground mt-1">Overview of your work and team activity.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2" onClick={() => navigate('/team/projects')}>
            <FolderKanban className="h-4 w-4" /> Projects
          </Button>
          <Button className="gap-2 shadow-lg shadow-primary/20" onClick={() => navigate('/team/tasks')}>
            + Create Task
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-primary/10 via-background to-background border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTasks.length}</div>
            <p className="text-xs mt-1">
              {dueTodayCount > 0
                ? <span className="text-amber-500 font-medium">{dueTodayCount} due today</span>
                : <span className="text-muted-foreground">No tasks due today</span>
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProjects.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {projects.length} total projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTasks.length}</div>
            <p className="text-xs text-green-500 mt-1 flex items-center">
              <ArrowUpRight className="h-3 w-3 mr-1" /> Tasks done
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efficiency</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{efficiency}%</div>
            <p className="text-xs text-muted-foreground mt-1">Task completion rate</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Daily Standup & Availability ───────────────────────────────────── */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="text-base">Daily Standup</CardTitle>
              <CardDescription>Your check-in for today · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</CardDescription>
            </div>
            {/* Availability status picker */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground hidden sm:inline">Status:</span>
              <div className="flex gap-1 flex-wrap">
                {STATUS_OPTS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={async () => {
                      setMyStatus(opt.value);
                      try { await standupApi.updateStatus(opt.value); }
                      catch { toast.error('Failed to update status'); }
                    }}
                    title={opt.label}
                    className={`text-xs px-2 py-1 rounded-full border transition-all ${myStatus === opt.value ? 'border-primary bg-primary/10 font-semibold' : 'border-border/40 hover:border-border'}`}
                  >
                    {opt.emoji} {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {standupSaved && standup ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-600 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" /> Standup submitted!
                </span>
                <button onClick={() => setStandupSaved(false)} className="text-xs text-muted-foreground hover:text-foreground underline">Edit</button>
              </div>
              <div className="grid sm:grid-cols-3 gap-3 text-sm">
                <div className="bg-muted/30 rounded-xl p-3">
                  <p className="text-xs text-muted-foreground font-medium mb-1">Yesterday</p>
                  <p className="text-sm leading-relaxed">{standup.didYesterday || '—'}</p>
                </div>
                <div className="bg-muted/30 rounded-xl p-3">
                  <p className="text-xs text-muted-foreground font-medium mb-1">Today</p>
                  <p className="text-sm leading-relaxed">{standup.doingToday || '—'}</p>
                </div>
                <div className="bg-muted/30 rounded-xl p-3">
                  <p className="text-xs text-muted-foreground font-medium mb-1">Blockers</p>
                  <p className="text-sm leading-relaxed">{standup.blockers || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Mood:</span>
                <span>{MOOD_OPTS.find(m => m.value === standup.mood)?.emoji} {MOOD_OPTS.find(m => m.value === standup.mood)?.label}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Mood selector */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground font-medium">Mood today:</span>
                {MOOD_OPTS.map(opt => (
                  <button key={opt.value} onClick={() => setStandupForm(f => ({ ...f, mood: opt.value }))} title={opt.label}
                    className={`text-lg transition-all ${standupForm.mood === opt.value ? 'scale-125' : 'opacity-50 hover:opacity-80'}`}>
                    {opt.emoji}
                  </button>
                ))}
              </div>
              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground font-medium block mb-1">What did you do yesterday?</label>
                  <textarea value={standupForm.didYesterday} onChange={e => setStandupForm(f => ({ ...f, didYesterday: e.target.value }))} rows={3} placeholder="Completed the login API, reviewed PRs…" className="w-full text-sm rounded-xl border border-border/50 bg-muted/20 px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30 resize-none placeholder:text-muted-foreground/50" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground font-medium block mb-1">What will you do today?</label>
                  <textarea value={standupForm.doingToday} onChange={e => setStandupForm(f => ({ ...f, doingToday: e.target.value }))} rows={3} placeholder="Finish dashboard UI, team call at 2pm…" className="w-full text-sm rounded-xl border border-border/50 bg-muted/20 px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30 resize-none placeholder:text-muted-foreground/50" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground font-medium block mb-1">Any blockers?</label>
                  <textarea value={standupForm.blockers} onChange={e => setStandupForm(f => ({ ...f, blockers: e.target.value }))} rows={3} placeholder="Waiting for design assets, blocked on…" className="w-full text-sm rounded-xl border border-border/50 bg-muted/20 px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30 resize-none placeholder:text-muted-foreground/50" />
                </div>
              </div>
              <Button onClick={handleSaveStandup} disabled={isSavingStandup || (!standupForm.didYesterday && !standupForm.doingToday)} className="gap-2">
                {isSavingStandup ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Submit Standup
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-7">

        {/* My Tasks */}
        <div className="col-span-1 md:col-span-4 space-y-6">
          <Card className="h-full border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Tasks</CardTitle>
                  <CardDescription>Workspace tasks overview.</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="gap-1" onClick={() => navigate('/team/tasks')}>
                  View All <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-2 sm:px-6">
              {tasks.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckSquare className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p>No tasks yet.</p>
                  <Button size="sm" className="mt-4" onClick={() => navigate('/team/tasks')}>
                    Create a task
                  </Button>
                </div>
              ) : (
                <div className="space-y-1">
                  <AnimatePresence>
                    {tasks.slice(0, 6).map((task) => {
                      const due = formatDue(task.dueDate);
                      return (
                        <motion.div
                          key={task._id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, height: 0 }}
                          className="group flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 border border-transparent hover:border-border/50 transition-all"
                        >
                          <div className="flex items-start gap-3 overflow-hidden">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="mt-1 flex-shrink-0 focus:outline-none">
                                  {getStatusIcon(task.status)}
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start">
                                <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleStatusUpdate(task, 'todo')}>
                                  <Circle className="h-3 w-3 mr-2 text-slate-400" /> To Do
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusUpdate(task, 'in_progress')}>
                                  <Timer className="h-3 w-3 mr-2 text-blue-500" /> In Progress
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusUpdate(task, 'in_review')}>
                                  <AlertCircle className="h-3 w-3 mr-2 text-amber-500" /> In Review
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusUpdate(task, 'completed')}>
                                  <CheckCircle2 className="h-3 w-3 mr-2 text-green-500" /> Completed
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>

                            <div className="min-w-0">
                              <p className={`font-medium text-sm truncate ${task.status === 'completed' ? 'text-muted-foreground line-through' : ''}`}>
                                {task.title}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                {task.project && (
                                  <Badge variant="secondary" className="text-[10px] h-4 px-1">
                                    {task.project.projectTitle}
                                  </Badge>
                                )}
                                <span className={`w-1.5 h-1.5 rounded-full ${getPriorityDot(task.priority)}`} title={`Priority: ${task.priority}`} />
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 pl-4 shrink-0">
                            <p className={`text-xs font-medium ${due.isToday ? 'text-amber-500' : due.isOverdue ? 'text-red-500' : 'text-muted-foreground'}`}>
                              {due.label}
                            </p>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => navigate('/team/tasks')}>
                                  Open in Kanban
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusUpdate(task, NEXT_STATUS[task.status])}>
                                  Mark as {STATUS_MAP[NEXT_STATUS[task.status]]}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="col-span-1 md:col-span-3 space-y-6">

          {/* Recent Activity (derived from tasks) */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" /> Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No recent activity.</p>
              ) : (
                <div className="space-y-4 relative">
                  <div className="absolute left-4 top-2 bottom-2 w-px bg-border/50" />
                  {recentActivity.map((task) => (
                    <div key={task._id} className="relative pl-10 flex gap-3 text-sm">
                      <Avatar className="h-8 w-8 absolute left-0 border-2 border-background z-10">
                        <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="leading-snug">
                          <span className="font-semibold text-foreground">{user?.name || 'You'}</span>
                          <span className="text-muted-foreground"> {getActivityLabel(task.status)} </span>
                          <span className="font-medium text-foreground">{task.title}</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(task.updatedAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assigned Projects */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Assigned Projects</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {projects.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No projects assigned.</p>
              ) : (
                projects.slice(0, 3).map((project) => {
                  const myRole = project.teamMembers?.find(
                    m => m.memberId?._id === user?._id
                  )?.role;
                  return (
                    <div key={project._id} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium truncate">{project.projectTitle}</span>
                        <span className="text-muted-foreground text-xs shrink-0 ml-2">{project.status}</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-500"
                          style={{ width: `${project.completionPercentage ?? 0}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{myRole || project.clientName}</span>
                        <span>{project.completionPercentage ?? 0}%</span>
                      </div>
                    </div>
                  );
                })
              )}
              <Button variant="ghost" className="w-full text-xs" asChild>
                <Link to="/team/projects">View All Projects</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
