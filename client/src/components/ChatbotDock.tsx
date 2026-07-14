/**
 * Chatbot hide/show dock — shared by the public Chatbot and DashboardChatbot.
 *
 * When the user hides the widget, the launcher is replaced by a slim tab
 * stuck to the right edge of the window; clicking the tab shows it again.
 * Preference persists in localStorage and applies across all surfaces.
 */
import { useState } from 'react';
import { MessageCircle, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

const KEY = 'chatbot_hidden';

export function useChatbotDock() {
  const [hidden, setHidden] = useState(() => localStorage.getItem(KEY) === '1');
  const hide = () => { localStorage.setItem(KEY, '1'); setHidden(true); };
  const show = () => { localStorage.removeItem(KEY); setHidden(false); };
  return { hidden, hide, show };
}

/** Slim tab clinging to the right edge of the window while the widget is hidden. */
export function ChatbotDockTab({ onClick, className }: { onClick: () => void; className?: string }) {
  return (
    <motion.button
      initial={{ x: 48, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 48, opacity: 0 }}
      onClick={onClick}
      title="Show chatbot"
      className={cn(
        'fixed right-0 bottom-24 z-50 group flex items-center gap-0.5 py-3 pl-1.5 pr-1',
        'rounded-l-2xl border border-r-0 border-border bg-background/80 backdrop-blur-xl shadow-lg',
        'text-muted-foreground hover:text-primary hover:pl-3 transition-all',
        className,
      )}
    >
      <ChevronLeft className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100" />
      <MessageCircle className="h-5 w-5" />
    </motion.button>
  );
}
