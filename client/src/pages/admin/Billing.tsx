/**
 * Billing Admin Page
 * Subscription and Invoice Management
 */
import React from 'react';
import { CreditCard, Download, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';

const invoices = [
  { id: 'INV-2024-001', date: 'Mar 01, 2024', amount: '$49.00', status: 'Paid', plan: 'Pro Plan' },
  { id: 'INV-2024-002', date: 'Feb 01, 2024', amount: '$49.00', status: 'Paid', plan: 'Pro Plan' },
  { id: 'INV-2024-003', date: 'Jan 01, 2024', amount: '$49.00', status: 'Paid', plan: 'Pro Plan' },
  { id: 'INV-2023-012', date: 'Dec 01, 2023', amount: '$29.00', status: 'Paid', plan: 'Starter Plan' },
];

export default function Billing() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Billing & Subscription</h2>
        <p className="text-muted-foreground">Manage your plan, payment methods, and invoices.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Current Plan */}
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>You are currently on the <span className="font-semibold text-primary">Pro Plan</span></CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-baseline space-x-2">
              <span className="text-4xl font-bold">$49</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary" /> Unlimited Projects</li>
              <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary" /> Priority Support</li>
              <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary" /> Advanced AI Tools</li>
              <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary" /> 20GB Storage</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full">Upgrade Plan</Button>
          </CardFooter>
        </Card>

        {/* Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Method</CardTitle>
            <CardDescription>Manage your payment details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <div className="h-10 w-16 bg-muted rounded flex items-center justify-center">
                <CreditCard className="h-6 w-6" />
              </div>
              <div>
                <p className="font-medium">Visa ending in 4242</p>
                <p className="text-sm text-muted-foreground">Expires 12/25</p>
              </div>
              <Badge variant="outline" className="ml-auto">Default</Badge>
            </div>
            <Button variant="outline" className="w-full">Add New Payment Method</Button>
          </CardContent>
        </Card>
      </div>

      {/* Invoices */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice History</CardTitle>
          <CardDescription>Download your past invoices.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.id}</TableCell>
                  <TableCell>{invoice.date}</TableCell>
                  <TableCell>{invoice.plan}</TableCell>
                  <TableCell>{invoice.amount}</TableCell>
                  <TableCell>
                    <Badge variant={invoice.status === 'Paid' ? 'success' : 'warning'}>
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="h-8 gap-2">
                      <Download className="h-4 w-4" /> Download
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
