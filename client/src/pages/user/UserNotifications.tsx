/**
 * User Notifications
 * Dedicated page for managing all notifications.
 */
import React from 'react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Bell, CheckCircle, AlertTriangle, Info, Trash2 } from 'lucide-react';

export default function UserNotifications() {
  const allNotifications = [
    {
      id: 1,
      title: "Project Milestone Reached",
      message: "The design phase for 'E-commerce Website' has been completed. Please review the deliverables.",
      time: "2 hours ago",
      type: "success",
      read: false
    },
    {
      id: 2,
      title: "New Message from Admin",
      message: "We need some clarification on the logo requirements.",
      time: "5 hours ago",
      type: "info",
      read: false
    },
    {
      id: 3,
      title: "Payment Successful",
      message: "We received your payment of $1,250.00 for Invoice #INV-2023-001.",
      time: "1 day ago",
      type: "success",
      read: true
    },
     {
      id: 4,
      title: "System Maintenance",
      message: "The platform will undergo scheduled maintenance on Saturday at 2:00 AM.",
      time: "2 days ago",
      type: "warning",
      read: true
    }
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'info': return <Info className="h-5 w-5 text-blue-500" />;
      default: return <Bell className="h-5 w-5 text-primary" />;
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
           <p className="text-muted-foreground">Stay updated with your project progress and alerts.</p>
        </div>
        <Button variant="outline" className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive">
            <Trash2 className="h-4 w-4" /> Clear All
        </Button>
      </div>

      <div className="space-y-4">
        {allNotifications.map((notification) => (
          <Card key={notification.id} className={`p-4 transition-all duration-300 hover:shadow-md border-border/50 ${!notification.read ? 'bg-secondary/10 border-l-4 border-l-primary' : ''}`}>
            <div className="flex gap-4 items-start">
              <div className={`mt-1 h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                notification.type === 'success' ? 'bg-green-500/10' : 
                notification.type === 'warning' ? 'bg-amber-500/10' : 
                notification.type === 'info' ? 'bg-blue-500/10' :
                'bg-primary/10'
              }`}>
                {getIcon(notification.type)}
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between items-start">
                    <h3 className={`font-semibold ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {notification.title}
                    </h3>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                        {notification.time}
                    </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    {notification.message}
                </p>
                
                <div className="flex gap-4 mt-3">
                    <button className="text-xs font-medium text-primary hover:underline">View Details</button>
                    <button className="text-xs font-medium text-muted-foreground hover:text-foreground">Mark as Read</button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}