/**
 * Admin Dashboard Home
 * Rich overview: stats, pipeline, charts, recent activity, quick actions, hero editor.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import {
  CreditCard, Users, FolderKanban, Save, LayoutTemplate, CheckCircle2,
  Briefcase, MessageSquare, TrendingUp, Clock, ArrowUpRight, HeartHandshake,
  TicketCheck, UserCheck, AlertTriangle, CheckCheck, Loader2, ChevronRight,
  Zap, Database, Settings, Bell, FileText, PlusCircle, Star, Target,
  BarChart3, Activity, DollarSign, TrendingDown, Calendar, Tag,
  Radio, Trash2,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { homepageApi } from '../../api/homepage.api';
import { projectsApi } from '../../api/projects.api';
import { clientsApi } from '../../api/clients.api';
import { contactsApi } from '../../api/contacts.api';
import { jobApplicationsApi } from '../../api/jobApplications.api';
import { supportTicketsApi } from '../../api/supportTickets.api';
import { usersApi } from '../../api/users.api';
import { tasksApi } from '../../api/tasks.api';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { toast } from 'sonner';

// ── Types ─────────────────────────────────────────────────────────────────────
interface ProjectStats {
  total: number; pending: number; inReview: number; approved: number;
  completed: number; rejected: number; totalRevenue: number; totalPaid: number; avgProgress: number;
}
interface ClientStats { total: number; newThisMonth: number; totalRevenue: number; }
interface ContactStats {
  totalContacts: number;
  contactsByMonth: { _id: { year: number; month: number }; count: number }[];
  recentContacts: { _id: string; firstName: string; lastName: string; email: string; subject: string; createdAt: string }[];
}
interface AppStats { total: number; byStatus: { _id: string; count: number }[]; }
interface TicketStats { total: number; open: number; inProgress: number; resolved: number; closed: number; urgent: number; }
interface Project {
  _id: string; projectName: string; status: string; progress: number;
  deadline?: string; projectType: string; totalCost?: number;
}
interface Ticket {
  _id: string; ticketId: string; subject: string; status: string;
  priority: string; category: string; createdAt: string;
  submittedBy?: { name: string; email: string };
}
interface Task {
  _id: string; title: string; status: string; priority?: string;
  assignedTo?: { name: string }; dueDate?: string;
}
interface User { _id: string; name: string; role: string; photo?: string; }

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const PIE_COLORS = ['#7c3aed','#2563eb','#16a34a','#d97706','#dc2626','#0891b2'];

const STATUS_LABEL: Record<string,string> = {
  approved:'Approved', in_review:'In Review', pending:'Pending',
  completed:'Completed', rejected:'Rejected',
};
const STATUS_COLOR: Record<string,string> = {
  approved:'bg-green-500', in_review:'bg-blue-500', pending:'bg-amber-500',
  completed:'bg-primary', rejected:'bg-red-500',
};
const PRIORITY_COLOR: Record<string,string> = {
  Urgent:'text-red-500 bg-red-500/10 border-red-500/20',
  High:'text-orange-500 bg-orange-500/10 border-orange-500/20',
  Medium:'text-blue-500 bg-blue-500/10 border-blue-500/20',
  Low:'text-muted-foreground bg-muted border-border',
};
const TICKET_STATUS_COLOR: Record<string,string> = {
  Open:'bg-amber-500/10 text-amber-600 border-amber-500/20',
  'In Progress':'bg-blue-500/10 text-blue-600 border-blue-500/20',
  Resolved:'bg-green-500/10 text-green-600 border-green-500/20',
  Closed:'bg-muted text-muted-foreground border-border',
};

const fadeUp = { initial:{ opacity:0, y:16 }, animate:{ opacity:1, y:0 }, transition:{ duration:0.35 } };
function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-muted rounded-lg ${className??''}`} />;
}
function formatRevenue(n:number) { return n>=1000?`$${(n/1000).toFixed(1)}k`:`$${n.toFixed(0)}`; }
function timeAgo(date:string) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff/60000);
  if (m<1) return 'just now';
  if (m<60) return `${m}m ago`;
  const h = Math.floor(m/60);
  if (h<24) return `${h}h ago`;
  return `${Math.floor(h/24)}d ago`;
}

const defaultHero = { statusBadge:'', titleLine1:'', titleLine2:'', subtitle:'' };

// ── Live Activity Feed ─────────────────────────────────────────────────────────
type ActivityType = 'project' | 'ticket' | 'message' | 'status' | 'reaction' | 'pin' | 'notification' | 'task' | 'system';
interface ActivityEvent {
  id: string;
  type: ActivityType;
  title: string;
  subtitle?: string;
  timestamp: Date;
}
const ACTIVITY_CONFIG: Record<ActivityType, { color: string; bg: string; icon: React.FC<{ className?: string }> }> = {
  project:      { color: 'text-blue-500',    bg: 'bg-blue-500/10',    icon: (p) => <FolderKanban {...p} /> },
  ticket:       { color: 'text-amber-500',   bg: 'bg-amber-500/10',   icon: (p) => <TicketCheck {...p} /> },
  message:      { color: 'text-primary',     bg: 'bg-primary/10',     icon: (p) => <MessageSquare {...p} /> },
  status:       { color: 'text-green-500',   bg: 'bg-green-500/10',   icon: (p) => <UserCheck {...p} /> },
  reaction:     { color: 'text-pink-500',    bg: 'bg-pink-500/10',    icon: (p) => <HeartHandshake {...p} /> },
  pin:          { color: 'text-indigo-500',  bg: 'bg-indigo-500/10',  icon: (p) => <Star {...p} /> },
  notification: { color: 'text-purple-500',  bg: 'bg-purple-500/10',  icon: (p) => <Bell {...p} /> },
  task:         { color: 'text-cyan-500',    bg: 'bg-cyan-500/10',    icon: (p) => <CheckCheck {...p} /> },
  system:       { color: 'text-muted-foreground', bg: 'bg-muted',     icon: (p) => <Activity {...p} /> },
};
function makeEvent(type: ActivityType, title: string, subtitle?: string): ActivityEvent {
  return { id: `${Date.now()}-${Math.random()}`, type, title, subtitle, timestamp: new Date() };
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function DashboardHome() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  // Live Activity Feed
  const [activityFeed, setActivityFeed] = useState<ActivityEvent[]>([]);
  const [feedPaused, setFeedPaused] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);
  const MAX_FEED = 50;

  const pushEvent = useCallback((event: ActivityEvent) => {
    if (feedPaused) return;
    setActivityFeed(prev => [event, ...prev].slice(0, MAX_FEED));
  }, [feedPaused]);

  // Seed with startup event
  useEffect(() => {
    setActivityFeed([makeEvent('system', 'Activity feed started', 'Listening for real-time events…')]);
  }, []);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    const onNotification = (data: { type: string; message?: string; projectName?: string; userName?: string }) => {
      const typeMap: Record<string, ActivityType> = {
        project_submitted: 'project', project_accepted: 'project', project_rejected: 'project',
        project_assigned: 'project', task_assigned: 'task', status_updated: 'project',
        message: 'message', file_received: 'notification',
      };
      const aType = typeMap[data.type] ?? 'notification';
      const title = data.message || `${data.type.replace(/_/g, ' ')} event`;
      const subtitle = data.userName ? `by ${data.userName}` : data.projectName;
      pushEvent(makeEvent(aType, title, subtitle));
    };

    const onDataUpdated = (payload: { section: string }) => {
      const sectionLabels: Record<string, string> = {
        projects: 'Project data updated', clients: 'Client data updated',
        tasks: 'Task data updated', services: 'Services updated',
        jobs: 'Job listings updated', announcements: 'Announcement updated',
      };
      pushEvent(makeEvent('system', sectionLabels[payload.section] ?? `${payload.section} updated`));
    };

    const onStatusChanged = (data: { userId?: string; userName?: string; status?: string }) => {
      pushEvent(makeEvent('status', `${data.userName ?? 'Team member'} is now ${data.status ?? 'unknown'}`, 'Availability changed'));
    };

    const onMessagePinned = (data: { pinnedBy?: { name?: string }; isPinned?: boolean }) => {
      const who = data.pinnedBy?.name ?? 'Someone';
      pushEvent(makeEvent('pin', `${who} ${data.isPinned ? 'pinned' : 'unpinned'} a message`));
    };

    const onReactionUpdated = (data: { emoji?: string; updatedBy?: string }) => {
      pushEvent(makeEvent('reaction', `Reaction ${data.emoji ?? '👍'} on a message`, data.updatedBy ? `by ${data.updatedBy}` : undefined));
    };

    socket.on('notification', onNotification);
    socket.on('data:updated', onDataUpdated);
    socket.on('user:status_changed', onStatusChanged);
    socket.on('chat:message_pinned', onMessagePinned);
    socket.on('chat:reaction_updated', onReactionUpdated);

    return () => {
      socket.off('notification', onNotification);
      socket.off('data:updated', onDataUpdated);
      socket.off('user:status_changed', onStatusChanged);
      socket.off('chat:message_pinned', onMessagePinned);
      socket.off('chat:reaction_updated', onReactionUpdated);
    };
  }, [socket, pushEvent]);

  // Auto-scroll feed to top when new event arrives
  useEffect(() => {
    if (!feedPaused && feedRef.current) {
      feedRef.current.scrollTop = 0;
    }
  }, [activityFeed, feedPaused]);

  // Hero
  const [heroForm, setHeroForm] = useState(defaultHero);
  const [isSaving, setIsSaving] = useState(false);
  const [isModified, setIsModified] = useState(false);
  const [saved, setSaved] = useState(false);

  // Data
  const [projectStats, setProjectStats]     = useState<ProjectStats|null>(null);
  const [clientStats, setClientStats]       = useState<ClientStats|null>(null);
  const [contactStats, setContactStats]     = useState<ContactStats|null>(null);
  const [appStats, setAppStats]             = useState<AppStats|null>(null);
  const [ticketStats, setTicketStats]       = useState<TicketStats|null>(null);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [recentTickets, setRecentTickets]   = useState<Ticket[]>([]);
  const [recentTasks, setRecentTasks]       = useState<Task[]>([]);
  const [teamMembers, setTeamMembers]       = useState<User[]>([]);
  const [loading, setLoading]               = useState(true);

  useEffect(() => {
    homepageApi.get().then(res => {
      const d = res.data.data;
      if (d) setHeroForm({ statusBadge:d.statusBadge||'', titleLine1:d.titleLine1||'', titleLine2:d.titleLine2||'', subtitle:d.subtitle||'' });
    }).catch(()=>{});
  }, []);

  useEffect(() => {
    Promise.allSettled([
      projectsApi.getStats(),
      clientsApi.getStats(),
      contactsApi.getStats(),
      jobApplicationsApi.getStats(),
      supportTicketsApi.getStats(),
      projectsApi.getAll({ limit:5, sortBy:'createdAt', order:'desc' }),
      supportTicketsApi.getAll({ limit:5, page:1 }),
      tasksApi.getAll({ limit:5 }),
      usersApi.getAll(),
    ]).then(([pStats,cStats,ctStats,appSt,tkStats,pList,tkList,tskList,userList]) => {
      if (pStats.status==='fulfilled')  setProjectStats(pStats.value.data.data);
      if (cStats.status==='fulfilled')  setClientStats(cStats.value.data.data);
      if (ctStats.status==='fulfilled') setContactStats(ctStats.value.data.data);
      if (appSt.status==='fulfilled')   setAppStats(appSt.value.data.data);
      if (tkStats.status==='fulfilled') setTicketStats(tkStats.value.data.data);
      if (pList.status==='fulfilled')   setRecentProjects(pList.value.data.data?.projects||[]);
      if (tkList.status==='fulfilled')  setRecentTickets(tkList.value.data.data?.tickets||[]);
      if (tskList.status==='fulfilled') setRecentTasks((tskList.value.data.data?.tasks||tskList.value.data.data||[]).slice(0,5));
      if (userList.status==='fulfilled') {
        const all: User[] = userList.value.data.data || [];
        setTeamMembers(all.filter(u => u.role === 'team').slice(0,6));
      }
    }).finally(()=>setLoading(false));
  }, []);

  const handleContentChange = (field: keyof typeof heroForm, value: string) => {
    setHeroForm(prev=>({...prev,[field]:value})); setIsModified(true); setSaved(false);
  };
  const handleSaveContent = async () => {
    setIsSaving(true);
    try {
      try { await homepageApi.update(heroForm); }
      catch(err:any) { if(err?.response?.status===404) await homepageApi.create(heroForm); else throw err; }
      setIsModified(false); setSaved(true); toast.success('Hero section updated!');
    } catch(err:any) { toast.error('Failed to save',{description:err?.response?.data?.message}); }
    finally { setIsSaving(false); }
  };

  const chartData = (contactStats?.contactsByMonth||[]).map(e=>({
    name: MONTH_NAMES[(e._id.month??1)-1], contacts: e.count,
  }));

  const appChartData = (appStats?.byStatus||[]).map(s=>({ name:s._id, value:s.count }));
  const activeCount = (projectStats?.approved??0)+(projectStats?.inReview??0);
  const outstanding = (projectStats?.totalRevenue??0)-(projectStats?.totalPaid??0);
  const paidPct = projectStats?.totalRevenue
    ? Math.round(((projectStats.totalPaid??0)/projectStats.totalRevenue)*100) : 0;

  const quickActions = [
    { label:'New Project Request', icon:PlusCircle, path:'/admin/client-requests',     color:'text-primary bg-primary/10' },
    { label:'Manage Tickets',      icon:TicketCheck,path:'/admin/support',              color:'text-amber-500 bg-amber-500/10' },
    { label:'Job Applications',    icon:Briefcase,  path:'/admin/job-applications',     color:'text-blue-500 bg-blue-500/10' },
    { label:'Content Editor',      icon:FileText,   path:'/admin/content-editor',       color:'text-green-500 bg-green-500/10' },
    { label:'Team Management',     icon:Users,      path:'/admin/team',                 color:'text-purple-500 bg-purple-500/10' },
    { label:'Database Manager',    icon:Database,   path:'/admin/database',             color:'text-cyan-500 bg-cyan-500/10' },
    { label:'Page Manager',        icon:Settings,   path:'/admin/page-manager',         color:'text-rose-500 bg-rose-500/10' },
    { label:'Announcements',       icon:Bell,       path:'/admin/announcements',        color:'text-indigo-500 bg-indigo-500/10' },
  ];

  const pipelineStages = [
    { key:'pending',   label:'Pending',   count:projectStats?.pending??0,   color:'bg-amber-500' },
    { key:'in_review', label:'In Review', count:projectStats?.inReview??0,  color:'bg-blue-500' },
    { key:'approved',  label:'Approved',  count:projectStats?.approved??0,  color:'bg-green-500' },
    { key:'completed', label:'Completed', count:projectStats?.completed??0, color:'bg-primary' },
    { key:'rejected',  label:'Rejected',  count:projectStats?.rejected??0,  color:'bg-red-500' },
  ];
  const totalPipelineCount = pipelineStages.reduce((s,x)=>s+x.count,0)||1;

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <motion.div {...fadeUp} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
            Dashboard
          </h2>
          <p className="text-muted-foreground mt-1">
            Welcome back, <span className="font-medium text-foreground">{user?.name?.split(' ')[0]??'Admin'}</span>. Here's your agency overview.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" className="gap-2 border-border h-9" onClick={()=>navigate('/admin/support')}>
            <TicketCheck className="h-4 w-4" />
            {ticketStats?.open??0} Open Tickets
          </Button>
          <Button className="gap-2 h-9" onClick={()=>navigate('/admin/client-requests')}>
            <ArrowUpRight className="h-4 w-4" /> View All Requests
          </Button>
        </div>
      </motion.div>

      {/* ── Stat Cards Row 1 (6 cards) ──────────────────────────────────────── */}
      <motion.div {...fadeUp} transition={{ delay:0.05 }} className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
        {/* Revenue */}
        <Card className="bg-gradient-to-br from-primary/10 to-purple-500/5 border-primary/20 col-span-2 md:col-span-1 xl:col-span-2">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total Revenue</p>
                <div className="text-2xl font-bold mt-1">
                  {loading ? <Skeleton className="h-8 w-24 inline-block" /> : formatRevenue(clientStats?.totalRevenue??0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {loading ? '' : `${formatRevenue(projectStats?.totalPaid??0)} collected · ${formatRevenue(outstanding)} outstanding`}
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
            </div>
            {!loading && (projectStats?.totalRevenue??0) > 0 && (
              <div className="mt-3">
                <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                  <span>Collected</span><span>{paidPct}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{width:`${paidPct}%`}} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Projects */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Active Projects</p>
                <p className="text-2xl font-bold mt-1">{loading?'—':activeCount}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {loading?'':(`${projectStats?.pending??0} pending · ${projectStats?.completed??0} done`)}
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                <FolderKanban className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Clients */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total Clients</p>
                <p className="text-2xl font-bold mt-1">{loading?'—':clientStats?.total??0}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {loading?'':`+${clientStats?.newThisMonth??0} this month`}
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                <HeartHandshake className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Open Tickets */}
        <Card className={ticketStats && ticketStats.open > 5 ? 'border-amber-500/30' : ''}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Support Tickets</p>
                <p className="text-2xl font-bold mt-1">{loading?'—':ticketStats?.open??0} <span className="text-sm font-normal text-muted-foreground">open</span></p>
                <p className="text-xs text-muted-foreground mt-1">
                  {loading?'':`${ticketStats?.urgent??0} urgent · ${ticketStats?.inProgress??0} in progress`}
                </p>
              </div>
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${(ticketStats?.urgent??0)>0?'bg-red-500/10':'bg-amber-500/10'}`}>
                <TicketCheck className={`h-5 w-5 ${(ticketStats?.urgent??0)>0?'text-red-500':'text-amber-500'}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Members */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Team Members</p>
                <p className="text-2xl font-bold mt-1">{loading?'—':teamMembers.length}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {loading?'':`${recentTasks.filter(t=>t.status==='in_progress').length} tasks active`}
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                <UserCheck className="h-5 w-5 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Row 2: Pipeline + Revenue Breakdown ─────────────────────────────── */}
      <motion.div {...fadeUp} transition={{ delay:0.1 }} className="grid gap-4 lg:grid-cols-7">

        {/* Project Pipeline */}
        <Card className="lg:col-span-4">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" /> Project Pipeline
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={()=>navigate('/admin/client-requests')}>
                View all <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading
              ? [...Array(5)].map((_,i)=><Skeleton key={i} className="h-8" />)
              : pipelineStages.map(stage=>(
                <div key={stage.key}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-muted-foreground text-xs font-medium">{stage.label}</span>
                    <span className="font-bold text-xs">{stage.count}</span>
                  </div>
                  <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${stage.color}`}
                      style={{ width:`${Math.round((stage.count/totalPipelineCount)*100)}%` }}
                    />
                  </div>
                </div>
              ))
            }
            {!loading && (
              <div className="pt-2 flex items-center gap-4 border-t border-border">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="font-bold text-lg">{projectStats?.total??0}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Avg Progress</p>
                  <p className="font-bold text-lg">{projectStats?.avgProgress??0}%</p>
                </div>
                <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-purple-400 rounded-full"
                    style={{ width:`${projectStats?.avgProgress??0}%` }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revenue + Job App breakdown */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" /> Revenue & Applications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Revenue breakdown */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Revenue</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-3">
                  <p className="text-[10px] text-muted-foreground">Collected</p>
                  <p className="font-bold text-sm text-green-600 dark:text-green-400 mt-0.5">
                    {loading?'—':formatRevenue(projectStats?.totalPaid??0)}
                  </p>
                </div>
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3">
                  <p className="text-[10px] text-muted-foreground">Outstanding</p>
                  <p className="font-bold text-sm text-amber-600 dark:text-amber-400 mt-0.5">
                    {loading?'—':formatRevenue(outstanding)}
                  </p>
                </div>
              </div>
            </div>

            {/* Job Apps breakdown */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Job Applications</p>
              {loading
                ? <Skeleton className="h-24" />
                : appStats && appStats.byStatus.length > 0
                  ? (
                    <div className="space-y-1.5">
                      {appStats.byStatus.slice(0,4).map((s,i)=>(
                        <div key={s._id} className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full shrink-0" style={{background:PIE_COLORS[i%PIE_COLORS.length]}} />
                          <span className="text-xs capitalize text-muted-foreground flex-1">{s._id}</span>
                          <span className="text-xs font-semibold">{s.count}</span>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-xs text-muted-foreground py-2 text-center">No applications yet</p>
              }
              <Button
                variant="ghost" size="sm" className="w-full h-7 text-xs gap-1 mt-1"
                onClick={()=>navigate('/admin/job-applications')}
              >
                View all applications <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Row 3: Charts ───────────────────────────────────────────────────── */}
      <motion.div {...fadeUp} transition={{ delay:0.15 }} className="grid gap-4 lg:grid-cols-7">

        {/* Contact Activity Chart */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" /> Contact Activity
                </CardTitle>
                <CardDescription>New contact form submissions by month.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={()=>navigate('/admin/contacts')}>
                {contactStats?.totalContacts??0} total
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              {loading ? (
                <div className="flex items-center justify-center h-full"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : chartData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">No contact data yet.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barSize={28}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="name" tick={{fontSize:11,fill:'#888'}} axisLine={false} tickLine={false} />
                    <YAxis tick={{fontSize:11,fill:'#888'}} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{background:'hsl(var(--card))',border:'1px solid hsl(var(--border))',borderRadius:8,fontSize:12,color:'hsl(var(--foreground))'}} cursor={{fill:'rgba(124,58,237,0.08)'}} />
                    <Bar dataKey="contacts" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Job Applications Donut */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" /> Applications by Status
            </CardTitle>
            <CardDescription>Total: {appStats?.total??0} applications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              {loading ? (
                <div className="flex items-center justify-center h-full"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : (appStats?.byStatus??[]).length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">No applications yet.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={appChartData} dataKey="value" nameKey="name" cx="45%" cy="50%" outerRadius={75} innerRadius={45}>
                      {appChartData.map((_,idx)=><Cell key={idx} fill={PIE_COLORS[idx%PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{background:'hsl(var(--card))',border:'1px solid hsl(var(--border))',borderRadius:8,fontSize:12,color:'hsl(var(--foreground))'}} />
                    <Legend formatter={(v:string)=><span className="text-xs capitalize text-muted-foreground">{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Row 4: Recent Project Requests + Recent Support Tickets ─────────── */}
      <motion.div {...fadeUp} transition={{ delay:0.2 }} className="grid gap-4 lg:grid-cols-2">

        {/* Recent Project Requests */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Recent Project Requests</CardTitle>
                <CardDescription>Latest 5 client requests.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="h-7" onClick={()=>navigate('/admin/client-requests')}>
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading
              ? <div className="space-y-3">{[...Array(4)].map((_,i)=><Skeleton key={i} className="h-14" />)}</div>
              : recentProjects.length===0
                ? <p className="text-sm text-muted-foreground text-center py-8">No project requests yet.</p>
                : (
                  <div className="space-y-0 divide-y divide-border">
                    {recentProjects.map(p=>(
                      <div key={p._id} className="flex items-center justify-between py-3 gap-3 group hover:bg-muted/20 -mx-1 px-1 rounded-lg transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <FolderKanban className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{p.projectName}</p>
                            <p className="text-xs text-muted-foreground">{p.projectType}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="w-14 bg-muted rounded-full h-1.5 overflow-hidden">
                            <div className={`h-full rounded-full ${STATUS_COLOR[p.status]??'bg-muted-foreground'}`} style={{width:`${p.progress??0}%`}} />
                          </div>
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md border ${
                            p.status==='completed' ? 'bg-green-500/10 text-green-600 border-green-500/20'
                            : p.status==='approved' ? 'bg-green-500/10 text-green-600 border-green-500/20'
                            : p.status==='in_review' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                            : p.status==='rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20'
                            : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                          }`}>
                            {STATUS_LABEL[p.status]??p.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )
            }
          </CardContent>
        </Card>

        {/* Recent Support Tickets */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <TicketCheck className="h-4 w-4 text-amber-500" /> Recent Tickets
                </CardTitle>
                <CardDescription>{ticketStats?.open??0} open · {ticketStats?.urgent??0} urgent</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="h-7" onClick={()=>navigate('/admin/support')}>
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading
              ? <div className="space-y-3">{[...Array(4)].map((_,i)=><Skeleton key={i} className="h-14" />)}</div>
              : recentTickets.length===0
                ? <p className="text-sm text-muted-foreground text-center py-8">No support tickets yet.</p>
                : (
                  <div className="space-y-0 divide-y divide-border">
                    {recentTickets.map(t=>(
                      <div key={t._id} className="flex items-center justify-between py-3 gap-3 cursor-pointer group hover:bg-muted/20 -mx-1 px-1 rounded-lg transition-colors" onClick={()=>navigate('/admin/support')}>
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                            t.priority==='Urgent' ? 'bg-red-500/10' : t.priority==='High' ? 'bg-orange-500/10' : 'bg-primary/10'
                          }`}>
                            <MessageSquare className={`h-3.5 w-3.5 ${
                              t.priority==='Urgent' ? 'text-red-500' : t.priority==='High' ? 'text-orange-500' : 'text-primary'
                            }`} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{t.subject}</p>
                            <p className="text-xs text-muted-foreground">{t.submittedBy?.name || 'Unknown'} · {timeAgo(t.createdAt)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md border ${PRIORITY_COLOR[t.priority]??'bg-muted text-muted-foreground border-border'}`}>
                            {t.priority}
                          </span>
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md border ${TICKET_STATUS_COLOR[t.status]??'bg-muted text-muted-foreground border-border'}`}>
                            {t.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )
            }
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Row 5: Recent Contacts + Team Members ───────────────────────────── */}
      <motion.div {...fadeUp} transition={{ delay:0.25 }} className="grid gap-4 lg:grid-cols-2">

        {/* Recent Contacts */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Recent Contacts</CardTitle>
                <CardDescription>Latest contact form submissions.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="h-7" onClick={()=>navigate('/admin/contacts')}>
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading
              ? <div className="space-y-3">{[...Array(4)].map((_,i)=><Skeleton key={i} className="h-12" />)}</div>
              : (contactStats?.recentContacts??[]).length===0
                ? <p className="text-sm text-muted-foreground text-center py-8">No contacts yet.</p>
                : (
                  <div className="divide-y divide-border">
                    {(contactStats?.recentContacts??[]).map(c=>(
                      <div key={c._id} className="flex items-start gap-3 py-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold text-primary">
                          {c.firstName?.[0]?.toUpperCase()??'?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{c.firstName} {c.lastName}</p>
                          <p className="text-xs text-muted-foreground truncate">{c.subject||c.email}</p>
                        </div>
                        <div className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(c.createdAt).toLocaleDateString('en-US',{month:'short',day:'numeric'})}
                        </div>
                      </div>
                    ))}
                  </div>
                )
            }
          </CardContent>
        </Card>

        {/* Team Members Quick View */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Team Members</CardTitle>
                <CardDescription>{teamMembers.length} active team members.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="h-7" onClick={()=>navigate('/admin/team')}>
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading
              ? <div className="grid grid-cols-2 gap-3">{[...Array(4)].map((_,i)=><Skeleton key={i} className="h-16" />)}</div>
              : teamMembers.length===0
                ? (
                  <div className="text-center py-8">
                    <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-30" />
                    <p className="text-sm text-muted-foreground">No team members yet.</p>
                    <Button variant="outline" size="sm" className="mt-3 h-7 text-xs gap-1.5 border-border" onClick={()=>navigate('/admin/team')}>
                      <PlusCircle className="h-3.5 w-3.5" /> Add Team Member
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {teamMembers.map(member=>(
                      <div key={member._id} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-muted/30 border border-border hover:border-primary/30 transition-colors">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                          {member.photo
                            ? <img src={member.photo} alt={member.name} className="h-full w-full object-cover" />
                            : <span className="text-xs font-bold text-primary">{member.name?.[0]?.toUpperCase()??'T'}</span>
                          }
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate">{member.name}</p>
                          <p className="text-[10px] text-muted-foreground capitalize">{member.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )
            }
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Row 6: Priority Inbox ───────────────────────────────────────────── */}
      {!loading && (() => {
        const overdueProjects = recentProjects.filter(p =>
          p.deadline && new Date(p.deadline) < new Date() && p.status !== 'completed'
        );
        const pendingRequests = recentProjects.filter(p => p.status === 'pending');
        const urgentTickets   = recentTickets.filter(t => t.priority === 'Urgent' && t.status !== 'Resolved' && t.status !== 'Closed');
        const pendingAppCount = (appStats?.byStatus?.find(s => s._id === 'pending')?.count ?? 0);

        const items = [
          ...urgentTickets.map(t => ({
            id: t._id, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10',
            label: `Urgent: ${t.subject}`,
            sub: `Ticket · ${t.submittedBy?.name ?? 'Unknown'}`,
            path: '/admin/support',
          })),
          ...overdueProjects.map(p => ({
            id: p._id, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10',
            label: `Overdue: ${p.projectName}`,
            sub: `${p.projectType} · ${Math.abs(Math.ceil((new Date(p.deadline!).getTime() - Date.now()) / 86400000))}d past deadline`,
            path: '/admin/client-requests',
          })),
          ...pendingRequests.slice(0, 3).map(p => ({
            id: p._id + '-pending', icon: FolderKanban, color: 'text-violet-500', bg: 'bg-violet-500/10',
            label: `Pending review: ${p.projectName}`,
            sub: `${p.projectType} · needs decision`,
            path: `/admin/client-requests?projectId=${p._id}`,
          })),
          ...(pendingAppCount > 0 ? [{
            id: 'apps', icon: Briefcase, color: 'text-blue-500', bg: 'bg-blue-500/10',
            label: `${pendingAppCount} unreviewed job application${pendingAppCount > 1 ? 's' : ''}`,
            sub: 'Pending review in Job Applications',
            path: '/admin/job-applications',
          }] : []),
        ];

        if (items.length === 0) return null;

        return (
          <motion.div {...fadeUp} transition={{ delay:0.27 }}>
            <Card className="border-amber-500/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Priority Inbox</CardTitle>
                      <CardDescription>{items.length} item{items.length !== 1 ? 's' : ''} need your attention</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-1">
                  {items.map(item => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => navigate(item.path)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/40 text-left transition-colors group"
                      >
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${item.bg}`}>
                          <Icon className={`h-3.5 w-3.5 ${item.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{item.label}</p>
                          <p className="text-xs text-muted-foreground truncate">{item.sub}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })()}

      {/* ── Row 7: Live Activity Feed ────────────────────────────────────────── */}
      <motion.div {...fadeUp} transition={{ delay:0.28 }}>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="relative flex items-center justify-center h-8 w-8">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-30 animate-ping" />
                  <Radio className="h-4 w-4 text-green-500 relative" />
                </div>
                <div>
                  <CardTitle className="text-base">Live Activity Feed</CardTitle>
                  <CardDescription>Real-time events across your platform</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFeedPaused(p => !p)}
                  className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition-all ${
                    feedPaused
                      ? 'bg-amber-500/10 text-amber-600 border-amber-500/30 hover:bg-amber-500/20'
                      : 'bg-green-500/10 text-green-600 border-green-500/30 hover:bg-green-500/20'
                  }`}
                >
                  {feedPaused ? '⏸ Paused' : '▶ Live'}
                </button>
                <button
                  onClick={() => setActivityFeed([makeEvent('system', 'Feed cleared')])}
                  className="h-7 w-7 rounded-lg flex items-center justify-center border border-border hover:border-destructive/40 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                  title="Clear feed"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div
              ref={feedRef}
              className="h-48 overflow-y-auto pr-1 space-y-1 scrollbar-thin"
              onMouseEnter={() => setFeedPaused(true)}
              onMouseLeave={() => setFeedPaused(false)}
            >
              <AnimatePresence initial={false}>
                {activityFeed.map(ev => {
                  const cfg = ACTIVITY_CONFIG[ev.type];
                  const Icon = cfg.icon;
                  return (
                    <motion.div
                      key={ev.id}
                      initial={{ opacity: 0, x: -8, height: 0 }}
                      animate={{ opacity: 1, x: 0, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-start gap-2.5 py-1.5 px-2 rounded-lg hover:bg-muted/30 transition-colors group"
                    >
                      <div className={`mt-0.5 h-6 w-6 rounded-md flex items-center justify-center shrink-0 ${cfg.bg}`}>
                        <Icon className={`h-3 w-3 ${cfg.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground leading-snug truncate">{ev.title}</p>
                        {ev.subtitle && (
                          <p className="text-[10px] text-muted-foreground truncate">{ev.subtitle}</p>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0 pt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {ev.timestamp.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit', second:'2-digit' })}
                      </span>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {activityFeed.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Activity className="h-6 w-6 mb-2 opacity-30" />
                  <p className="text-xs">Waiting for events…</p>
                </div>
              )}
            </div>
            <div className="mt-2 pt-2 border-t border-border flex items-center justify-between">
              <p className="text-[10px] text-muted-foreground">
                {activityFeed.length} event{activityFeed.length !== 1 ? 's' : ''} · hover to pause
              </p>
              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                {(['project','ticket','message','status','task'] as ActivityType[]).map(t => {
                  const c = ACTIVITY_CONFIG[t];
                  return (
                    <span key={t} className={`text-[10px] px-1.5 py-0.5 rounded-md ${c.bg} ${c.color} capitalize`}>{t}</span>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Row 7: Quick Actions + Hero Editor ──────────────────────────────── */}
      <motion.div {...fadeUp} transition={{ delay:0.3 }} className="grid gap-4 lg:grid-cols-7">

        {/* Quick Actions */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" /> Quick Actions
            </CardTitle>
            <CardDescription>Jump to any section instantly.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map(action=>{
                const Icon=action.icon;
                return (
                  <button
                    key={action.path}
                    onClick={()=>navigate(action.path)}
                    className="flex items-center gap-2.5 p-3 rounded-xl border border-border hover:border-primary/30 bg-muted/20 hover:bg-muted/40 transition-all text-left group"
                  >
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${action.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors leading-tight">{action.label}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Hero Quick Editor */}
        <Card className="lg:col-span-4 border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <LayoutTemplate className="h-5 w-5 text-primary" /> Edit Home Page Hero
                </CardTitle>
                <CardDescription>Quickly update your hero section content.</CardDescription>
              </div>
              {saved && !isModified
                ? <Badge variant="outline" className="text-green-500 border-green-500/50 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />Saved</Badge>
                : isModified
                  ? <Badge variant="outline" className="text-amber-500 border-amber-500/50">Unsaved</Badge>
                  : null
              }
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase text-muted-foreground">Status Badge</label>
              <Input value={heroForm.statusBadge} onChange={e=>handleContentChange('statusBadge',e.target.value)} placeholder="e.g. Accepting New Projects for 2026" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase text-muted-foreground">Title Line 1</label>
                <Input value={heroForm.titleLine1} onChange={e=>handleContentChange('titleLine1',e.target.value)} placeholder="e.g. We Build" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase text-muted-foreground">Title Line 2 (Colored)</label>
                <Input value={heroForm.titleLine2} onChange={e=>handleContentChange('titleLine2',e.target.value)} placeholder="e.g. Digital Excellence" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase text-muted-foreground">Subtitle</label>
              <Textarea value={heroForm.subtitle} onChange={e=>handleContentChange('subtitle',e.target.value)} placeholder="Hero description text..." className="resize-none min-h-[72px]" />
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleSaveContent} disabled={!isModified||isSaving} className="flex-1">
                {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : <><Save className="mr-2 h-4 w-4" />Save Changes</>}
              </Button>
              <Button variant="outline" className="border-border" onClick={()=>navigate('/admin/content-editor')}>
                Full Editor
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

    </div>
  );
}
