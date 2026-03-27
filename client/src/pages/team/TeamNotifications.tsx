/**
 * Team Notifications Page
 * Displays team-specific alerts, task updates, and mentions.
 * Wired to real REST API via useNotifications hook.
 */
import React, { useState } from 'react';
import { Bell, CheckCircle, AlertTriangle, Info, Clock, Loader2, Check, Trash2 } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { useNotifications } from '../../hooks/useNotifications';

export default function TeamNotifications() {
    const {
        notifications,
        unreadCount,
        isLoading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
    } = useNotifications();
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    const filtered = filter === 'all' ? notifications : notifications.filter((n) => !n.isRead);

    const getIcon = (type: string) => {
        switch (type) {
            case 'project_assigned': return <AlertTriangle className="h-5 w-5" />;
            case 'project_accepted': return <CheckCircle className="h-5 w-5" />;
            case 'project_rejected': return <AlertTriangle className="h-5 w-5" />;
            default: return <Info className="h-5 w-5" />;
        }
    };

    const getIconStyle = (type: string) => {
        switch (type) {
            case 'project_assigned': return 'bg-blue-500/10 text-blue-500';
            case 'project_accepted': return 'bg-green-500/10 text-green-500';
            case 'project_rejected': return 'bg-red-500/10 text-red-500';
            default: return 'bg-blue-500/10 text-blue-500';
        }
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - d.getTime();
        if (diff < 60 * 1000) return 'Just now';
        if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / 3600000)}h ago`;
        return `${Math.floor(diff / 86400000)}d ago`;
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
                    <p className="text-muted-foreground mt-2">Stay updated with your team activities.</p>
                </div>
                <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                        <Badge variant="outline" className="px-4 py-1">
                            {unreadCount} Unread
                        </Badge>
                    )}
                    {notifications.length > 0 && (
                        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={clearAll}>
                            <Trash2 className="h-4 w-4" /> Clear all
                        </Button>
                    )}
                </div>
            </div>

            <div className="flex gap-2">
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
                    Unread {unreadCount > 0 && `(${unreadCount})`}
                </Button>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground border border-dashed rounded-xl">
                    <Bell className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    <p>No notifications found</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filtered.map((notification) => (
                        <Card
                            key={notification._id}
                            className={`transition-all hover:shadow-md ${
                                !notification.isRead ? 'border-primary/50 bg-primary/5' : ''
                            }`}
                        >
                            <CardContent className="p-4 flex items-start gap-4">
                                <div className={`p-2 rounded-full shrink-0 ${getIconStyle(notification.type)}`}>
                                    {getIcon(notification.type)}
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="flex justify-between items-start">
                                        <h4 className={`font-semibold ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                                            {notification.title}
                                        </h4>
                                        <div className="flex items-center text-xs text-muted-foreground gap-1 ml-2 shrink-0">
                                            <Clock className="h-3 w-3" />
                                            {formatDate(notification.createdAt)}
                                        </div>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                                    <div className="flex gap-3 pt-1">
                                        {!notification.isRead && (
                                            <button
                                                className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                                                onClick={() => markAsRead(notification._id)}
                                            >
                                                <Check className="h-3 w-3" /> Mark as read
                                            </button>
                                        )}
                                        <button
                                            className="text-xs font-medium text-muted-foreground hover:text-destructive"
                                            onClick={() => deleteNotification(notification._id)}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
