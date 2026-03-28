/**
 * User Chat
 * Direct messaging interface with Admin support.
 * Wired to Socket.IO for real-time delivery and REST API for history.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Send, Paperclip, Phone, Video, MoreVertical, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { chatApi, ChatMessage, Conversation } from '../../api/chat.api';
import { ChatFileMessage } from '../../components/ChatFileMessage';
import { SwipeableMessage } from '../../components/SwipeableMessage';

export default function UserChat() {
    const { user } = useAuth();
    const { socket, isConnected } = useSocket();
    const [searchParams] = useSearchParams();
    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [message, setMessage] = useState('');
    const [isLoadingConvo, setIsLoadingConvo] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [typingUser, setTypingUser] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── Load or create the user ↔ admin conversation ────────────────────────
    useEffect(() => {
        async function initConversation() {
            try {
                setIsLoadingConvo(true);
                // Check for an existing user_admin conversation
                const convosRes = await chatApi.getConversations();
                const existing = (convosRes.data.data || []).find(
                    (c: Conversation) => c.type === 'user_admin'
                );

                if (existing) {
                    setConversation(existing);
                    await loadMessages(existing._id);
                } else {
                    // No conversation yet — it will be created on first send
                    setIsLoadingConvo(false);
                }
            } catch (err: any) {
                toast.error('Failed to load chat', { description: err?.response?.data?.message || 'Please try again.' });
                setIsLoadingConvo(false);
            }
        }
        if (user) initConversation();
    }, [user]);

    const loadMessages = async (conversationId: string) => {
        try {
            const res = await chatApi.getMessages(conversationId, 1, 50);
            setMessages(res.data.data?.messages || []);
        } catch (err: any) {
            toast.error('Failed to load messages', { description: err?.response?.data?.message || 'Please try again.' });
        } finally {
            setIsLoadingConvo(false);
        }
    };

    // ── Join socket room when conversation is ready (and on reconnect) ────────
    useEffect(() => {
        if (!socket || !conversation || !isConnected) return;
        socket.emit('chat:join_conversation', { conversationId: conversation._id });
        socket.emit('chat:read_messages', { conversationId: conversation._id });
        // Reload messages in case any were missed while disconnected
        loadMessages(conversation._id);
    }, [socket, conversation?._id, isConnected]);

    // ── Socket event listeners ───────────────────────────────────────────────
    useEffect(() => {
        if (!socket || !conversation) return;

        const onNewMessage = (msg: ChatMessage) => {
            if (msg.conversationId !== conversation._id) return;
            setMessages((prev) => {
                if (prev.find((m) => m._id === msg._id)) return prev;
                return [...prev, msg];
            });
            // Mark as read immediately since the chat is open
            socket.emit('chat:read_messages', { conversationId: conversation._id });
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
    }, [socket, conversation?._id]);

    // ── Auto-scroll to newest message ────────────────────────────────────────
    useEffect(() => {
        const el = messagesContainerRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [messages]);

    // ── Typing indicator ─────────────────────────────────────────────────────
    const handleTyping = (value: string) => {
        setMessage(value);
        if (!socket || !conversation) return;
        socket.emit('chat:typing', { conversationId: conversation._id, isTyping: true });
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            socket.emit('chat:typing', { conversationId: conversation._id, isTyping: false });
        }, 1500);
    };

    // ── Send text message ────────────────────────────────────────────────────
    const handleSend = useCallback(async () => {
        const trimmed = message.trim();
        if (!trimmed || !socket || isSending) return;

        let activeConvo = conversation;

        // If no conversation yet, create one (server auto-finds admin)
        if (!activeConvo) {
            try {
                setIsSending(true);
                const convoRes = await chatApi.getOrCreateConversation(undefined, 'user_admin');
                activeConvo = convoRes.data.data;
                setConversation(activeConvo);
                socket.emit('chat:join_conversation', { conversationId: activeConvo._id });
            } catch (err: any) {
                toast.error('Failed to start conversation', { description: err?.response?.data?.message || 'Please try again.' });
                return;
            } finally {
                setIsSending(false);
            }
        }

        setMessage('');
        const replyToId = replyTo?._id;
        setReplyTo(null);
        socket.emit('chat:typing', { conversationId: activeConvo._id, isTyping: false });
        socket.emit('chat:send_message', {
            conversationId: activeConvo._id,
            content: trimmed,
            messageType: 'text',
            replyToId,
        });
    }, [message, socket, conversation, isSending, replyTo]);

    // ── Delete message ────────────────────────────────────────────────────────
    const handleDelete = useCallback((msgId: string) => {
        if (!socket) return;
        socket.emit('chat:delete_message', { messageId: msgId });
    }, [socket]);

    // ── File upload ──────────────────────────────────────────────────────────
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !conversation || !socket) return;

        try {
            setIsUploading(true);
            const res = await chatApi.uploadFile(file);
            const { fileUrl, fileName, fileMime } = res.data.data;
            socket.emit('chat:send_message', {
                conversationId: conversation._id,
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

    // ── Admin participant from conversation ──────────────────────────────────
    const adminParticipant = conversation?.participants?.find(
        (p) => p.role === 'admin'
    );

    const formatTime = (dateStr: string) =>
        new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col lg:flex-row gap-6">
            {/* Sidebar */}
            <Card className="w-full lg:w-80 flex flex-col border-border/50 overflow-hidden">
                <div className="p-4 border-b border-border/50 bg-secondary/20">
                    <h2 className="font-bold">Messages</h2>
                    <div className="flex items-center gap-1.5 mt-1">
                        <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
                        <span className="text-xs text-muted-foreground">
                            {isConnected ? 'Connected' : 'Connecting…'}
                        </span>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {conversation ? (
                        <div className="p-4 flex items-center gap-3 bg-primary/5 border-b border-border/50 border-l-4 border-l-primary">
                            <div className="relative">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                                    A
                                </div>
                                {isConnected && (
                                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-1">
                                    <h3 className="font-medium truncate text-sm">
                                        {adminParticipant?.name || 'Admin Support'}
                                    </h3>
                                    {messages.length > 0 && (
                                        <span className="text-xs text-muted-foreground">
                                            {formatTime(messages[messages.length - 1].createdAt)}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground truncate">
                                    {messages.length > 0
                                        ? messages[messages.length - 1].content || 'File attachment'
                                        : 'Start a conversation'}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 text-sm text-muted-foreground text-center">
                            No conversations yet
                        </div>
                    )}
                </div>
            </Card>

            {/* Chat Area */}
            <Card className="flex-1 flex flex-col border-border/50 overflow-hidden shadow-lg">
                {/* Header */}
                <div className="p-4 border-b border-border/50 flex justify-between items-center bg-secondary/20 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                            A
                        </div>
                        <div>
                            <h3 className="font-bold text-sm">
                                {adminParticipant?.name || 'Admin Support'}
                            </h3>
                            <p className="text-xs text-green-500 flex items-center gap-1">
                                <span className={`h-1.5 w-1.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
                                {isConnected ? 'Online' : 'Offline'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                            <Phone className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                            <Video className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-muted-foreground">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Messages */}
                <div ref={messagesContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 bg-muted/20">
                    {isLoadingConvo ? (
                        <div className="flex justify-center items-center h-full">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                            <p className="text-sm">No messages yet. Say hello!</p>
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const isMe = msg.senderId._id === user?._id;
                            if (msg.messageType === 'system') {
                                return (
                                    <div key={msg._id} className="flex justify-center">
                                        <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">{msg.content}</span>
                                    </div>
                                );
                            }
                            return (
                                <motion.div
                                    key={msg._id}
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                >
                                    {!isMe && (
                                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold text-xs mr-2 shrink-0 self-end">
                                            {msg.senderId.name.charAt(0)}
                                        </div>
                                    )}
                                    <div className="max-w-[70%]">
                                    <SwipeableMessage msg={msg} isMe={isMe} onReply={setReplyTo} onDelete={handleDelete}>
                                        <div
                                            className={`rounded-2xl p-3 shadow-sm ${
                                                isMe
                                                    ? 'bg-primary text-primary-foreground rounded-br-none'
                                                    : 'bg-card border border-border/50 rounded-bl-none'
                                            }`}
                                        >
                                            {msg.replyTo && (
                                                <div className={`mb-2 px-2 py-1 rounded-lg border-l-2 text-xs opacity-70 ${isMe ? 'border-white/40 bg-white/10' : 'border-primary/40 bg-muted/50'}`}>
                                                    <span className="font-semibold">{msg.replyTo.senderId.name}</span>
                                                    <p className="truncate">{msg.replyTo.isDeleted ? 'Deleted message' : (msg.replyTo.messageType === 'file' ? `📎 ${msg.replyTo.fileName}` : msg.replyTo.content)}</p>
                                                </div>
                                            )}
                                            {msg.isDeleted ? (
                                                <p className="text-sm italic opacity-50">Message deleted</p>
                                            ) : msg.messageType === 'file' ? (
                                                <ChatFileMessage
                                                    fileUrl={msg.fileUrl ?? ''}
                                                    fileName={msg.fileName ?? 'File'}
                                                    fileMime={msg.fileMime}
                                                    isMe={isMe}
                                                />
                                            ) : (
                                                <p className="text-sm leading-relaxed">{msg.content}</p>
                                            )}
                                            <p
                                                className={`text-[10px] mt-1 text-right ${
                                                    isMe
                                                        ? 'text-primary-foreground/70'
                                                        : 'text-muted-foreground'
                                                }`}
                                            >
                                                {formatTime(msg.createdAt)}
                                            </p>
                                        </div>
                                    </SwipeableMessage>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                    {isTyping && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{typingUser} is typing…</span>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="border-t border-border/50 bg-background">
                    {replyTo && (
                        <div className="flex items-center gap-2 px-4 pt-3 pb-1">
                            <div className="flex-1 text-xs px-3 py-1.5 rounded-lg bg-muted border-l-2 border-primary">
                                <span className="font-semibold text-primary">{replyTo.senderId.name}</span>
                                <p className="truncate text-muted-foreground">{replyTo.messageType === 'file' ? `📎 ${replyTo.fileName}` : replyTo.content}</p>
                            </div>
                            <button onClick={() => setReplyTo(null)} className="text-muted-foreground hover:text-foreground p-1">✕</button>
                        </div>
                    )}
                    <div className="p-4">
                    <input
                        type="file"
                        accept="*/*"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileChange}
                    />
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0 text-muted-foreground hover:text-primary"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading || !conversation}
                        >
                            {isUploading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <Paperclip className="h-5 w-5" />
                            )}
                        </Button>
                        <input
                            type="text"
                            placeholder="Type your message…"
                            value={message}
                            onChange={(e) => handleTyping(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                            className="flex-1 bg-secondary/50 border-transparent focus:bg-background border focus:border-primary/50 rounded-full px-4 py-2.5 text-sm outline-none transition-all"
                        />
                        <Button
                            onClick={handleSend}
                            size="icon"
                            className="rounded-full shadow-lg shadow-primary/25 shrink-0"
                            disabled={!message.trim() || isSending}
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}
