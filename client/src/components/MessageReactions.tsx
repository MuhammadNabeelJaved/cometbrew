/**
 * MessageReactions
 * Emoji reaction bar + picker used in all 3 chat surfaces.
 *
 * Usage:
 *   <MessageReactions
 *     reactions={msg.reactions}
 *     myUserId={user._id}
 *     onReact={(emoji) => socket.emit('chat:react_message', { messageId, emoji })}
 *   />
 */
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { MessageReaction } from '../api/chat.api';

const EMOJI_LIST = ['👍', '❤️', '😂', '😮', '😢', '🎉', '🔥', '👏'];

interface MessageReactionsProps {
    reactions?: MessageReaction[];
    myUserId: string;
    onReact: (emoji: string) => void;
    isMine?: boolean; // affects picker position
}

export function MessageReactions({ reactions = [], myUserId, onReact, isMine = false }: MessageReactionsProps) {
    const [pickerOpen, setPickerOpen] = useState(false);
    const pickerRef = useRef<HTMLDivElement>(null);

    // Close picker on outside click
    useEffect(() => {
        if (!pickerOpen) return;
        const handler = (e: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
                setPickerOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [pickerOpen]);

    const hasAny = reactions.length > 0;

    return (
        <div className="relative inline-flex items-center gap-1 flex-wrap mt-0.5">
            {/* Existing reaction bubbles */}
            {reactions.map((r) => {
                const reacted = r.users.includes(myUserId);
                const count = r.users.length;
                return (
                    <motion.button
                        key={r.emoji}
                        onClick={() => onReact(r.emoji)}
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.9 }}
                        title={`${count} reaction${count !== 1 ? 's' : ''}${reacted ? ' (click to remove)' : ''}`}
                        className={cn(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-all select-none',
                            reacted
                                ? 'bg-primary/15 border-primary/40 text-primary font-semibold'
                                : 'bg-muted/60 border-border/40 hover:bg-muted text-foreground'
                        )}
                    >
                        <span>{r.emoji}</span>
                        <span className="tabular-nums">{count}</span>
                    </motion.button>
                );
            })}

            {/* Add reaction button — always visible on hover via parent group */}
            <div className="relative" ref={pickerRef}>
                <button
                    onClick={() => setPickerOpen((o) => !o)}
                    className={cn(
                        'opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center justify-center w-6 h-6 rounded-full text-sm',
                        'bg-muted/70 hover:bg-muted border border-border/40 text-muted-foreground hover:text-foreground',
                        hasAny && 'opacity-100' // always show when there are reactions
                    )}
                    title="Add reaction"
                >
                    <span className="text-[11px]">+</span>
                </button>

                <AnimatePresence>
                    {pickerOpen && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.85, y: 6 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.85, y: 6 }}
                            transition={{ duration: 0.15 }}
                            className={cn(
                                'absolute z-50 flex gap-1 p-2 rounded-2xl shadow-xl border border-border/50',
                                'bg-popover backdrop-blur-xl',
                                isMine ? 'right-0 bottom-8' : 'left-0 bottom-8'
                            )}
                        >
                            {EMOJI_LIST.map((emoji) => (
                                <motion.button
                                    key={emoji}
                                    whileHover={{ scale: 1.3 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => { onReact(emoji); setPickerOpen(false); }}
                                    className="text-xl leading-none p-1 rounded-lg hover:bg-accent transition-colors"
                                >
                                    {emoji}
                                </motion.button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
