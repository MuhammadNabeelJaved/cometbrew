/**
 * Support Admin Page
 * Ticket management and help center
 */
import React, { useState } from 'react';
import { HelpCircle, MessageCircle, Mail, Plus, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';

interface Ticket {
  id: string;
  subject: string;
  category: string;
  status: 'Open' | 'In Progress' | 'Closed';
  priority: 'Low' | 'Medium' | 'High';
  lastUpdated: string;
}

const initialTickets: Ticket[] = [
  { id: 'TCK-2091', subject: 'Integration issue with Shopify', category: 'Technical', status: 'Open', priority: 'High', lastUpdated: '2 hours ago' },
  { id: 'TCK-2088', subject: 'Billing question regarding invoice #402', category: 'Billing', status: 'In Progress', priority: 'Medium', lastUpdated: '1 day ago' },
  { id: 'TCK-2055', subject: 'Feature request: Dark mode export', category: 'Feedback', status: 'Closed', priority: 'Low', lastUpdated: '3 days ago' },
];

const faqs = [
  { q: "How do I add a new team member?", a: "Go to Settings > Team and click on 'Invite Member'. They will receive an email invitation." },
  { q: "Can I upgrade my plan at any time?", a: "Yes, you can upgrade or downgrade your plan from the Billing page. Changes take effect immediately." },
  { q: "Where can I find my API keys?", a: "API keys are located in Settings > Developer. Keep them secure and do not share them." },
];

export default function Support() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Support Center</h2>
          <p className="text-muted-foreground">Get help and manage your support tickets.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline"> Documentation</Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> New Ticket
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Recent Tickets</CardTitle>
            <CardDescription>Status of your ongoing support requests.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead className="text-right">Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialTickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell>
                      <div className="font-medium">{ticket.subject}</div>
                      <div className="text-xs text-muted-foreground">{ticket.id} • {ticket.category}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={ticket.status === 'Open' ? 'destructive' : ticket.status === 'In Progress' ? 'warning' : 'secondary'}>
                        {ticket.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs font-medium ${
                        ticket.priority === 'High' ? 'text-red-500' : 
                        ticket.priority === 'Medium' ? 'text-yellow-500' : 'text-green-500'
                      }`}>
                        {ticket.priority}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground text-xs">{ticket.lastUpdated}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Us</CardTitle>
              <CardDescription>Need immediate assistance?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full gap-2" variant="outline">
                <MessageCircle className="h-4 w-4" /> Live Chat
              </Button>
              <Button className="w-full gap-2" variant="outline">
                <Mail className="h-4 w-4" /> Email Support
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick FAQs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <button 
                    className="flex items-center justify-between w-full text-left font-medium text-sm"
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  >
                    {faq.q}
                    {openFaq === index ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                  {openFaq === index && (
                    <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                      {faq.a}
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
