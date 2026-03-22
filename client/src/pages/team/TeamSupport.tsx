/**
 * Team Support Page
 * Internal help center for team members — IT support, HR contacts, FAQs.
 */
import React, { useState } from 'react';
import {
  HelpCircle, MessageCircle, Mail, Plus, ChevronDown, ChevronUp,
  Loader2, CheckCircle2, Clock, Wrench, Users, Send, FileQuestion,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '../../components/ui/dialog';

interface Ticket {
  id: string;
  subject: string;
  category: string;
  status: 'Open' | 'In Progress' | 'Resolved';
  priority: 'Low' | 'Medium' | 'High';
  lastUpdated: string;
}

const sampleTickets: Ticket[] = [
  {
    id: 'INT-301', subject: 'Cannot access the shared design drive',
    category: 'IT / Access', status: 'In Progress', priority: 'High', lastUpdated: '1 hour ago',
  },
  {
    id: 'INT-298', subject: 'Clarification on task deadline — Project Alpha',
    category: 'Project', status: 'Open', priority: 'Medium', lastUpdated: '2 days ago',
  },
  {
    id: 'INT-290', subject: 'Request for additional software license',
    category: 'IT / Tools', status: 'Resolved', priority: 'Low', lastUpdated: '1 week ago',
  },
];

const faqs = [
  {
    q: 'How do I mark a task as completed?',
    a: 'Go to "My Tasks" in the sidebar. Drag the task to the "Completed" column on the Kanban board, or click the task and change its status from the detail panel.',
  },
  {
    q: 'How do I access shared project resources and files?',
    a: 'Visit the "Resources" section in the sidebar. All shared documents, design assets, and reference files are organised there by project or category.',
  },
  {
    q: 'Who do I contact if I find a bug or system issue?',
    a: 'Open an IT ticket here using the "New Ticket" button, selecting "IT / Technical" as the category. For critical issues, ping the admin on the internal Chat.',
  },
  {
    q: 'How are client project assignments handled?',
    a: 'Admin assigns client requests to team members via the admin panel. Once assigned, the project will appear under your "Projects" tab in the "Client Requests" section.',
  },
  {
    q: 'How do I view my performance reports?',
    a: 'Head to the "Reports" section in the sidebar. You can see task completion rates, project progress, and timeline metrics for your assigned work.',
  },
];

const statusIcon = (status: Ticket['status']) => {
  if (status === 'Open') return <Clock className="h-3.5 w-3.5 text-yellow-500" />;
  if (status === 'In Progress') return <Loader2 className="h-3.5 w-3.5 text-blue-500" />;
  return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />;
};

const statusVariant = (status: Ticket['status']) => {
  if (status === 'Open') return 'warning' as const;
  if (status === 'In Progress') return 'secondary' as const;
  return 'outline' as const;
};

export default function TeamSupport() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [ticketForm, setTicketForm] = useState({ subject: '', category: 'General', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmitTicket = async () => {
    if (!ticketForm.subject.trim() || !ticketForm.message.trim()) return;
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 1000));
    setIsSubmitting(false);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setIsNewTicketOpen(false);
      setTicketForm({ subject: '', category: 'General', message: '' });
    }, 2000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Help & Support</h2>
          <p className="text-muted-foreground mt-1">
            Internal help center for the Nabeel Agency team.
          </p>
        </div>
        <Button className="gap-2" onClick={() => setIsNewTicketOpen(true)}>
          <Plus className="h-4 w-4" /> New Ticket
        </Button>
      </div>

      {/* Quick Contact Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/50 bg-gradient-to-br from-primary/5 to-blue-500/5 hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-11 w-11 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <Wrench className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">IT Support</p>
              <p className="text-xs text-muted-foreground mt-0.5">Tech issues & access</p>
            </div>
            <Button size="sm" variant="outline">Contact</Button>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-gradient-to-br from-purple-500/5 to-pink-500/5 hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-11 w-11 rounded-2xl bg-purple-500/10 flex items-center justify-center shrink-0">
              <Users className="h-5 w-5 text-purple-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">HR / Admin</p>
              <p className="text-xs text-muted-foreground mt-0.5">Payroll, leave, policies</p>
            </div>
            <Button size="sm" variant="outline">Contact</Button>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-gradient-to-br from-green-500/5 to-emerald-500/5 hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-11 w-11 rounded-2xl bg-green-500/10 flex items-center justify-center shrink-0">
              <MessageCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">Team Chat</p>
              <p className="text-xs text-muted-foreground mt-0.5">Quick internal messages</p>
            </div>
            <Button size="sm" variant="outline">Open Chat</Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Tickets */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              My Internal Tickets
            </CardTitle>
            <CardDescription>Track your reported issues and requests.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {sampleTickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <FileQuestion className="h-10 w-10 mb-3 opacity-30" />
                <p className="font-medium">No tickets yet</p>
                <p className="text-xs mt-1">Open a ticket when you need help</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {sampleTickets.map(ticket => (
                  <div key={ticket.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 hover:bg-muted/20 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{ticket.subject}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{ticket.id} • {ticket.category} • {ticket.lastUpdated}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-xs font-medium ${
                        ticket.priority === 'High' ? 'text-red-500' :
                        ticket.priority === 'Medium' ? 'text-yellow-500' : 'text-green-500'
                      }`}>
                        {ticket.priority}
                      </span>
                      <Badge variant={statusVariant(ticket.status)} className="gap-1.5 text-xs">
                        {statusIcon(ticket.status)}
                        {ticket.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* FAQs */}
        <Card className="border-border/50 h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileQuestion className="h-5 w-5 text-primary" />
              Team FAQs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="rounded-xl border border-border/60 overflow-hidden transition-all"
              >
                <button
                  className="flex items-center justify-between w-full text-left font-medium text-sm p-4 hover:bg-muted/20 transition-colors gap-3"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  <span className="leading-snug">{faq.q}</span>
                  {openFaq === index
                    ? <ChevronUp className="h-4 w-4 shrink-0 text-primary" />
                    : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />}
                </button>
                {openFaq === index && (
                  <div className="px-4 pb-4 text-xs text-muted-foreground leading-relaxed border-t border-border/40 pt-3 bg-muted/10">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* New Ticket Dialog */}
      <Dialog open={isNewTicketOpen} onOpenChange={open => !open && setIsNewTicketOpen(false)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Open an Internal Ticket</DialogTitle>
            <DialogDescription>
              Report an issue or request to the admin or IT team.
            </DialogDescription>
          </DialogHeader>

          {submitted ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
              <div className="h-14 w-14 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-7 w-7 text-green-500" />
              </div>
              <p className="font-semibold">Ticket Submitted!</p>
              <p className="text-sm text-muted-foreground">The team will look into it shortly.</p>
            </div>
          ) : (
            <div className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <Label>Subject <span className="text-destructive">*</span></Label>
                <Input
                  value={ticketForm.subject}
                  onChange={e => setTicketForm(f => ({ ...f, subject: e.target.value }))}
                  placeholder="Brief description of the issue"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <select
                  value={ticketForm.category}
                  onChange={e => setTicketForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option>General</option>
                  <option>IT / Access</option>
                  <option>IT / Tools</option>
                  <option>IT / Technical</option>
                  <option>Project</option>
                  <option>HR / Admin</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Details <span className="text-destructive">*</span></Label>
                <Textarea
                  value={ticketForm.message}
                  onChange={e => setTicketForm(f => ({ ...f, message: e.target.value }))}
                  placeholder="Describe the issue in detail..."
                  rows={4}
                />
              </div>
            </div>
          )}

          {!submitted && (
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsNewTicketOpen(false)}>Cancel</Button>
              <Button
                onClick={handleSubmitTicket}
                disabled={isSubmitting || !ticketForm.subject.trim() || !ticketForm.message.trim()}
                className="gap-2"
              >
                {isSubmitting
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Send className="h-4 w-4" />}
                Submit Ticket
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
