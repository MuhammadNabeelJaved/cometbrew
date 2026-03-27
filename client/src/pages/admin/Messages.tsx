/**
 * Admin Messages Page
 * Split view: sidebar lists all user-admin conversations (searchable),
 * main area shows the live chat thread.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Search, MoreVertical, Phone, Video, Send, Paperclip,
    CheckCheck, Users, Loader2, Hash
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { chatApi, ChatMessage, Conversation } from '../../api/chat.api';

type ChatTab = 'users' | 'team';

export default function Messages() {
    const { user } = useAuth();
    const { socket, isConnected } = useSocket();
    const [tab, setTab] = useState<ChatTab>('users');
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
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── Load conversations ───────────────────────────────────────────────────
    const loadConversations = useCallback(async (type: ChatTab) => {
        try {
            setIsLoading(true);
            setSelectedConvo(null);
            setMessages([]);
            const convoType = type === 'users' ? 'user_admin' : 'admin_team';
            const res = await chatApi.adminGetConversations(convoType, search || undefined);
            setConversations(res.data.data || []);
        } catch {
            toast.error('Failed to load conversations');
        } finally {
            setIsLoading(false);
        }
    }, [search]);

    useEffect(() => {
        if (user?.role === 'admin') loadConversations(tab);
    }, [tab, user]);

    // Re-filter on search change
    useEffect(() => {
        const t = setTimeout(() => {
            if (user?.role === 'admin') loadConversations(tab);
        }, 400);
        return () => clearTimeout(t);
    }, [search]);

    // ── Socket new support request alert ─────────────────────────────────────
    useEffect(() => {
        if (!socket) return;
        const onNewRequest = () => {
            if (tab === 'users') loadConversations('users');
        };
        socket.on('admin:new_support_request', onNewRequest);
        return () => { socket.off('admin:new_support_request', onNewRequest); };
    }, [socket, tab]);

    const selectConversation = async (convo: Conversation) => {
        if (selectedConvo) {
            socket?.emit('chat:leave_conversation', { conversationId: selectedConvo._id });
        }
        setSelectedConvo(convo);
        setMessages([]);
        try {
            setIsMsgsLoading(true);
            const res = await chatApi.getMessages(convo._id, 1, 50);
            setMessages(res.data.data?.messages || []);
            socket?.emit('chat:join_conversation', { conversationId: convo._id });
            socket?.emit('chat:read_messages', { conversationId: convo._id });
        } catch {
            toast.error('Failed to load messages');
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
            }
            setConversations((prev) =>
                prev.map((c) =>
                    c._id === msg.conversationId ? { ...c, lastMessageAt: msg.createdAt } : c
                )
            );
        };

        const onTyping = ({ userName, isTyping: typing }: { userId: string; userName: string; isTyping: boolean }) => {
            setTypingUser(typing ? userName : '');
            setIsTyping(typing);
        };

        socket.on('chat:new_message', onNewMessage);
        socket.on('chat:typing_indicator', onTyping);
        return () => {
            socket.off('chat:new_message', onNewMessage);
            socket.off('chat:typing_indicator', onTyping);
        };
    }, [socket, selectedConvo?._id]);

    // ── Auto-scroll ──────────────────────────────────────────────────────────
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

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
        socket.emit('chat:typing', { conversationId: selectedConvo._id, isTyping: false });
        socket.emit('chat:send_message', {
            conversationId: selectedConvo._id,
            content: trimmed,
            messageType: 'text',
        });
    };

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
        } catch {
            toast.error('File upload failed');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const getOtherParticipant = (convo: Conversation) =>
        convo.participants.find((p) => p._id !== user?._id);

    const formatTime = (dateStr: string) =>
        new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const activeParticipant = selectedConvo ? getOtherParticipant(selectedConvo) : null;

    return (
        <div className="flex h-[calc(100vh-8rem)] rounded-xl border bg-card overflow-hidden shadow-sm">
            {/* Sidebar */}
            <div className={`w-full md:w-80 border-r bg-muted/10 flex flex-col ${selectedConvo ? 'hidden md:flex' : 'flex'}`}>
                {/* Tab toggle */}
                <div className="p-4 border-b space-y-3">
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant={tab === 'users' ? 'default' : 'outline'}
                            className="flex-1"
                            onClick={() => setTab('users')}
                        >
                            User Chats
                        </Button>
                        <Button
                            size="sm"
                            variant={tab === 'team' ? 'default' : 'outline'}
                            className="flex-1"
                            onClick={() => setTab('team')}
                        >
                            Team DMs
                        </Button>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search conversations…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full h-9 pl-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
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
                            return (
                                <div
                                    key={chat._id}
                                    onClick={() => selectConversation(chat)}
                                    className={`p-4 border-b last:border-0 cursor-pointer hover:bg-muted/50 transition-colors ${
                                        selectedConvo?._id === chat._id
                                            ? 'bg-muted/50 border-l-4 border-l-primary'
                                            : 'border-l-4 border-l-transparent'
                                    }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="relative">
                                            {other?.photo && other.photo !== 'default.jpg' ? (
                                                <img
                                                    src={other.photo}
                                                    alt={other.name}
                                                    className="w-10 h-10 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                                                    {other?.name?.charAt(0) ?? '?'}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center mb-1">
                                                <h3 className="font-semibold text-sm truncate">
                                                    {other?.name ?? 'Unknown'}
                                                </h3>
                                                <span className="text-xs text-muted-foreground">
                                                    {chat.lastMessageAt
                                                        ? formatTime(chat.lastMessageAt)
                                                        : ''}
                                                </span>
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
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                                        {activeParticipant?.name?.charAt(0) ?? '?'}
                                    </div>
                                )}
                                <div>
                                    <h3 className="font-semibold">{activeParticipant?.name ?? 'Unknown'}</h3>
                                    <p className="text-xs text-muted-foreground capitalize">
                                        {activeParticipant?.role ?? ''}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="sm" className="hidden md:flex gap-2 text-primary">
                                    <Users className="h-4 w-4" /> Assign to Team
                                </Button>
                                <div className="h-4 w-px bg-border mx-1 hidden md:block" />
                                <Button variant="ghost" size="icon"><Phone className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon"><Video className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/5">
                            <div className="flex justify-center my-4">
                                <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                                    Today
                                </span>
                            </div>

                            {isMsgsLoading ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                    <p>No messages yet. Start the conversation!</p>
                                </div>
                            ) : (
                                messages.map((msg) => {
                                    const isMe = msg.senderId._id === user?._id;
                                    if (msg.messageType === 'system') {
                                        return (
                                            <div key={msg._id} className="flex justify-center">
                                                <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                                                    {msg.content}
                                                </span>
                                            </div>
                                        );
                                    }
                                    return (
                                        <motion.div
                                            key={msg._id}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                                                    isMe
                                                        ? 'bg-primary text-primary-foreground rounded-tr-none'
                                                        : 'bg-card text-card-foreground border rounded-tl-none'
                                                }`}
                                            >
                                                {msg.messageType === 'file' ? (
                                                    <a
                                                        href={msg.fileUrl}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="flex items-center gap-2 text-sm underline"
                                                    >
                                                        <Paperclip className="h-3 w-3 shrink-0" />
                                                        {msg.fileName || 'File attachment'}
                                                    </a>
                                                ) : (
                                                    <p className="text-sm">{msg.content}</p>
                                                )}
                                                <div
                                                    className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                                                        isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'
                                                    }`}
                                                >
                                                    <span>{formatTime(msg.createdAt)}</span>
                                                    {isMe && <CheckCheck className="h-3 w-3" />}
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })
                            )}
                            {isTyping && (
                                <p className="text-xs text-muted-foreground">{typingUser} is typing…</p>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t bg-card">
                            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
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
    );
}
