/**
 * Team Notifications Page
 * Displays team-specific alerts, task updates, and mentions
 */
import React from 'react';
import { Bell, CheckCircle, AlertTriangle, Info, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

export default function TeamNotifications() {
  const notifications = [
    {
      id: 1,
      title: 'New Task Assigned',
      message: 'You have been assigned to "Website Redesign" project',
      type: 'info',
      time: '2 hours ago',
      read: false
    },
    {
      id: 2,
      title: 'Project Deadline Approaching',
      message: 'Mobile App Development deadline is in 2 days',
      type: 'warning',
      time: '5 hours ago',
      read: false
    },
    {
      id: 3,
      title: 'Design Review Completed',
      message: 'The design assets for the new campaign have been approved',
      type: 'success',
      time: '1 day ago',
      read: true
    },
    {
      id: 4,
      title: 'Team Meeting',
      message: 'Weekly sync meeting scheduled for tomorrow at 10 AM',
      type: 'info',
      time: '1 day ago',
      read: true
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground mt-2">Stay updated with your team activities.</p>
        </div>
        <Badge variant="outline" className="px-4 py-1">
          {notifications.filter(n => !n.read).length} Unread
        </Badge>
      </div>

      <div className="grid gap-4">
        {notifications.map((notification) => (
          <Card key={notification.id} className={`transition-all hover:shadow-md ${!notification.read ? 'border-primary/50 bg-primary/5' : ''}`}>
            <CardContent className="p-4 flex items-start gap-4">
              <div className={`p-2 rounded-full shrink-0 ${
                notification.type === 'warning' ? 'bg-orange-500/10 text-orange-500' :
                notification.type === 'success' ? 'bg-green-500/10 text-green-500' :
                'bg-blue-500/10 text-blue-500'
              }`}>
                {notification.type === 'warning' ? <AlertTriangle className="h-5 w-5" /> :
                 notification.type === 'success' ? <CheckCircle className="h-5 w-5" /> :
                 <Info className="h-5 w-5" />}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-start">
                  <h4 className={`font-semibold ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {notification.title}
                  </h4>
                  <div className="flex items-center text-xs text-muted-foreground gap-1">
                    <Clock className="h-3 w-3" />
                    {notification.time}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{notification.message}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}