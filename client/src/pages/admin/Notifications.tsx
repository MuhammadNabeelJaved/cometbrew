/**
 * Notifications Admin Page
 * System alerts and messages
 */
import React, { useState } from 'react';
import { Bell, Check, Clock, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  time: string;
  read: boolean;
}

const initialNotifications: Notification[] = [
  {
    id: '1',
    title: 'Project Milestone Reached',
    message: 'The "Fintech Dashboard" project has reached 50% completion.',
    type: 'success',
    time: '2 min ago',
    read: false
  },
  {
    id: '2',
    title: 'Payment Successful',
    message: 'Your monthly subscription has been successfully processed.',
    type: 'info',
    time: '1 hour ago',
    read: false
  },
  {
    id: '3',
    title: 'Storage Limit Warning',
    message: 'You have used 85% of your allocated storage space.',
    type: 'warning',
    time: '3 hours ago',
    read: true
  },
  {
    id: '4',
    title: 'Security Alert',
    message: 'New login detected from a new device (London, UK).',
    type: 'alert',
    time: '1 day ago',
    read: true
  }
];

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const filteredNotifications = filter === 'all' 
    ? notifications 
    : notifications.filter(n => !n.read);

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'alert': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default: return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Notifications</h2>
          <p className="text-muted-foreground">Manage your system alerts and updates.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={markAllAsRead}>Mark all as read</Button>
        </div>
      </div>

      <div className="flex gap-2 pb-2">
        <Button 
          variant={filter === 'all' ? 'default' : 'ghost'} 
          size="sm" 
          onClick={() => setFilter('all')}
        >
          All
        </Button>
        <Button 
          variant={filter === 'unread' ? 'default' : 'ghost'} 
          size="sm" 
          onClick={() => setFilter('unread')}
        >
          Unread
        </Button>
      </div>

      <div className="grid gap-4">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-card rounded-lg border border-dashed">
            <Bell className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p>No notifications found</p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <Card key={notification.id} className={`transition-colors ${!notification.read ? 'bg-primary/5 border-primary/20' : ''}`}>
              <CardContent className="p-4 flex items-start gap-4">
                <div className="mt-1 bg-background p-2 rounded-full border shadow-sm">
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className={`font-medium ${!notification.read ? 'text-primary' : ''}`}>
                      {notification.title}
                    </p>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {notification.time}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {notification.message}
                  </p>
                </div>
                {!notification.read && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                    onClick={() => markAsRead(notification.id)}
                    title="Mark as read"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
