/**
 * Team Reports Page
 * Productivity and performance analytics
 */
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Download, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

export default function TeamReports() {
  const productivityData = [
    { name: 'Mon', hours: 6.5, tasks: 4 },
    { name: 'Tue', hours: 7.2, tasks: 6 },
    { name: 'Wed', hours: 5.8, tasks: 3 },
    { name: 'Thu', hours: 8.0, tasks: 8 },
    { name: 'Fri', hours: 6.0, tasks: 5 },
  ];

  const projectDistribution = [
    { name: 'Fintech', value: 45, color: '#3b82f6' },
    { name: 'E-commerce', value: 30, color: '#8b5cf6' },
    { name: 'Internal', value: 25, color: '#10b981' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics & Reports</h2>
          <p className="text-muted-foreground">Track your productivity and project performance.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Calendar className="h-4 w-4" /> Last 7 Days
          </Button>
          <Button className="gap-2">
            <Download className="h-4 w-4" /> Export PDF
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Productivity Chart */}
        <Card className="col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle>Weekly Productivity</CardTitle>
            <CardDescription>Hours worked vs Tasks completed</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productivityData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs text-muted-foreground" />
                <YAxis className="text-xs text-muted-foreground" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                />
                <Bar dataKey="hours" name="Hours Logged" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="tasks" name="Tasks Completed" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Project Distribution */}
        <Card className="col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle>Time Distribution</CardTitle>
            <CardDescription>Time spent per project this week</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={projectDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {projectDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-4">
              {projectDistribution.map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
             <div className="flex items-center justify-between border-b border-border/50 pb-4">
               <div>
                 <p className="font-medium">Task Completion Rate</p>
                 <p className="text-sm text-muted-foreground">Percentage of assigned tasks completed on time</p>
               </div>
               <div className="text-right">
                 <p className="text-2xl font-bold text-green-500">92%</p>
                 <p className="text-xs text-muted-foreground">+5% vs last week</p>
               </div>
             </div>
             <div className="flex items-center justify-between border-b border-border/50 pb-4">
               <div>
                 <p className="font-medium">Average Response Time</p>
                 <p className="text-sm text-muted-foreground">Time taken to respond to client comments</p>
               </div>
               <div className="text-right">
                 <p className="text-2xl font-bold">1.5h</p>
                 <p className="text-xs text-muted-foreground">-15min vs last week</p>
               </div>
             </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}