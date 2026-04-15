/**
 * Team Chat Page
 * Two tabs:
 *  - "Admin DM"  — admin_team conversations (team member ↔ admin)
 *  - "Team DMs"  — team_team conversations  (team member ↔ team member)
 * Per-tab unread badge + per-conversation unread badges.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Send, Search, Phone, Video, MoreVertical, Paperclip, Loader2,
    MessageSquarePlus, CheckCheck, Check, UserCircle, BellOff, Bell,
    Eraser, X, Mail, ShieldCheck, Calendar, ChevronRight, Users, Plus, Briefcase, ArrowDown,
    Pin, PinOff,
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { chatApi, ChatMessage, Conversation, Participant, MessageReaction } from '../../api/chat.api';
import { ChatFileMessage } from '../../components/ChatFileMessage';
import { SwipeableMessage } from '../../components/SwipeableMessage';
import { MessageReactions } from '../../components/MessageReactions';

type ActiveTab = 'admin' | 'team';

export default function TeamChat() {
    const { user } = useAuth();
    const { socket, isConnected } = useSocket();
    const [searchParams] = useSearchParams();

    // ── Conversations (split by type) ────────────────────────────────────────
    const [adminConversations, setAdminConversations] = useState<Conversation[]>([]);
    const [teamConversations, setTeamConversations] = useState<Conversation[]>([]);
    const [activeTab, setActiveTab] = useState<ActiveTab>('admin');
    const [adminTabUnread, setAdminTabUnread] = useState(0);
    const [teamTabUnread, setTeamTabUnread] = useState(0);

    // ── Selected conversation & messages ─────────────────────────────────────
    const [selectedConvo, setSelectedConvo] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [message, setMessage] = useState('');
    const [search, setSearch] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isMsgsLoading, setIsMsgsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [typingUser, setTypingUser] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
    const [highlightedMsgId, setHighlightedMsgId] = useState<string | null>(null);
    const [convoUnread, setConvoUnread] = useState<Record<string, number>>({});

    // ── New DM picker ────────────────────────────────────────────────────────
    const [showNewDm, setShowNewDm] = useState(false);
    const [teamPeers, setTeamPeers] = useState<Participant[]>([]);
    const [isPeersLoading, setIsPeersLoading] = useState(false);
    const [peerSearch, setPeerSearch] = useState('');

    // ── Scroll to bottom ─────────────────────────────────────────────────────
    const [showScrollBtn, setShowScrollBtn] = useState(false);
    const [newBelowCount, setNewBelowCount] = useState(0);
    const isAtBottomRef = useRef(true);
    const prevMsgCountRef = useRef(0);

    // ── Chat options ─────────────────────────────────────────────────────────
    const [showProfile, setShowProfile] = useState(false);
    const [mutedConvos, setMutedConvos] = useState<Set<string>>(new Set());
    const [confirmClear, setConfirmClear] = useState(false);
    const [isActioning, setIsActioning] = useState(false);

    // ── Search state ──────────────────────────────────────────────────────────
    const [msgSearchOpen, setMsgSearchOpen] = useState(false);
    const [msgSearchQuery, setMsgSearchQuery] = useState('');
    const [msgSearchResults, setMsgSearchResults] = useState<ChatMessage[]>([]);
    const [msgSearchIdx, setMsgSearchIdx] = useState(0);
    const [isMsgSearching, setIsMsgSearching] = useState(false);
    const msgSearchInputRef = useRef<HTMLInputElement>(null);

    // ── Refs ─────────────────────────────────────────────────────────────────
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const scrolledToMsgRef = useRef<string | null>(null);
    const selectedConvoRef = useRef<Conversation | null>(null);
    const adminConvosRef = useRef<Conversation[]>([]);
    const teamConvosRef = useRef<Conversation[]>([]);
    const activeTabRef = useRef<ActiveTab>('admin');

    // Sync refs
    useEffect(() => { selectedConvoRef.current = selectedConvo; }, [selectedConvo]);
    useEffect(() => { adminConvosRef.current = adminConversations; }, [adminConversations]);
    useEffect(() => { teamConvosRef.current = teamConversations; }, [teamConversations]);
    useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);

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

    // ── Load conversations ───────────────────────────────────────────────────
    useEffect(() => {
        async function load() {
            try {
                setIsLoading(true);
                const res = await chatApi.getConversations();
                const all = res.data.data || [];
                const adminConvos = all.filter((c: Conversation) => c.type === 'admin_team');
                const teamConvos = all.filter((c: Conversation) => c.type === 'team_team');

                setAdminConversations(adminConvos);
                setTeamConversations(teamConvos);

                // Seed per-convo unread badges from server (skip selected to avoid race)
                const selectedId = selectedConvoRef.current?._id;
                setConvoUnread(prev => {
                    const next = { ...prev };
                    all.forEach((c: any) => {
                        if ((c.unreadCount ?? 0) > 0 && c._id !== selectedId) next[c._id] = c.unreadCount;
                        else if (c._id === selectedId) next[c._id] = 0;
                    });
                    return next;
                });

                // Auto-select first admin convo
                if (adminConvos.length > 0) await selectConversation(adminConvos[0]);
            } catch (err: any) {
                toast.error('Failed to load conversations', { description: err?.response?.data?.message || 'Please try again.' });
            } finally {
                setIsLoading(false);
            }
        }
        if (user) load();
    }, [user]);

    // ── Select conversation ──────────────────────────────────────────────────
    const selectConversation = async (convo: Conversation) => {
        selectedConvoRef.current = convo; // sync immediately so socket handler is correct
        setSelectedConvo(convo);
        setShowProfile(false);
        setConvoUnread(prev => ({ ...prev, [convo._id]: 0 }));
        setMessages([]);
        prevMsgCountRef.current = 0;
        setNewBelowCount(0);
        setShowScrollBtn(false);
        isAtBottomRef.current = true;
        if (!convo) return;
        try {
            setIsMsgsLoading(true);
            const res = await chatApi.getMessages(convo._id, 1, 50);
            const msgs = res.data.data?.messages || [];
            setMessages(msgs);
            // Update sidebar preview with latest message
            const lastMsg = msgs.filter((m: ChatMessage) => m.messageType !== 'system').pop();
            if (lastMsg) {
                const updater = (prev: Conversation[]) =>
                    prev.map((c) =>
                        c._id === convo._id
                            ? { ...c, lastMessage: lastMsg, lastMessageAt: lastMsg.createdAt }
                            : c
                    );
                if (convo.type === 'admin_team') setAdminConversations(updater);
                else setTeamConversations(updater);
            }
            // Re-clear badge after async load — prevents functional-update race
            setConvoUnread(prev => ({ ...prev, [convo._id]: 0 }));
            socket?.emit('chat:read_messages', { conversationId: convo._id });
        } catch (err: any) {
            toast.error('Failed to load messages', { description: err?.response?.data?.message || 'Please try again.' });
        } finally {
            setIsMsgsLoading(false);
        }
    };

    // ── Tab switch ───────────────────────────────────────────────────────────
    const handleTabChange = (tab: ActiveTab) => {
        setActiveTab(tab);
        if (tab === 'admin') setAdminTabUnread(0);
        if (tab === 'team') setTeamTabUnread(0);
    };

    // ── URL param: auto-select conversation from notification ────────────────
    useEffect(() => {
        const convoId = searchParams.get('convoId');
        if (!convoId || (adminConversations.length === 0 && teamConversations.length === 0)) return;
        const allConvos = [...adminConversations, ...teamConversations];
        const match = allConvos.find((c) => c._id === convoId);
        if (match && selectedConvo?._id !== convoId) {
            // Switch to the correct tab first
            if (match.type === 'team_team') handleTabChange('team');
            else handleTabChange('admin');
            selectConversation(match);
        }
    }, [adminConversations, teamConversations, searchParams]);

    // ── Socket room join (and on reconnect) ──────────────────────────────────
    useEffect(() => {
        if (!socket || !selectedConvo || !isConnected) return;
        socket.emit('chat:join_conversation', { conversationId: selectedConvo._id });
        socket.emit('chat:read_messages', { conversationId: selectedConvo._id });
    }, [socket, selectedConvo?._id, isConnected]);

    // ── Socket listeners ─────────────────────────────────────────────────────
    useEffect(() => {
        if (!socket) return;

        const onNewMessage = (msg: ChatMessage) => {
            const selectedId = selectedConvoRef.current?._id;
            const tab = activeTabRef.current;

            if (msg.conversationId === selectedId) {
                setMessages((prev) => {
                    if (prev.find((m) => m._id === msg._id)) return prev;
                    return [...prev, msg];
                });
                socket.emit('chat:read_messages', { conversationId: msg.conversationId });
            } else {
                // Per-conversation unread badge
                setConvoUnread(prev => ({ ...prev, [msg.conversationId]: (prev[msg.conversationId] ?? 0) + 1 }));
            }

            // Tab badge — increment OTHER tab's badge if message belongs to the other tab
            const inAdmin = adminConvosRef.current.some(c => c._id === msg.conversationId);
            const inTeam = teamConvosRef.current.some(c => c._id === msg.conversationId);
            if (tab === 'admin' && inTeam) setTeamTabUnread(prev => prev + 1);
            if (tab === 'team' && inAdmin) setAdminTabUnread(prev => prev + 1);

            // Update sidebar preview in the correct conversation list
            const updater = (prev: Conversation[]) =>
                prev.map((c) =>
                    c._id === msg.conversationId
                        ? { ...c, lastMessage: msg as any, lastMessageAt: msg.createdAt }
                        : c
                );
            if (inAdmin) setAdminConversations(updater);
            if (inTeam) setTeamConversations(updater);
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

        const onReactionUpdated = ({ messageId, reactions }: { messageId: string; reactions: MessageReaction[] }) => {
            setMessages((prev) => prev.map((m) => m._id === messageId ? { ...m, reactions } : m));
        };
        const onMessagePinned = ({ messageId, isPinned, pinnedBy }: { messageId: string; isPinned: boolean; pinnedBy: any }) => {
            setMessages((prev) => prev.map((m) => m._id === messageId ? { ...m, isPinned, pinnedBy } : m));
        };

        const onMessagesRead = ({ conversationId: cId, readBy: readerId }: { conversationId: string; readBy: string }) => {
            if (!selectedConvo || cId !== selectedConvo._id) return;
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
    }, [socket, selectedConvo?._id]);

    // ── Auto-scroll (skip when navigating to specific message) ───────────────
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

    // ── Load team peers (for New DM picker) ──────────────────────────────────
    const loadTeamPeers = useCallback(async () => {
        if (teamPeers.length > 0) return; // already loaded
        setIsPeersLoading(true);
        try {
            const res = await chatApi.getTeamPeersForChat();
            setTeamPeers(res.data.data || []);
        } catch {
            toast.error('Failed to load team members');
        } finally {
            setIsPeersLoading(false);
        }
    }, [teamPeers.length]);

    const handleShowNewDm = () => {
        setShowNewDm(true);
        loadTeamPeers();
    };

    const startTeamDm = async (peer: Participant) => {
        try {
            const res = await chatApi.getOrCreateConversation(peer._id, 'team_team');
            const convo = res.data.data;
            setTeamConversations(prev => {
                const exists = prev.find(c => c._id === convo._id);
                if (exists) return prev;
                return [convo, ...prev];
            });
            setShowNewDm(false);
            setPeerSearch('');
            handleTabChange('team');
            await selectConversation(convo);
        } catch (err: any) {
            toast.error('Failed to start conversation', { description: err?.response?.data?.message });
        }
    };

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
    const handleSend = useCallback(async () => {
        const trimmed = message.trim();
        if (!trimmed || !socket || isSending) return;

        let activeConvo = selectedConvo;

        // If no conversation yet (admin tab only — auto-create with admin)
        if (!activeConvo && activeTabRef.current === 'admin') {
            try {
                setIsSending(true);
                const convoRes = await chatApi.getOrCreateConversation(undefined, 'admin_team');
                activeConvo = convoRes.data.data;
                setAdminConversations([activeConvo!]);
                setSelectedConvo(activeConvo);
                socket.emit('chat:join_conversation', { conversationId: activeConvo!._id });
            } catch (err: any) {
                toast.error('Failed to start conversation', { description: err?.response?.data?.message || 'Please try again.' });
                return;
            } finally {
                setIsSending(false);
            }
        }

        if (!activeConvo) return;

        setMessage('');
        const replyToId = replyTo?._id;
        setReplyTo(null);
        socket.emit('chat:typing', { conversationId: activeConvo!._id, isTyping: false });
        socket.emit('chat:send_message', {
            conversationId: activeConvo!._id,
            content: trimmed,
            messageType: 'text',
            replyToId,
        });
    }, [message, socket, selectedConvo, isSending, replyTo]);

    // ── Delete message ────────────────────────────────────────────────────────
    const handleDelete = useCallback((msgId: string) => {
        if (!socket) return;
        socket.emit('chat:delete_message', { messageId: msgId });
    }, [socket]);

    // ── File upload ──────────────────────────────────────────────────────────
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !socket) return;

        let activeConvo = selectedConvo;

        if (!activeConvo && activeTabRef.current === 'admin') {
            try {
                setIsUploading(true);
                const convoRes = await chatApi.getOrCreateConversation(undefined, 'admin_team');
                activeConvo = convoRes.data.data;
                setAdminConversations([activeConvo!]);
                setSelectedConvo(activeConvo);
                socket.emit('chat:join_conversation', { conversationId: activeConvo!._id });
            } catch (err: any) {
                toast.error('Failed to start conversation', { description: err?.response?.data?.message || 'Please try again.' });
                setIsUploading(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
                return;
            }
        }

        if (!activeConvo) { if (fileInputRef.current) fileInputRef.current.value = ''; return; }

        try {
            setIsUploading(true);
            const res = await chatApi.uploadFile(file);
            const { fileUrl, fileName, fileMime } = res.data.data;
            socket.emit('chat:send_message', {
                conversationId: activeConvo!._id,
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

    // ── Clear chat ───────────────────────────────────────────────────────────
    const handleClearChat = async () => {
        if (!selectedConvo) return;
        setIsActioning(true);
        try {
            await chatApi.clearChatMessages(selectedConvo._id);
            setMessages([]);
            setConfirmClear(false);
            toast.success('Chat cleared');
        } catch { toast.error('Failed to clear chat'); }
        finally { setIsActioning(false); }
    };

    const toggleMute = (convoId: string) => {
        setMutedConvos(prev => {
            const next = new Set(prev);
            if (next.has(convoId)) { next.delete(convoId); toast.success('Notifications unmuted'); }
            else { next.add(convoId); toast.success('Notifications muted'); }
            return next;
        });
    };

    // ── Helpers ──────────────────────────────────────────────────────────────
    const getOtherParticipant = (convo: Conversation) =>
        convo.participants.find((p) => p && p._id !== user?._id);

    const formatTime = (dateStr: string) =>
        new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // ── Message search handlers ───────────────────────────────────────────────
    const scrollToSearchMsg = (msgId: string) => {
        setHighlightedMsgId(msgId);
        setTimeout(() => {
            const el = document.querySelector(`[data-message-id="${msgId}"]`);
            el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 50);
        setTimeout(() => setHighlightedMsgId(null), 2500);
    };

    const handleMsgSearch = async (q: string) => {
        setMsgSearchQuery(q);
        if (!q.trim() || !selectedConvo) { setMsgSearchResults([]); return; }
        setIsMsgSearching(true);
        try {
            const res = await chatApi.searchMessages(selectedConvo._id, q);
            const results = res.data.data || [];
            setMsgSearchResults(results);
            setMsgSearchIdx(0);
            if (results.length > 0) scrollToSearchMsg(results[0]._id);
        } catch { /* silent */ }
        finally { setIsMsgSearching(false); }
    };

    const navigateMsgSearch = (dir: 1 | -1) => {
        if (!msgSearchResults.length) return;
        const next = (msgSearchIdx + dir + msgSearchResults.length) % msgSearchResults.length;
        setMsgSearchIdx(next);
        scrollToSearchMsg(msgSearchResults[next]._id);
    };

    const currentConversations = activeTab === 'admin' ? adminConversations : teamConversations;
    const filteredConvos = currentConversations.filter((c) => {
        const other = getOtherParticipant(c);
        return !search || other?.name?.toLowerCase().includes(search.toLowerCase());
    });
    const filteredPeers = teamPeers.filter(p =>
        !peerSearch || p.name?.toLowerCase().includes(peerSearch.toLowerCase())
    );
    const otherParticipant = selectedConvo ? getOtherParticipant(selectedConvo) : null;

    return (
        <>
        <div className="h-[calc(100vh-140px)] flex gap-4 relative overflow-hidden">
            {/* Sidebar */}
            <Card className="w-64 flex flex-col overflow-hidden border-border/50">
                {/* Search */}
                <div className="p-3 border-b border-border/50 bg-secondary/20">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 h-8 text-sm"
                        />
                    </div>
                </div>

                {/* Tab buttons */}
                <div className="flex border-b border-border/50">
                    <button
                        onClick={() => handleTabChange('admin')}
                        className={`flex-1 py-2 text-xs font-medium transition-colors relative ${
                            activeTab === 'admin'
                                ? 'text-primary border-b-2 border-primary bg-primary/5'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Admin DM
                        {adminTabUnread > 0 && (
                            <span className="ml-1.5 h-4 min-w-[16px] px-0.5 rounded-full bg-primary text-[9px] text-primary-foreground font-bold inline-flex items-center justify-center">
                                {adminTabUnread > 99 ? '99+' : adminTabUnread}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => handleTabChange('team')}
                        className={`flex-1 py-2 text-xs font-medium transition-colors relative ${
                            activeTab === 'team'
                                ? 'text-primary border-b-2 border-primary bg-primary/5'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Team DMs
                        {teamTabUnread > 0 && (
                            <span className="ml-1.5 h-4 min-w-[16px] px-0.5 rounded-full bg-primary text-[9px] text-primary-foreground font-bold inline-flex items-center justify-center">
                                {teamTabUnread > 99 ? '99+' : teamTabUnread}
                            </span>
                        )}
                    </button>
                </div>

                {/* Conversation list */}
                <div className="flex-1 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex justify-center py-6">
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        </div>
                    ) : filteredConvos.length === 0 ? (
                        activeTab === 'admin' ? (
                            // No admin convo — start chat with admin
                            <button
                                onClick={async () => {
                                    if (!socket) return;
                                    try {
                                        const convoRes = await chatApi.getOrCreateConversation(undefined, 'admin_team');
                                        const convo = convoRes.data.data;
                                        setAdminConversations([convo]);
                                        await selectConversation(convo);
                                    } catch (err: any) {
                                        toast.error('Failed to connect', { description: err?.response?.data?.message });
                                    }
                                }}
                                className="w-full text-left px-3 py-3 flex items-center gap-2.5 hover:bg-muted/50 transition-colors"
                            >
                                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                                    A
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground">Admin Support</p>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <MessageSquarePlus className="h-3 w-3" /> Start conversation
                                    </p>
                                </div>
                            </button>
                        ) : (
                            // No team DMs yet
                            <div className="flex flex-col items-center justify-center py-8 px-4 text-center gap-2">
                                <Users className="h-8 w-8 text-muted-foreground/40" />
                                <p className="text-xs text-muted-foreground">No team conversations yet</p>
                                <button
                                    onClick={handleShowNewDm}
                                    className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
                                >
                                    <Plus className="h-3 w-3" /> Start a DM
                                </button>
                            </div>
                        )
                    ) : (
                        filteredConvos.map((convo) => {
                            const other = getOtherParticipant(convo);
                            const isSelected = selectedConvo?._id === convo._id;
                            const lastMsg = (convo as any).lastMessage;
                            const unread = convoUnread[convo._id] ?? 0;
                            return (
                                <button
                                    key={convo._id}
                                    onClick={() => selectConversation(convo)}
                                    className={`w-full text-left px-3 py-3 flex items-center gap-2.5 transition-colors border-b border-border/30 ${
                                        isSelected
                                            ? 'bg-primary/10 border-l-2 border-l-primary'
                                            : unread > 0
                                            ? 'bg-primary/5 border-l-2 border-l-primary/50'
                                            : 'hover:bg-muted/50 border-l-2 border-l-transparent'
                                    }`}
                                >
                                    <div className="relative shrink-0">
                                        {other?.photo && other.photo !== 'default.jpg' ? (
                                            <img src={other.photo} alt={other.name} className="h-9 w-9 rounded-full object-cover" />
                                        ) : (
                                            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                                                {other?.name?.charAt(0) ?? 'T'}
                                            </div>
                                        )}
                                        {isConnected && (
                                            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-background" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-baseline justify-between gap-1">
                                            <p className={`text-sm font-medium truncate ${isSelected ? 'text-primary' : unread > 0 ? 'text-foreground font-semibold' : 'text-foreground'}`}>
                                                {other?.name ?? (activeTab === 'admin' ? 'Admin' : 'Team Member')}
                                            </p>
                                            <div className="flex items-center gap-1 shrink-0">
                                                {lastMsg && (
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {formatTime(lastMsg.createdAt)}
                                                    </span>
                                                )}
                                                {unread > 0 && (
                                                    <span className="h-4 min-w-[16px] px-0.5 rounded-full bg-primary text-[9px] text-primary-foreground font-bold flex items-center justify-center">
                                                        {unread > 99 ? '99+' : unread}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {lastMsg
                                                ? lastMsg.messageType === 'file' ? '📎 File' : lastMsg.content
                                                : 'No messages yet'}
                                        </p>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>

                {/* New DM button (team tab only) */}
                {activeTab === 'team' && filteredConvos.length > 0 && (
                    <div className="p-3 border-t border-border/50">
                        <button
                            onClick={handleShowNewDm}
                            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-xs font-medium transition-colors"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            New Team DM
                        </button>
                    </div>
                )}
            </Card>

            {/* Chat Area */}
            <Card className="flex-1 flex flex-col overflow-hidden border-border/50 shadow-lg">
                {/* Header */}
                <div className="p-4 border-b border-border/50 flex justify-between items-center bg-secondary/20 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            {otherParticipant?.photo && otherParticipant.photo !== 'default.jpg' ? (
                                <img src={otherParticipant.photo} alt={otherParticipant.name} className="h-10 w-10 rounded-full object-cover" />
                            ) : (
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                                    {otherParticipant?.name?.charAt(0) ?? (activeTab === 'admin' ? 'A' : 'T')}
                                </div>
                            )}
                            <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm">{otherParticipant?.name ?? (activeTab === 'admin' ? 'Admin Support' : 'Team Member')}</h3>
                            <p className={`text-xs ${isConnected ? 'text-green-500' : 'text-muted-foreground'}`}>
                                {isConnected ? 'Online' : 'Offline'}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className={`text-muted-foreground hover:text-primary ${msgSearchOpen ? 'text-primary bg-primary/10' : ''}`} onClick={() => { setMsgSearchOpen(v => !v); setMsgSearchQuery(''); setMsgSearchResults([]); setTimeout(() => msgSearchInputRef.current?.focus(), 100); }}>
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
                                {otherParticipant && (
                                    <DropdownMenuItem onClick={() => setShowProfile(v => !v)}>
                                        <UserCircle className="h-4 w-4 mr-2" />
                                        View Profile
                                        <ChevronRight className="h-3 w-3 ml-auto opacity-50" />
                                    </DropdownMenuItem>
                                )}
                                {selectedConvo && (
                                    <DropdownMenuItem onClick={() => toggleMute(selectedConvo._id)}>
                                        {mutedConvos.has(selectedConvo._id)
                                            ? <><Bell className="h-4 w-4 mr-2" />Unmute Notifications</>
                                            : <><BellOff className="h-4 w-4 mr-2" />Mute Notifications</>
                                        }
                                    </DropdownMenuItem>
                                )}
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
                    {msgSearchOpen && selectedConvo && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-b border-border/50 overflow-hidden">
                            <div className="flex items-center gap-2 px-4 py-2 bg-muted/30">
                                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                                <input ref={msgSearchInputRef} value={msgSearchQuery} onChange={(e) => handleMsgSearch(e.target.value)} placeholder="Search messages…" className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground" />
                                {msgSearchResults.length > 0 && <span className="text-xs text-muted-foreground shrink-0">{msgSearchIdx + 1}/{msgSearchResults.length}</span>}
                                {msgSearchResults.length > 1 && (<><button onClick={() => navigateMsgSearch(-1)} className="text-xs px-1.5 py-0.5 rounded hover:bg-accent">↑</button><button onClick={() => navigateMsgSearch(1)} className="text-xs px-1.5 py-0.5 rounded hover:bg-accent">↓</button></>)}
                                {isMsgSearching && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                                {msgSearchQuery && !isMsgSearching && msgSearchResults.length === 0 && <span className="text-xs text-muted-foreground">No results</span>}
                                <button onClick={() => { setMsgSearchOpen(false); setMsgSearchQuery(''); setMsgSearchResults([]); }} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Messages */}
                <div className="flex-1 relative overflow-hidden">
                <div ref={messagesContainerRef} onScroll={handleMessagesScroll} className="h-full overflow-y-auto overflow-x-hidden px-4 py-3 bg-muted/20">
                    {!selectedConvo ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                            <MessageSquarePlus className="h-10 w-10 opacity-20" />
                            <p className="text-sm">Select a conversation to start chatting</p>
                        </div>
                    ) : isMsgsLoading ? (
                        <div className="flex justify-center items-center h-full">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                            <MessageSquarePlus className="h-10 w-10 opacity-20" />
                            <p className="text-sm">No messages yet. Say hello!</p>
                        </div>
                    ) : (
                        messages.map((msg, index) => {
                            const isMe = msg.senderId?._id === user?._id;
                            const prevMsg = messages[index - 1];
                            const nextMsg = messages[index + 1];
                            const isFirstInGroup = !prevMsg || prevMsg.messageType === 'system' || prevMsg.senderId?._id !== msg.senderId?._id;
                            const isLastInGroup = !nextMsg || nextMsg.messageType === 'system' || nextMsg.senderId?._id !== msg.senderId?._id;
                            const senderName = msg.senderId?.name ?? 'Team';
                            const senderPhoto = (msg.senderId as any)?.photo;
                            const isHighlighted = highlightedMsgId === msg._id;

                            if (msg.messageType === 'system') {
                                return (
                                    <div key={msg._id} className="flex justify-center my-4">
                                        <span className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full">{msg.content}</span>
                                    </div>
                                );
                            }

                            return (
                                <motion.div
                                    key={msg._id}
                                    data-message-id={msg._id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'} ${isFirstInGroup ? 'mt-4' : 'mt-0.5'} ${isHighlighted ? 'rounded-2xl ring-2 ring-primary/50 bg-primary/5 transition-all duration-500' : ''}`}
                                >
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
                                        {msg.isPinned && (
                                            <div className="flex items-center gap-1 text-[10px] text-amber-500 mb-0.5 px-1">
                                                <Pin className="h-3 w-3" /><span>Pinned</span>
                                            </div>
                                        )}
                                        {isFirstInGroup && !isMe && (
                                            <span className="text-[11px] font-semibold text-muted-foreground mb-1 px-1">{senderName}</span>
                                        )}
                                        <div className="group relative">
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
                                                        <ChatFileMessage fileUrl={msg.fileUrl ?? ''} fileName={msg.fileName ?? 'File'} fileMime={msg.fileMime} isMe={isMe} />
                                                    ) : (
                                                        <p className="leading-relaxed">{msg.content}</p>
                                                    )}
                                                    <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                                        <span>{formatTime(msg.createdAt)}</span>
                                                        {isMe && (() => {
                                                            const otherId = otherParticipant?._id;
                                                            const seen = otherId && msg.readBy.includes(otherId);
                                                            return seen
                                                                ? <CheckCheck className="h-3 w-3 text-blue-400" title="Seen" />
                                                                : <Check className="h-3 w-3 opacity-60" title="Sent" />;
                                                        })()}
                                                    </div>
                                                </div>
                                            </SwipeableMessage>
                                            {!msg.isDeleted && (
                                                <div className="mt-0.5">
                                                    <MessageReactions reactions={msg.reactions} myUserId={user?._id ?? ''} onReact={(emoji) => socket?.emit('chat:react_message', { messageId: msg._id, emoji })} isMine={isMe} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                    {isTyping && (
                        <div className="flex items-end gap-2 mt-2">
                            <div className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                                {otherParticipant?.name?.charAt(0) ?? 'T'}
                            </div>
                            <div className="bg-card border border-border/50 rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm">
                                <div className="flex gap-1 items-center">
                                    <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0ms]" />
                                    <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:150ms]" />
                                    <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:300ms]" />
                                </div>
                                <span className="text-[10px] text-muted-foreground mt-0.5 block">{typingUser} is typing</span>
                            </div>
                        </div>
                    )}
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
                        <input type="file" accept="*/*" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="shrink-0 text-muted-foreground hover:text-primary"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading || !selectedConvo}
                            >
                                {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Paperclip className="h-5 w-5" />}
                            </Button>
                            <input
                                type="text"
                                placeholder={selectedConvo ? 'Type your message…' : 'Select a conversation first'}
                                value={message}
                                disabled={!selectedConvo}
                                onChange={(e) => handleTypingChange(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                                className="flex-1 bg-secondary/50 border-transparent focus:bg-background border focus:border-primary/50 rounded-full px-4 py-2.5 text-sm outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <Button
                                onClick={handleSend}
                                size="icon"
                                className="rounded-full shadow-lg shadow-primary/25 shrink-0"
                                disabled={!message.trim() || isSending || !selectedConvo}
                            >
                                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>
        </div>

        {/* ── Profile Slide Panel ── */}
        <AnimatePresence>
            {showProfile && otherParticipant && (
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
                            {otherParticipant.photo && otherParticipant.photo !== 'default.jpg' ? (
                                <img src={otherParticipant.photo} alt={otherParticipant.name} className="w-20 h-20 rounded-full object-cover mb-3" />
                            ) : (
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-2xl font-bold mb-3">
                                    {otherParticipant.name?.charAt(0)}
                                </div>
                            )}
                            <h3 className="font-semibold text-base">{otherParticipant.name}</h3>
                            <span className="text-xs text-muted-foreground capitalize mt-0.5 px-2 py-0.5 rounded-full bg-muted">{otherParticipant.role}</span>
                        </div>
                        <div className="px-4 py-3 space-y-3 border-b">
                            <div className="flex items-start gap-3">
                                <ShieldCheck className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                <div><p className="text-[11px] text-muted-foreground">Role</p><p className="text-sm capitalize">{otherParticipant.role}</p></div>
                            </div>
                            {otherParticipant.teamProfile?.position && (
                                <div className="flex items-start gap-3">
                                    <Briefcase className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                    <div><p className="text-[11px] text-muted-foreground">Position</p><p className="text-sm">{otherParticipant.teamProfile.position}</p></div>
                                </div>
                            )}
                            {(otherParticipant as any).email && (
                                <div className="flex items-start gap-3">
                                    <Mail className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                    <div><p className="text-[11px] text-muted-foreground">Email</p><p className="text-sm break-all">{(otherParticipant as any).email}</p></div>
                                </div>
                            )}
                            {selectedConvo?.createdAt && (
                                <div className="flex items-start gap-3">
                                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                    <div><p className="text-[11px] text-muted-foreground">Chat started</p><p className="text-sm">{new Date((selectedConvo as any).createdAt).toLocaleDateString()}</p></div>
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

        {/* ── New Team DM Picker ── */}
        <AnimatePresence>
            {showNewDm && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                    onClick={() => { setShowNewDm(false); setPeerSearch(''); }}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-card w-full max-w-sm rounded-xl shadow-2xl border"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-4 py-3 border-b">
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-primary" />
                                <span className="font-semibold text-sm">New Team DM</span>
                            </div>
                            <button onClick={() => { setShowNewDm(false); setPeerSearch(''); }} className="p-1 rounded-full hover:bg-accent text-muted-foreground">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="p-3 border-b">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search team members…"
                                    value={peerSearch}
                                    onChange={(e) => setPeerSearch(e.target.value)}
                                    className="pl-9 h-8 text-sm"
                                    autoFocus
                                />
                            </div>
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                            {isPeersLoading ? (
                                <div className="flex justify-center py-6">
                                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                </div>
                            ) : filteredPeers.length === 0 ? (
                                <div className="flex flex-col items-center py-6 text-muted-foreground text-sm gap-1">
                                    <Users className="h-6 w-6 opacity-30" />
                                    <p>{peerSearch ? 'No members found' : 'No other team members'}</p>
                                </div>
                            ) : (
                                filteredPeers.map((peer) => (
                                    <button
                                        key={peer._id}
                                        onClick={() => startTeamDm(peer)}
                                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left border-b border-border/30 last:border-0"
                                    >
                                        {peer.photo && peer.photo !== 'default.jpg' ? (
                                            <img src={peer.photo} alt={peer.name} className="h-9 w-9 rounded-full object-cover shrink-0" />
                                        ) : (
                                            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                                                {peer.name?.charAt(0) ?? 'T'}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium">{peer.name}</p>
                                            {peer.teamProfile?.position && (
                                                <p className="text-xs text-muted-foreground truncate">{peer.teamProfile.position}</p>
                                            )}
                                        </div>
                                        <MessageSquarePlus className="h-4 w-4 text-muted-foreground shrink-0" />
                                    </button>
                                ))
                            )}
                        </div>
                    </motion.div>
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
