/**
 * Admin Messages Page
 * Split view: sidebar lists all user-admin conversations (searchable),
 * main area shows the live chat thread.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Search, MoreVertical, Phone, Video, Send, Paperclip,
    CheckCheck, Users, Loader2, Hash, UserX, MessageSquarePlus, X
} from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { chatApi, ChatMessage, Conversation } from '../../api/chat.api';
import { ChatFileMessage } from '../../components/ChatFileMessage';
import { SwipeableMessage } from '../../components/SwipeableMessage';

type ChatTab = 'users' | 'team';

export default function Messages() {
    const { user } = useAuth();
    const { socket, isConnected } = useSocket();
    const [searchParams] = useSearchParams();
    const initialTab = searchParams.get('tab') === 'team' ? 'team' : 'users';
    const [tab, setTab] = useState<ChatTab>(initialTab);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConvo, setSelectedConvo] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [search, setSearch] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isMsgsLoading, setIsMsgsLoading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [typingUser, setTypingUser] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
    const [highlightedMsgId, setHighlightedMsgId] = useState<string | null>(null);
    // Per-conversation unread counts (incremented on new msg when not selected, cleared on select)
    const [convoUnread, setConvoUnread] = useState<Record<string, number>>({});
    // Team tab unread badge (increments when on users tab and team msg arrives)
    const [teamTabUnread, setTeamTabUnread] = useState(0);
    // New team DM modal
    const [showNewDmModal, setShowNewDmModal] = useState(false);
    const [teamMembers, setTeamMembers] = useState<Array<{ _id: string; name: string; photo: string; teamProfile?: { position?: string } }>>([]);
    const [isLoadingMembers, setIsLoadingMembers] = useState(false);
    const [isStartingDm, setIsStartingDm] = useState<string | null>(null);
    const { chatUnreadCount } = useNotifications();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const scrolledToMsgRef = useRef<string | null>(null);
    // Keep a ref to selectedConvo so reconnect effect can access current value
    const selectedConvoRef = useRef<Conversation | null>(null);
    useEffect(() => { selectedConvoRef.current = selectedConvo; }, [selectedConvo]);

    // ── Load conversations ───────────────────────────────────────────────────
    const loadConversations = useCallback(async (type: ChatTab) => {
        try {
            setIsLoading(true);
            setSelectedConvo(null);
            setMessages([]);
            const convoType = type === 'users' ? 'user_admin' : 'admin_team';
            const res = await chatApi.adminGetConversations(convoType, search || undefined);
            setConversations(res.data.data || []);
        } catch (err: any) {
            toast.error('Failed to load conversations', { description: err?.response?.data?.message || 'Please try again.' });
        } finally {
            setIsLoading(false);
        }
    }, [search]);

    useEffect(() => {
        if (user?.role === 'admin') loadConversations(tab);
        if (tab === 'team') setTeamTabUnread(0); // clear badge when switching to team tab
    }, [tab, user]);

    // Re-filter on search change
    useEffect(() => {
        const t = setTimeout(() => {
            if (user?.role === 'admin') loadConversations(tab);
        }, 400);
        return () => clearTimeout(t);
    }, [search]);

    // Auto-select conversation from URL param ?convoId=...
    useEffect(() => {
        const convoId = searchParams.get('convoId');
        if (!convoId || conversations.length === 0) return;
        const match = conversations.find((c) => c._id === convoId);
        if (match && selectedConvo?._id !== convoId) selectConversation(match);
    }, [conversations, searchParams]);

    // ── Load team members for New DM modal ───────────────────────────────────
    const loadTeamMembers = useCallback(async () => {
        try {
            setIsLoadingMembers(true);
            const res = await chatApi.getTeamMembersForChat();
            setTeamMembers(res.data.data || []);
        } catch { /* silent */ } finally {
            setIsLoadingMembers(false);
        }
    }, []);

    const startTeamDm = async (memberId: string) => {
        try {
            setIsStartingDm(memberId);
            const res = await chatApi.getOrCreateConversation(memberId, 'admin_team');
            const convo = res.data.data;
            setShowNewDmModal(false);
            // Switch to team tab if needed and select the conversation
            if (tab !== 'team') {
                setTab('team');
                // loadConversations('team') will be triggered by the tab effect
                // Wait for conversations to load then select
                setTimeout(() => selectConversation(convo), 600);
            } else {
                await loadConversations('team');
                selectConversation(convo);
            }
        } catch (err: any) {
            toast.error('Failed to start conversation');
        } finally {
            setIsStartingDm(null);
        }
    };

    // ── Socket new support request alert ─────────────────────────────────────
    useEffect(() => {
        if (!socket) return;
        const onNewRequest = () => {
            if (tab === 'users') loadConversations('users');
        };
        socket.on('admin:new_support_request', onNewRequest);
        return () => { socket.off('admin:new_support_request', onNewRequest); };
    }, [socket, tab]);

    // ── Reconnect recovery: rejoin room + reload messages + update preview ────
    useEffect(() => {
        if (!isConnected || !socket) return;
        const convo = selectedConvoRef.current;
        if (!convo) return;
        socket.emit('chat:join_conversation', { conversationId: convo._id });
        chatApi.getMessages(convo._id, 1, 50)
            .then((res) => {
                const msgs = res.data.data?.messages || [];
                setMessages(msgs);
                // Update sidebar preview to reflect the latest message
                const lastMsg = msgs.filter(m => m.messageType !== 'system').pop();
                if (lastMsg) {
                    setConversations(prev => prev.map(c =>
                        c._id === convo._id
                            ? {
                                ...c,
                                lastMessageAt: lastMsg.createdAt,
                                lastMessage: {
                                    _id: lastMsg._id,
                                    content: lastMsg.content,
                                    messageType: lastMsg.messageType,
                                    fileName: lastMsg.fileName,
                                    senderId: lastMsg.senderId as any,
                                    createdAt: lastMsg.createdAt,
                                },
                              }
                            : c
                    ));
                }
            })
            .catch(() => {});
    }, [isConnected, socket]);

    const selectConversation = async (convo: Conversation) => {
        if (selectedConvo) {
            socket?.emit('chat:leave_conversation', { conversationId: selectedConvo._id });
        }
        setSelectedConvo(convo);
        // Clear unread count for this conversation
        setConvoUnread(prev => ({ ...prev, [convo._id]: 0 }));
        setMessages([]);
        try {
            setIsMsgsLoading(true);
            const res = await chatApi.getMessages(convo._id, 1, 50);
            const msgs = res.data.data?.messages || [];
            setMessages(msgs);
            // Update sidebar preview with the latest real message
            const lastMsg = msgs.filter((m: any) => m.messageType !== 'system').pop();
            if (lastMsg) {
                setConversations(prev => prev.map(c =>
                    c._id === convo._id
                        ? {
                            ...c,
                            lastMessageAt: lastMsg.createdAt,
                            lastMessage: {
                                _id: lastMsg._id,
                                content: lastMsg.content,
                                messageType: lastMsg.messageType,
                                fileName: lastMsg.fileName,
                                senderId: lastMsg.senderId as any,
                                createdAt: lastMsg.createdAt,
                            },
                          }
                        : c
                ));
            }
            socket?.emit('chat:join_conversation', { conversationId: convo._id });
            socket?.emit('chat:read_messages', { conversationId: convo._id });
        } catch (err: any) {
            toast.error('Failed to load messages', { description: err?.response?.data?.message || 'Please try again.' });
        } finally {
            setIsMsgsLoading(false);
        }
    };

    // ── Socket listeners ─────────────────────────────────────────────────────
    useEffect(() => {
        if (!socket) return;

        const onNewMessage = (msg: ChatMessage) => {
            if (msg.conversationId === selectedConvo?._id) {
                setMessages((prev) => {
                    if (prev.find((m) => m._id === msg._id)) return prev;
                    return [...prev, msg];
                });
                socket.emit('chat:read_messages', { conversationId: msg.conversationId });
            } else {
                // Increment per-conversation unread
                setConvoUnread(prev => ({ ...prev, [msg.conversationId]: (prev[msg.conversationId] ?? 0) + 1 }));
                // If this is a team message and admin is on 'users' tab, bump teamTabUnread
                // We detect team msg by checking if it's in the current conversations list
                setTeamTabUnread(prev => {
                    // Only increment if we're viewing users tab and convo isn't in current list
                    // (meaning it belongs to the other tab)
                    return prev + 1;
                });
            }
            setConversations((prev) => {
                const exists = prev.find(c => c._id === msg.conversationId);
                if (!exists) return prev; // belongs to other tab
                return prev.map((c) =>
                    c._id === msg.conversationId
                        ? {
                            ...c,
                            lastMessageAt: msg.createdAt,
                            lastMessage: {
                                _id: msg._id,
                                content: msg.content,
                                messageType: msg.messageType,
                                fileName: msg.fileName,
                                senderId: msg.senderId as any,
                                createdAt: msg.createdAt,
                            },
                          }
                        : c
                );
            });
        };

        const onTyping = ({ userName, isTyping: typing }: { userId: string; userName: string; isTyping: boolean }) => {
            setTypingUser(typing ? userName : '');
            setIsTyping(typing);
        };

        const onDeleted = ({ messageId }: { messageId: string }) => {
            setMessages((prev) =>
                prev.map((m) => m._id === messageId ? { ...m, isDeleted: true, content: '' } : m)
            );
        };

        socket.on('chat:new_message', onNewMessage);
        socket.on('chat:typing_indicator', onTyping);
        socket.on('chat:message_deleted', onDeleted);
        return () => {
            socket.off('chat:new_message', onNewMessage);
            socket.off('chat:typing_indicator', onTyping);
            socket.off('chat:message_deleted', onDeleted);
        };
    }, [socket, selectedConvo?._id]);

    // ── Auto-scroll (only when no specific message target) ───────────────────
    useEffect(() => {
        const targetId = searchParams.get('messageId');
        if (targetId && messages.find(m => m._id === targetId)) return; // let scroll-to-msg handle it
        const el = messagesContainerRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [messages]);

    // ── Scroll to + highlight a specific message from notification ────────────
    useEffect(() => {
        const messageId = searchParams.get('messageId');
        if (!messageId || messages.length === 0) return;
        if (scrolledToMsgRef.current === messageId) return;
        const found = messages.find(m => m._id === messageId);
        if (!found) return;
        scrolledToMsgRef.current = messageId;
        setHighlightedMsgId(messageId);
        setTimeout(() => {
            document.querySelector(`[data-message-id="${messageId}"]`)
                ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 150);
        setTimeout(() => setHighlightedMsgId(null), 3000);
    }, [messages, searchParams]);

    // ── Typing ───────────────────────────────────────────────────────────────
    const handleInputChange = (val: string) => {
        setInputMessage(val);
        if (!socket || !selectedConvo) return;
        socket.emit('chat:typing', { conversationId: selectedConvo._id, isTyping: true });
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            socket.emit('chat:typing', { conversationId: selectedConvo._id, isTyping: false });
        }, 1500);
    };

    // ── Send ─────────────────────────────────────────────────────────────────
    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = inputMessage.trim();
        if (!trimmed || !socket || !selectedConvo) return;
        setInputMessage('');
        const replyToId = replyTo?._id;
        setReplyTo(null);
        socket.emit('chat:typing', { conversationId: selectedConvo._id, isTyping: false });
        socket.emit('chat:send_message', {
            conversationId: selectedConvo._id,
            content: trimmed,
            messageType: 'text',
            replyToId,
        });
    };

    // ── Delete message ────────────────────────────────────────────────────────
    const handleDelete = useCallback((msgId: string) => {
        if (!socket) return;
        socket.emit('chat:delete_message', { messageId: msgId });
    }, [socket]);

    // ── File upload ──────────────────────────────────────────────────────────
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedConvo || !socket) return;
        try {
            setIsUploading(true);
            const res = await chatApi.uploadFile(file);
            const { fileUrl, fileName, fileMime } = res.data.data;
            socket.emit('chat:send_message', {
                conversationId: selectedConvo._id,
                content: '',
                messageType: 'file',
                fileUrl,
                fileName,
                fileMime,
            });
        } catch (err: any) {
            toast.error('File upload failed', { description: err?.response?.data?.message || 'Please try again.' });
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const getOtherParticipant = (convo: Conversation) =>
        convo.participants.find((p) => p && p._id !== user?._id);

    const formatTime = (dateStr: string) =>
        new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const activeParticipant = selectedConvo ? getOtherParticipant(selectedConvo) : null;

    return (
        <>
        <div className="flex h-[calc(100vh-8rem)] rounded-xl border bg-card overflow-hidden shadow-sm">
            {/* Sidebar */}
            <div className={`w-full md:w-80 border-r bg-muted/10 flex flex-col ${selectedConvo ? 'hidden md:flex' : 'flex'}`}>
                {/* Tab toggle */}
                <div className="p-4 border-b space-y-3">
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant={tab === 'users' ? 'default' : 'outline'}
                            className="flex-1 relative"
                            onClick={() => setTab('users')}
                        >
                            User Chats
                            {tab !== 'users' && chatUnreadCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-destructive text-[9px] text-white font-bold flex items-center justify-center">
                                    {chatUnreadCount > 9 ? '9+' : chatUnreadCount}
                                </span>
                            )}
                        </Button>
                        <Button
                            size="sm"
                            variant={tab === 'team' ? 'default' : 'outline'}
                            className="flex-1 relative"
                            onClick={() => setTab('team')}
                        >
                            Team DMs
                            {tab !== 'team' && teamTabUnread > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-primary text-[9px] text-primary-foreground font-bold flex items-center justify-center shadow-[0_0_6px_rgba(139,92,246,0.6)]">
                                    {teamTabUnread > 9 ? '9+' : teamTabUnread}
                                </span>
                            )}
                        </Button>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search conversations…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full h-9 pl-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            />
                        </div>
                        {tab === 'team' && (
                            <Button
                                size="icon"
                                variant="outline"
                                className="h-9 w-9 shrink-0"
                                title="New Team DM"
                                onClick={() => { loadTeamMembers(); setShowNewDmModal(true); }}
                            >
                                <MessageSquarePlus className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
                        <span className="text-xs text-muted-foreground">
                            {isConnected ? 'Socket connected' : 'Connecting…'}
                        </span>
                    </div>
                </div>

                {/* Conversation list */}
                <div className="flex-1 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        </div>
                    ) : conversations.length === 0 ? (
                        <div className="p-4 text-sm text-muted-foreground text-center">
                            No conversations found
                        </div>
                    ) : (
                        conversations.map((chat) => {
                            const other = getOtherParticipant(chat);
                            const isDeleted = !other;
                            const unreadForConvo = convoUnread[chat._id] ?? 0;
                            return (
                                <div
                                    key={chat._id}
                                    onClick={() => selectConversation(chat)}
                                    className={`p-4 border-b last:border-0 cursor-pointer hover:bg-muted/50 transition-colors ${
                                        selectedConvo?._id === chat._id
                                            ? 'bg-muted/50 border-l-4 border-l-primary'
                                            : unreadForConvo > 0
                                            ? 'bg-primary/5 border-l-4 border-l-primary/50'
                                            : 'border-l-4 border-l-transparent'
                                    }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="relative">
                                            {!isDeleted && other?.photo && other.photo !== 'default.jpg' ? (
                                                <img
                                                    src={other.photo}
                                                    alt={other.name}
                                                    className="w-10 h-10 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${isDeleted ? 'bg-muted border border-border' : 'bg-gradient-to-br from-primary to-purple-600'}`}>
                                                    {isDeleted
                                                        ? <UserX className="h-5 w-5 text-muted-foreground" />
                                                        : other?.name?.charAt(0)
                                                    }
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center mb-1">
                                                <h3 className={`font-semibold text-sm truncate ${isDeleted ? 'text-muted-foreground italic' : ''} ${unreadForConvo > 0 ? 'text-foreground' : ''}`}>
                                                    {isDeleted ? 'Deleted Account' : other?.name}
                                                </h3>
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    <span className="text-xs text-muted-foreground">
                                                        {chat.lastMessageAt ? formatTime(chat.lastMessageAt) : ''}
                                                    </span>
                                                    {unreadForConvo > 0 && (
                                                        <span className="h-5 min-w-[20px] px-1 rounded-full bg-primary text-[10px] text-primary-foreground font-bold flex items-center justify-center shadow-[0_0_6px_rgba(139,92,246,0.5)]">
                                                            {unreadForConvo > 99 ? '99+' : unreadForConvo}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-sm text-muted-foreground truncate pr-2">
                                                {chat.lastMessage
                                                    ? chat.lastMessage.messageType === 'file'
                                                        ? '📎 File attachment'
                                                        : chat.lastMessage.content
                                                    : 'No messages yet'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className={`flex-1 flex flex-col ${!selectedConvo ? 'hidden md:flex' : 'flex'}`}>
                {selectedConvo ? (
                    <>
                        {/* Header */}
                        <div className="p-4 border-b flex items-center justify-between bg-card">
                            <div className="flex items-center gap-3">
                                <button
                                    className="md:hidden p-1 rounded text-muted-foreground"
                                    onClick={() => setSelectedConvo(null)}
                                >
                                    ←
                                </button>
                                {activeParticipant?.photo && activeParticipant.photo !== 'default.jpg' ? (
                                    <img
                                        src={activeParticipant.photo}
                                        alt={activeParticipant.name}
                                        className="w-10 h-10 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${!activeParticipant ? 'bg-muted border border-border' : 'bg-gradient-to-br from-primary to-purple-600'}`}>
                                        {activeParticipant
                                            ? activeParticipant.name?.charAt(0)
                                            : <UserX className="h-5 w-5 text-muted-foreground" />
                                        }
                                    </div>
                                )}
                                <div>
                                    <h3 className={`font-semibold ${!activeParticipant ? 'text-muted-foreground italic' : ''}`}>
                                        {activeParticipant?.name ?? 'Deleted Account'}
                                    </h3>
                                    <p className="text-xs text-muted-foreground capitalize">
                                        {activeParticipant?.role ?? 'Account no longer exists'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                {activeParticipant && (
                                    <>
                                        <Button variant="ghost" size="sm" className="hidden md:flex gap-2 text-primary">
                                            <Users className="h-4 w-4" /> Assign to Team
                                        </Button>
                                        <div className="h-4 w-px bg-border mx-1 hidden md:block" />
                                        <Button variant="ghost" size="icon"><Phone className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="icon"><Video className="h-4 w-4" /></Button>
                                    </>
                                )}
                                <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                            </div>
                        </div>

                        {/* Deleted user banner */}
                        {!activeParticipant && (
                            <div className="flex items-center gap-2 px-4 py-2.5 bg-destructive/5 border-b border-destructive/10 text-sm text-destructive/80">
                                <UserX className="h-4 w-4 shrink-0" />
                                This user's account has been deleted. Chat history is preserved but no new messages can be sent.
                            </div>
                        )}

                        {/* Messages */}
                        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-3 bg-muted/5">
                            {isMsgsLoading ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full py-12 text-muted-foreground">
                                    <p>No messages yet. Start the conversation!</p>
                                </div>
                            ) : (
                                messages.map((msg, index) => {
                                    const isMe = msg.senderId?._id === user?._id;
                                    const prevMsg = messages[index - 1];
                                    const nextMsg = messages[index + 1];
                                    const isFirstInGroup = !prevMsg || prevMsg.messageType === 'system' || prevMsg.senderId?._id !== msg.senderId?._id;
                                    const isLastInGroup = !nextMsg || nextMsg.messageType === 'system' || nextMsg.senderId?._id !== msg.senderId?._id;
                                    const senderName = msg.senderId?.name ?? 'Deleted User';
                                    const senderPhoto = (msg.senderId as any)?.photo;

                                    if (msg.messageType === 'system') {
                                        return (
                                            <div key={msg._id} className="flex justify-center my-4">
                                                <span className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full">
                                                    {msg.content}
                                                </span>
                                            </div>
                                        );
                                    }
                                    const isHighlighted = highlightedMsgId === msg._id;
                                    return (
                                        <motion.div
                                            key={msg._id}
                                            data-message-id={msg._id}
                                            initial={{ opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'} ${isFirstInGroup ? 'mt-4' : 'mt-0.5'} ${isHighlighted ? 'rounded-2xl ring-2 ring-primary/50 bg-primary/5 transition-all duration-500' : ''}`}
                                        >
                                            {/* Avatar — left side only, visible on last msg of group */}
                                            {!isMe && (
                                                <div className="w-8 h-8 shrink-0">
                                                    {isLastInGroup ? (
                                                        senderPhoto && senderPhoto !== 'default.jpg' ? (
                                                            <img src={senderPhoto} alt={senderName} className="w-8 h-8 rounded-full object-cover" />
                                                        ) : (
                                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                                                                {senderName.charAt(0).toUpperCase()}
                                                            </div>
                                                        )
                                                    ) : (
                                                        <div className="w-8 h-8" />
                                                    )}
                                                </div>
                                            )}

                                            <div className={`max-w-[65%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                                {/* Sender name — first msg in group, non-me */}
                                                {isFirstInGroup && !isMe && (
                                                    <span className="text-[11px] font-semibold text-muted-foreground mb-1 px-1">
                                                        {senderName}
                                                    </span>
                                                )}

                                                <SwipeableMessage msg={msg} isMe={isMe} onReply={setReplyTo} onDelete={handleDelete}>
                                                    <div
                                                        className={`px-4 py-2.5 shadow-sm text-sm ${
                                                            isMe
                                                                ? `bg-primary text-primary-foreground ${isFirstInGroup ? 'rounded-2xl rounded-tr-sm' : 'rounded-2xl'}`
                                                                : `bg-card text-card-foreground border ${isFirstInGroup ? 'rounded-2xl rounded-tl-sm' : 'rounded-2xl'}`
                                                        }`}
                                                    >
                                                        {msg.replyTo && (
                                                            <div className={`mb-2 px-2 py-1 rounded-lg border-l-2 text-xs opacity-70 ${isMe ? 'border-white/40 bg-white/10' : 'border-primary/40 bg-muted/50'}`}>
                                                                <span className="font-semibold">{msg.replyTo.senderId?.name ?? 'Deleted User'}</span>
                                                                <p className="truncate">{msg.replyTo.isDeleted ? 'Deleted message' : (msg.replyTo.messageType === 'file' ? `📎 ${msg.replyTo.fileName}` : msg.replyTo.content)}</p>
                                                            </div>
                                                        )}
                                                        {msg.isDeleted ? (
                                                            <p className="italic opacity-50">Message deleted</p>
                                                        ) : msg.messageType === 'file' ? (
                                                            <ChatFileMessage
                                                                fileUrl={msg.fileUrl ?? ''}
                                                                fileName={msg.fileName ?? 'File'}
                                                                fileMime={msg.fileMime}
                                                                isMe={isMe}
                                                            />
                                                        ) : (
                                                            <p>{msg.content}</p>
                                                        )}
                                                        <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                                            <span>{formatTime(msg.createdAt)}</span>
                                                            {isMe && <CheckCheck className="h-3 w-3" />}
                                                        </div>
                                                    </div>
                                                </SwipeableMessage>
                                            </div>
                                        </motion.div>
                                    );
                                })
                            )}
                            {isTyping && (
                                <div className="flex items-end gap-2 mt-2">
                                    <div className="w-8 h-8 shrink-0" />
                                    <div className="bg-card border rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm">
                                        <div className="flex gap-1 items-center">
                                            <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0ms]" />
                                            <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:150ms]" />
                                            <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:300ms]" />
                                        </div>
                                        <span className="text-[10px] text-muted-foreground mt-0.5 block">{typingUser} is typing</span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="border-t bg-card">
                            {activeParticipant ? (
                                <>
                                    {replyTo && (
                                        <div className="flex items-center gap-2 px-4 pt-3 pb-1">
                                            <div className="flex-1 text-xs px-3 py-1.5 rounded-lg bg-muted border-l-2 border-primary">
                                                <span className="font-semibold text-primary">{replyTo.senderId?.name ?? 'Deleted User'}</span>
                                                <p className="truncate text-muted-foreground">{replyTo.messageType === 'file' ? `📎 ${replyTo.fileName}` : replyTo.content}</p>
                                            </div>
                                            <button onClick={() => setReplyTo(null)} className="text-muted-foreground hover:text-foreground p-1">✕</button>
                                        </div>
                                    )}
                                    <div className="p-4">
                                        <input type="file" ref={fileInputRef} className="hidden" accept="*/*" onChange={handleFileChange} />
                                        <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="shrink-0 text-muted-foreground"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={isUploading}
                                            >
                                                {isUploading ? (
                                                    <Loader2 className="h-5 w-5 animate-spin" />
                                                ) : (
                                                    <Paperclip className="h-5 w-5" />
                                                )}
                                            </Button>
                                            <input
                                                type="text"
                                                value={inputMessage}
                                                onChange={(e) => handleInputChange(e.target.value)}
                                                placeholder="Type your message…"
                                                className="flex-1 min-h-[44px] rounded-lg border border-input bg-background px-4 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                            />
                                            <Button type="submit" size="icon" className="shrink-0" disabled={!inputMessage.trim()}>
                                                <Send className="h-5 w-5" />
                                            </Button>
                                        </form>
                                    </div>
                                </>
                            ) : (
                                <div className="p-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                                    <UserX className="h-4 w-4" />
                                    Messaging unavailable — this account no longer exists
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-muted/5">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                            <Hash className="h-8 w-8 opacity-50" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
                        <p>Choose a chat from the sidebar to start messaging.</p>
                    </div>
                )}
            </div>
        </div>

        {/* ── New Team DM Modal ── */}
        {showNewDmModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-card w-full max-w-sm rounded-xl shadow-2xl border overflow-hidden"
                >
                    <div className="p-4 border-b flex items-center justify-between">
                        <h3 className="font-semibold">New Team Message</h3>
                        <button onClick={() => setShowNewDmModal(false)} className="p-1 rounded-full hover:bg-accent text-muted-foreground">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="p-2 max-h-80 overflow-y-auto">
                        {isLoadingMembers ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            </div>
                        ) : teamMembers.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-6">No team members found</p>
                        ) : (
                            teamMembers.map((member) => (
                                <button
                                    key={member._id}
                                    onClick={() => startTeamDm(member._id)}
                                    disabled={isStartingDm === member._id}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/60 transition-colors text-left"
                                >
                                    {member.photo && member.photo !== 'default.jpg' ? (
                                        <img src={member.photo} alt={member.name} className="h-9 w-9 rounded-full object-cover shrink-0" />
                                    ) : (
                                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                                            {member.name.charAt(0)}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{member.name}</p>
                                        {member.teamProfile?.position && (
                                            <p className="text-xs text-muted-foreground truncate">{member.teamProfile.position}</p>
                                        )}
                                    </div>
                                    {isStartingDm === member._id && (
                                        <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </motion.div>
            </div>
        )}
        </>
    );
}
