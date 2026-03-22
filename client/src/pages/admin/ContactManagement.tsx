/**
 * Contact Management Page
 * Comprehensive interface for managing contact form submissions and inquiries.
 * Features: List view, Details view, Edit, Delete, Bulk Actions, Statistics.
 */
import React, { useState, useEffect, useMemo } from 'react';
import {
  Mail,
  Search,
  Filter,
  Trash2,
  Edit,
  Eye,
  MoreVertical,
  CheckSquare,
  Square,
  ArrowUpDown,
  Calendar,
  User,
  MessageSquare,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '../../components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { toast } from 'sonner';
import { contactsApi } from '../../api/contacts.api';
import ConfirmDeleteDialog from '../../components/ui/ConfirmDeleteDialog';

export default function ContactManagement() {
  // State
  const [contacts, setContacts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [viewContact, setViewContact] = useState<any | null>(null);
  const [editContact, setEditContact] = useState<any | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchContacts = async (page = currentPage) => {
    setIsLoading(true);
    try {
      const response = await contactsApi.getAll({
        page,
        limit: itemsPerPage,
        search: searchTerm || undefined,
        sortBy: sortConfig.key,
        order: sortConfig.direction,
      });
      const result = response.data.data;
      // Backend may return { contacts, total, totalPages } or just an array
      if (Array.isArray(result)) {
        setContacts(result);
        setTotalCount(result.length);
        setTotalPages(Math.ceil(result.length / itemsPerPage));
      } else {
        setContacts(result.contacts || result.data || []);
        setTotalCount(result.total || 0);
        setTotalPages(result.totalPages || Math.ceil((result.total || 0) / itemsPerPage) || 1);
      }
    } catch (err: any) {
      toast.error('Failed to load contacts', { description: err?.response?.data?.message || 'Could not connect to the server.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts(1);
    setCurrentPage(1);
  }, [searchTerm, sortConfig]);

  useEffect(() => {
    fetchContacts(currentPage);
  }, [currentPage]);

  // Statistics derived from current page data (full stats would need /contacts/stats endpoint)
  const stats = useMemo(() => {
    const unread = contacts.filter(c => !c.isRead).length;
    const thisMonth = contacts.filter(c => {
      const date = new Date(c.createdAt);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length;
    return { total: totalCount, unread, thisMonth };
  }, [contacts, totalCount]);

  // Handlers
  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const toggleSelectAll = () => {
    if (selectedContacts.length === contacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(contacts.map(c => c._id));
    }
  };

  const toggleSelectContact = (id: string) => {
    setSelectedContacts(prev =>
      prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
    );
  };

  const handleDelete = async () => {
    try {
      if (contactToDelete === 'BULK') {
        await contactsApi.deleteBulk(selectedContacts);
        setSelectedContacts([]);
        toast.success('Contacts deleted', { description: `${selectedContacts.length} contacts removed.` });
      } else if (contactToDelete) {
        await contactsApi.delete(contactToDelete);
        toast.success('Contact deleted', { description: 'The contact has been removed.' });
      }
      setIsDeleteAlertOpen(false);
      setContactToDelete(null);
      if (viewContact) setViewContact(null);
      fetchContacts(currentPage);
    } catch (err: any) {
      toast.error('Delete failed', { description: err?.response?.data?.message || 'Could not delete the contact(s).' });
      setIsDeleteAlertOpen(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editContact) return;
    setIsSaving(true);
    try {
      await contactsApi.update(editContact._id, {
        firstName: editContact.firstName,
        lastName: editContact.lastName,
        email: editContact.email,
        subject: editContact.subject,
        message: editContact.message,
      });
      toast.success('Contact updated', { description: 'Changes have been saved.' });
      setEditContact(null);
      fetchContacts(currentPage);
    } catch (err: any) {
      toast.error('Update failed', { description: err?.response?.data?.message || 'Could not update the contact.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Contact Management</h2>
          <p className="text-muted-foreground">Manage inquiries and messages from your audience.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchContacts(currentPage)}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card hover:bg-accent/5 transition-colors">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Messages</p>
              <h3 className="text-3xl font-bold mt-2">{stats.total}</h3>
            </div>
            <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
              <Mail className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card hover:bg-accent/5 transition-colors">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Unread Inquiries</p>
              <h3 className="text-3xl font-bold mt-2">{stats.unread}</h3>
            </div>
            <div className="h-12 w-12 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500">
              <MessageSquare className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card hover:bg-accent/5 transition-colors">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">New This Month</p>
              <h3 className="text-3xl font-bold mt-2">{stats.thisMonth}</h3>
            </div>
            <div className="h-12 w-12 bg-green-500/10 rounded-full flex items-center justify-center text-green-500">
              <Calendar className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <CardTitle>Inquiries</CardTitle>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {selectedContacts.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setContactToDelete('BULK');
                    setIsDeleteAlertOpen(true);
                  }}
                  className="mr-auto sm:mr-0 animate-in fade-in zoom-in duration-200"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete ({selectedContacts.length})
                </Button>
              )}

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search contacts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>All Messages</DropdownMenuItem>
                  <DropdownMenuItem>Unread Only</DropdownMenuItem>
                  <DropdownMenuItem>Replied Only</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-md border border-border/50 overflow-hidden overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[50px] text-center">
                    <div
                      className="flex items-center justify-center cursor-pointer"
                      onClick={toggleSelectAll}
                    >
                      {selectedContacts.length > 0 && selectedContacts.length === contacts.length ? (
                        <CheckSquare className="h-4 w-4 text-primary" />
                      ) : (
                        <Square className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('firstName')}>
                    <div className="flex items-center gap-1">
                      Sender <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('subject')}>
                    <div className="flex items-center gap-1">
                      Subject <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead className="hidden md:table-cell cursor-pointer" onClick={() => handleSort('createdAt')}>
                    <div className="flex items-center gap-1">
                      Date <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead className="hidden sm:table-cell">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : contacts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      No contacts found matching your search.
                    </TableCell>
                  </TableRow>
                ) : (
                  contacts.map((contact) => (
                    <TableRow
                      key={contact._id}
                      className={`
                        group transition-colors hover:bg-muted/50
                        ${!contact.isRead ? 'bg-primary/5' : ''}
                      `}
                    >
                      <TableCell className="text-center">
                        <div
                          className="flex items-center justify-center cursor-pointer"
                          onClick={() => toggleSelectContact(contact._id)}
                        >
                          {selectedContacts.includes(contact._id) ? (
                            <CheckSquare className="h-4 w-4 text-primary" />
                          ) : (
                            <Square className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border border-border">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                              {contact.firstName?.[0]}{contact.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className={`text-sm ${!contact.isRead ? 'font-bold' : 'font-medium'}`}>
                              {contact.firstName} {contact.lastName}
                            </span>
                            <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                              {contact.email}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col max-w-[200px]">
                          <span className="text-sm font-medium truncate">{contact.subject}</span>
                          <span className="text-xs text-muted-foreground truncate">{contact.message}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {format(new Date(contact.createdAt), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant={contact.isRead ? "outline" : "default"} className="text-xs">
                          {contact.isRead ? 'Read' : 'New'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setViewContact(contact)}>
                              <Eye className="mr-2 h-4 w-4" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setEditContact(contact)}>
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => {
                                setContactToDelete(contact._id);
                                setIsDeleteAlertOpen(true);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between p-4 border-t border-border/50">
            <div className="text-sm text-muted-foreground hidden sm:block">
              Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
              <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalCount)}</span> of{' '}
              <span className="font-medium">{totalCount}</span> results
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-sm font-medium px-2">
                Page {currentPage} of {totalPages || 1}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Details Dialog */}
      <Dialog open={!!viewContact} onOpenChange={(open) => !open && setViewContact(null)}>
        <DialogContent className="sm:max-w-[600px]">
          {viewContact && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">Contact Details</DialogTitle>
                <DialogDescription>
                  Received on {format(new Date(viewContact.createdAt), 'PPP at p')}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-6 py-4">
                <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                  <Avatar className="h-12 w-12 border border-border">
                    <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                      {viewContact.firstName?.[0]}{viewContact.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold">{viewContact.firstName} {viewContact.lastName}</h3>
                    <div className="flex items-center gap-2 text-muted-foreground mt-1">
                      <Mail className="h-3 w-3" />
                      <span className="text-sm">{viewContact.email}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase font-bold">Subject</Label>
                    <div className="mt-1 font-medium">{viewContact.subject}</div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase font-bold">Message</Label>
                    <div className="mt-2 p-4 bg-muted/20 rounded-lg text-sm leading-relaxed whitespace-pre-wrap">
                      {viewContact.message}
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setViewContact(null)}>Close</Button>
                <Button onClick={() => window.location.href = `mailto:${viewContact.email}`}>
                  <Mail className="mr-2 h-4 w-4" /> Reply via Email
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setContactToDelete(viewContact._id);
                    setViewContact(null);
                    setIsDeleteAlertOpen(true);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Contact Dialog */}
      <Dialog open={!!editContact} onOpenChange={(open) => !open && setEditContact(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Contact Info</DialogTitle>
            <DialogDescription>
              Update contact details for this entry.
            </DialogDescription>
          </DialogHeader>

          {editContact && (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={editContact.firstName}
                    onChange={(e) => setEditContact({...editContact, firstName: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={editContact.lastName}
                    onChange={(e) => setEditContact({...editContact, lastName: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={editContact.email}
                  onChange={(e) => setEditContact({...editContact, email: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={editContact.subject}
                  onChange={(e) => setEditContact({...editContact, subject: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message Content</Label>
                <Textarea
                  id="message"
                  value={editContact.message}
                  onChange={(e) => setEditContact({...editContact, message: e.target.value})}
                  rows={4}
                  required
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setEditContact(null)}>Cancel</Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={isDeleteAlertOpen}
        onClose={() => setIsDeleteAlertOpen(false)}
        onConfirm={handleDelete}
        description={
          contactToDelete === 'BULK'
            ? `Are you sure you want to delete ${selectedContacts.length} selected contacts? This action cannot be undone.`
            : "Are you sure you want to delete this contact message? This action cannot be undone."
        }
      />
    </div>
  );
}
