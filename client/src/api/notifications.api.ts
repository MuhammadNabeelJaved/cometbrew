/**
 * Notifications API
 * REST calls for the /notifications dashboard page, bell icon list, and clear actions.
 */
import apiClient from './apiClient';

export interface ApiNotification {
    _id: string;
    type: 'message' | 'file_received' | 'project_accepted' | 'project_rejected' | 'project_assigned';
    title: string;
    message: string;
    payload: Record<string, unknown>;
    isRead: boolean;
    createdAt: string;
    createdBy?: { name: string; photo: string; role: string };
}

interface NotificationsResponse {
    data: {
        notifications: ApiNotification[];
        unreadCount: number;
        pagination: { total: number; page: number; pages: number; hasMore: boolean };
    };
}

export const notificationsApi = {
    /** Get paginated notification list for the current user */
    getAll: (page = 1, limit = 30, unreadOnly = false) =>
        apiClient.get<NotificationsResponse>('/notifications', {
            params: { page, limit, unread: unreadOnly || undefined },
        }),

    /** Mark a single notification as read */
    markAsRead: (id: string) =>
        apiClient.put<{ data: { unreadCount: number } }>(`/notifications/${id}`),

    /** Mark all notifications as read */
    markAllAsRead: () =>
        apiClient.put<{ data: { unreadCount: number } }>('/notifications/read-all'),

    /** Delete a single notification */
    deleteOne: (id: string) =>
        apiClient.delete<{ data: { unreadCount: number } }>(`/notifications/${id}`),

    /** Clear all notifications */
    clearAll: () =>
        apiClient.delete('/notifications'),
};
