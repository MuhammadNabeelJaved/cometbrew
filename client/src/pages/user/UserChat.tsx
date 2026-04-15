/**
 * User Chat
 * Direct messaging interface with Admin support.
 * Wired to Socket.IO for real-time delivery and REST API for history.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Send, Paperclip, Phone, Video, MoreVertical, Loader2, CheckCheck, Check,
    UserCircle, BellOff, Bell, Eraser, X, Mail, ShieldCheck, Calendar, ChevronRight, ArrowDown,
    Search, Pin, PinOff,
} from 'lucide-react';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { chatApi, ChatMessage, Conversation, MessageReaction } from '../../api/chat.api';
import { ChatFileMessage } from '../../components/ChatFileMessage';
import { SwipeableMessage } from '../../components/SwipeableMessage';
import { MessageReactions } from '../../components/MessageReactions';

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
    const [highlightedMsgId, setHighlightedMsgId] = useState<string | null>(null);
    const [showProfile, setShowProfile] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [confirmClear, setConfirmClear] = useState(false);
    const [isActioning, setIsActioning] = useState(false);
    const [showScrollBtn, setShowScrollBtn] = useState(false);
    const [newBelowCount, setNewBelowCount] = useState(0);
    // Search state
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<ChatMessage[]>([]);
    const [searchIdx, setSearchIdx] = useState(0);
    const [isSearching, setIsSearching] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const receiverTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const scrolledToMsgRef = useRef<string | null>(null);
    const isAtBottomRef = useRef(true);
    const prevMsgCountRef = useRef(0);

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
            prevMsgCountRef.current = 0;
            setNewBelowCount(0);
            setShowScrollBtn(false);
            isAtBottomRef.current = true;
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
            // Auto-reset after 3s in case sender disconnects without sending false
            if (receiverTypingTimeoutRef.current) clearTimeout(receiverTypingTimeoutRef.current);
            if (typing) {
                receiverTypingTimeoutRef.current = setTimeout(() => {
                    setIsTyping(false);
                    setTypingUser('');
                }, 3000);
            }
        };

        const onDeleted = ({ messageId }: { messageId: string }) => {
            setMessages((prev) =>
                prev.map((m) => m._id === messageId ? { ...m, isDeleted: true, content: '' } : m)
            );
        };

        const onReactionUpdated = ({ messageId, reactions }: { messageId: string; reactions: MessageReaction[] }) => {
            setMessages((prev) => prev.map((m) => m._id === messageId ? { ...m, reactions } : m));
        };

        const onMessagePinned = ({ messageId, isPinned, pinnedBy }: { messageId: string; isPinned: boolean; pinnedBy: any }) => {
            setMessages((prev) => prev.map((m) => m._id === messageId ? { ...m, isPinned, pinnedBy } : m));
        };

        const onMessagesRead = ({ conversationId: cId, readBy: readerId }: { conversationId: string; readBy: string }) => {
            if (cId !== conversation._id) return;
            setMessages((prev) =>
                prev.map((m) =>
                    m.readBy.includes(readerId) ? m : { ...m, readBy: [...m.readBy, readerId] }
                )
            );
        };

        socket.on('chat:new_message', onNewMessage);
        socket.on('chat:typing_indicator', onTyping);
        socket.on('chat:message_deleted', onDeleted);
        socket.on('chat:reaction_updated', onReactionUpdated);
        socket.on('chat:message_pinned', onMessagePinned);
        socket.on('chat:messages_read', onMessagesRead);

        return () => {
            socket.off('chat:new_message', onNewMessage);
            socket.off('chat:typing_indicator', onTyping);
            socket.off('chat:message_deleted', onDeleted);
            socket.off('chat:reaction_updated', onReactionUpdated);
            socket.off('chat:message_pinned', onMessagePinned);
            socket.off('chat:messages_read', onMessagesRead);
        };
    }, [socket, conversation?._id]);

    // ── Scroll handlers ──────────────────────────────────────────────────────
    const handleMessagesScroll = () => {
        const el = messagesContainerRef.current;
        if (!el) return;
        const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
        isAtBottomRef.current = atBottom;
        setShowScrollBtn(!atBottom);
        if (atBottom) setNewBelowCount(0);
    };

    const scrollToBottom = () => {
        const el = messagesContainerRef.current;
        if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
        setNewBelowCount(0);
        setShowScrollBtn(false);
    };

    // ── Auto-scroll to newest message (skip when navigating to a specific message) ──
    useEffect(() => {
        const targetId = searchParams.get('messageId');
        if (targetId && messages.find((m) => m._id === targetId)) return;

        const isNewMsg = messages.length > prevMsgCountRef.current && prevMsgCountRef.current > 0;
        prevMsgCountRef.current = messages.length;

        const el = messagesContainerRef.current;
        if (!el) return;

        if (isAtBottomRef.current || !isNewMsg) {
            el.scrollTop = el.scrollHeight;
        } else {
            // New message arrived while user is scrolled up — show badge
            setNewBelowCount(prev => prev + 1);
        }
    }, [messages]);

    // ── Scroll to + highlight a specific message from notification ────────────
    useEffect(() => {
        const messageId = searchParams.get('messageId');
        if (!messageId || messages.length === 0) return;
        if (scrolledToMsgRef.current === messageId) return;
        const found = messages.find((m) => m._id === messageId);
        if (!found) return;
        scrolledToMsgRef.current = messageId;
        setHighlightedMsgId(messageId);
        setTimeout(() => {
            document.querySelector(`[data-message-id="${messageId}"]`)
                ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 150);
        setTimeout(() => setHighlightedMsgId(null), 3000);
    }, [messages, searchParams]);

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

    const handleClearChat = async () => {
        if (!conversation) return;
        setIsActioning(true);
        try {
            await chatApi.clearChatMessages(conversation._id);
            setMessages([]);
            setConfirmClear(false);
            toast.success('Chat cleared');
        } catch { toast.error('Failed to clear chat'); }
        finally { setIsActioning(false); }
    };

    // ── Admin participant from conversation ──────────────────────────────────
    const adminParticipant = conversation?.participants?.find(
        (p) => p.role === 'admin'
    );

    const formatTime = (dateStr: string) =>
        new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // ── Search handlers ──────────────────────────────────────────────────────
    const handleSearch = async (q: string) => {
        setSearchQuery(q);
        if (!q.trim() || !conversation) { setSearchResults([]); return; }
        setIsSearching(true);
        try {
            const res = await chatApi.searchMessages(conversation._id, q);
            const results = res.data.data || [];
            setSearchResults(results);
            setSearchIdx(0);
            if (results.length > 0) scrollToSearchResult(results[0]._id);
        } catch { /* silent */ }
        finally { setIsSearching(false); }
    };

    const scrollToSearchResult = (msgId: string) => {
        setHighlightedMsgId(msgId);
        setTimeout(() => {
            const el = document.querySelector(`[data-message-id="${msgId}"]`);
            el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 50);
        setTimeout(() => setHighlightedMsgId(null), 2500);
    };

    const navigateSearch = (dir: 1 | -1) => {
        if (!searchResults.length) return;
        const next = (searchIdx + dir + searchResults.length) % searchResults.length;
        setSearchIdx(next);
        scrollToSearchResult(searchResults[next]._id);
    };

    return (
        <>
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
                                        ? messages[messages.length - 1].messageType === 'file'
                                            ? '📎 File attachment'
                                            : messages[messages.length - 1].content || 'Start a conversation'
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
                        <div className="relative">
                            {adminParticipant?.photo && adminParticipant.photo !== 'default.jpg' ? (
                                <img src={adminParticipant.photo} alt={adminParticipant.name} className="h-10 w-10 rounded-full object-cover" />
                            ) : (
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                                    {adminParticipant?.name?.charAt(0) ?? 'A'}
                                </div>
                            )}
                            <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm">
                                {adminParticipant?.name || 'Admin Support'}
                            </h3>
                            <p className={`text-xs flex items-center gap-1 ${isConnected ? 'text-green-500' : 'text-muted-foreground'}`}>
                                {isConnected ? 'Online' : 'Offline'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className={`text-muted-foreground hover:text-primary ${searchOpen ? 'text-primary bg-primary/10' : ''}`} onClick={() => { setSearchOpen(v => !v); setSearchQuery(''); setSearchResults([]); setTimeout(() => searchInputRef.current?.focus(), 100); }}>
                            <Search className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                            <Phone className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                            <Video className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-muted-foreground">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                                {adminParticipant && (
                                    <DropdownMenuItem onClick={() => setShowProfile(v => !v)}>
                                        <UserCircle className="h-4 w-4 mr-2" />
                                        View Profile
                                        <ChevronRight className="h-3 w-3 ml-auto opacity-50" />
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => { setIsMuted(v => !v); toast.success(isMuted ? 'Notifications unmuted' : 'Notifications muted'); }}>
                                    {isMuted ? <><Bell className="h-4 w-4 mr-2" />Unmute Notifications</> : <><BellOff className="h-4 w-4 mr-2" />Mute Notifications</>}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="text-amber-600 focus:text-amber-600"
                                    onClick={() => setConfirmClear(true)}
                                >
                                    <Eraser className="h-4 w-4 mr-2" />
                                    Clear Chat
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Search bar */}
                <AnimatePresence>
                    {searchOpen && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-b border-border/50 overflow-hidden">
                            <div className="flex items-center gap-2 px-4 py-2 bg-muted/30">
                                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                                <input
                                    ref={searchInputRef}
                                    value={searchQuery}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    placeholder="Search messages…"
                                    className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
                                />
                                {searchResults.length > 0 && (
                                    <span className="text-xs text-muted-foreground shrink-0">{searchIdx + 1}/{searchResults.length}</span>
                                )}
                                {searchResults.length > 1 && (
                                    <>
                                        <button onClick={() => navigateSearch(-1)} className="text-xs px-1.5 py-0.5 rounded hover:bg-accent">↑</button>
                                        <button onClick={() => navigateSearch(1)} className="text-xs px-1.5 py-0.5 rounded hover:bg-accent">↓</button>
                                    </>
                                )}
                                {isSearching && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                                {searchQuery && !isSearching && searchResults.length === 0 && (
                                    <span className="text-xs text-muted-foreground">No results</span>
                                )}
                                <button onClick={() => { setSearchOpen(false); setSearchQuery(''); setSearchResults([]); }} className="text-muted-foreground hover:text-foreground">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Messages */}
                <div className="flex-1 relative overflow-hidden">
                <div ref={messagesContainerRef} onScroll={handleMessagesScroll} className="h-full overflow-y-auto overflow-x-hidden px-4 py-3 bg-muted/20">
                    {isLoadingConvo ? (
                        <div className="flex justify-center items-center h-full">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                            <p className="text-sm">No messages yet. Say hello!</p>
                        </div>
                    ) : (
                        messages.map((msg, index) => {
                            const isMe = msg.senderId?._id === user?._id;
                            const prevMsg = messages[index - 1];
                            const nextMsg = messages[index + 1];
                            const isFirstInGroup = !prevMsg || prevMsg.messageType === 'system' || prevMsg.senderId?._id !== msg.senderId?._id;
                            const isLastInGroup = !nextMsg || nextMsg.messageType === 'system' || nextMsg.senderId?._id !== msg.senderId?._id;
                            const senderName = msg.senderId?.name ?? 'Support';
                            const senderPhoto = (msg.senderId as any)?.photo;

                            if (msg.messageType === 'system') {
                                return (
                                    <div key={msg._id} className="flex justify-center my-4">
                                        <span className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full">{msg.content}</span>
                                    </div>
                                );
                            }
                            const isHighlighted = highlightedMsgId === msg._id;
                            return (
                                <motion.div
                                    key={msg._id}
                                    data-message-id={msg._id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'} ${isFirstInGroup ? 'mt-4' : 'mt-0.5'} ${isHighlighted ? 'rounded-2xl ring-2 ring-primary/50 bg-primary/5 transition-all duration-500' : ''}`}
                                >
                                    {/* Avatar — left side only, last in group */}
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
                                        {/* Pin indicator */}
                                        {msg.isPinned && (
                                            <div className="flex items-center gap-1 text-[10px] text-amber-500 mb-0.5 px-1">
                                                <Pin className="h-3 w-3" />
                                                <span>Pinned by {msg.pinnedBy?.name ?? 'someone'}</span>
                                            </div>
                                        )}
                                        {isFirstInGroup && !isMe && (
                                            <span className="text-[11px] font-semibold text-muted-foreground mb-1 px-1">{senderName}</span>
                                        )}
                                        <div className="group relative">
                                            {/* Quick action buttons on hover */}
                                            {!msg.isDeleted && (
                                                <div className={`absolute top-1 ${isMe ? 'right-full mr-1' : 'left-full ml-1'} hidden group-hover:flex items-center gap-0.5 z-10`}>
                                                    <button onClick={() => socket?.emit('chat:pin_message', { messageId: msg._id })} title={msg.isPinned ? 'Unpin' : 'Pin'} className="p-1 rounded-lg bg-background border border-border/50 hover:bg-accent text-muted-foreground hover:text-foreground transition-colors shadow-sm">
                                                        {msg.isPinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
                                                    </button>
                                                </div>
                                            )}
                                            <SwipeableMessage msg={msg} isMe={isMe} onReply={setReplyTo} onDelete={handleDelete}>
                                                <div
                                                    className={`px-4 py-2.5 shadow-sm text-sm ${
                                                        isMe
                                                            ? `bg-primary text-primary-foreground ${isFirstInGroup ? 'rounded-2xl rounded-tr-sm' : 'rounded-2xl'}`
                                                            : `bg-card border border-border/50 ${isFirstInGroup ? 'rounded-2xl rounded-tl-sm' : 'rounded-2xl'}`
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
                                                        <p className="leading-relaxed">{msg.content}</p>
                                                    )}
                                                    <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                                        <span>{formatTime(msg.createdAt)}</span>
                                                        {isMe && (() => {
                                                            const otherId = adminParticipant?._id;
                                                            const seen = otherId && msg.readBy.includes(otherId);
                                                            return seen
                                                                ? <CheckCheck className="h-3 w-3 text-blue-400" title="Seen" />
                                                                : <Check className="h-3 w-3 opacity-60" title="Sent" />;
                                                        })()}
                                                    </div>
                                                </div>
                                            </SwipeableMessage>
                                            {/* Reactions */}
                                            {!msg.isDeleted && (
                                                <div className="mt-0.5">
                                                    <MessageReactions
                                                        reactions={msg.reactions}
                                                        myUserId={user?._id ?? ''}
                                                        onReact={(emoji) => socket?.emit('chat:react_message', { messageId: msg._id, emoji })}
                                                        isMine={isMe}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                    <AnimatePresence>
                        {isTyping && (
                            <motion.div
                                key="typing-indicator"
                                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                transition={{ duration: 0.18 }}
                                className="flex items-end gap-2 mt-2"
                            >
                                <div className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                                    {adminParticipant?.name?.charAt(0) ?? 'A'}
                                </div>
                                <div className="bg-card border border-border/50 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                                    <div className="flex gap-1 items-center h-4">
                                        <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:0ms]" />
                                        <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:160ms]" />
                                        <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:320ms]" />
                                    </div>
                                    <span className="text-[10px] text-muted-foreground mt-1 block">{typingUser} is typing…</span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                </div>
                {/* Scroll to bottom button */}
                <AnimatePresence>
                    {showScrollBtn && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8, y: 8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8, y: 8 }}
                            transition={{ duration: 0.18 }}
                            onClick={scrollToBottom}
                            className="absolute bottom-4 right-4 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-background/90 backdrop-blur-sm border-2 border-primary/50 text-primary shadow-xl shadow-black/20 hover:bg-primary hover:text-primary-foreground hover:border-primary hover:scale-110 transition-all duration-200"
                        >
                            {newBelowCount > 0 && (
                                <span className="absolute -top-2 -right-2 h-[18px] min-w-[18px] px-1 rounded-full bg-destructive text-[9px] text-white font-bold flex items-center justify-center shadow-sm">
                                    {newBelowCount > 99 ? '99+' : newBelowCount}
                                </span>
                            )}
                            <ArrowDown className="h-4 w-4" />
                        </motion.button>
                    )}
                </AnimatePresence>
                </div>{/* end relative wrapper */}

                {/* Input */}
                <div className="border-t border-border/50 bg-background">
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

        {/* ── Profile Slide Panel ── */}
        <AnimatePresence>
            {showProfile && adminParticipant && (
                <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="fixed right-0 top-0 h-full w-72 bg-card border-l shadow-2xl z-50 flex flex-col"
                >
                    <div className="flex items-center justify-between px-4 py-3 border-b">
                        <span className="font-semibold text-sm">Contact Info</span>
                        <button onClick={() => setShowProfile(false)} className="p-1 rounded-full hover:bg-accent text-muted-foreground">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        <div className="flex flex-col items-center py-6 px-4 border-b">
                            {adminParticipant.photo && adminParticipant.photo !== 'default.jpg' ? (
                                <img src={adminParticipant.photo} alt={adminParticipant.name} className="w-20 h-20 rounded-full object-cover mb-3" />
                            ) : (
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-2xl font-bold mb-3">
                                    {adminParticipant.name?.charAt(0) ?? 'A'}
                                </div>
                            )}
                            <h3 className="font-semibold text-base">{adminParticipant.name ?? 'Admin Support'}</h3>
                            <span className="text-xs text-muted-foreground capitalize mt-0.5 px-2 py-0.5 rounded-full bg-muted">{adminParticipant.role}</span>
                        </div>
                        <div className="px-4 py-3 space-y-3 border-b">
                            <div className="flex items-start gap-3">
                                <ShieldCheck className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                <div><p className="text-[11px] text-muted-foreground">Role</p><p className="text-sm capitalize">{adminParticipant.role}</p></div>
                            </div>
                            {conversation?.createdAt && (
                                <div className="flex items-start gap-3">
                                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                    <div><p className="text-[11px] text-muted-foreground">Chat started</p><p className="text-sm">{new Date(conversation.createdAt).toLocaleDateString()}</p></div>
                                </div>
                            )}
                        </div>
                        <div className="px-4 py-3">
                            <button
                                onClick={() => { setShowProfile(false); setConfirmClear(true); }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/20 text-amber-600 text-sm transition-colors"
                            >
                                <Eraser className="h-4 w-4 shrink-0" />
                                Clear Chat
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* ── Confirm: Clear Chat ── */}
        {confirmClear && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card w-full max-w-sm rounded-xl shadow-2xl border p-6">
                    <h3 className="font-semibold text-lg mb-1">Clear chat?</h3>
                    <p className="text-sm text-muted-foreground mb-5">All messages will be permanently deleted.</p>
                    <div className="flex gap-3 justify-end">
                        <Button variant="outline" onClick={() => setConfirmClear(false)} disabled={isActioning}>Cancel</Button>
                        <Button variant="destructive" onClick={handleClearChat} disabled={isActioning}>
                            {isActioning ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Clear Chat'}
                        </Button>
                    </div>
                </motion.div>
            </div>
        )}
        </>
    );
}
