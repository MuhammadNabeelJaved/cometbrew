/**
 * Admin Client Management Page
 * Full CRUD: add, edit, delete, status quick-change, full detail view
 * Field names aligned with backend Client model
 */
import React, { useState, useEffect } from 'react';
import {
  Users, Search, Plus, Mail, Phone, ExternalLink, Briefcase,
  Trash2, Edit, Building, Loader2, Globe, DollarSign,
  Eye, CheckCircle2, AlertCircle, Clock, Ban, Calendar,
  User, FileText, TrendingUp, RefreshCw,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '../../components/ui/dialog';
import {
  Select, SelectItem,
} from '../../components/ui/select';
import { toast } from 'sonner';
import { clientsApi } from '../../api/clients.api';
import ConfirmDeleteDialog from '../../components/ui/ConfirmDeleteDialog';
import apiClient from '../../api/apiClient';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Client {
  _id: string;
  companyName: string;
  contactName?: string;
  email: string;
  phone?: string;
  industry?: string;
  status: 'Active' | 'Inactive' | 'Onboarding' | 'Churned';
  website?: string;
  notes?: string;
  logoUrl?: string;
  totalRevenue?: number;
  accountManager?: { _id: string; name: string; email: string; photo?: string };
  createdBy?: { _id: string; name: string; email: string };
  activeProjects?: number;
  createdAt?: string;
}

interface FormData {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  industry: string;
  status: string;
  website: string;
  notes: string;
  totalRevenue: string;
}

const emptyForm: FormData = {
  companyName: '', contactName: '', email: '', phone: '',
  industry: '', status: 'Active', website: '', notes: '', totalRevenue: '',
};

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { bg: string; icon: React.ElementType }> = {
  Active:     { bg: 'bg-green-500/10 text-green-600 border-green-500/20',  icon: CheckCircle2 },
  Onboarding: { bg: 'bg-blue-500/10 text-blue-600 border-blue-500/20',     icon: Clock        },
  Inactive:   { bg: 'bg-amber-500/10 text-amber-600 border-amber-500/20',  icon: AlertCircle  },
  Churned:    { bg: 'bg-red-500/10 text-red-600 border-red-500/20',        icon: Ban          },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.Inactive;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg}`}>
      <Icon className="h-3 w-3" />
      {status}
    </span>
  );
}

function formatRevenue(amount?: number) {
  if (!amount) return '$0';
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}k`;
  return `$${amount.toLocaleString()}`;
}

