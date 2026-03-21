/**
 * Dashboard Home Page
 * - Welcome message
 * - Summary cards
 * - Activity timeline
 * - Performance charts
 * - Content Management (Quick Edit)
 */
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Activity, CreditCard, Users, FolderKanban, ArrowUpRight, ArrowDownRight, Clock, CheckCircle2, Save, LayoutTemplate } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useContent } from '../../contexts/ContentContext';

const data = [
  { name: 'Mon', usage: 4000, projects: 2400 },
  { name: 'Tue', usage: 3000, projects: 1398 },
  { name: 'Wed', usage: 2000, projects: 9800 },
  { name: 'Thu', usage: 2780, projects: 3908 },
  { name: 'Fri', usage: 1890, projects: 4800 },
  { name: 'Sat', usage: 2390, projects: 3800 },
  { name: 'Sun', usage: 3490, projects: 4300 },
];

export default function DashboardHome() {
  const { heroContent, updateHeroContent } = useContent();
  const [editingContent, setEditingContent] = useState(heroContent);
  const [isSaving, setIsSaving] = useState(false);
  const [isModified, setIsModified] = useState(false);

  const handleContentChange = (field: keyof typeof heroContent, value: string) => {
    setEditingContent(prev => ({ ...prev, [field]: value }));
    setIsModified(true);
  };

  const handleSaveContent = () => {
    setIsSaving(true);
    // Simulate API delay
    setTimeout(() => {
      updateHeroContent(editingContent);
      setIsSaving(false);
      setIsModified(false);
    }, 500);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">Welcome back, Alex. Here's what's happening with your projects.</p>
        </div>
        <div className="flex space-x-2">
          <Button>Download Report</Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$45,231.89</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <span className="text-green-500 flex items-center mr-1"><ArrowUpRight className="h-3 w-3" /> +20.1%</span> from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+12</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <span className="text-green-500 flex items-center mr-1"><ArrowUpRight className="h-3 w-3" /> +4</span> new this week
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Tokens Used</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.2M</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
               <span className="text-yellow-500 flex items-center mr-1"><ArrowUpRight className="h-3 w-3" /> +12%</span> usage increase
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
               <span className="text-green-500 flex items-center mr-1"><ArrowDownRight className="h-3 w-3" /> -2</span> since yesterday
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        
        {/* Quick Edit Content - NEW SECTION */}
        <Card className="col-span-4 lg:col-span-3 border-primary/20 shadow-lg shadow-primary/5">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1.5">
              <CardTitle className="flex items-center gap-2">
                <LayoutTemplate className="h-5 w-5 text-primary" />
                Edit Home Page
              </CardTitle>
              <CardDescription>Quickly update your hero section content.</CardDescription>
            </div>
            {isModified && (
              <Badge variant="outline" className="text-amber-500 border-amber-500/50">Unsaved Changes</Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase text-muted-foreground">Status Badge</label>
              <Input 
                value={editingContent.badgeText}
                onChange={(e) => handleContentChange('badgeText', e.target.value)}
                placeholder="e.g. Accepting New Projects"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase text-muted-foreground">Title Line 1</label>
                <Input 
                  value={editingContent.titleLine1}
                  onChange={(e) => handleContentChange('titleLine1', e.target.value)}
                  placeholder="e.g. We Build"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase text-muted-foreground">Title Line 2 (Colored)</label>
                <Input 
                  value={editingContent.titleLine2}
                  onChange={(e) => handleContentChange('titleLine2', e.target.value)}
                  placeholder="e.g. Digital Excellence"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium uppercase text-muted-foreground">Subtitle</label>
              <Textarea 
                value={editingContent.subtitle}
                onChange={(e) => handleContentChange('subtitle', e.target.value)}
                placeholder="Hero description text..."
                className="resize-none min-h-[80px]"
              />
            </div>

            <Button 
              onClick={handleSaveContent} 
              disabled={!isModified || isSaving}
              className="w-full"
            >
              {isSaving ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" /> Save Changes
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Chart */}
        <Card className="col-span-4 lg:col-span-4">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>System usage and project activity over the last 7 days.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs text-muted-foreground" />
                  <YAxis className="text-xs text-muted-foreground" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Bar dataKey="usage" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Projects List Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Active Projects</CardTitle>
          <CardDescription>Your currently running projects and their status.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { name: "Website Redesign", status: "In Progress", progress: 65, date: "Due Mar 15, 2024" },
              { name: "Mobile App Dev", status: "Review", progress: 90, date: "Due Mar 10, 2024" },
              { name: "AI Integration", status: "Planning", progress: 15, date: "Due Apr 01, 2024" },
            ].map((project, i) => (
              <div key={i} className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0">
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <FolderKanban className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{project.name}</p>
                    <p className="text-xs text-muted-foreground">{project.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant={project.status === "Review" ? "warning" : project.status === "In Progress" ? "default" : "secondary"}>
                    {project.status}
                  </Badge>
                  <div className="w-24 bg-muted rounded-full h-2 overflow-hidden">
                    <div className="bg-primary h-full" style={{ width: `${project.progress}%` }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}