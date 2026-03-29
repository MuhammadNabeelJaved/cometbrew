/**
 * User Notifications
 * Dedicated page for managing all notifications.
 * Wired to real REST API via useNotifications hook.
 */
import React, { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Bell, CheckCircle, AlertTriangle, Info, Trash2, Loader2, Check } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';

export default function UserNotifications() {
    const {
        notifications,
        unreadCount,
        isLoading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
    } = useNotifications({ enableToast: false });
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    const filtered = filter === 'all' ? notifications : notifications.filter((n) => !n.isRead);

    const getIcon = (type: string) => {
        switch (type) {
            case 'project_accepted': return <CheckCircle className="h-5 w-5 text-green-500" />;
            case 'project_rejected': return <AlertTriangle className="h-5 w-5 text-red-500" />;
            case 'project_assigned': return <Info className="h-5 w-5 text-blue-500" />;
            case 'file_received': return <Info className="h-5 w-5 text-purple-500" />;
            case 'message': return <Bell className="h-5 w-5 text-primary" />;
            default: return <Bell className="h-5 w-5 text-primary" />;
        }
    };

    const getIconBg = (type: string) => {
        switch (type) {
            case 'project_accepted': return 'bg-green-500/10';
            case 'project_rejected': return 'bg-red-500/10';
            case 'project_assigned': return 'bg-blue-500/10';
            case 'file_received': return 'bg-purple-500/10';
            default: return 'bg-primary/10';
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
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
                    <p className="text-muted-foreground">
                        {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                    </p>
                </div>
                <div className="flex gap-2">
                    {unreadCount > 0 && (
                        <Button variant="outline" className="gap-2" onClick={markAllAsRead}>
                            <Check className="h-4 w-4" /> Mark all read
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={clearAll}
                        disabled={notifications.length === 0}
                    >
                        <Trash2 className="h-4 w-4" /> Clear All
                    </Button>
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
                <div className="space-y-4">
                    {filtered.map((notification) => (
                        <Card
                            key={notification._id}
                            className={`p-4 transition-all duration-300 hover:shadow-md border-border/50 ${
                                !notification.isRead ? 'bg-secondary/10 border-l-4 border-l-primary' : ''
                            }`}
                        >
                            <div className="flex gap-4 items-start">
                                <div
                                    className={`mt-1 h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${getIconBg(notification.type)}`}
                                >
                                    {getIcon(notification.type)}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h3 className={`font-semibold ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                                            {notification.title}
                                        </h3>
                                        <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                                            {formatDate(notification.createdAt)}
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                                        {notification.message}
                                    </p>
                                    <div className="flex gap-4 mt-3">
                                        {!notification.isRead && (
                                            <button
                                                className="text-xs font-medium text-primary hover:underline"
                                                onClick={() => markAsRead(notification._id)}
                                            >
                                                Mark as Read
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
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
