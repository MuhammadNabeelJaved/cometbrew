/**
 * Team Dashboard Home
 * Central hub for team members to manage work, track progress, and collaborate.
 */
import React, { useState } from 'react';
import { 
  CheckSquare, 
  FolderKanban, 
  Clock, 
  Target, 
  ArrowRight, 
  Plus, 
  MoreHorizontal, 
  Calendar,
  AlertCircle,
  Search,
  Filter,
  Activity,
  User,
  CheckCircle2,
  Circle,
  Timer,
  ArrowUpRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';

// --- Mock Data ---

const INITIAL_TASKS = [
  { id: 1, title: "Homepage Hero Animation", project: "Fintech Dashboard", priority: "High", due: "Today", status: "In Progress", assignee: "Sarah" },
  { id: 2, title: "Fix Mobile Navigation", project: "E-commerce App", priority: "High", due: "Today", status: "To Do", assignee: "Sarah" },
  { id: 3, title: "Client Feedback Meeting", project: "Internal", priority: "Medium", due: "Tomorrow", status: "Scheduled", assignee: "Sarah" },
  { id: 4, title: "Update Documentation", project: "SaaS Platform", priority: "Low", due: "In 2 days", status: "Review", assignee: "Sarah" },
  { id: 5, title: "API Integration", project: "Fintech Dashboard", priority: "High", due: "Next Week", status: "To Do", assignee: "Sarah" },
];

const INITIAL_PROJECTS = [
  { id: 1, name: "Fintech Dashboard", role: "Lead Designer", progress: 75, deadline: "Mar 15", status: "Active" },
  { id: 2, name: "E-commerce App", role: "UI Designer", progress: 45, deadline: "Apr 01", status: "Active" },
  { id: 3, name: "SaaS Platform", role: "Frontend Dev", progress: 20, deadline: "Apr 20", status: "Planning" },
];

const TEAM_ACTIVITY = [
  { id: 1, user: "Alex Johnson", action: "completed task", target: "User Authentication", time: "10 mins ago", avatar: "AJ" },
  { id: 2, user: "Maria Garcia", action: "commented on", target: "Design System V2", time: "45 mins ago", avatar: "MG" },
  { id: 3, user: "David Chen", action: "created project", target: "Mobile App Redesign", time: "2 hours ago", avatar: "DC" },
  { id: 4, user: "Sarah Team", action: "updated status", target: "Homepage Hero", time: "3 hours ago", avatar: "ST" },
];

export default function TeamDashboardHome() {
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [projects, setProjects] = useState(INITIAL_PROJECTS);
  const [activities, setActivities] = useState(TEAM_ACTIVITY);
  
  // Task Creation State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', project: '', priority: 'Medium', due: '' });

  // Project Creation State
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', role: '', deadline: '' });

  const handleCreateTask = () => {
    const task = {
      id: Date.now(),
      title: newTask.title,
      project: newTask.project || 'General',
      priority: newTask.priority,
      due: newTask.due || 'No Date',
      status: 'To Do',
      assignee: 'Sarah'
    };
    setTasks([task, ...tasks]);
    setActivities([{ id: Date.now(), user: "Sarah Team", action: "created task", target: task.title, time: "Just now", avatar: "ST" }, ...activities]);
    setIsTaskModalOpen(false);
    setNewTask({ title: '', project: '', priority: 'Medium', due: '' });
  };

  const handleCreateProject = () => {
    const project = {
      id: Date.now(),
      name: newProject.name,
      role: newProject.role || 'Member',
      progress: 0,
      deadline: newProject.deadline || 'TBD',
      status: 'Planning'
    };
    setProjects([project, ...projects]);
    setActivities([{ id: Date.now(), user: "Sarah Team", action: "created project", target: project.name, time: "Just now", avatar: "ST" }, ...activities]);
    setIsProjectModalOpen(false);
    setNewProject({ name: '', role: '', deadline: '' });
  };

  const handleStatusUpdate = (taskId: number, newStatus: string) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    const taskTitle = tasks.find(t => t.id === taskId)?.title;
    setActivities([{ id: Date.now(), user: "Sarah Team", action: `marked as ${newStatus}`, target: taskTitle || 'task', time: "Just now", avatar: "ST" }, ...activities]);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-500';
      case 'Medium': return 'bg-amber-500';
      case 'Low': return 'bg-blue-500';
      default: return 'bg-slate-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'In Progress': return <Timer className="h-4 w-4 text-blue-500" />;
      case 'Review': return <AlertCircle className="h-4 w-4 text-amber-500" />;
      default: return <Circle className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground mt-1">Overview of your work and team activity.</p>
        </div>
        <div className="flex gap-3">
          <Dialog open={isProjectModalOpen} onOpenChange={setIsProjectModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <FolderKanban className="h-4 w-4" /> New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>Start a new collaborative project for your team.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="p-name">Project Name</Label>
                  <Input id="p-name" value={newProject.name} onChange={e => setNewProject({...newProject, name: e.target.value})} placeholder="e.g. Website Redesign" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="p-role">Your Role</Label>
                  <Input id="p-role" value={newProject.role} onChange={e => setNewProject({...newProject, role: e.target.value})} placeholder="e.g. Lead Designer" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="p-deadline">Target Deadline</Label>
                  <Input id="p-deadline" type="date" value={newProject.deadline} onChange={e => setNewProject({...newProject, deadline: e.target.value})} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsProjectModalOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateProject}>Create Project</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isTaskModalOpen} onOpenChange={setIsTaskModalOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-lg shadow-primary/20">
                <Plus className="h-4 w-4" /> Create Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
                <DialogDescription>Add a new task to your workload.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Task Title</Label>
                  <Input id="title" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} placeholder="e.g. Design Homepage Hero" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="project">Project</Label>
                  <Select onValueChange={v => setNewTask({...newTask, project: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map(p => (
                        <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                      ))}
                      <SelectItem value="General">General / Administrative</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select defaultValue="Medium" onValueChange={v => setNewTask({...newTask, priority: v})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="due">Due Date</Label>
                    <Input id="due" value={newTask.due} onChange={e => setNewTask({...newTask, due: e.target.value})} placeholder="e.g. Tomorrow" />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsTaskModalOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateTask}>Create Task</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-primary/10 via-background to-background border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.filter(t => t.status !== 'Completed').length}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <span className="text-amber-500 font-medium">{tasks.filter(t => t.due === 'Today').length} due today</span>
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.filter(p => p.status === 'Active').length}</div>
            <p className="text-xs text-muted-foreground mt-1">Across 3 clients</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">28.5h</div>
            <p className="text-xs text-green-500 mt-1 flex items-center">
              <ArrowUpRight className="h-3 w-3 mr-1" /> On track
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efficiency</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94%</div>
            <p className="text-xs text-muted-foreground mt-1">Task completion rate</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        
        {/* Main Content Area - Tasks */}
        <div className="col-span-1 md:col-span-4 space-y-6">
          <Card className="h-full border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>My Tasks</CardTitle>
                  <CardDescription>Manage your daily assignments.</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="gap-1">
                  View All <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-2 sm:px-6">
              <div className="space-y-1">
                <AnimatePresence>
                  {tasks.slice(0, 6).map((task) => (
                    <motion.div 
                      key={task.id}
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
                            <DropdownMenuItem onClick={() => handleStatusUpdate(task.id, 'To Do')}>
                              <Circle className="h-3 w-3 mr-2 text-slate-400" /> To Do
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusUpdate(task.id, 'In Progress')}>
                              <Timer className="h-3 w-3 mr-2 text-blue-500" /> In Progress
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusUpdate(task.id, 'Review')}>
                              <AlertCircle className="h-3 w-3 mr-2 text-amber-500" /> In Review
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusUpdate(task.id, 'Completed')}>
                              <CheckCircle2 className="h-3 w-3 mr-2 text-green-500" /> Completed
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        
                        <div className="min-w-0">
                          <p className={`font-medium text-sm truncate ${task.status === 'Completed' ? 'text-muted-foreground line-through' : ''}`}>
                            {task.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-[10px] h-4 px-1">
                              {task.project}
                            </Badge>
                            <span className={`w-1.5 h-1.5 rounded-full ${getPriorityColor(task.priority)}`} title={`Priority: ${task.priority}`} />
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 pl-4 shrink-0">
                        <div className="text-right">
                          <p className={`text-xs font-medium ${task.due === 'Today' ? 'text-amber-500' : 'text-muted-foreground'}`}>
                            {task.due}
                          </p>
                        </div>
                        <DropdownMenu>
                           <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                           </DropdownMenuTrigger>
                           <DropdownMenuContent align="end">
                              <DropdownMenuItem>Edit Task</DropdownMenuItem>
                              <DropdownMenuItem>Assign Member</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                           </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {tasks.length === 0 && (
                   <div className="text-center py-12 text-muted-foreground">
                      <CheckSquare className="h-10 w-10 mx-auto mb-3 opacity-20" />
                      <p>No tasks yet. Create one to get started!</p>
                   </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Area - Activity & Projects */}
        <div className="col-span-1 md:col-span-3 space-y-6">
          
          {/* Team Activity Feed */}
          <Card>
             <CardHeader className="pb-3">
               <CardTitle className="text-lg flex items-center gap-2">
                 <Activity className="h-4 w-4 text-primary" /> Team Activity
               </CardTitle>
             </CardHeader>
             <CardContent>
                <div className="space-y-4 relative">
                   {/* Timeline Line */}
                   <div className="absolute left-4 top-2 bottom-2 w-px bg-border/50" />
                   
                   {activities.map((activity) => (
                      <div key={activity.id} className="relative pl-10 flex gap-3 text-sm">
                         <Avatar className="h-8 w-8 absolute left-0 border-2 border-background z-10">
                            <AvatarFallback className="text-[10px] bg-primary/10 text-primary">{activity.avatar}</AvatarFallback>
                         </Avatar>
                         <div>
                            <p className="leading-snug">
                               <span className="font-semibold text-foreground">{activity.user}</span>
                               <span className="text-muted-foreground"> {activity.action} </span>
                               <span className="font-medium text-foreground">{activity.target}</span>
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">{activity.time}</p>
                         </div>
                      </div>
                   ))}
                </div>
             </CardContent>
          </Card>

          {/* Quick Projects View */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Assigned Projects</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               {projects.slice(0, 3).map((project) => (
                  <div key={project.id} className="space-y-2">
                     <div className="flex justify-between text-sm">
                        <span className="font-medium">{project.name}</span>
                        <span className="text-muted-foreground text-xs">{project.status}</span>
                     </div>
                     <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div 
                           className="h-full bg-primary transition-all duration-500" 
                           style={{ width: `${project.progress}%` }} 
                        />
                     </div>
                     <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{project.role}</span>
                        <span>{project.progress}%</span>
                     </div>
                  </div>
               ))}
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