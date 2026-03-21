/**
 * Messages Admin Page
 * Split view with sidebar list and main chat area
 */
import React, { useState } from 'react';
import { 
  Search, 
  MoreVertical, 
  Phone, 
  Video, 
  Send, 
  Paperclip, 
  Smile, 
  Clock,
  Check,
  CheckCheck,
  Users
} from 'lucide-react';
import { Button } from '../../components/ui/button';

// Mock Data
const conversations = [
  {
    id: 1,
    user: 'Alice Smith',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
    lastMessage: 'Can we schedule a call for tomorrow?',
    time: '10:30 AM',
    unread: 2,
    online: true,
    messages: [
      { id: 1, sender: 'Alice Smith', text: 'Hi team, I have a question about the new design.', time: '10:00 AM' },
      { id: 2, sender: 'You', text: 'Sure Alice, what would you like to know?', time: '10:15 AM' },
      { id: 3, sender: 'Alice Smith', text: 'I was wondering if we could adjust the color scheme slightly?', time: '10:20 AM' },
      { id: 4, sender: 'Alice Smith', text: 'Can we schedule a call for tomorrow to discuss?', time: '10:30 AM' }
    ]
  },
  {
    id: 2,
    user: 'Robert Johnson',
    avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=150',
    lastMessage: 'The project files have been uploaded.',
    time: 'Yesterday',
    unread: 0,
    online: false,
    messages: [
      { id: 1, sender: 'Robert Johnson', text: 'Hey, just checking in on the progress.', time: 'Yesterday 2:00 PM' },
      { id: 2, sender: 'You', text: 'We are on track! Will share update soon.', time: 'Yesterday 2:30 PM' },
      { id: 3, sender: 'Robert Johnson', text: 'Great! The project files have been uploaded to the drive.', time: 'Yesterday 4:00 PM' }
    ]
  },
  {
    id: 3,
    user: 'Sarah Williams',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150',
    lastMessage: 'Thanks for the quick turnaround!',
    time: '2 days ago',
    unread: 0,
    online: true,
    messages: [
      { id: 1, sender: 'You', text: 'Here are the revisions you requested.', time: '2 days ago 10:00 AM' },
      { id: 2, sender: 'Sarah Williams', text: 'Perfect! Exactly what I was looking for.', time: '2 days ago 10:30 AM' },
      { id: 3, sender: 'Sarah Williams', text: 'Thanks for the quick turnaround!', time: '2 days ago 10:35 AM' }
    ]
  },
  {
    id: 4,
    user: 'Michael Chen',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
    lastMessage: 'Budget proposal approved.',
    time: '3 days ago',
    unread: 0,
    online: false,
    messages: []
  },
  {
    id: 5,
    user: 'Emma Wilson',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=150',
    lastMessage: 'When is the next milestone due?',
    time: '1 week ago',
    unread: 0,
    online: false,
    messages: []
  }
];

export default function Messages() {
  const [selectedChat, setSelectedChat] = useState<number | null>(1);
  const [inputMessage, setInputMessage] = useState('');

  const activeChat = conversations.find(c => c.id === selectedChat);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    
    // In a real app, this would send to backend
    // For now we just clear the input
    console.log("Sending:", inputMessage);
    setInputMessage('');
  };

  const handleAssignToTeam = () => {
    // Mock assignment
    alert(`Assigned conversation with ${activeChat?.user} to support team.`);
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] rounded-xl border bg-card overflow-hidden shadow-sm">
      {/* Sidebar - List */}
      <div className={`w-full md:w-80 border-r bg-muted/10 flex flex-col ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search messages..."
              className="w-full h-9 pl-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map((chat) => (
            <div
              key={chat.id}
              onClick={() => setSelectedChat(chat.id)}
              className={`p-4 border-b last:border-0 cursor-pointer hover:bg-muted/50 transition-colors ${selectedChat === chat.id ? 'bg-muted/50 border-l-4 border-l-primary' : 'border-l-4 border-l-transparent'}`}
            >
              <div className="flex items-start gap-3">
                <div className="relative">
                  <img 
                    src={chat.avatar} 
                    alt={chat.user} 
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  {chat.online && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-semibold text-sm truncate">{chat.user}</h3>
                    <span className="text-xs text-muted-foreground">{chat.time}</span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate pr-2">
                    {chat.lastMessage}
                  </p>
                </div>
                {chat.unread > 0 && (
                  <div className="flex flex-col items-end justify-center h-full">
                    <span className="w-5 h-5 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center">
                      {chat.unread}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col ${!selectedChat ? 'hidden md:flex' : 'flex'}`}>
        {activeChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b flex items-center justify-between bg-card">
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="md:hidden" 
                  onClick={() => setSelectedChat(null)}
                >
                  <ArrowRightIcon className="h-5 w-5 rotate-180" />
                </Button>
                <div className="relative">
                  <img 
                    src={activeChat.avatar} 
                    alt={activeChat.user} 
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  {activeChat.online && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></span>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold">{activeChat.user}</h3>
                  <p className="text-xs text-muted-foreground">{activeChat.online ? 'Online' : 'Offline'}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" className="hidden md:flex gap-2 text-primary" onClick={handleAssignToTeam}>
                  <Users className="h-4 w-4" /> Assign to Team
                </Button>
                <div className="h-4 w-px bg-border mx-1 hidden md:block"></div>
                <Button variant="ghost" size="icon">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Video className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/5">
              <div className="flex justify-center my-4">
                <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">Today</span>
              </div>
              
              {activeChat.messages.length > 0 ? (
                activeChat.messages.map((msg) => {
                  const isMe = msg.sender === 'You';
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                        isMe 
                          ? 'bg-primary text-primary-foreground rounded-tr-none' 
                          : 'bg-card text-card-foreground border rounded-tl-none'
                      }`}>
                        <p className="text-sm">{msg.text}</p>
                        <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                          <span>{msg.time}</span>
                          {isMe && <CheckCheck className="h-3 w-3" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mb-2 opacity-20" />
                  <p>No messages yet. Start the conversation!</p>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t bg-card">
              <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                <Button type="button" variant="ghost" size="icon" className="shrink-0 text-muted-foreground">
                  <Paperclip className="h-5 w-5" />
                </Button>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="w-full min-h-[44px] max-h-32 rounded-lg border border-input bg-background px-4 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring pr-10"
                  />
                  <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1 text-muted-foreground hover:bg-transparent">
                    <Smile className="h-5 w-5" />
                  </Button>
                </div>
                <Button type="submit" size="icon" className="shrink-0" disabled={!inputMessage.trim()}>
                  <Send className="h-5 w-5" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-muted/5">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="h-8 w-8 opacity-50" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
            <p>Choose a chat from the sidebar to start messaging.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Icon helper
function ArrowRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  )
}