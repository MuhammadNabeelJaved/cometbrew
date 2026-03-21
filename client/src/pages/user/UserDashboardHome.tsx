/**
 * User Dashboard Home
 * Overview of the user's account and activities.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { 
  FolderKanban, 
  Clock, 
  CheckCircle, 
  CreditCard,
  ArrowRight,
  TrendingUp,
  MessageSquare,
  Plus
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function UserDashboardHome() {
  const navigate = useNavigate();
  const stats = [
    { label: 'Active Projects', value: '2', icon: FolderKanban, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Pending Orders', value: '1', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Completed', value: '12', icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'Total Spent', value: '$4,500', icon: CreditCard, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ];

  const recentProjects = [
    { id: 1, name: 'E-commerce Website', status: 'In Progress', progress: 65, date: 'Oct 24, 2023', image: 'https://images.unsplash.com/photo-1523206485973-27457d363c18?auto=format&fit=crop&q=80&w=300' },
    { id: 2, name: 'Mobile App Design', status: 'Pending Review', progress: 90, date: 'Oct 20, 2023', image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&q=80&w=300' },
    { id: 3, name: 'Logo Redesign', status: 'Completed', progress: 100, date: 'Sep 15, 2023', image: 'https://images.unsplash.com/photo-1626785774573-4b799312c95d?auto=format&fit=crop&q=80&w=300' },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, Alex! 👋</h1>
          <p className="text-muted-foreground mt-1">Here's what's happening with your projects today.</p>
        </div>
        <Button 
          className="gap-2 shadow-lg shadow-primary/25"
          onClick={() => navigate('/user-dashboard/projects', { state: { openNewProject: true } })}
        >
          <Plus className="h-4 w-4" /> New Project
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <h3 className="text-2xl font-bold mt-2">{stat.value}</h3>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bg}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Projects */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Recent Projects</h2>
            <Button variant="ghost" className="text-primary hover:text-primary/80">View All</Button>
          </div>
          
          <div className="space-y-4">
            {recentProjects.map((project, i) => (
              <motion.div 
                key={project.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + (i * 0.1) }}
                className="group relative bg-card border border-border/50 rounded-xl p-4 hover:shadow-lg transition-all duration-300 hover:border-primary/50"
              >
                <div className="flex items-center gap-4">
                  <div className="h-16 w-24 rounded-lg overflow-hidden shrink-0">
                    <img src={project.image} alt={project.name} className="h-full w-full object-cover transition-transform group-hover:scale-110 duration-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold truncate pr-4">{project.name}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full border ${
                        project.status === 'Completed' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                        project.status === 'In Progress' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 
                        'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      }`}>
                        {project.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">Started {project.date}</p>
                    <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Quick Actions & Support */}
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-primary/10 to-blue-600/5 border-none shadow-inner">
            <CardHeader>
              <CardTitle className="text-lg">Need Assistance?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Our support team is available 24/7 to help you with any questions or project details.
              </p>
              <Button 
                className="w-full gap-2" 
                variant="secondary"
                onClick={() => navigate('/user-dashboard/messages')}
              >
                <MessageSquare className="h-4 w-4" /> Chat with Support
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notifications</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y divide-border/50">
                    {[1, 2, 3].map((n) => (
                        <div key={n} className="p-4 hover:bg-muted/50 transition-colors cursor-pointer flex gap-3">
                            <div className="h-2 w-2 mt-2 rounded-full bg-blue-500 shrink-0" />
                            <div>
                                <p className="text-sm font-medium">New mockup uploaded</p>
                                <p className="text-xs text-muted-foreground mt-1">2 hours ago</p>
                            </div>
                        </div>
                    ))}
                </div>
                <Button variant="ghost" className="w-full text-xs py-3 rounded-t-none">View All Notifications</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}