/**
 * User Support Page
 * Help center for client users — submit tickets, contact agency, read FAQs.
 */
import React, { useState } from 'react';
import {
  HelpCircle, MessageCircle, Mail, Plus, ChevronDown, ChevronUp,
  Loader2, CheckCircle2, Clock, XCircle, FileQuestion, Send,
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
    id: 'TCK-1042', subject: 'When will my project move to the next stage?',
    category: 'Project Status', status: 'In Progress', priority: 'Medium', lastUpdated: '3 hours ago',
  },
  {
    id: 'TCK-1039', subject: 'Invoice #221 — need a revised copy',
    category: 'Billing', status: 'Open', priority: 'High', lastUpdated: '1 day ago',
  },
  {
    id: 'TCK-1031', subject: 'Can I add more files to my project request?',
    category: 'Project', status: 'Resolved', priority: 'Low', lastUpdated: '5 days ago',
  },
];

const faqs = [
  {
    q: 'How do I check the status of my project?',
    a: 'Go to "My Projects" in the sidebar. Each project card shows the current status (Pending → In Review → Approved → In Progress → Completed). You will also receive email notifications on every status change.',
  },
  {
    q: 'Can I upload additional files after submitting a project request?',
    a: 'Currently, you can delete and re-submit a request if it is still in Pending or Rejected status. For active projects, please open a support ticket or contact us via Live Chat so the team can attach the files for you.',
  },
  {
    q: 'How is my invoice calculated?',
    a: 'Your invoice is based on the agreed Total Cost for the project. You can see the total cost, amount paid, and amount due inside each project\'s detail view under "My Projects".',
  },
  {
    q: 'How long does it usually take to get a response?',
    a: 'We aim to respond to all tickets within 24 business hours. For urgent issues, use Live Chat for a faster response.',
  },
  {
    q: 'How do I update my profile or change my password?',
    a: 'Go to "Profile & Settings" in the sidebar. You can update your name, avatar, and password from there.',
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

export default function UserSupport() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [ticketForm, setTicketForm] = useState({ subject: '', category: 'General', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmitTicket = async () => {
    if (!ticketForm.subject.trim() || !ticketForm.message.trim()) return;
    setIsSubmitting(true);
    // Simulate API call
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
          <h2 className="text-3xl font-bold tracking-tight">Support Center</h2>
          <p className="text-muted-foreground mt-1">
            Need help? We're here for you — browse FAQs or open a ticket.
          </p>
        </div>
        <Button className="gap-2" onClick={() => setIsNewTicketOpen(true)}>
          <Plus className="h-4 w-4" /> New Ticket
        </Button>
      </div>

      {/* Quick Contact Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-border/50 bg-gradient-to-br from-primary/5 to-blue-500/5 hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <MessageCircle className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">Live Chat</p>
              <p className="text-xs text-muted-foreground mt-0.5">Get instant answers from our team</p>
            </div>
            <Button size="sm" variant="outline">Start Chat</Button>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-gradient-to-br from-green-500/5 to-emerald-500/5 hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-green-500/10 flex items-center justify-center shrink-0">
              <Mail className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">Email Support</p>
              <p className="text-xs text-muted-foreground mt-0.5">Response within 24 business hours</p>
            </div>
            <Button size="sm" variant="outline">Send Email</Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Tickets Table */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              My Tickets
            </CardTitle>
            <CardDescription>Track the status of your support requests.</CardDescription>
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
              Frequently Asked
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
            <DialogTitle>Open a Support Ticket</DialogTitle>
            <DialogDescription>
              Describe your issue and our team will get back to you within 24 hours.
            </DialogDescription>
          </DialogHeader>

          {submitted ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
              <div className="h-14 w-14 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-7 w-7 text-green-500" />
              </div>
              <p className="font-semibold">Ticket Submitted!</p>
              <p className="text-sm text-muted-foreground">We'll respond within 24 business hours.</p>
            </div>
          ) : (
            <div className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <Label>Subject <span className="text-destructive">*</span></Label>
                <Input
                  value={ticketForm.subject}
                  onChange={e => setTicketForm(f => ({ ...f, subject: e.target.value }))}
                  placeholder="Brief description of your issue"
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
                  <option>Project Status</option>
                  <option>Billing</option>
                  <option>Technical</option>
                  <option>Account</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Message <span className="text-destructive">*</span></Label>
                <Textarea
                  value={ticketForm.message}
                  onChange={e => setTicketForm(f => ({ ...f, message: e.target.value }))}
                  placeholder="Describe your issue in detail..."
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
