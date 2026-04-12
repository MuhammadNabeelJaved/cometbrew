/**
 * Team Reports Page
 * Real productivity and performance analytics from live task/project data.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
  Download, RefreshCw, CheckCheck, Clock, AlertTriangle, TrendingUp,
  FolderKanban, ListChecks, Flame,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { tasksApi } from '../../api/tasks.api';
import { projectsApi } from '../../api/projects.api';
import { standupApi } from '../../api/standup.api';
import { exportToCsv } from '../../lib/exportCsv';
import { toast } from 'sonner';

interface Task {
  _id: string; title: string; status: string; priority: string; dueDate?: string; createdAt?: string;
}
interface Project {
  _id: string; projectName: string; status: string; progress: number; deadline?: string;
}

const PIE_COLORS = ['#7c3aed', '#2563eb', '#16a34a', '#d97706', '#dc2626'];

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-muted rounded-lg ${className ?? ''}`} />;
}

export default function TeamReports() {
  const [tasks,    setTasks]    = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [streak,   setStreak]   = useState(0);
  const [loading,  setLoading]  = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, pRes, sRes] = await Promise.allSettled([
        tasksApi.getAll({ limit: 200 }),
        projectsApi.getAll({ limit: 100 }),
        standupApi.getHistory(),
      ]);
      if (tRes.status === 'fulfilled') {
        const d = tRes.value.data.data;
        setTasks(d?.tasks ?? d ?? []);
      }
      if (pRes.status === 'fulfilled') {
        const d = pRes.value.data.data;
        setProjects(d?.projects ?? d ?? []);
      }
      if (sRes.status === 'fulfilled') {
        // Calculate standup streak: consecutive days from today going backward
        const notes: { date: string }[] = sRes.value.data.data ?? [];
        const dateSet = new Set(notes.map(n => n.date));
        let s = 0;
        const today = new Date();
        for (let i = 0; i < 30; i++) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          const key = d.toISOString().slice(0, 10);
          if (dateSet.has(key)) s++;
          else if (i > 0) break; // gap found, stop
        }
        setStreak(s);
      }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Derived stats ─────────────────────────────────────────────────────────

  const totalTasks     = tasks.length;
  const doneTasks      = tasks.filter(t => t.status === 'completed').length;
  const inProgressT    = tasks.filter(t => t.status === 'in_progress').length;
  const overdueTasks   = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed').length;
  const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const activeProjects = projects.filter(p => p.status === 'approved' || p.status === 'in_review').length;
  const overdueProjects = projects.filter(p =>
    p.deadline && new Date(p.deadline) < new Date() && p.status !== 'completed'
  ).length;

  // Pie: tasks by status
  const taskStatusData = [
    { name: 'To Do',       value: tasks.filter(t => t.status === 'todo').length,        color: PIE_COLORS[1] },
    { name: 'In Progress', value: tasks.filter(t => t.status === 'in_progress').length, color: PIE_COLORS[0] },
    { name: 'In Review',   value: tasks.filter(t => t.status === 'in_review').length,   color: PIE_COLORS[3] },
    { name: 'Completed',   value: doneTasks,                                             color: PIE_COLORS[2] },
  ].filter(d => d.value > 0);

  // Bar: tasks by priority
  const priorityData = [
    { name: 'High',   count: tasks.filter(t => t.priority === 'high').length   },
    { name: 'Medium', count: tasks.filter(t => t.priority === 'medium').length },
    { name: 'Low',    count: tasks.filter(t => t.priority === 'low').length    },
  ];

  // Upcoming deadlines (next 14 days)
  const upcoming = projects
    .filter(p => p.deadline && p.status !== 'completed')
    .map(p => ({ ...p, daysLeft: Math.ceil((new Date(p.deadline!).getTime() - Date.now()) / 86400000) }))
    .filter(p => p.daysLeft >= 0 && p.daysLeft <= 14)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 5);

  const handleExport = () => {
    const rows = tasks.map(t => ({
      Title: t.title, Status: t.status, Priority: t.priority,
      'Due Date': t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '',
    }));
    exportToCsv(rows, 'team-report');
    toast.success('Report exported as CSV');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics & Reports</h2>
          <p className="text-muted-foreground">Your live productivity and project performance.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={fetchAll} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button className="gap-2" onClick={handleExport} disabled={tasks.length === 0}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Tasks',        value: totalTasks,      icon: ListChecks,   color: 'text-primary',     bg: 'bg-primary/10'     },
          { label: 'Completed',          value: doneTasks,       icon: CheckCheck,   color: 'text-green-500',   bg: 'bg-green-500/10'   },
          { label: 'Overdue Tasks',      value: overdueTasks,    icon: AlertTriangle,color: 'text-red-500',     bg: 'bg-red-500/10'     },
          { label: 'Active Projects',    value: activeProjects,  icon: FolderKanban, color: 'text-blue-500',    bg: 'bg-blue-500/10'    },
        ].map(s => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-2xl font-bold mt-1">{loading ? '—' : s.value}</p>
                </div>
                <div className={`p-2.5 rounded-xl ${s.bg}`}>
                  <Icon className={`h-5 w-5 ${s.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Tasks by Priority bar */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Tasks by Priority</CardTitle>
            <CardDescription>Distribution across all priority levels</CardDescription>
          </CardHeader>
          <CardContent className="h-[240px]">
            {loading ? <Skeleton className="h-full" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityData} barSize={40}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="count" name="Tasks" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Tasks by Status pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Tasks by Status</CardTitle>
            <CardDescription>Across all workflow stages</CardDescription>
          </CardHeader>
          <CardContent className="h-[240px]">
            {loading ? <Skeleton className="h-full" /> : taskStatusData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">No tasks yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={taskStatusData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                    {taskStatusData.map((_, i) => <Cell key={i} fill={_.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                  <Legend formatter={(v) => <span className="text-xs text-muted-foreground">{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance summary + Upcoming deadlines */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Performance */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Performance Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? <div className="space-y-3">{[...Array(3)].map((_,i) => <Skeleton key={i} className="h-14" />)}</div> : <>
              <div className="flex items-center justify-between py-3 border-b border-border/50">
                <div>
                  <p className="font-medium text-sm">Task Completion Rate</p>
                  <p className="text-xs text-muted-foreground">{doneTasks} of {totalTasks} tasks done</p>
                </div>
                <p className={`text-2xl font-bold ${completionRate >= 70 ? 'text-green-500' : completionRate >= 40 ? 'text-amber-500' : 'text-red-500'}`}>
                  {completionRate}%
                </p>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-border/50">
                <div>
                  <p className="font-medium text-sm">In Progress</p>
                  <p className="text-xs text-muted-foreground">Tasks currently being worked on</p>
                </div>
                <p className="text-2xl font-bold text-blue-500">{inProgressT}</p>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-border/50">
                <div>
                  <p className="font-medium text-sm">Overdue Projects</p>
                  <p className="text-xs text-muted-foreground">Past deadline, not completed</p>
                </div>
                <p className={`text-2xl font-bold ${overdueProjects > 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {overdueProjects}
                </p>
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <div>
                    <p className="font-medium text-sm">Standup Streak</p>
                    <p className="text-xs text-muted-foreground">Consecutive days with standup submitted</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-orange-500">{streak} {streak === 1 ? 'day' : 'days'}</p>
              </div>
            </>}
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" /> Upcoming Deadlines
            </CardTitle>
            <CardDescription>Projects due in the next 14 days</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? <div className="space-y-3">{[...Array(4)].map((_,i) => <Skeleton key={i} className="h-12" />)}</div>
              : upcoming.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <CheckCheck className="h-8 w-8 mb-2 opacity-30" />
                <p className="text-sm">No deadlines in the next 14 days</p>
              </div>
            ) : (
              <div className="space-y-2">
                {upcoming.map(p => (
                  <div key={p._id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/40">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{p.projectName}</p>
                      <p className="text-xs text-muted-foreground capitalize">{p.status.replace('_', ' ')}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full shrink-0 ml-2 ${
                      p.daysLeft === 0 ? 'bg-red-500/20 text-red-500' :
                      p.daysLeft <= 3  ? 'bg-orange-500/20 text-orange-500' :
                                         'bg-amber-500/20 text-amber-600'
                    }`}>
                      {p.daysLeft === 0 ? 'Today' : `${p.daysLeft}d left`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
