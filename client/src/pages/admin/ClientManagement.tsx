/**
 * Admin Client Management Page
 * Comprehensive interface for managing all clients and their relationships
 */
import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  MoreVertical,
  Mail,
  Phone,
  ExternalLink,
  Briefcase,
  Trash2,
  Edit,
  Building,
  CheckCircle2,
  XCircle,
  Loader2,
  X,
  Save
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Notification } from '../../components/Notification';
import { clientsApi } from '../../api/clients.api';

export default function ClientManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; title: string; message?: string } | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any | null>(null);
  const [formData, setFormData] = useState<any>({
    name: '',
    industry: '',
    contact: '',
    email: '',
    phone: '',
    status: 'Active',
    assignedTo: '',
  });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const showNotification = (type: 'success' | 'error', title: string, message?: string) => {
    setNotification({ type, title, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadClients = async () => {
    setIsLoading(true);
    try {
      const response = await clientsApi.getAll();
      const data = response.data.data;
      setClients(Array.isArray(data) ? data : []);
    } catch (err: any) {
      showNotification('error', 'Failed to load clients', err?.response?.data?.message || 'Could not connect to the server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const filteredClients = clients.filter(c =>
    (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenCreate = () => {
    setEditingClient(null);
    setFormData({ name: '', industry: '', contact: '', email: '', phone: '', status: 'Active', assignedTo: '' });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (client: any) => {
    setEditingClient(client);
    setFormData({
      name: client.name || '',
      industry: client.industry || '',
      contact: client.contact || '',
      email: client.email || '',
      phone: client.phone || '',
      status: client.status || 'Active',
      assignedTo: client.assignedTo || '',
    });
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingClient) {
        const id = editingClient._id || editingClient.id;
        await clientsApi.update(id, formData);
        showNotification('success', 'Client updated', 'Changes have been saved.');
      } else {
        await clientsApi.create(formData);
        showNotification('success', 'Client created', 'New client has been added.');
      }
      setIsFormOpen(false);
      loadClients();
    } catch (err: any) {
      showNotification('error', 'Save failed', err?.response?.data?.message || 'Could not save the client.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await clientsApi.delete(deleteId);
      showNotification('success', 'Client deleted', 'The client has been removed.');
      setDeleteId(null);
      loadClients();
    } catch (err: any) {
      showNotification('error', 'Delete failed', err?.response?.data?.message || 'Could not delete the client.');
      setDeleteId(null);
    }
  };

  // Compute simple stats
  const totalProjects = clients.reduce((acc, c) => acc + (c.projects || 0), 0);

  return (
    <div className="space-y-6">
      {notification && (
        <Notification
          type={notification.type}
          title={notification.title}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Client Management</h2>
          <p className="text-muted-foreground">Oversee all client accounts, projects, and relationships.</p>
        </div>
        <Button className="gap-2" onClick={handleOpenCreate}>
          <Plus className="h-4 w-4" /> Add New Client
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex flex-col gap-1">
            <span className="text-muted-foreground text-xs uppercase font-bold">Total Clients</span>
            <span className="text-2xl font-bold">{clients.length}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col gap-1">
            <span className="text-muted-foreground text-xs uppercase font-bold">Active Projects</span>
            <span className="text-2xl font-bold text-primary">{totalProjects}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col gap-1">
            <span className="text-muted-foreground text-xs uppercase font-bold">Active Clients</span>
            <span className="text-2xl font-bold text-green-500">
              {clients.filter(c => c.status === 'Active').length}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col gap-1">
            <span className="text-muted-foreground text-xs uppercase font-bold">Onboarding</span>
            <span className="text-2xl font-bold text-blue-500">
              {clients.filter(c => c.status === 'Onboarding').length}
            </span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Client Directory</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client / Company</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Active Projects</TableHead>
                  <TableHead>Account Manager</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => {
                  const id = client._id || client.id;
                  return (
                    <TableRow key={id} className="hover:bg-muted/50 cursor-pointer">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {(client.name || '').substring(0, 2)}
                          </div>
                          <div>
                            <p className="font-medium">{client.name}</p>
                            <p className="text-xs text-muted-foreground">{client.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{client.industry}</TableCell>
                      <TableCell>
                        <Badge variant={client.status === 'Active' ? 'success' : client.status === 'Inactive' ? 'secondary' : 'warning'}>
                          {client.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-muted-foreground" />
                          <span>{client.projects || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {client.assignedTo && client.assignedTo !== 'Unassigned' ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback>{(client.assignedTo || '')[0]}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{client.assignedTo}</span>
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-xs">Unassigned</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" title="Edit" onClick={() => handleOpenEdit(client)}>
                            <Edit className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Delete"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setDeleteId(id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredClients.length === 0 && !isLoading && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No clients found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={(open) => !open && setIsFormOpen(false)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingClient ? 'Edit Client' : 'Add New Client'}</DialogTitle>
            <DialogDescription>
              {editingClient ? 'Update client information.' : 'Fill in the details for the new client.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>Company / Client Name</Label>
                <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required placeholder="e.g. FinTech Corp" />
              </div>
              <div className="space-y-2">
                <Label>Industry</Label>
                <Input value={formData.industry} onChange={e => setFormData({ ...formData, industry: e.target.value })} placeholder="e.g. Finance" />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={val => setFormData({ ...formData, status: val })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Onboarding">Onboarding</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Contact Person</Label>
                <Input value={formData.contact} onChange={e => setFormData({ ...formData, contact: e.target.value })} placeholder="e.g. John Smith" />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+1 (555) 000-0000" />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Email</Label>
                <Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required placeholder="client@company.com" />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Account Manager</Label>
                <Input value={formData.assignedTo} onChange={e => setFormData({ ...formData, assignedTo: e.target.value })} placeholder="e.g. Sarah Jenkins" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingClient ? 'Save Changes' : 'Create Client'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" /> Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this client? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete Permanently</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
