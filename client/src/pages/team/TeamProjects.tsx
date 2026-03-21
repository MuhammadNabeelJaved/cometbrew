/**
 * Team Projects Page
 * List of assigned projects
 */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, X, Users, Clock, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

export default function TeamProjects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([
    { 
      id: 1, 
      name: "Fintech Dashboard Redesign", 
      client: "FinTech Corp", 
      status: "Active", 
      role: "Lead Designer",
      dueDate: "Mar 15, 2024", 
      progress: 75,
      members: 4,
      description: "Complete overhaul of the user dashboard including new analytics widgets and dark mode support."
    },
    { 
      id: 2, 
      name: "E-commerce Mobile App", 
      client: "Shopify Store", 
      status: "Active", 
      role: "UI Designer",
      dueDate: "Apr 01, 2024", 
      progress: 45,
      members: 6,
      description: "Native mobile application design for iOS and Android platforms."
    },
    { 
      id: 3, 
      name: "SaaS Platform Frontend", 
      client: "Cloud Systems", 
      status: "Planning", 
      role: "Frontend Dev",
      dueDate: "Apr 20, 2024", 
      progress: 20,
      members: 3,
      description: "Implementation of the new react-based frontend architecture."
    },
    { 
      id: 4, 
      name: "Marketing Website", 
      client: "Growth IO", 
      status: "Completed", 
      role: "Web Developer",
      dueDate: "Feb 28, 2024", 
      progress: 100,
      members: 2,
      description: "Landing page development with high-performance animations."
    }
  ]);

  const handleDelete = (id: number) => {
    if(confirm('Are you sure you want to delete this project?')) {
      setProjects(projects.filter(p => p.id !== id));
    }
  };

  const handleAccept = (id: number) => {
    setProjects(projects.map(p => p.id === id ? {...p, status: 'Active'} : p));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Projects</h2>
          <p className="text-muted-foreground">Manage your assigned projects and track progress.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Filter</Button>
          <Button variant="outline">Sort</Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {projects.map((project) => (
          <Card key={project.id} className="group hover:border-primary/50 transition-all duration-300 flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-start mb-2">
                <Badge variant={project.status === 'Active' ? 'default' : project.status === 'Completed' ? 'secondary' : 'outline'}>
                  {project.status}
                </Badge>
                <div className="flex gap-1">
                   {project.status === 'Planning' && (
                     <Button variant="ghost" size="icon" className="h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-500/10" onClick={() => handleAccept(project.id)} title="Accept Project">
                       <Check className="h-4 w-4" />
                     </Button>
                   )}
                   <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(project.id)} title="Delete Project">
                      <X className="h-4 w-4" />
                   </Button>
                </div>
              </div>
              <CardTitle 
                className="line-clamp-1 group-hover:text-primary transition-colors cursor-pointer"
                onClick={() => navigate(`/team/projects/${project.id}`)}
              >
                {project.name}
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Users className="h-3 w-3" /> {project.client}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <p className="text-sm text-muted-foreground mb-6 line-clamp-2 min-h-[40px]">
                {project.description}
              </p>
              
              <div className="mt-auto space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{project.progress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-500" 
                      style={{ width: `${project.progress}%` }} 
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-border/50">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {project.dueDate}
                  </div>
                  <div className="flex items-center gap-2">
                     <div className="flex -space-x-2">
                      {[...Array(project.members)].slice(0, 3).map((_, i) => (
                        <div key={i} className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px] overflow-hidden">
                          <img src={`https://i.pravatar.cc/100?img=${i + 10 + project.id}`} alt="User" />
                        </div>
                      ))}
                    </div>
                    <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => navigate(`/team/projects/${project.id}`)}>
                      Details <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}