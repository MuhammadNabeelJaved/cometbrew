/**
 * Cookies Settings Page
 * Allows users to manage their cookie preferences.
 */
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cookie, Check, Info, Save, RotateCcw } from 'lucide-react';
import { Button } from '../../components/ui/button';

// Simple Toggle Component
const Toggle = ({ checked, onCheckedChange, disabled }: { checked: boolean, onCheckedChange: (c: boolean) => void, disabled?: boolean }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => !disabled && onCheckedChange(!checked)}
    className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 ${
      checked ? 'bg-primary' : 'bg-input'
    }`}
  >
    <span
      className={`pointer-events-none block h-6 w-6 rounded-full bg-background shadow-lg ring-0 transition-transform ${
        checked ? 'translate-x-5' : 'translate-x-0'
      }`}
    />
  </button>
);

export default function CookiesSettings() {
  const [preferences, setPreferences] = useState({
    necessary: true, // Always true and disabled
    functional: false,
    analytics: false,
    marketing: false
  });
  
  const [saved, setSaved] = useState(false);

  // Load preferences from local storage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('cookie-preferences');
      if (stored) {
        setPreferences(JSON.parse(stored));
      } else {
        // Fallback to consent simple flag
        const simpleConsent = localStorage.getItem('cookie-consent');
        if (simpleConsent === 'accepted') {
          setPreferences({ necessary: true, functional: true, analytics: true, marketing: true });
        }
      }
    } catch (e) {
      console.error("Failed to load cookie preferences", e);
    }
  }, []);

  const handleToggle = (key: keyof typeof preferences) => {
    if (key === 'necessary') return; // Cannot toggle necessary
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem('cookie-preferences', JSON.stringify(preferences));
    // Also update the simple flag for the banner
    localStorage.setItem('cookie-consent', 'accepted'); 
    
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setPreferences({
        necessary: true,
        functional: false,
        analytics: false,
        marketing: false
    });
    setSaved(false);
  };

  const handleAcceptAll = () => {
    setPreferences({
        necessary: true,
        functional: true,
        analytics: true,
        marketing: true
    });
    setSaved(false);
  };

  const cookieCategories = [
    {
      id: 'necessary',
      title: 'Strictly Necessary Cookies',
      description: 'These cookies are essential for the proper functioning of the website. Without these cookies, the website would not work properly.',
      icon: Info,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10'
    },
    {
      id: 'functional',
      title: 'Functional Cookies',
      description: 'These cookies allow the website to remember choices you make (such as your user name, language or the region you are in) and provide enhanced, more personal features.',
      icon: RotateCcw,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10'
    },
    {
      id: 'analytics',
      title: 'Performance & Analytics',
      description: 'These cookies help us understand how visitors interact with the website by collecting and reporting information anonymously.',
      icon: Info,
      color: 'text-green-500',
      bg: 'bg-green-500/10'
    },
    {
      id: 'marketing',
      title: 'Marketing & Targeting',
      description: 'These cookies are used to track visitors across websites. The intention is to display ads that are relevant and engaging for the individual user.',
      icon: Cookie,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10'
    }
  ];

  return (
    <div className="min-h-screen bg-background pb-20 pt-10">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center justify-center p-3 mb-6 bg-primary/10 rounded-full">
            <Cookie className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Cookies Settings
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Manage your cookie preferences to control how we use your data.
          </p>
        </motion.div>

        <div className="grid gap-8">
            {/* Controls */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="flex flex-col sm:flex-row justify-end gap-4 mb-4"
            >
                <Button variant="outline" onClick={handleReset}>Reset to Default</Button>
                <Button variant="secondary" onClick={handleAcceptAll}>Accept All</Button>
            </motion.div>

            {/* Categories */}
            <div className="space-y-6">
                {cookieCategories.map((category, index) => (
                    <motion.div
                        key={category.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 + (index * 0.1) }}
                        className="bg-card/40 backdrop-blur-sm border border-border/50 rounded-2xl p-6 md:p-8 hover:border-primary/20 transition-all"
                    >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-start gap-4 flex-1">
                                <div className={`p-3 rounded-xl shrink-0 ${category.bg}`}>
                                    <category.icon className={`w-6 h-6 ${category.color}`} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                                        {category.title}
                                        {category.id === 'necessary' && (
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">Required</span>
                                        )}
                                    </h3>
                                    <p className="text-muted-foreground leading-relaxed">
                                        {category.description}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-4 pl-16 md:pl-0">
                                <div className="flex items-center gap-3">
                                    <span className={`text-sm font-medium ${preferences[category.id as keyof typeof preferences] ? 'text-primary' : 'text-muted-foreground'}`}>
                                        {preferences[category.id as keyof typeof preferences] ? 'Enabled' : 'Disabled'}
                                    </span>
                                    <Toggle 
                                        checked={preferences[category.id as keyof typeof preferences]} 
                                        onCheckedChange={() => handleToggle(category.id as keyof typeof preferences)}
                                        disabled={category.id === 'necessary'}
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Save Action */}
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="sticky bottom-6 flex justify-center mt-8 z-40"
            >
                <div className="bg-background/80 backdrop-blur-xl border border-border/50 p-2 rounded-full shadow-2xl flex items-center gap-4 pl-6 pr-2">
                    <span className="text-sm font-medium text-muted-foreground hidden sm:block">
                        Review your changes before saving
                    </span>
                    <Button 
                        size="lg" 
                        onClick={handleSave}
                        className={`rounded-full min-w-[140px] transition-all duration-300 ${saved ? 'bg-green-500 hover:bg-green-600' : ''}`}
                    >
                        {saved ? (
                            <>
                                <Check className="w-4 h-4 mr-2" />
                                Saved!
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Save Preferences
                            </>
                        )}
                    </Button>
                </div>
            </motion.div>
        </div>
      </div>
    </div>
  );
}
