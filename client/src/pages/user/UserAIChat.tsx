/**
 * User AI Chat Assistant
 * AI-powered chat interface for user assistance.
 */
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Send, Bot, User, Sparkles, RefreshCw, ThumbsUp, ThumbsDown, Copy, Paperclip, Image as ImageIcon, X, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

interface FileAttachment {
  name: string;
  type: 'image' | 'file';
  url?: string;
  size: string;
}

interface Message {
  id: number;
  sender: 'user' | 'ai';
  text: string;
  time: string;
  attachments?: FileAttachment[];
}

export default function UserAIChat() {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileAttachment | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: 1, 
      sender: 'ai', 
      text: 'Hello! I am your AI project assistant. How can I help you today? I can assist with project ideas, status updates, or analyze your documents.', 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    }
  ]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isImage = file.type.startsWith('image/');
      setSelectedFile({
        name: file.name,
        type: isImage ? 'image' : 'file',
        url: isImage ? URL.createObjectURL(file) : undefined,
        size: (file.size / 1024).toFixed(1) + ' KB'
      });
    }
  };

  const handleSend = () => {
    if (!message.trim() && !selectedFile) return;

    const newMsg: Message = {
      id: messages.length + 1,
      sender: 'user',
      text: message,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachments: selectedFile ? [selectedFile] : undefined
    };

    setMessages(prev => [...prev, newMsg]);
    setMessage('');
    setSelectedFile(null);
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const responses = [
        "That sounds like a great idea! Have you considered adding more specific requirements for the design phase?",
        "I can help you with that. Could you provide more details about your timeline?",
        "Based on your current projects, this seems feasible. Would you like to start a new project draft?",
        "I've analyzed the file you sent. It looks comprehensive. Shall we extract the key points?",
        "That's interesting! Tell me more about the target audience for this feature."
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      const aiMsg: Message = {
        id: messages.length + 2,
        sender: 'ai',
        text: randomResponse,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="h-[calc(100vh-140px)] flex gap-6">
      <Card className="flex-1 flex flex-col border-border/50 overflow-hidden shadow-lg bg-card/50 backdrop-blur-sm relative">
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

        {/* Chat Header */}
        <div className="relative z-10 p-4 border-b border-border/50 flex justify-between items-center bg-background/50 backdrop-blur-xl">
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20 ring-2 ring-indigo-500/20">
                  <Bot className="h-6 w-6" />
             </div>
             <div>
                <h3 className="font-bold text-sm flex items-center gap-2">
                  Project AI Assistant
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 text-[10px] font-bold border border-indigo-500/20">PRO</span>
                </h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span> Online & Ready
                </p>
             </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setMessages([])} className="text-muted-foreground hover:text-destructive">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 relative z-10" ref={scrollRef}>
          {messages.map((msg) => (
            <motion.div 
                key={msg.id} 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-3 max-w-[80%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 shadow-md ${
                  msg.sender === 'user' 
                    ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground' 
                    : 'bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-500 border border-indigo-500/20'
                }`}>
                  {msg.sender === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
                
                <div className="space-y-1">
                  <div className={`p-4 rounded-2xl shadow-sm backdrop-blur-md ${
                    msg.sender === 'user' 
                      ? 'bg-primary text-primary-foreground rounded-tr-none' 
                      : 'bg-card/80 border border-border/50 rounded-tl-none'
                  }`}>
                    {msg.text && <p className="text-sm leading-relaxed">{msg.text}</p>}
                    
                    {/* Attachments Display */}
                    {msg.attachments && (
                        <div className="mt-3 space-y-2">
                            {msg.attachments.map((file, i) => (
                                <div key={i} className={`flex items-center gap-3 p-2 rounded-lg ${msg.sender === 'user' ? 'bg-white/10' : 'bg-muted/50 border border-border/50'}`}>
                                    <div className="h-10 w-10 rounded bg-black/10 flex items-center justify-center overflow-hidden shrink-0">
                                        {file.type === 'image' && file.url ? (
                                            <img src={file.url} alt="file" className="h-full w-full object-cover" />
                                        ) : (
                                            <FileText className="h-5 w-5 opacity-70" />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-medium truncate max-w-[150px]">{file.name}</p>
                                        <p className="text-[10px] opacity-70">{file.size}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                  </div>
                  
                  <div className={`flex items-center gap-2 text-[10px] text-muted-foreground ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <span>{msg.time}</span>
                    {msg.sender === 'ai' && (
                      <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="hover:text-foreground"><ThumbsUp className="h-3 w-3" /></button>
                        <button className="hover:text-foreground"><ThumbsDown className="h-3 w-3" /></button>
                        <button className="hover:text-foreground"><Copy className="h-3 w-3" /></button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex gap-3 max-w-[80%]">
                <div className="h-8 w-8 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0 border border-indigo-500/20">
                  <Sparkles className="h-4 w-4 animate-pulse" />
                </div>
                <div className="bg-card/80 border border-border/50 rounded-2xl rounded-tl-none p-4 shadow-sm flex items-center gap-1 backdrop-blur-md">
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="relative z-10 p-4 border-t border-border/50 bg-background/50 backdrop-blur-xl">
          
          {/* File Upload Preview */}
          <AnimatePresence>
            {selectedFile && (
                <motion.div 
                    initial={{ opacity: 0, height: 0, mb: 0 }}
                    animate={{ opacity: 1, height: 'auto', mb: 12 }}
                    exit={{ opacity: 0, height: 0, mb: 0 }}
                    className="flex gap-2 mb-3"
                >
                    <div className="relative flex items-center gap-3 p-2 pr-8 rounded-lg bg-muted/80 border border-border/50 shadow-sm w-fit">
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

          <div className="flex items-end gap-2 bg-secondary/50 border border-transparent focus-within:bg-background focus-within:border-indigo-500/30 focus-within:ring-4 focus-within:ring-indigo-500/10 rounded-2xl p-2 transition-all duration-300">
             <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileSelect}
             />
             
             <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => fileInputRef.current?.click()}
                className="h-10 w-10 rounded-xl text-muted-foreground hover:text-indigo-500 hover:bg-indigo-500/10 mb-0.5"
             >
                <Paperclip className="h-5 w-5" />
             </Button>

            <textarea 
              placeholder="Ask me anything or upload a file..." 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1 bg-transparent border-none resize-none max-h-32 min-h-[44px] py-3 text-sm outline-none placeholder:text-muted-foreground"
              onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                  }
              }}
              rows={1}
            />
            
            <Button 
                onClick={handleSend} 
                size="icon" 
                disabled={(!message.trim() && !selectedFile) || isTyping}
                className={cn(
                    "h-11 w-11 rounded-xl shadow-lg transition-all duration-300 mb-0.5 shrink-0",
                    (message.trim() || selectedFile) 
                        ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/25" 
                        : "bg-muted text-muted-foreground shadow-none"
                )}
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="mt-3 flex justify-between items-center px-1">
             <p className="text-[10px] text-muted-foreground">
                AI can make mistakes. Consider checking important information.
             </p>
             <div className="text-[10px] text-muted-foreground">
                Markdown supported
             </div>
          </div>
        </div>
      </Card>
      
      {/* Helper Sidebar */}
      <div className="hidden xl:flex w-80 flex-col gap-4">
        <Card className="p-0 border-indigo-500/20 bg-indigo-500/5 overflow-hidden">
            <div className="p-4 border-b border-indigo-500/10 bg-indigo-500/10">
                <h4 className="font-semibold text-sm text-indigo-500 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" /> Suggested Prompts
                </h4>
            </div>
            <div className="p-3 space-y-2">
                {[
                    "What's the status of my e-commerce project?",
                    "Draft a new project description",
                    "How do I add a payment method?",
                    "Schedule a meeting with support",
                    "Analyze the attached requirements doc"
                ].map((prompt, i) => (
                    <button 
                        key={i}
                        onClick={() => setMessage(prompt)}
                        className="w-full text-left text-xs p-3 rounded-xl bg-background/50 hover:bg-indigo-500/10 hover:text-indigo-600 transition-all border border-border/50 hover:border-indigo-500/20 shadow-sm hover:shadow-md"
                    >
                        {prompt}
                    </button>
                ))}
            </div>
        </Card>

        <Card className="p-4 border-border/50 bg-card/50 backdrop-blur-sm flex-1">
            <h4 className="font-semibold text-sm mb-4 flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" /> Recent Files
            </h4>
            <div className="text-center py-8 text-muted-foreground text-xs">
                No files uploaded recently.
            </div>
        </Card>
      </div>
    </div>
  );
}