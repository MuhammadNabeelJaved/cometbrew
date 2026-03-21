/**
 * Team Project Detail Page
 * Full page view for a specific project with detailed info and actions
 */
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  Users, 
  CheckCircle2, 
  MoreHorizontal, 
  ArrowLeft,
  FileText,
  Link as LinkIcon,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';

export default function TeamProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Mock data - in a real app, fetch based on ID
  const project = {
    id: 1,
    title: "Fintech Dashboard Redesign",
    client: "FinTech Corp",
    status: "Active",
    priority: "High",
    dueDate: "Mar 15, 2024",
    startDate: "Jan 10, 2024",
    description: "Complete overhaul of the user dashboard including new analytics widgets, dark mode support, and improved accessibility. The goal is to increase user engagement by 40% and reduce support tickets related to navigation.",
    techStack: ["React", "TypeScript", "Tailwind CSS", "Recharts"],
    team: [
      { name: "Sarah Jenkins", role: "PM", avatar: "https://i.pravatar.cc/150?u=1" },
      { name: "David Chen", role: "Tech Lead", avatar: "https://i.pravatar.cc/150?u=2" },
      { name: "You", role: "Lead Designer", avatar: "https://i.pravatar.cc/150?u=3" }
    ],
    tasks: [
      { id: 101, title: "Design System Update", status: "Completed", assignee: "You" },
      { id: 102, title: "Dark Mode Components", status: "In Progress", assignee: "David Chen" },
      { id: 103, title: "Analytics Widget Integration", status: "Pending", assignee: "You" }
    ],
    assets: [
      { name: "Brand_Guidelines.pdf", size: "2.4 MB" },
      { name: "Wireframes_v2.fig", size: "15 MB" }
    ]
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate('/team/projects')} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Back to Projects
      </Button>

      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">{project.title}</h1>
            <Badge variant={project.status === 'Active' ? 'default' : 'secondary'}>{project.status}</Badge>
          </div>
          <div className="flex items-center gap-4 text-muted-foreground">
            <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {project.client}</span>
            <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> Due: {project.dueDate}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Edit Project</Button>
          <Button>Update Status</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                {project.description}
              </p>
              
              <div className="pt-4">
                <h3 className="font-semibold mb-2">Tech Stack</h3>
                <div className="flex flex-wrap gap-2">
                  {project.techStack.map(tech => (
                    <Badge key={tech} variant="secondary">{tech}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="tasks">
            <TabsList>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
            </TabsList>
            <TabsContent value="tasks" className="space-y-4 mt-4">
              {project.tasks.map(task => (
                <Card key={task.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center ${task.status === 'Completed' ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground'}`}>
                      {task.status === 'Completed' && <CheckCircle2 className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="font-medium">{task.title}</p>
                      <p className="text-xs text-muted-foreground">Assigned to: {task.assignee}</p>
                    </div>
                  </div>
                  <Badge variant="outline">{task.status}</Badge>
                </Card>
              ))}
            </TabsContent>
            <TabsContent value="activity">
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  Activity log placeholder
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="files">
              <div className="grid gap-4">
                {project.assets.map((file, i) => (
                  <Card key={i} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-primary/50" />
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{file.size}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">Download</Button>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Team</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {project.team.map((member, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback>{member.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium leading-none">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.role}</p>
                    </div>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full text-xs">Manage Team</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Project Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Start Date</span>
                <span>{project.startDate}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Deadline</span>
                <span>{project.dueDate}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Priority</span>
                <span className="font-medium text-orange-500">{project.priority}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Client Contact</span>
                <span className="text-primary cursor-pointer hover:underline">View</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}