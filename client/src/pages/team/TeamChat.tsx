/**
 * Team Chat Page
 * Real-time internal communication between admin and team members.
 * Sidebar shows all admin_team DM conversations.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Send, Search, Phone, Video, MoreVertical, Paperclip, Loader2, Hash
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { chatApi, ChatMessage, Conversation } from '../../api/chat.api';

export default function TeamChat() {
    const { user } = useAuth();
    const { socket, isConnected } = useSocket();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConvo, setSelectedConvo] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [message, setMessage] = useState('');
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
    useEffect(() => {
        async function load() {
            try {
                setIsLoading(true);
                const res = await chatApi.getConversations();
                const convos = (res.data.data || []).filter(
                    (c: Conversation) => c.type === 'admin_team'
                );
                setConversations(convos);
                if (convos.length > 0) selectConversation(convos[0]);
            } catch {
                toast.error('Failed to load conversations');
            } finally {
                setIsLoading(false);
            }
        }
        if (user) load();
    }, [user]);

    const selectConversation = async (convo: Conversation) => {
        setSelectedConvo(convo);
        setMessages([]);
        if (!convo) return;
        try {
            setIsMsgsLoading(true);
            const res = await chatApi.getMessages(convo._id, 1, 50);
            setMessages(res.data.data?.messages || []);
        } catch {
            toast.error('Failed to load messages');
        } finally {
            setIsMsgsLoading(false);
        }
    };

    // ── Socket room join ─────────────────────────────────────────────────────
    useEffect(() => {
        if (!socket || !selectedConvo) return;
        socket.emit('chat:join_conversation', { conversationId: selectedConvo._id });
        socket.emit('chat:read_messages', { conversationId: selectedConvo._id });
    }, [socket, selectedConvo?._id]);

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
            // Update sidebar last message
            setConversations((prev) =>
                prev.map((c) =>
                    c._id === msg.conversationId
                        ? { ...c, lastMessageAt: msg.createdAt }
                        : c
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

    // ── Typing indicator ─────────────────────────────────────────────────────
    const handleTypingChange = (value: string) => {
        setMessage(value);
        if (!socket || !selectedConvo) return;
        socket.emit('chat:typing', { conversationId: selectedConvo._id, isTyping: true });
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            socket.emit('chat:typing', { conversationId: selectedConvo._id, isTyping: false });
        }, 1500);
    };

    // ── Send text ────────────────────────────────────────────────────────────
    const handleSend = useCallback(() => {
        const trimmed = message.trim();
        if (!trimmed || !socket || !selectedConvo) return;
        setMessage('');
        socket.emit('chat:typing', { conversationId: selectedConvo._id, isTyping: false });
        socket.emit('chat:send_message', {
            conversationId: selectedConvo._id,
            content: trimmed,
            messageType: 'text',
        });
    }, [message, socket, selectedConvo]);

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

    const filteredConvos = conversations.filter((c) => {
        const other = getOtherParticipant(c);
        return !search || other?.name?.toLowerCase().includes(search.toLowerCase());
    });

    return (
        <div className="h-[calc(100vh-140px)] flex gap-4">
            {/* Sidebar */}
            <Card className="w-64 flex flex-col overflow-hidden">
                <div className="p-4 border-b">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    <h3 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-2">
                        Direct Messages
                    </h3>
                    {isLoading ? (
                        <div className="flex justify-center py-4">
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        </div>
                    ) : filteredConvos.length === 0 ? (
                        <p className="text-xs text-muted-foreground px-2 py-2">
                            No conversations yet
                        </p>
                    ) : (
                        filteredConvos.map((convo) => {
                            const other = getOtherParticipant(convo);
                            const isSelected = selectedConvo?._id === convo._id;
                            return (
                                <button
                                    key={convo._id}
                                    onClick={() => selectConversation(convo)}
                                    className={`w-full text-left px-2 py-2 rounded-md text-sm flex items-center gap-2.5 transition-colors ${
                                        isSelected
                                            ? 'bg-primary/10 text-primary'
                                            : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                        {other?.name?.charAt(0) ?? '?'}
                                    </div>
                                    <span className="truncate">{other?.name ?? 'Unknown'}</span>
                                </button>
                            );
                        })
                    )}
                </div>
            </Card>

            {/* Chat Area */}
            <Card className="flex-1 flex flex-col overflow-hidden">
                {selectedConvo ? (
                    <>
                        {/* Header */}
                        <div className="p-4 border-b flex justify-between items-center bg-card/50 backdrop-blur">
                            <div className="flex items-center gap-2">
                                <Hash className="h-5 w-5 text-muted-foreground" />
                                <h2 className="font-bold">
                                    {getOtherParticipant(selectedConvo)?.name ?? 'Team Chat'}
                                </h2>
                                <div className="flex items-center gap-1.5 ml-2">
                                    <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
                                    <span className="text-xs text-muted-foreground">
                                        {isConnected ? 'Online' : 'Offline'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="icon"><Phone className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon"><Video className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/5">
                            {isMsgsLoading ? (
                                <div className="flex justify-center items-center h-full">
                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                    <p className="text-sm">No messages yet. Start the conversation!</p>
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
                                            className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}
                                        >
                                            <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                                                {msg.senderId.name.charAt(0)}
                                            </div>
                                            <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                                                <div className={`flex items-baseline gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                                                    <span className="font-semibold text-sm">{msg.senderId.name}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {formatTime(msg.createdAt)}
                                                    </span>
                                                </div>
                                                <div
                                                    className={`mt-1 rounded-2xl px-3 py-2 text-sm ${
                                                        isMe
                                                            ? 'bg-primary text-primary-foreground'
                                                            : 'bg-card border border-border/50'
                                                    }`}
                                                >
                                                    {msg.messageType === 'file' ? (
                                                        <a
                                                            href={msg.fileUrl}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="flex items-center gap-2 underline"
                                                        >
                                                            <Paperclip className="h-3 w-3 shrink-0" />
                                                            {msg.fileName || 'File attachment'}
                                                        </a>
                                                    ) : (
                                                        msg.content
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })
                            )}
                            {isTyping && (
                                <p className="text-xs text-muted-foreground pl-12">
                                    {typingUser} is typing…
                                </p>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t bg-card/50">
                            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="shrink-0 text-muted-foreground hover:text-primary"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                >
                                    {isUploading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Paperclip className="h-4 w-4" />
                                    )}
                                </Button>
                                <Input
                                    placeholder={`Message ${getOtherParticipant(selectedConvo)?.name ?? 'team'}…`}
                                    value={message}
                                    onChange={(e) => handleTypingChange(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                                    className="flex-1"
                                />
                                <Button size="icon" onClick={handleSend} disabled={!message.trim()}>
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                        <Hash className="h-12 w-12 opacity-20 mb-3" />
                        <p>Select a conversation to start chatting</p>
                    </div>
                )}
            </Card>
        </div>
    );
}
