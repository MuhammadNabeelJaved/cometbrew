/**
 * NotificationBell
 * Reusable bell icon with live unread badge + dropdown list.
 * Driven by useNotifications hook (socket + REST).
 * Used in DashboardLayout, UserDashboardLayout, TeamDashboardLayout.
 */
import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, AlertCircle, Info, Clock, X, CheckCircle2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '../hooks/useNotifications';

interface NotificationBellProps {
    /** Route for the "See all" link. E.g. "/admin/notifications" */
    notificationsRoute: string;
    /** Route for the chat page. When provided, message notifications navigate to it with ?convoId= param. */
    chatRoute?: string;
}

export function NotificationBell({ notificationsRoute, chatRoute }: NotificationBellProps) {
    const navigate = useNavigate();
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications({ enableToast: false });
    const [open, setOpen] = React.useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        function onClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener('mousedown', onClickOutside);
        return () => document.removeEventListener('mousedown', onClickOutside);
    }, []);

    const getIcon = (type: string) => {
        switch (type) {
            case 'project_accepted': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
            case 'project_rejected': return <AlertTriangle className="h-4 w-4 text-red-500" />;
            case 'project_assigned': return <Info className="h-4 w-4 text-blue-500" />;
            case 'file_received': return <Info className="h-4 w-4 text-purple-500" />;
            case 'message': return <Bell className="h-4 w-4 text-primary" />;
            default: return <Info className="h-4 w-4 text-blue-500" />;
        }
    };

    const formatTime = (dateStr: string) => {
        const d = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - d.getTime();
        if (diff < 60 * 1000) return 'Now';
        if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / 3600000)}h ago`;
        return `${Math.floor(diff / 86400000)}d ago`;
    };

    // Show only the most recent 6 in the dropdown
    const recent = notifications.slice(0, 6);

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen((o) => !o)}
                className="relative group p-2 rounded-full hover:bg-accent transition-colors outline-none"
                aria-label="Notifications"
            >
                <Bell className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary text-[10px] text-primary-foreground font-bold flex items-center justify-center shadow-[0_0_8px_rgba(var(--primary),0.5)]">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-card border border-border/50 rounded-xl shadow-2xl backdrop-blur-xl z-50 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-border/50 flex items-center justify-between bg-muted/30">
                            <div>
                                <h3 className="font-semibold text-foreground">Notifications</h3>
                                <p className="text-xs text-muted-foreground">
                                    {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                                </p>
                            </div>
                            <button
                                onClick={() => setOpen(false)}
                                className="p-1 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* List */}
                        <div className="max-h-[400px] overflow-y-auto">
                            {recent.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground">
                                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                    <p className="text-sm">No notifications yet</p>
                                </div>
                            ) : (
                                recent.map((notif) => (
                                    <div
                                        key={notif._id}
                                        className={`p-4 border-b border-border/50 hover:bg-muted/50 transition-colors cursor-pointer flex gap-3 ${
                                            !notif.isRead ? 'bg-primary/5' : ''
                                        }`}
                                        onClick={() => {
                                            if (!notif.isRead) markAsRead(notif._id);
                                            const isChatNotif = notif.type === 'message' || notif.type === 'file_received';
                                            if (isChatNotif && chatRoute && notif.payload?.conversationId) {
                                                setOpen(false);
                                                const convoId = notif.payload.conversationId as string;
                                                const msgId = notif.payload.messageId as string | undefined;
                                                const url = msgId
                                                    ? `${chatRoute}?convoId=${convoId}&messageId=${msgId}`
                                                    : `${chatRoute}?convoId=${convoId}`;
                                                navigate(url);
                                            }
                                        }}
                                    >
                                        <div className={`mt-1 h-8 w-8 rounded-full flex items-center justify-center shrink-0 bg-background border`}>
                                            {getIcon(notif.type)}
                                        </div>
                                        <div className="flex-1 space-y-0.5 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <p className={`text-sm font-medium truncate ${!notif.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                    {notif.title}
                                                </p>
                                                <span className="text-[10px] text-muted-foreground flex items-center gap-1 ml-1 shrink-0">
                                                    <Clock className="h-3 w-3" /> {formatTime(notif.createdAt)}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground line-clamp-2">
                                                {notif.message}
                                            </p>
                                        </div>
                                        {!notif.isRead && (
                                            <div className="self-center shrink-0">
                                                <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-3 bg-muted/30 border-t border-border/50 flex items-center justify-between">
                            {unreadCount > 0 ? (
                                <button
                                    className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                                    onClick={markAllAsRead}
                                >
                                    Mark all as read
                                </button>
                            ) : (
                                <span />
                            )}
                            <button
                                className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                                onClick={() => {
                                    setOpen(false);
                                    navigate(notificationsRoute);
                                }}
                            >
                                See all →
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
