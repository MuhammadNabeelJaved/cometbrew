/**
 * Reusable Notification / Alert Component
 * Variants: success | error | warning | loading | info
 * Usage:
 *   <Notification type="error" title="Login Failed" message="Invalid credentials." />
 *   <Notification type="success" title="Saved" message="Changes saved." onClose={() => setVisible(false)} />
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertCircle, Loader2, X, Bell } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'warning' | 'loading' | 'info';

export interface NotificationProps {
  type: NotificationType;
  title: string;
  message?: string;
  isVisible?: boolean;
  onClose?: () => void;
  className?: string;
}

const CONFIG = {
  success: {
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
    icon: <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />,
    titleColor: 'text-green-600 dark:text-green-400',
  },
  error: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    icon: <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />,
    titleColor: 'text-red-600 dark:text-red-400',
  },
  warning: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    icon: <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />,
    titleColor: 'text-amber-600 dark:text-amber-400',
  },
  loading: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    icon: <Loader2 className="w-5 h-5 text-blue-500 animate-spin shrink-0 mt-0.5" />,
    titleColor: 'text-blue-600 dark:text-blue-400',
  },
  info: {
    bg: 'bg-primary/10',
    border: 'border-primary/20',
    icon: <Bell className="w-5 h-5 text-primary shrink-0 mt-0.5" />,
    titleColor: 'text-primary',
  },
};

export function Notification({
  type,
  title,
  message,
  isVisible = true,
  onClose,
  className = '',
}: NotificationProps) {
  const c = CONFIG[type];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.2 }}
          className={`relative overflow-hidden rounded-xl border p-4 ${c.bg} ${c.border} ${className}`}
        >
          <div className="flex gap-3">
            {c.icon}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${c.titleColor}`}>{title}</p>
              {message && (
                <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{message}</p>
              )}
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Animated progress bar for loading */}
          {type === 'loading' && (
            <div className="absolute bottom-0 left-0 h-0.5 w-full bg-blue-500/20">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 2, repeat: Infinity }}
                className="h-full bg-blue-500"
              />
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default Notification;
