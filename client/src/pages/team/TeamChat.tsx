/**
 * Team Chat Page
 * Real-time communication for team collaboration
 */
import React from 'react';
import { Send, Search, Phone, Video, MoreVertical, Hash, User } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { ScrollArea } from '../../components/ui/scroll-area';

export default function TeamChat() {
  const channels = ['general', 'design-team', 'development', 'announcements', 'random'];
  const directMessages = ['Sarah Miller', 'John Doe', 'Mike Ross', 'Emily Clark'];

  return (
    <div className="h-[calc(100vh-140px)] flex gap-4">
      {/* Sidebar List */}
      <Card className="w-64 flex flex-col overflow-hidden">
        <div className="p-4 border-b">
          <Input placeholder="Search messages..." prefix={<Search className="h-4 w-4 text-muted-foreground" />} />
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-6">
          <div>
            <h3 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Channels</h3>
            <div className="space-y-1">
              {channels.map(channel => (
                <button key={channel} className={`w-full text-left px-2 py-1.5 rounded-md text-sm flex items-center gap-2 ${channel === 'design-team' ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground hover:text-foreground'}`}>
                  <Hash className="h-4 w-4 opacity-70" />
                  {channel}
                </button>
              ))}
            </div>
          </div>
          <div>
            <h3 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Direct Messages</h3>
            <div className="space-y-1">
              {directMessages.map(user => (
                <button key={user} className="w-full text-left px-2 py-1.5 rounded-md text-sm flex items-center gap-2 hover:bg-muted text-muted-foreground hover:text-foreground">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  {user}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-card/50 backdrop-blur">
          <div className="flex items-center gap-2">
            <Hash className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-bold">design-team</h2>
            <span className="text-xs text-muted-foreground ml-2">Topic: Website Redesign Q3</span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon"><Phone className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon"><Video className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div className="flex gap-4">
             <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">SM</div>
             <div>
                <div className="flex items-baseline gap-2">
                    <span className="font-bold">Sarah Miller</span>
                    <span className="text-xs text-muted-foreground">10:30 AM</span>
                </div>
                <p className="text-sm mt-1">Hey team, has anyone reviewed the new wireframes?</p>
             </div>
          </div>
          <div className="flex gap-4">
             <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-500 font-bold">JD</div>
             <div>
                <div className="flex items-baseline gap-2">
                    <span className="font-bold">John Doe</span>
                    <span className="text-xs text-muted-foreground">10:32 AM</span>
                </div>
                <p className="text-sm mt-1">Yes, I just left some comments on Figma. Looking good overall!</p>
             </div>
          </div>
          <div className="flex gap-4">
             <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 font-bold">MC</div>
             <div>
                <div className="flex items-baseline gap-2">
                    <span className="font-bold">Mike Clark</span>
                    <span className="text-xs text-muted-foreground">10:35 AM</span>
                </div>
                <p className="text-sm mt-1">I'm working on the mobile responsiveness part. Will update soon.</p>
             </div>
          </div>
        </div>

        {/* Input */}
        <div className="p-4 border-t bg-card/50">
          <div className="flex gap-2">
            <Input placeholder="Message #design-team" className="flex-1" />
            <Button size="icon"><Send className="h-4 w-4" /></Button>
          </div>
        </div>
      </Card>
    </div>
  );
}