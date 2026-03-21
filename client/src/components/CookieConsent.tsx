/**
 * Cookie Consent Component
 * Displays a glassmorphism notification to accept or decline cookies.
 * Uses localStorage to persist the user's choice.
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X, Settings2 } from 'lucide-react';
import { Button } from './ui/button';
import { Link } from 'react-router-dom';

const DEFAULT_PREFERENCES = {
  necessary: true,
  functional: false,
  analytics: false,
  marketing: false,
};

export type CookiePreferences = typeof DEFAULT_PREFERENCES;

/** Read stored preferences; returns null if user hasn't decided yet */
export function getCookiePreferences(): CookiePreferences | null {
  try {
    const raw = localStorage.getItem('cookie-preferences');
    if (raw) return JSON.parse(raw) as CookiePreferences;
    const simple = localStorage.getItem('cookie-consent');
    if (simple === 'accepted') return { necessary: true, functional: true, analytics: true, marketing: true };
    if (simple === 'declined') return DEFAULT_PREFERENCES;
    return null;
  } catch {
    return null;
  }
}

function savePreferences(prefs: CookiePreferences) {
  localStorage.setItem('cookie-preferences', JSON.stringify(prefs));
  localStorage.setItem('cookie-consent', 'accepted');
}

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasDecided = getCookiePreferences() !== null;
    if (!hasDecided) {
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    savePreferences({ necessary: true, functional: true, analytics: true, marketing: true });
    setIsVisible(false);
  };

  const handleDecline = () => {
    savePreferences(DEFAULT_PREFERENCES);
    localStorage.setItem('cookie-consent', 'declined');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed bottom-4 left-4 right-4 md:right-auto md:left-4 md:w-[400px] z-50"
        >
          <div className="bg-background/80 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Cookie className="w-6 h-6 text-primary" />
                </div>
                <button
                  onClick={handleDecline}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Decline cookies"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <h3 className="text-lg font-bold mb-2">We use cookies</h3>
              <p className="text-muted-foreground text-sm mb-5">
                We use cookies to enhance your browsing experience, serve personalized content, and analyze traffic. You can manage your preferences at any time.
              </p>

              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <Button
                    onClick={handleDecline}
                    variant="outline"
                    className="flex-1 bg-transparent border-white/10 hover:bg-white/5"
                    size="sm"
                  >
                    Decline
                  </Button>
                  <Button
                    onClick={handleAcceptAll}
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                    size="sm"
                  >
                    Accept All
                  </Button>
                </div>
                <Link
                  to="/cookies"
                  onClick={() => setIsVisible(false)}
                  className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors py-1"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  Manage Preferences
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