function getInitials(name: string) {
  return name.substring(0, 2).toUpperCase();
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ClientManagement() {
  const [clients, setClients] = useState<Client[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  // Form dialog
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);

  // Detail panel
  const [detailClient, setDetailClient] = useState<Client | null>(null);

  // Delete
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadClients = async () => {
    setIsLoading(true);
    try {
      const clientsRes = await clientsApi.getAll();
      const data = clientsRes.data.data;
      setClients(Array.isArray(data?.clients) ? data.clients : []);
    } catch (err: any) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message;
      if (status === 401 || status === 403) {
        toast.error('Access denied', { description: 'Please log in as admin and try again.' });
      } else if (!err?.response) {
        toast.error('Cannot connect to server', { description: 'Make sure the backend server is running on port 8000.' });
      } else {
        toast.error('Failed to load clients', { description: msg || `Server error (${status}).` });
      }
    } finally {
      setIsLoading(false);
    }

    // Stats — non-blocking
    try {
      const statsRes = await clientsApi.getStats();
      setStats(statsRes.data.data);
    } catch {
      // stats failure doesn't block the main list
    }
  };

  useEffect(() => { loadClients(); }, []);

  // ── filtered list ──
  const filteredClients = clients.filter(c => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      (c.companyName || '').toLowerCase().includes(q) ||
      (c.contactName || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.industry || '').toLowerCase().includes(q);
    const matchStatus = statusFilter === 'All' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // ── form open ──
  const handleOpenCreate = () => {
    setEditingClient(null);
    setFormData(emptyForm);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      companyName: client.companyName || '',
      contactName: client.contactName || '',
      email: client.email || '',
      phone: client.phone || '',
      industry: client.industry || '',
      status: client.status || 'Active',
      website: client.website || '',
      notes: client.notes || '',
      totalRevenue: client.totalRevenue?.toString() || '',
    });
    setIsFormOpen(true);
  };

  // ── save ──
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload: any = {
        companyName: formData.companyName,
        contactName: formData.contactName || undefined,
        email: formData.email,
        phone: formData.phone || undefined,
        industry: formData.industry || undefined,
        status: formData.status,
        website: formData.website || undefined,
        notes: formData.notes || undefined,
      };
      if (formData.totalRevenue) payload.totalRevenue = Number(formData.totalRevenue);

      if (editingClient) {
        await clientsApi.update(editingClient._id, payload);
        toast.success('Client updated', { description: 'Changes saved successfully.' });
      } else {
        await clientsApi.create(payload);
        toast.success('Client created', { description: 'New client added to directory.' });
      }
      setIsFormOpen(false);
      loadClients();
    } catch (err: any) {
      toast.error('Save failed', { description: err?.response?.data?.message || 'Could not save client.' });
    } finally {
      setIsSaving(false);
    }
  };

  // ── quick status change ──
  const handleStatusChange = async (client: Client, newStatus: string) => {
    try {
      await clientsApi.update(client._id, { status: newStatus });
      setClients(prev => prev.map(c => c._id === client._id ? { ...c, status: newStatus as any } : c));
      if (detailClient?._id === client._id) {
        setDetailClient({ ...detailClient, status: newStatus as any });
      }
      toast.success('Status updated', { description: `${client.companyName} → ${newStatus}` });
    } catch (err: any) {
      toast.error('Update failed', { description: err?.response?.data?.message });
    }
  };

  // ── seed demo data ──
  const [isSeeding, setIsSeeding] = useState(false);
  const handleSeedData = async () => {
    setIsSeeding(true);
    try {
      await apiClient.post('/devseed', { force: false });
      toast.success('Demo data seeded!', { description: '10 sample clients added to the database.' });
      loadClients();
    } catch (err: any) {
      toast.error('Seeding failed', { description: err?.response?.data?.message || 'Could not seed demo data.' });
    } finally {
      setIsSeeding(false);
    }
  };

  // ── delete ──
  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await clientsApi.delete(deleteId);
      toast.success('Client archived', { description: 'Client removed from active directory.' });
      setDeleteId(null);
      if (detailClient?._id === deleteId) setDetailClient(null);
      loadClients();
    } catch (err: any) {
      toast.error('Delete failed', { description: err?.response?.data?.message });
      setDeleteId(null);
    }
  };

  // ── stats ──
  const totalRevenue = stats?.totalRevenue ?? clients.reduce((a, c) => a + (c.totalRevenue || 0), 0);
  const totalClients = stats?.total ?? clients.length;
  const activeCount = clients.filter(c => c.status === 'Active').length;
  const onboardingCount = clients.filter(c => c.status === 'Onboarding').length;

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Client Management</h2>
          <p className="text-muted-foreground mt-1">Manage all client accounts, status, and relationships.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={loadClients} title="Refresh" disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button className="gap-2" onClick={handleOpenCreate}>
            <Plus className="h-4 w-4" /> Add New Client
          </Button>
        </div>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Clients',   value: isLoading ? '—' : totalClients,      color: 'text-foreground',    bg: 'bg-primary/10',     icon: Users        },
          { label: 'Active',          value: isLoading ? '—' : activeCount,        color: 'text-green-600',     bg: 'bg-green-500/10',   icon: CheckCircle2 },
          { label: 'Onboarding',      value: isLoading ? '—' : onboardingCount,    color: 'text-blue-600',      bg: 'bg-blue-500/10',    icon: Clock        },
          { label: 'Total Revenue',   value: isLoading ? '—' : formatRevenue(totalRevenue), color: 'text-amber-600', bg: 'bg-amber-500/10', icon: DollarSign },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <Card key={label} className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
                <div className={`h-8 w-8 rounded-lg ${bg} flex items-center justify-center`}>
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
              </div>
              <span className={`text-3xl font-bold ${color}`}>{value}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Table Card ── */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <CardTitle>Client Directory</CardTitle>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search name, email, industry..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter} className="w-36 shrink-0">
                  <SelectItem value="All">All Statuses</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Onboarding">Onboarding</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Churned">Churned</SelectItem>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead>Company</TableHead>
                    <TableHead className="hidden md:table-cell">Industry</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Projects</TableHead>
                    <TableHead className="hidden lg:table-cell">Revenue</TableHead>
                    <TableHead className="hidden xl:table-cell">Account Manager</TableHead>
                    <TableHead className="text-right w-28">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map(client => (
                    <TableRow key={client._id} className="border-border/50 hover:bg-muted/30 group">

                      {/* Company */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0 select-none">
                            {getInitials(client.companyName)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground leading-none mb-1 truncate max-w-[160px]">
                              {client.companyName}
                            </p>
                            <p className="text-xs text-muted-foreground truncate max-w-[160px]">{client.email}</p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Industry */}
                      <TableCell className="hidden md:table-cell">
                        <span className="text-sm text-muted-foreground">{client.industry || '—'}</span>
                      </TableCell>

                      {/* Status — click to change */}
                      <TableCell>
                        <Select value={client.status} onValueChange={val => handleStatusChange(client, val)} className="text-xs h-8">
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Onboarding">Onboarding</SelectItem>
                            <SelectItem value="Inactive">Inactive</SelectItem>
                            <SelectItem value="Churned">Churned</SelectItem>
                        </Select>
                      </TableCell>

                      {/* Active Projects */}
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center gap-1.5 text-sm">
                          <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{client.activeProjects ?? 0}</span>
                        </div>
                      </TableCell>

                      {/* Revenue */}
                      <TableCell className="hidden lg:table-cell">
                        <span className="text-sm font-medium text-green-600">
                          {formatRevenue(client.totalRevenue)}
                        </span>
                      </TableCell>

                      {/* Account Manager */}
                      <TableCell className="hidden xl:table-cell">
                        {client.accountManager ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={client.accountManager.photo} />
                              <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                {client.accountManager.name?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm truncate max-w-[100px]">{client.accountManager.name}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Unassigned</span>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-0.5">
                          <Button
                            variant="ghost" size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="View Details"
                            onClick={() => setDetailClient(client)}
                          >
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost" size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Edit Client"
                            onClick={() => handleOpenEdit(client)}
                          >
                            <Edit className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost" size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                            title="Delete Client"
                            onClick={() => setDeleteId(client._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}

                  {filteredClients.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="h-40 text-center">
                        {searchTerm || statusFilter !== 'All' ? (
                          <p className="text-muted-foreground">No clients match your filters.</p>
                        ) : (
                          <div className="flex flex-col items-center gap-3">
                            <Building className="h-8 w-8 text-muted-foreground/40" />
                            <p className="text-muted-foreground text-sm">No clients yet.</p>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={handleOpenCreate}>
                                <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Manually
                              </Button>
                              <Button size="sm" variant="secondary" onClick={handleSeedData} disabled={isSeeding}>
                                {isSeeding
                                  ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Seeding...</>
                                  : <><RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Load Demo Data</>
                                }
                              </Button>
                            </div>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ══════════════════════════════════════════════
          CREATE / EDIT DIALOG
      ══════════════════════════════════════════════ */}
      <Dialog open={isFormOpen} onOpenChange={open => !open && setIsFormOpen(false)}>
        <DialogContent className="sm:max-w-[580px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingClient ? 'Edit Client' : 'Add New Client'}</DialogTitle>
            <DialogDescription>
              {editingClient
                ? 'Update the client information below.'
                : 'Fill in the details to create a new client record.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              {/* Company Name */}
              <div className="space-y-1.5 col-span-2">
                <Label>Company Name <span className="text-destructive">*</span></Label>
                <Input
                  value={formData.companyName}
                  onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                  required
                  placeholder="e.g. FinTech Corp"
                />
              </div>

              {/* Contact Person */}
              <div className="space-y-1.5">
                <Label>Contact Person</Label>
                <Input
                  value={formData.contactName}
                  onChange={e => setFormData({ ...formData, contactName: e.target.value })}
                  placeholder="e.g. John Smith"
                />
              </div>

              {/* Industry */}
              <div className="space-y-1.5">
                <Label>Industry</Label>
                <Input
                  value={formData.industry}
                  onChange={e => setFormData({ ...formData, industry: e.target.value })}
                  placeholder="e.g. Finance"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5 col-span-2">
                <Label>Email <span className="text-destructive">*</span></Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  required
                  placeholder="contact@company.com"
                />
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={val => setFormData({ ...formData, status: val })}>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Onboarding">Onboarding</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Churned">Churned</SelectItem>
                </Select>
              </div>

              {/* Website */}
              <div className="space-y-1.5 col-span-2">
                <Label>Website</Label>
                <Input
                  value={formData.website}
                  onChange={e => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://company.com"
                />
              </div>

              {/* Total Revenue */}
              <div className="space-y-1.5 col-span-2">
                <Label>Total Revenue (USD)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    min="0"
                    value={formData.totalRevenue}
                    onChange={e => setFormData({ ...formData, totalRevenue: e.target.value })}
                    placeholder="0"
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5 col-span-2">
                <Label>Internal Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Internal notes about this client..."
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingClient ? 'Save Changes' : 'Create Client'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════
          CLIENT DETAIL PANEL
      ══════════════════════════════════════════════ */}
      <Dialog open={!!detailClient} onOpenChange={open => !open && setDetailClient(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          {detailClient && (
            <>
              {/* Header */}
              <DialogHeader>
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xl shrink-0 select-none">
                    {getInitials(detailClient.companyName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <DialogTitle className="text-xl leading-tight">{detailClient.companyName}</DialogTitle>
                    {detailClient.industry && (
                      <p className="text-sm text-muted-foreground mt-0.5">{detailClient.industry}</p>
                    )}
                    <div className="mt-2">
                      <StatusBadge status={detailClient.status} />
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4 pt-2">
                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-border/50 bg-muted/20 p-3 text-center">
                    <Briefcase className="h-4 w-4 text-muted-foreground mx-auto mb-1.5" />
                    <p className="text-[11px] text-muted-foreground mb-0.5">Active Projects</p>
                    <p className="text-lg font-bold">{detailClient.activeProjects ?? 0}</p>
                  </div>
                  <div className="rounded-xl border border-border/50 bg-muted/20 p-3 text-center">
                    <DollarSign className="h-4 w-4 text-amber-500 mx-auto mb-1.5" />
                    <p className="text-[11px] text-muted-foreground mb-0.5">Total Revenue</p>
                    <p className="text-lg font-bold text-amber-500">{formatRevenue(detailClient.totalRevenue)}</p>
                  </div>
                  <div className="rounded-xl border border-border/50 bg-muted/20 p-3 text-center">
                    <Calendar className="h-4 w-4 text-muted-foreground mx-auto mb-1.5" />
                    <p className="text-[11px] text-muted-foreground mb-0.5">Client Since</p>
                    <p className="text-sm font-semibold">
                      {detailClient.createdAt
                        ? new Date(detailClient.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                        : '—'}
                    </p>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="rounded-xl border border-border/50 bg-muted/20 p-4 space-y-3">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contact Information</h4>
                  {detailClient.contactName && (
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium">{detailClient.contactName}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                    <a href={`mailto:${detailClient.email}`} className="text-sm text-primary hover:underline">
                      {detailClient.email}
                    </a>
                  </div>
                  {detailClient.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm">{detailClient.phone}</span>
                    </div>
                  )}
                  {detailClient.website && (
                    <div className="flex items-center gap-3">
                      <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                      <a
                        href={detailClient.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-primary hover:underline flex items-center gap-1.5"
                      >
                        {detailClient.website.replace(/^https?:\/\//, '')}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>

                {/* Quick Status Change */}
                <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Change Status</h4>
                  <div className="flex flex-wrap gap-2">
                    {(['Active', 'Onboarding', 'Inactive', 'Churned'] as const).map(s => (
                      <button
                        key={s}
                        onClick={() => handleStatusChange(detailClient, s)}
                        className={`transition-all duration-200 ${
                          detailClient.status === s
                            ? 'ring-2 ring-primary ring-offset-1 rounded-full scale-105'
                            : 'opacity-60 hover:opacity-100'
                        }`}
                      >
                        <StatusBadge status={s} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Account Manager */}
                {detailClient.accountManager && (
                  <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Account Manager</h4>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={detailClient.accountManager.photo} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                          {detailClient.accountManager.name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold">{detailClient.accountManager.name}</p>
                        <p className="text-xs text-muted-foreground">{detailClient.accountManager.email}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {detailClient.notes && (
                  <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5" /> Internal Notes
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{detailClient.notes}</p>
                  </div>
                )}
              </div>

              {/* Footer actions */}
              <div className="flex justify-between pt-4 border-t border-border/50 mt-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => { setDeleteId(detailClient._id); setDetailClient(null); }}
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </Button>
                <Button
                  size="sm"
                  onClick={() => { setDetailClient(null); handleOpenEdit(detailClient); }}
                >
                  <Edit className="h-4 w-4 mr-2" /> Edit Client
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm ── */}
      <ConfirmDeleteDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        description="This will archive the client. They will no longer appear in the active directory."
      />
    </div>
  );
}
