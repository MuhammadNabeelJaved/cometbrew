/**
 * Notifications Admin Page
 * System alerts and messages — wired to real REST API via useNotifications hook.
 */
import React, { useState } from 'react';
import { Bell, Check, Clock, Info, AlertTriangle, CheckCircle2, Loader2, Trash2 } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { useNotifications } from '../../hooks/useNotifications';

export default function Notifications() {
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
            case 'project_accepted': return <CheckCircle2 className="h-5 w-5 text-green-500" />;
            case 'project_rejected': return <AlertTriangle className="h-5 w-5 text-red-500" />;
            case 'project_assigned': return <Info className="h-5 w-5 text-blue-500" />;
            case 'file_received': return <Info className="h-5 w-5 text-purple-500" />;
            case 'message': return <Bell className="h-5 w-5 text-primary" />;
            default: return <Info className="h-5 w-5 text-blue-500" />;
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
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Notifications</h2>
                    <p className="text-muted-foreground">Manage your system alerts and updates.</p>
                </div>
                <div className="flex gap-2">
                    {unreadCount > 0 && (
                        <Button variant="outline" onClick={markAllAsRead}>
                            Mark all as read
                        </Button>
                    )}
                    {notifications.length > 0 && (
                        <Button
                            variant="outline"
                            className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={clearAll}
                        >
                            <Trash2 className="h-4 w-4" /> Clear all
                        </Button>
                    )}
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
                    Unread {unreadCount > 0 && `(${unreadCount})`}
                </Button>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground bg-card rounded-lg border border-dashed">
                    <Bell className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    <p>No notifications found</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filtered.map((notification) => (
                        <Card
                            key={notification._id}
                            className={`transition-colors ${!notification.isRead ? 'bg-primary/5 border-primary/20' : ''}`}
                        >
                            <CardContent className="p-4 flex items-start gap-4">
                                <div className="mt-1 bg-background p-2 rounded-full border shadow-sm">
                                    {getIcon(notification.type)}
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <p className={`font-medium ${!notification.isRead ? 'text-primary' : ''}`}>
                                            {notification.title}
                                        </p>
                                        <span className="text-xs text-muted-foreground flex items-center gap-1 ml-2 shrink-0">
                                            <Clock className="h-3 w-3" /> {formatDate(notification.createdAt)}
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {notification.message}
                                    </p>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    {!notification.isRead && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                                            onClick={() => markAsRead(notification._id)}
                                            title="Mark as read"
                                        >
                                            <Check className="h-4 w-4" />
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                        onClick={() => deleteNotification(notification._id)}
                                        title="Delete"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
