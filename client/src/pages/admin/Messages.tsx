/**
 * Admin Messages Page
 * Split view: sidebar lists all user-admin conversations (searchable),
 * main area shows the live chat thread.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Search, MoreVertical, Phone, Video, Send, Paperclip,
    CheckCheck, Users, Loader2, Hash, UserX, MessageSquarePlus, X,
    Trash2, Eraser, BellOff, Bell, UserCircle, ChevronRight, Mail,
    ShieldCheck, Calendar, ArrowDown, Pin, PinOff,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { chatApi, ChatMessage, Conversation, MessageReaction } from '../../api/chat.api';
import { ChatFileMessage } from '../../components/ChatFileMessage';
import { SwipeableMessage } from '../../components/SwipeableMessage';
import { MessageReactions } from '../../components/MessageReactions';

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
    // Tab unread badges: increment only when a message from the OTHER tab arrives
    const [teamTabUnread, setTeamTabUnread] = useState(0);
    const [userTabUnread, setUserTabUnread] = useState(0);
    // New team DM modal
    const [showNewDmModal, setShowNewDmModal] = useState(false);
    const [teamMembers, setTeamMembers] = useState<Array<{ _id: string; name: string; photo: string; teamProfile?: { position?: string } }>>([]);
    const [isLoadingMembers, setIsLoadingMembers] = useState(false);
    const [isStartingDm, setIsStartingDm] = useState<string | null>(null);
    // Profile panel & mute
    const [showProfile, setShowProfile] = useState(false);
    const [mutedConvos, setMutedConvos] = useState<Set<string>>(new Set());
    // Confirm dialogs
    const [confirmClear, setConfirmClear] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [isActioning, setIsActioning] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const scrolledToMsgRef = useRef<string | null>(null);
    // Keep refs so socket callbacks always see fresh values without re-subscribing
    const selectedConvoRef = useRef<Conversation | null>(null);
    const tabRef = useRef<ChatTab>(tab);
    const conversationsRef = useRef<Conversation[]>([]);
    // Tracks the last convoId we attempted cross-tab switch for, to prevent infinite toggling
    const pendingConvoIdRef = useRef<string | null>(null);
    // Scroll-to-bottom
    const [showScrollBtn, setShowScrollBtn] = useState(false);
    const [newBelowCount, setNewBelowCount] = useState(0);
    const isAtBottomRef = useRef(true);
    const prevMsgCountRef = useRef(0);
    // ── Search state ──────────────────────────────────────────────────────────
    const [msgSearchOpen, setMsgSearchOpen] = useState(false);
    const [msgSearchQuery, setMsgSearchQuery] = useState('');
    const [msgSearchResults, setMsgSearchResults] = useState<ChatMessage[]>([]);
    const [msgSearchIdx, setMsgSearchIdx] = useState(0);
    const [isMsgSearching, setIsMsgSearching] = useState(false);
    const msgSearchInputRef = useRef<HTMLInputElement>(null);
    useEffect(() => { selectedConvoRef.current = selectedConvo; }, [selectedConvo]);
    useEffect(() => { tabRef.current = tab; }, [tab]);
    useEffect(() => { conversationsRef.current = conversations; }, [conversations]);

    // ── Load conversations ───────────────────────────────────────────────────
    const loadConversations = useCallback(async (type: ChatTab) => {
        try {
            setIsLoading(true);
            setSelectedConvo(null);
            setMessages([]);
            const convoType = type === 'users' ? 'user_admin' : 'admin_team';
            const res = await chatApi.adminGetConversations(convoType, search || undefined);
            const convos = res.data.data || [];
            setConversations(convos);
            // Initialise per-convo unread badges from server — skip the currently
            // selected conversation (it's already visible; clear it, don't overwrite)
            const selectedId = selectedConvoRef.current?._id;
            setConvoUnread(prev => {
                const next = { ...prev };
                convos.forEach((c: any) => {
                    if ((c.unreadCount ?? 0) > 0 && c._id !== selectedId) {
                        next[c._id] = c.unreadCount;
                    } else if (c._id === selectedId) {
                        next[c._id] = 0; // always keep selected convo clear
                    }
                });
                return next;
            });
        } catch (err: any) {
            toast.error('Failed to load conversations', { description: err?.response?.data?.message || 'Please try again.' });
        } finally {
            setIsLoading(false);
        }
    }, [search]);

    // ── Load the OTHER tab's total unread on first mount (tab badge) ─────────
    useEffect(() => {
        if (!user || user.role !== 'admin') return;
        const otherType = initialTab === 'users' ? 'admin_team' : 'user_admin';
        chatApi.adminGetConversations(otherType).then(res => {
            const convos = res.data.data || [];
            const total = convos.reduce((s: number, c: any) => s + (c.unreadCount ?? 0), 0);
            if (initialTab === 'users') setTeamTabUnread(total);
            else setUserTabUnread(total);
            // Also seed convoUnread for the other tab's convos
            const unreadMap: Record<string, number> = {};
            convos.forEach((c: any) => { if ((c.unreadCount ?? 0) > 0) unreadMap[c._id] = c.unreadCount; });
            setConvoUnread(prev => ({ ...prev, ...unreadMap }));
        }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    useEffect(() => {
        if (user?.role === 'admin') loadConversations(tab);
        if (tab === 'team') setTeamTabUnread(0); // clear team badge when switching to team tab
        if (tab === 'users') setUserTabUnread(0); // clear user badge when switching to users tab
    }, [tab, user]);

    // Re-filter on search change
    useEffect(() => {
        const t = setTimeout(() => {
            if (user?.role === 'admin') loadConversations(tab);
        }, 400);
        return () => clearTimeout(t);
    }, [search]);

    // Auto-select conversation from URL param ?convoId=
    // If the target conversation is in the OTHER tab, switch tabs automatically (once).
    useEffect(() => {
        const convoId = searchParams.get('convoId');
        if (!convoId) return;
        if (conversations.length === 0) return; // wait for current tab to load

        const match = conversations.find((c) => c._id === convoId);
        if (match) {
            // Found in current tab — select it and clear any pending cross-tab flag
            if (selectedConvo?._id !== convoId) selectConversation(match);
            pendingConvoIdRef.current = null;
            return;
        }

        // Not found in current tab. Switch to the other tab once per convoId so we
        // can search there. Guard against infinite flipping with pendingConvoIdRef.
        if (pendingConvoIdRef.current !== convoId) {
            pendingConvoIdRef.current = convoId;
            setTab(prev => prev === 'users' ? 'team' : 'users');
        }
        // Once tab flips, loadConversations fires → conversations updates → this
        // effect re-runs and finds the match (or gives up if genuinely not found).
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
        selectedConvoRef.current = convo; // sync immediately so socket handler is correct
        setSelectedConvo(convo);
        setShowProfile(false);
        // Clear unread count for this conversation
        setConvoUnread(prev => ({ ...prev, [convo._id]: 0 }));
        setMessages([]);
        // Reset scroll state
        setShowScrollBtn(false);
        setNewBelowCount(0);
        isAtBottomRef.current = true;
        prevMsgCountRef.current = 0;
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
            // Re-clear badge after async load — handles any functional-update race
            setConvoUnread(prev => ({ ...prev, [convo._id]: 0 }));
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
            if (msg.conversationId === selectedConvoRef.current?._id) {
                setMessages((prev) => {
                    if (prev.find((m) => m._id === msg._id)) return prev;
                    return [...prev, msg];
                });
                if (!isAtBottomRef.current) {
                    setNewBelowCount(prev => prev + 1);
                    setShowScrollBtn(true);
                }
                socket.emit('chat:read_messages', { conversationId: msg.conversationId });
            } else {
                // Check if this conversation is in the currently-visible tab's list
                const isInCurrentTab = conversationsRef.current.some(c => c._id === msg.conversationId);
                if (isInCurrentTab) {
                    // Same tab, just not selected — show per-convo badge
                    setConvoUnread(prev => ({ ...prev, [msg.conversationId]: (prev[msg.conversationId] ?? 0) + 1 }));
                } else {
                    // Belongs to the other tab — bump that tab's badge
                    if (tabRef.current === 'users') {
                        setTeamTabUnread(prev => prev + 1);
                    } else {
                        setUserTabUnread(prev => prev + 1);
                    }
                }
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

        const onReactionUpdated = ({ messageId, reactions }: { messageId: string; reactions: MessageReaction[] }) => {
            setMessages((prev) => prev.map((m) => m._id === messageId ? { ...m, reactions } : m));
        };
        const onMessagePinned = ({ messageId, isPinned, pinnedBy }: { messageId: string; isPinned: boolean; pinnedBy: any }) => {
            setMessages((prev) => prev.map((m) => m._id === messageId ? { ...m, isPinned, pinnedBy } : m));
        };

        socket.on('chat:new_message', onNewMessage);
        socket.on('chat:typing_indicator', onTyping);
        socket.on('chat:message_deleted', onDeleted);
        socket.on('chat:reaction_updated', onReactionUpdated);
        socket.on('chat:message_pinned', onMessagePinned);
        return () => {
            socket.off('chat:new_message', onNewMessage);
            socket.off('chat:typing_indicator', onTyping);
            socket.off('chat:message_deleted', onDeleted);
            socket.off('chat:reaction_updated', onReactionUpdated);
            socket.off('chat:message_pinned', onMessagePinned);
        };
    }, [socket, selectedConvo?._id]);

    // ── Auto-scroll (only when no specific message target) ───────────────────
    useEffect(() => {
        const targetId = searchParams.get('messageId');
        if (targetId && messages.find(m => m._id === targetId)) return; // let scroll-to-msg handle it
        const isInitialLoad = prevMsgCountRef.current === 0 && messages.length > 0;
        const wasAtBottom = isAtBottomRef.current;
        prevMsgCountRef.current = messages.length;
        if (isInitialLoad || wasAtBottom) {
            const el = messagesContainerRef.current;
            if (el) el.scrollTop = el.scrollHeight;
        }
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

    // ── Clear chat ────────────────────────────────────────────────────────────
    const handleClearChat = async () => {
        if (!selectedConvo) return;
        setIsActioning(true);
        try {
            await chatApi.clearChatMessages(selectedConvo._id);
            setMessages([]);
            setShowScrollBtn(false);
            setNewBelowCount(0);
            prevMsgCountRef.current = 0;
            setConversations(prev => prev.map(c =>
                c._id === selectedConvo._id
                    ? { ...c, lastMessage: undefined, lastMessageAt: new Date().toISOString() }
                    : c
            ));
            setConfirmClear(false);
            toast.success('Chat cleared');
        } catch {
            toast.error('Failed to clear chat');
        } finally {
            setIsActioning(false);
        }
    };

    // ── Delete conversation ───────────────────────────────────────────────────
    const handleDeleteConversation = async () => {
        if (!selectedConvo) return;
        setIsActioning(true);
        try {
            await chatApi.deleteConversation(selectedConvo._id);
            setConversations(prev => prev.filter(c => c._id !== selectedConvo._id));
            setSelectedConvo(null);
            setMessages([]);
            setShowScrollBtn(false);
            setNewBelowCount(0);
            prevMsgCountRef.current = 0;
            setConfirmDelete(false);
            setShowProfile(false);
            toast.success('Conversation deleted');
        } catch {
            toast.error('Failed to delete conversation');
        } finally {
            setIsActioning(false);
        }
    };

    // ── Scroll-to-bottom ─────────────────────────────────────────────────────
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
        setShowScrollBtn(false);
        setNewBelowCount(0);
    };

    // ── Mute toggle ───────────────────────────────────────────────────────────
    const toggleMute = (convoId: string) => {
        setMutedConvos(prev => {
            const next = new Set(prev);
            if (next.has(convoId)) { next.delete(convoId); toast.success('Notifications unmuted'); }
            else { next.add(convoId); toast.success('Notifications muted'); }
            return next;
        });
    };

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
                            {tab !== 'users' && userTabUnread > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-destructive text-[9px] text-white font-bold flex items-center justify-center">
                                    {userTabUnread > 9 ? '9+' : userTabUnread}
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

            {/* Main Chat Area + Profile Panel wrapper */}
            <div className={`flex-1 flex min-w-0 ${!selectedConvo ? 'hidden md:flex' : 'flex'}`}>
            <div className={`flex-1 flex flex-col min-w-0`}>
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
                                {/* Clickable avatar + name → opens profile panel */}
                                <button
                                    className="flex items-center gap-3 hover:opacity-80 transition-opacity text-left"
                                    onClick={() => activeParticipant && setShowProfile(v => !v)}
                                >
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
                                </button>
                            </div>
                            <div className="flex items-center gap-1">
                                {activeParticipant && (
                                    <>
                                        <Button variant="ghost" size="sm" className="hidden md:flex gap-2 text-primary">
                                            <Users className="h-4 w-4" /> Assign to Team
                                        </Button>
                                        <div className="h-4 w-px bg-border mx-1 hidden md:block" />
                                        <Button variant="ghost" size="icon" className={msgSearchOpen ? 'text-primary bg-primary/10' : ''} onClick={() => { setMsgSearchOpen(v => !v); setMsgSearchQuery(''); setMsgSearchResults([]); setTimeout(() => msgSearchInputRef.current?.focus(), 100); }}>
                                            <Search className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon"><Phone className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="icon"><Video className="h-4 w-4" /></Button>
                                    </>
                                )}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-52">
                                        {activeParticipant && (
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
                                        <DropdownMenuItem
                                            className="text-destructive focus:text-destructive"
                                            onClick={() => setConfirmDelete(true)}
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete Conversation
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                        {/* Deleted user banner */}
                        {!activeParticipant && (
                            <div className="flex items-center gap-2 px-4 py-2.5 bg-destructive/5 border-b border-destructive/10 text-sm text-destructive/80">
                                <UserX className="h-4 w-4 shrink-0" />
                                This user's account has been deleted. Chat history is preserved but no new messages can be sent.
                            </div>
                        )}

                        {/* Search bar */}
                        <AnimatePresence>
                            {msgSearchOpen && (
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
                        <div ref={messagesContainerRef} onScroll={handleMessagesScroll} className="h-full overflow-y-auto overflow-x-hidden px-4 py-3 bg-muted/5">
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
                                                                <ChatFileMessage fileUrl={msg.fileUrl ?? ''} fileName={msg.fileName ?? 'File'} fileMime={msg.fileMime} isMe={isMe} />
                                                            ) : (
                                                                <p>{msg.content}</p>
                                                            )}
                                                            <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                                                <span>{formatTime(msg.createdAt)}</span>
                                                                {isMe && <CheckCheck className="h-3 w-3" />}
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

            {/* ── Profile Slide Panel ── */}
            <AnimatePresence>
                {showProfile && activeParticipant && (
                    <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 280, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="border-l bg-card overflow-hidden shrink-0 flex flex-col"
                    >
                        <div className="flex items-center justify-between px-4 py-3 border-b">
                            <span className="font-semibold text-sm">Contact Info</span>
                            <button onClick={() => setShowProfile(false)} className="p-1 rounded-full hover:bg-accent text-muted-foreground">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {/* Avatar */}
                            <div className="flex flex-col items-center py-6 px-4 border-b">
                                {activeParticipant.photo && activeParticipant.photo !== 'default.jpg' ? (
                                    <img src={activeParticipant.photo} alt={activeParticipant.name} className="w-20 h-20 rounded-full object-cover mb-3" />
                                ) : (
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-2xl font-bold mb-3">
                                        {activeParticipant.name?.charAt(0)}
                                    </div>
                                )}
                                <h3 className="font-semibold text-base">{activeParticipant.name}</h3>
                                <span className="text-xs text-muted-foreground capitalize mt-0.5 px-2 py-0.5 rounded-full bg-muted">{activeParticipant.role}</span>
                            </div>
                            {/* Info rows */}
                            <div className="px-4 py-3 space-y-3 border-b">
                                <div className="flex items-start gap-3">
                                    <ShieldCheck className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-[11px] text-muted-foreground">Role</p>
                                        <p className="text-sm capitalize">{activeParticipant.role}</p>
                                    </div>
                                </div>
                                {(activeParticipant as any).email && (
                                    <div className="flex items-start gap-3">
                                        <Mail className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-[11px] text-muted-foreground">Email</p>
                                            <p className="text-sm break-all">{(activeParticipant as any).email}</p>
                                        </div>
                                    </div>
                                )}
                                {activeParticipant.teamProfile?.position && (
                                    <div className="flex items-start gap-3">
                                        <UserCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-[11px] text-muted-foreground">Position</p>
                                            <p className="text-sm">{activeParticipant.teamProfile.position}</p>
                                        </div>
                                    </div>
                                )}
                                {selectedConvo?.createdAt && (
                                    <div className="flex items-start gap-3">
                                        <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-[11px] text-muted-foreground">Chat started</p>
                                            <p className="text-sm">{new Date((selectedConvo as any).createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            {/* Actions */}
                            <div className="px-4 py-3 space-y-1">
                                <button
                                    onClick={() => { setShowProfile(false); setConfirmClear(true); }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/20 text-amber-600 text-sm transition-colors"
                                >
                                    <Eraser className="h-4 w-4 shrink-0" />
                                    Clear Chat
                                </button>
                                <button
                                    onClick={() => { setShowProfile(false); setConfirmDelete(true); }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-destructive/10 text-destructive text-sm transition-colors"
                                >
                                    <Trash2 className="h-4 w-4 shrink-0" />
                                    Delete Conversation
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            </div>{/* end Main Chat Area + Profile wrapper */}
        </div>{/* end outer flex container */}

        {/* ── Confirm: Clear Chat ── */}
        {confirmClear && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card w-full max-w-sm rounded-xl shadow-2xl border p-6">
                    <h3 className="font-semibold text-lg mb-1">Clear chat?</h3>
                    <p className="text-sm text-muted-foreground mb-5">All messages in this conversation will be permanently deleted. The conversation will remain in your list.</p>
                    <div className="flex gap-3 justify-end">
                        <Button variant="outline" onClick={() => setConfirmClear(false)} disabled={isActioning}>Cancel</Button>
                        <Button variant="destructive" onClick={handleClearChat} disabled={isActioning}>
                            {isActioning ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Clear Chat'}
                        </Button>
                    </div>
                </motion.div>
            </div>
        )}

        {/* ── Confirm: Delete Conversation ── */}
        {confirmDelete && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card w-full max-w-sm rounded-xl shadow-2xl border p-6">
                    <h3 className="font-semibold text-lg mb-1">Delete conversation?</h3>
                    <p className="text-sm text-muted-foreground mb-5">This will permanently delete the conversation and all its messages. This cannot be undone.</p>
                    <div className="flex gap-3 justify-end">
                        <Button variant="outline" onClick={() => setConfirmDelete(false)} disabled={isActioning}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDeleteConversation} disabled={isActioning}>
                            {isActioning ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
                        </Button>
                    </div>
                </motion.div>
            </div>
        )}

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
