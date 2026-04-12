/**
 * Chat API
 * REST calls for conversations, message history, file uploads, and admin search.
 * Real-time message delivery uses Socket.IO (SocketContext + chat pages).
 */
import apiClient from './apiClient';

export interface Participant {
    _id: string;
    name: string;
    photo: string;
    role: string;
    teamProfile?: { position?: string; department?: string };
}

export interface Conversation {
    _id: string;
    participants: Participant[];
    type: 'user_admin' | 'admin_team' | 'team_team';
    lastMessage?: {
        _id: string;
        content: string;
        messageType: string;
        fileName?: string;
        senderId: { _id: string; name: string };
        createdAt: string;
    };
    lastMessageAt: string;
    isActive: boolean;
    unreadCount?: number;
    createdAt?: string;
}

export interface MessageReaction {
    emoji: string;
    users: string[]; // user IDs
}

export interface ChatMessage {
    _id: string;
    conversationId: string;
    senderId: { _id: string; name: string; photo: string; role: string };
    content: string;
    messageType: 'text' | 'file' | 'system';
    fileUrl?: string;
    fileName?: string;
    fileType?: string;
    fileMime?: string;
    readBy: string[];
    createdAt: string;
    isDeleted?: boolean;
    reactions?: MessageReaction[];
    isPinned?: boolean;
    pinnedBy?: { _id: string; name: string } | null;
    replyTo?: {
        _id: string;
        content: string;
        messageType: string;
        fileName?: string;
        isDeleted?: boolean;
        senderId: { _id: string; name: string };
    };
}

export interface UploadedFile {
    fileUrl: string;
    fileName: string;
    fileType: string;
    fileMime: string;
}

export const chatApi = {
    /** Get all conversations for the current user */
    getConversations: () =>
        apiClient.get<{ data: Conversation[] }>('/chat/conversations'),

    /** Get or create a conversation with another user.
     *  For 'user_admin'/'admin_team', participantId is optional — server finds admin automatically.
     *  For 'team_team', participantId is required. */
    getOrCreateConversation: (participantId: string | undefined, type: 'user_admin' | 'admin_team' | 'team_team') =>
        apiClient.post<{ data: Conversation }>('/chat/conversations', { participantId, type }),

    /** Get paginated messages for a conversation */
    getMessages: (conversationId: string, page = 1, limit = 50) =>
        apiClient.get<{
            data: {
                messages: ChatMessage[];
                pagination: { total: number; page: number; pages: number; hasMore: boolean };
            };
        }>(`/chat/conversations/${conversationId}/messages`, { params: { page, limit } }),

    /** Upload a file and get back the Cloudinary URL */
    uploadFile: (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return apiClient.post<{ data: UploadedFile }>('/chat/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },

    /** Admin: list all user-admin conversations, optional search */
    adminGetConversations: (type: 'user_admin' | 'admin_team' = 'user_admin', search?: string) =>
        apiClient.get<{ data: Conversation[] }>('/chat/admin/conversations', {
            params: { type, search },
        }),

    /** Admin: list team members available for DM */
    getTeamMembersForChat: () =>
        apiClient.get<{ data: Participant[] }>('/chat/admin/team-members'),

    /** Team: list other team members available for peer DM */
    getTeamPeersForChat: () =>
        apiClient.get<{ data: Participant[] }>('/chat/team/peers'),

    /** Admin: delete all messages in a conversation (keeps conversation) */
    clearChatMessages: (conversationId: string) =>
        apiClient.delete(`/chat/conversations/${conversationId}/messages`),

    /** Admin: permanently delete a conversation + all its messages */
    deleteConversation: (conversationId: string) =>
        apiClient.delete(`/chat/conversations/${conversationId}`),

    /** Get all pinned messages in a conversation */
    getPinnedMessages: (conversationId: string) =>
        apiClient.get<{ data: ChatMessage[] }>(`/chat/conversations/${conversationId}/pinned`),

    /** Search messages in a conversation by text */
    searchMessages: (conversationId: string, q: string) =>
        apiClient.get<{ data: ChatMessage[] }>(`/chat/conversations/${conversationId}/search`, { params: { q } }),
};
