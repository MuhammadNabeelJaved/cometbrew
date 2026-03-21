/**
 * User Chat
 * Direct messaging interface with service providers.
 */
import React, { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Send, Paperclip, Phone, Video, MoreVertical, Image as ImageIcon } from 'lucide-react';
import { motion } from 'framer-motion';

export default function UserChat() {
  const [message, setMessage] = useState('');
  
  const messages = [
    { id: 1, sender: 'admin', text: 'Hello Alex! How can I help you today?', time: '10:00 AM' },
    { id: 2, sender: 'user', text: 'Hi! I wanted to check the status of the E-commerce project.', time: '10:05 AM' },
    { id: 3, sender: 'admin', text: 'Sure! We are currently wrapping up the design phase. I will send you the latest mockups shortly.', time: '10:07 AM' },
    { id: 4, sender: 'user', text: 'Great, thanks!', time: '10:08 AM' },
    { id: 5, sender: 'admin', text: 'Here are the design files.', attachment: 'mockup-v2.pdf', time: '10:10 AM' },
  ];

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col lg:flex-row gap-6">
      {/* Sidebar - Contacts */}
      <Card className="w-full lg:w-80 flex flex-col border-border/50 overflow-hidden">
        <div className="p-4 border-b border-border/50 bg-secondary/20">
          <h2 className="font-bold">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {['Admin Support', 'Project Manager', 'Design Team'].map((contact, i) => (
            <div 
              key={i} 
              className={`p-4 flex items-center gap-3 cursor-pointer hover:bg-muted/50 transition-colors border-b border-border/50 ${i === 0 ? 'bg-primary/5' : ''}`}
            >
              <div className="relative">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                  {contact.charAt(0)}
                </div>
                {i === 0 && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background"></span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-medium truncate text-sm">{contact}</h3>
                  <span className="text-xs text-muted-foreground">10:10 AM</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {i === 0 ? 'Here are the design files.' : 'No new messages'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col border-border/50 overflow-hidden shadow-lg">
        {/* Chat Header */}
        <div className="p-4 border-b border-border/50 flex justify-between items-center bg-secondary/20 backdrop-blur-sm">
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                  A
             </div>
             <div>
                <h3 className="font-bold text-sm">Admin Support</h3>
                <p className="text-xs text-green-500 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span> Online
                </p>
             </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                <Phone className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                <Video className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground">
                <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/20">
          {messages.map((msg) => (
            <motion.div 
                key={msg.id} 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] rounded-2xl p-3 shadow-sm ${
                msg.sender === 'user' 
                  ? 'bg-primary text-primary-foreground rounded-br-none' 
                  : 'bg-card border border-border/50 rounded-bl-none'
              }`}>
                {msg.text && <p className="text-sm leading-relaxed">{msg.text}</p>}
                {msg.attachment && (
                    <div className="mt-2 p-2 rounded bg-background/20 flex items-center gap-2 text-xs">
                        <Paperclip className="h-3 w-3" />
                        <span>{msg.attachment}</span>
                    </div>
                )}
                <p className={`text-[10px] mt-1 text-right ${msg.sender === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    {msg.time}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-border/50 bg-background">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-primary">
                <Paperclip className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-primary">
                <ImageIcon className="h-5 w-5" />
            </Button>
            <input 
              type="text" 
              placeholder="Type your message..." 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1 bg-secondary/50 border-transparent focus:bg-background border focus:border-primary/50 rounded-full px-4 py-2.5 text-sm outline-none transition-all"
              onKeyDown={(e) => e.key === 'Enter' && setMessage('')}
            />
            <Button 
                onClick={() => setMessage('')} 
                size="icon" 
                className="rounded-full shadow-lg shadow-primary/25 shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}