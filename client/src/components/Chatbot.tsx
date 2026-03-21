/**
 * Chatbot Widget Component
 * "Neural Nexus" - A futuristic, creative AI chat widget
 * Features:
 * - Glassmorphism & Neon aesthetics
 * - File Upload System (Simulation)
 * - Expandable/Collapsible
 * - Animated interactions
 */
import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageCircle, X, Send, Bot, Loader2, 
  Paperclip, Image as ImageIcon, FileText, 
  Sparkles, Minimize2, Maximize2, Trash2, 
  Mic
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { cn } from '../lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachments?: FileAttachment[];
}

interface FileAttachment {
  name: string;
  type: 'image' | 'file';
  url?: string;
  size?: string;
}

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Greetings! I am Nova, your creative AI partner. Upload a file or ask me anything to get started.',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileAttachment | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen, isExpanded]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Simulate file upload
      const isImage = file.type.startsWith('image/');
      setSelectedFile({
        name: file.name,
        type: isImage ? 'image' : 'file',
        url: isImage ? URL.createObjectURL(file) : undefined,
        size: (file.size / 1024).toFixed(1) + ' KB'
      });
    }
  };

  const handleSend = async () => {
    if (!input.trim() && !selectedFile) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
      attachments: selectedFile ? [selectedFile] : undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setSelectedFile(null);
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const responses = [
        "I've analyzed the uploaded data. It looks promising! Here's a breakdown...",
        "That's a fascinating concept. Based on your input, I suggest exploring...",
        "I can help you iterate on this design. Have you considered...",
        "File received! Processing the contents now...",
        "I'm generating some creative variations for you. One moment..."
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: randomResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
      setIsLoading(false);
    }, 2000);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9, rotateX: 10 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1, 
              rotateX: 0,
              width: isExpanded ? '800px' : '384px',
              height: isExpanded ? '80vh' : '600px'
            }}
            exit={{ opacity: 0, y: 50, scale: 0.9, rotateX: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={cn(
              "fixed bottom-24 right-6 max-w-[calc(100vw-3rem)] max-h-[calc(100vh-8rem)]",
              "bg-background/80 backdrop-blur-xl border border-primary/20 rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden",
              "ring-1 ring-white/10 dark:ring-white/5",
              isExpanded && "right-1/2 translate-x-1/2 bottom-10" // Center when expanded
            )}
            style={{ transformOrigin: 'bottom right' }}
          >
            {/* Ambient Glow */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-purple-500 to-blue-500" />
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-purple-500/20 rounded-full blur-[100px] pointer-events-none" />

            {/* Header */}
            <div className="relative p-4 border-b border-border/50 flex justify-between items-center bg-muted/20 backdrop-blur-md z-10">
              <div className="flex items-center space-x-3">
                <div className="relative">
                    <div className="absolute inset-0 bg-primary/50 blur-lg rounded-full animate-pulse" />
                    <div className="relative p-2 bg-gradient-to-br from-primary to-purple-600 rounded-xl shadow-lg shadow-primary/25">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                    Nova AI
                  </h3>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                    Creative Assistant
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 hover:bg-white/10 rounded-full"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 hover:bg-red-500/10 hover:text-red-500 rounded-full"
                    onClick={() => setIsOpen(false)}
                >
                    <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-grow overflow-y-auto p-4 space-y-6 relative z-0" ref={scrollRef}>
              {messages.map((msg) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    
                    {/* Avatar */}
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 shadow-lg ${
                      msg.role === 'user' 
                        ? 'bg-gradient-to-br from-blue-500 to-cyan-500' 
                        : 'bg-gradient-to-br from-primary to-purple-600'
                    }`}>
                      {msg.role === 'user' ? <div className="text-white text-xs font-bold">U</div> : <Bot className="h-4 w-4 text-white" />}
                    </div>

                    <div className="space-y-2">
                        {/* Bubble */}
                        <div
                            className={cn(
                            "rounded-2xl px-5 py-3 text-sm shadow-sm backdrop-blur-sm border",
                            msg.role === 'user'
                                ? "bg-primary/90 text-primary-foreground rounded-tr-none border-primary/20"
                                : "bg-card/50 text-foreground rounded-tl-none border-border/50"
                            )}
                        >
                            <p className="leading-relaxed">{msg.content}</p>
                        </div>

                        {/* Attachments */}
                        {msg.attachments && msg.attachments.map((file, i) => (
                            <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-background/50 backdrop-blur-md max-w-[240px] ${msg.role === 'user' ? 'ml-auto' : ''}`}>
                                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                                    {file.type === 'image' && file.url ? (
                                        <img src={file.url} alt="preview" className="h-full w-full object-cover" />
                                    ) : (
                                        <FileText className="h-5 w-5 text-muted-foreground" />
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-medium truncate">{file.name}</p>
                                    <p className="text-[10px] text-muted-foreground">{file.size}</p>
                                </div>
                            </div>
                        ))}
                        
                        <div className={`text-[10px] text-muted-foreground opacity-50 px-1 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <div className="bg-card/50 border border-border/50 px-4 py-3 rounded-2xl rounded-tl-none flex items-center space-x-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">Nova is creating...</span>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-background/50 backdrop-blur-md border-t border-border/50 z-10">
              
              {/* File Preview */}
              <AnimatePresence>
                {selectedFile && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0, mb: 0 }}
                        animate={{ opacity: 1, height: 'auto', mb: 12 }}
                        exit={{ opacity: 0, height: 0, mb: 0 }}
                        className="relative"
                    >
                        <div className="flex items-center gap-3 p-2 pr-8 rounded-lg bg-muted/50 border border-border/50 w-fit">
                            <div className="h-10 w-10 rounded bg-background flex items-center justify-center overflow-hidden">
                                {selectedFile.type === 'image' && selectedFile.url ? (
                                    <img src={selectedFile.url} alt="preview" className="h-full w-full object-cover" />
                                ) : (
                                    <FileText className="h-5 w-5 text-muted-foreground" />
                                )}
                            </div>
                            <div className="text-xs">
                                <p className="font-medium max-w-[150px] truncate">{selectedFile.name}</p>
                                <p className="text-muted-foreground">{selectedFile.size}</p>
                            </div>
                            <button 
                                onClick={() => setSelectedFile(null)}
                                className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-md hover:bg-destructive/90"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    </motion.div>
                )}
              </AnimatePresence>

              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="relative flex items-center gap-2 bg-card border border-border/50 rounded-2xl p-2 shadow-inner focus-within:ring-2 focus-within:ring-primary/20 transition-all"
              >
                <input 
                    type="file" 
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileSelect}
                />
                
                <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="h-10 w-10 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="h-5 w-5" />
                </Button>

                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask Nova or upload a file..."
                  className="flex-grow border-none bg-transparent shadow-none focus-visible:ring-0 px-2 h-10"
                />

                <div className="flex items-center gap-1">
                    {!input && !selectedFile && (
                         <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground rounded-lg">
                            <Mic className="h-5 w-5" />
                         </Button>
                    )}
                    <Button 
                        type="submit" 
                        size="icon" 
                        disabled={(!input.trim() && !selectedFile) || isLoading}
                        className={cn(
                            "h-10 w-10 rounded-xl transition-all duration-300",
                            (input.trim() || selectedFile) 
                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/40" 
                                : "bg-muted text-muted-foreground"
                        )}
                    >
                        <Send className="h-5 w-5" />
                    </Button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Trigger Button */}
      <AnimatePresence>
        {!isOpen && (
            <motion.button
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 h-16 w-16 rounded-[2rem] bg-gradient-to-br from-primary to-purple-600 text-white shadow-2xl flex items-center justify-center z-50 group border-2 border-white/20"
            >
                <div className="absolute inset-0 rounded-[2rem] bg-white/20 blur-md group-hover:blur-lg transition-all opacity-0 group-hover:opacity-100" />
                <MessageCircle className="h-8 w-8 relative z-10" />
                
                {/* Notification Badge */}
                <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full border-2 border-background" />
                
                <div className="absolute right-full mr-4 bg-background/80 backdrop-blur border border-border px-4 py-2 rounded-xl shadow-xl text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 pointer-events-none">
                    Start creating with Nova
                    <div className="absolute top-1/2 -right-1.5 w-3 h-3 bg-background/80 border-t border-r border-border transform rotate-45 -translate-y-1/2" />
                </div>
            </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}