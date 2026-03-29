/**
 * useNotifications Hook
 *
 * Single hook that drives all three notification surfaces:
 *  1. Toast (transient) — via sonner toast
 *  2. Bell icon counter — `unreadCount` state
 *  3. /notifications page — `notifications` list
 *
 * On mount:
 *  - Fetches initial list and unread count from REST API
 *  - Listens to "notification:new" socket event to prepend + toast in real time
 *  - Listens to "notification:unread_count" for reconnect count sync
 *
 * Usage:
 *   const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import { notificationsApi } from '../api/notifications.api';

export interface AppNotification {
    _id: string;
    type: string;
    title: string;
    message: string;
    payload: Record<string, unknown>;
    isRead: boolean;
    createdAt: string;
    createdBy?: { name: string; photo: string; role: string };
}

export function useNotifications({ enableToast = true }: { enableToast?: boolean } = {}) {
    const { socket } = useSocket();
    const { isAuthenticated } = useAuth();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    // ── Initial fetch on mount ─────────────────────────────────────────────────
    const fetchNotifications = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            setIsLoading(true);
            const res = await notificationsApi.getAll();
            setNotifications(res.data.data.notifications || []);
            setUnreadCount(res.data.data.unreadCount || 0);
        } catch {
            // Silently fail — user might not be authenticated yet
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // ── Socket event listeners ─────────────────────────────────────────────────
    useEffect(() => {
        if (!socket) return;

        // New notification arrives in real time
        const onNew = (notif: AppNotification) => {
            // 1. Prepend to list
            setNotifications((prev) => [notif, ...prev]);
            // 2. Increment bell counter
            setUnreadCount((c) => c + 1);
            // 3. Show transient toast (only the designated instance per layout)
            if (enableToast) {
                const toastFn = getToastFn(notif.type);
                toastFn(notif.title, { description: notif.message });
            }
        };

        // Server sends the accurate count (on reconnect / after mark-read via socket)
        const onUnreadCount = ({ count }: { count: number }) => {
            setUnreadCount(count);
            // Re-fetch notification list to sync isRead status on chat notifications
            fetchNotifications();
        };

        socket.on('notification:new', onNew);
        socket.on('notification:unread_count', onUnreadCount);

        return () => {
            socket.off('notification:new', onNew);
            socket.off('notification:unread_count', onUnreadCount);
        };
    }, [socket]);

    // ── Actions ───────────────────────────────────────────────────────────────

    const markAsRead = useCallback(async (id: string) => {
        try {
            await notificationsApi.markAsRead(id);
            setNotifications((prev) =>
                prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
            );
            setUnreadCount((c) => Math.max(0, c - 1));
            // Sync via socket so all tabs update
            socket?.emit('notification:mark_read', { notificationId: id });
        } catch {
            toast.error('Failed to mark notification as read');
        }
    }, [socket]);

    const markAllAsRead = useCallback(async () => {
        try {
            await notificationsApi.markAllAsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            setUnreadCount(0);
            socket?.emit('notification:mark_all_read');
        } catch {
            toast.error('Failed to mark all as read');
        }
    }, [socket]);

    const deleteNotification = useCallback(async (id: string) => {
        const notif = notifications.find((n) => n._id === id);
        try {
            await notificationsApi.deleteOne(id);
            setNotifications((prev) => prev.filter((n) => n._id !== id));
            if (notif && !notif.isRead) setUnreadCount((c) => Math.max(0, c - 1));
        } catch {
            toast.error('Failed to delete notification');
        }
    }, [notifications]);

    const clearAll = useCallback(async () => {
        try {
            await notificationsApi.clearAll();
            setNotifications([]);
            setUnreadCount(0);
        } catch {
            toast.error('Failed to clear notifications');
        }
    }, []);

    // Count of unread chat notifications (message + file_received) — drives sidebar badge
    const chatUnreadCount = useMemo(
        () => notifications.filter(n => !n.isRead && (n.type === 'message' || n.type === 'file_received')).length,
        [notifications]
    );

    return {
        notifications,
        unreadCount,
        chatUnreadCount,
        isLoading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
        refresh: fetchNotifications,
    };
}

// ── Toast style per notification type ─────────────────────────────────────────
function getToastFn(type: string) {
    switch (type) {
        case 'project_accepted':
            return toast.success;
        case 'project_rejected':
            return toast.error;
        case 'project_assigned':
        case 'file_received':
            return toast.info;
        case 'message':
        default:
            return toast.message;
    }
}
