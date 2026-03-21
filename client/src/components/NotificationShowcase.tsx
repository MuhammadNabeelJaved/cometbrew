/**
 * Notification Showcase Component
 * Demonstrates various notification types (success, error, loading, info)
 * Used as widgets in the Home page.
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertCircle, Loader2, X, Bell } from 'lucide-react';

type NotificationType = 'success' | 'error' | 'warning' | 'loading' | 'info';

interface NotificationProps {
  type: NotificationType;
  title: string;
  message: string;
  isVisible?: boolean;
  onClose?: () => void;
}

const NotificationWidget = ({ type, title, message, isVisible = true, onClose }: NotificationProps) => {
  const styles = {
    success: {
      bg: 'bg-green-500/10',
      border: 'border-green-500/20',
      icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
      titleColor: 'text-green-500'
    },
    error: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
      icon: <XCircle className="w-5 h-5 text-red-500" />,
      titleColor: 'text-red-500'
    },
    warning: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      icon: <AlertCircle className="w-5 h-5 text-amber-500" />,
      titleColor: 'text-amber-500'
    },
    loading: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      icon: <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />,
      titleColor: 'text-blue-500'
    },
    info: {
      bg: 'bg-primary/10',
      border: 'border-primary/20',
      icon: <Bell className="w-5 h-5 text-primary" />,
      titleColor: 'text-primary'
    }
  };

  const style = styles[type];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={`relative overflow-hidden rounded-xl border backdrop-blur-md p-4 shadow-lg ${style.bg} ${style.border} max-w-sm w-full`}
        >
          <div className="flex gap-4">
            <div className="mt-0.5 shrink-0">
              {style.icon}
            </div>
            <div className="flex-1">
              <h4 className={`text-sm font-semibold mb-1 ${style.titleColor}`}>
                {title}
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {message}
              </p>
            </div>
            {onClose && (
              <button 
                onClick={onClose}
                className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {/* Progress bar for loading state */}
          {type === 'loading' && (
            <div className="absolute bottom-0 left-0 h-1 bg-blue-500/20 w-full">
              <motion.div 
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 2, repeat: Infinity }}
                className="h-full bg-blue-500"
              />
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const NotificationShowcase = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-7xl mx-auto p-6">
      <NotificationWidget 
        type="success"
        title="Operation Successful"
        message="Your changes have been saved successfully to the database."
      />
      <NotificationWidget 
        type="error"
        title="Verification Failed"
        message="We couldn't verify your email address. The link may have expired."
      />
      <NotificationWidget 
        type="loading"
        title="Processing Request"
        message="Please wait while we process your transaction..."
      />
      <NotificationWidget 
        type="warning"
        title="Connection Unstable"
        message="Your internet connection appears to be unstable. Some features may be limited."
      />
    </div>
  );
};

export default NotificationShowcase;
