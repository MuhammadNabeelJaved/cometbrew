/**
 * Team Management Admin Page
 * - Fetches real team members from the database
 * - Full CRUD: Add, Edit, Remove team members
 * - Hiring pipeline (candidates — kept as local state for now)
 */
import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Mail,
  Phone,
  Briefcase,
  CheckCircle2,
  Clock,
  XCircle,
  Plus,
  Trash2,
  Edit,
  Github,
  Linkedin,
  Twitter,
  AlertCircle,
  Loader2,
  X,
  RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { usersApi } from '../../api/users.api';
import ConfirmDeleteDialog from '../../components/ui/ConfirmDeleteDialog';

// ── Types ──────────────────────────────────────────────────────────────────────

interface TeamMember {
  _id: string;
  name: string;
  email: string;
  photo: string;
  role: 'admin' | 'team' | 'user';
  isActive: boolean;
  createdAt: string;
  teamProfile: {
    position?: string;
    department?: string;
    bio?: string;
    phone?: string;
    skills?: string[];
    experience?: string;
    status?: 'Active' | 'On Leave' | 'Inactive' | 'Recently Joined';
    memberRole?: string;
    featured?: boolean;
    displayOrder?: number;
    joinedDate?: string;
    socialLinks?: {
      linkedin?: string;
      twitter?: string;
      github?: string;
      portfolio?: string;
    };
  };
}

interface MemberForm {
  name: string;
  email: string;
  password: string;
  role: 'team' | 'admin';
  position: string;
  department: string;
  bio: string;
  phone: string;
  skills: string;
  experience: string;
  status: string;
  memberRole: string;
  linkedin: string;
  twitter: string;
  github: string;
  featured: boolean;
  displayOrder: string;
}

const EMPTY_FORM: MemberForm = {
  name: '', email: '', password: '', role: 'team',
  position: '', department: 'Development', bio: '', phone: '',
  skills: '', experience: '', status: 'Active', memberRole: 'Member',
  linkedin: '', twitter: '', github: '',
  featured: false, displayOrder: '0',
};

const DEPARTMENTS = ['CEO', 'Design', 'Development', 'Marketing', 'Sales', 'Management', 'Other'];
const STATUSES = ['Active', 'On Leave', 'Inactive', 'Recently Joined'];
const MEMBER_ROLES = ['Member', 'Team Lead', 'Manager', 'Director', 'VP', 'C-Level', 'Intern', 'Other'];

// ── Mock Candidates (hiring pipeline — local state) ────────────────────────────

const INITIAL_CANDIDATES = [
  {
    id: 101, name: 'Alex Johnson', role: 'Senior UI Designer', experience: '5 years',
    email: 'alex.j@example.com', phone: '+1 (555) 123-4567', status: 'Interview' as const,
    appliedDate: '2 days ago',
    avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=100',
    skills: ['Figma', 'Prototyping', 'Design Systems'],
    coverLetter: "I've been following Nabeel Agency's work for years. My background in complex system design would be a great fit.",
  },
  {
    id: 102, name: 'Maria Garcia', role: 'Frontend Developer', experience: '3 years',
    email: 'maria.g@example.com', phone: '+1 (555) 987-6543', status: 'Applied' as const,
    appliedDate: '5 hours ago',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=100',
    skills: ['React', 'TypeScript', 'Tailwind'],
    coverLetter: "Passionate about creating accessible and performant web applications.",
  },
  {
    id: 103, name: 'Robert Fox', role: 'Project Manager', experience: '7 years',
    email: 'robert.f@example.com', status: 'Screening' as const,
    appliedDate: '1 day ago',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100',
    skills: ['Agile', 'Scrum', 'JIRA'],
    coverLetter: "Certified Scrum Master with 7 years of experience.",
  },
  {
    id: 104, name: 'Lisa Wong', role: 'UX Researcher', experience: '4 years',
    email: 'lisa.w@example.com', status: 'Offer' as const,
    appliedDate: '1 week ago',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=100',
    skills: ['User Testing', 'Data Analysis', 'Psychology'],
    coverLetter: "I specialize in turning user insights into actionable design improvements.",
  },
];

type CandidateStatus = 'Applied' | 'Screening' | 'Interview' | 'Offer' | 'Rejected';

// ── Component ──────────────────────────────────────────────────────────────────

export default function TeamManagement() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<TeamMember | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [form, setForm] = useState<MemberForm>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);

  // View modal
  const [viewMember, setViewMember] = useState<TeamMember | null>(null);

  // Candidates (local)
  const [candidates, setCandidates] = useState(INITIAL_CANDIDATES);
  const [selectedCandidate, setSelectedCandidate] = useState<(typeof INITIAL_CANDIDATES)[0] | null>(null);
  const [isCandidateModalOpen, setIsCandidateModalOpen] = useState(false);

  // ── Data Loading ──

  const loadMembers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await usersApi.getAll();
      const allUsers: TeamMember[] = res.data.data || [];
      // Show only team and admin members
      setMembers(allUsers.filter(u => u.role === 'team' || u.role === 'admin'));
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load team members');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  // ── Handlers ──

  const handleOpenAdd = () => {
    setEditingMember(null);
    setForm(EMPTY_FORM);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (member: TeamMember) => {
    setEditingMember(member);
    setForm({
      name: member.name,
      email: member.email,
      password: '',
      role: member.role === 'admin' ? 'admin' : 'team',
      position: member.teamProfile?.position || '',
      department: member.teamProfile?.department || 'Other',
      bio: member.teamProfile?.bio || '',
      phone: member.teamProfile?.phone || '',
      skills: (member.teamProfile?.skills || []).join(', '),
      experience: member.teamProfile?.experience || '',
      status: member.teamProfile?.status || 'Active',
      memberRole: member.teamProfile?.memberRole || 'Member',
      linkedin: member.teamProfile?.socialLinks?.linkedin || '',
      twitter: member.teamProfile?.socialLinks?.twitter || '',
      github: member.teamProfile?.socialLinks?.github || '',
      featured: member.teamProfile?.featured || false,
      displayOrder: String(member.teamProfile?.displayOrder ?? 0),
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const teamProfile = {
        position: form.position,
        department: form.department,
        bio: form.bio,
        phone: form.phone,
        skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
        experience: form.experience,
        status: form.status,
        memberRole: form.memberRole,
        featured: form.featured,
        displayOrder: parseInt(form.displayOrder) || 0,
        socialLinks: {
          linkedin: form.linkedin || undefined,
          twitter: form.twitter || undefined,
          github: form.github || undefined,
        },
      };

      if (editingMember) {
        await usersApi.update(editingMember._id, { name: form.name, teamProfile });
      } else {
        await usersApi.createTeamMember({
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
          teamProfile,
        });
      }

      setIsModalOpen(false);
      await loadMembers();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Save failed. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await usersApi.delete(deleteTarget._id);
      setMembers(prev => prev.filter(m => m._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Delete failed');
      setDeleteTarget(null);
    }
  };

  const handleCandidateStatus = (status: CandidateStatus) => {
    if (!selectedCandidate) return;
    setCandidates(prev => prev.map(c => c.id === selectedCandidate.id ? { ...c, status } : c));
    setSelectedCandidate(prev => prev ? { ...prev, status } : null);
  };

  // ── Filtering ──

  const filteredMembers = members.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.teamProfile?.position || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCandidates = candidates.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusVariant = (s?: string) => {
    if (s === 'Active') return 'success';
    if (s === 'On Leave') return 'warning';
    return 'secondary';
  };

  // ── Render ──

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Team Management</h2>
          <p className="text-muted-foreground">Manage your team members, assignments, and hiring pipeline.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={loadMembers} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button className="gap-2" onClick={handleOpenAdd}>
            <UserPlus className="h-4 w-4" /> Add Member
          </Button>
        </div>
      </div>

      <Tabs defaultValue="members" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="members" className="gap-2"><Users className="h-4 w-4" /> Team Members</TabsTrigger>
            <TabsTrigger value="hiring" className="gap-2"><Briefcase className="h-4 w-4" /> Hiring & Applications</TabsTrigger>
          </TabsList>

          <div className="relative w-64 hidden sm:block">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search people..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* ── Team Members Tab ── */}
        <TabsContent value="members" className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card><CardContent className="p-4 flex items-center justify-between">
              <div><p className="text-sm text-muted-foreground">Total Members</p><h3 className="text-2xl font-bold">{members.length}</h3></div>
              <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary"><Users className="h-5 w-5" /></div>
            </CardContent></Card>
            <Card><CardContent className="p-4 flex items-center justify-between">
              <div><p className="text-sm text-muted-foreground">Active</p><h3 className="text-2xl font-bold">{members.filter(m => m.teamProfile?.status === 'Active').length}</h3></div>
              <div className="h-10 w-10 bg-green-500/10 rounded-full flex items-center justify-center text-green-500"><CheckCircle2 className="h-5 w-5" /></div>
            </CardContent></Card>
            <Card><CardContent className="p-4 flex items-center justify-between">
              <div><p className="text-sm text-muted-foreground">On Leave</p><h3 className="text-2xl font-bold">{members.filter(m => m.teamProfile?.status === 'On Leave').length}</h3></div>
              <div className="h-10 w-10 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-500"><Clock className="h-5 w-5" /></div>
            </CardContent></Card>
            <Card><CardContent className="p-4 flex items-center justify-between">
              <div><p className="text-sm text-muted-foreground">Applications</p><h3 className="text-2xl font-bold">{candidates.filter(c => c.status === 'Applied').length}</h3></div>
              <div className="h-10 w-10 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500"><Briefcase className="h-5 w-5" /></div>
            </CardContent></Card>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
              <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
            </div>
          )}

          {/* Table */}
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              {isLoading ? (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Skills</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMembers.map(member => (
                      <TableRow key={member._id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={member.photo} />
                              <AvatarFallback>{member.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{member.name}</p>
                              <p className="text-xs text-muted-foreground">{member.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{member.teamProfile?.position || '—'}</TableCell>
                        <TableCell className="text-sm">{member.teamProfile?.department || '—'}</TableCell>
                        <TableCell>
                          <Badge variant={statusVariant(member.teamProfile?.status) as any}>
                            {member.teamProfile?.status || 'Active'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-[160px]">
                            {(member.teamProfile?.skills || []).slice(0, 3).map(skill => (
                              <span key={skill} className="text-[10px] px-1.5 py-0.5 bg-muted rounded border">{skill}</span>
                            ))}
                            {(member.teamProfile?.skills || []).length > 3 && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-muted rounded border">+{(member.teamProfile?.skills || []).length - 3}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={member.role === 'admin' ? 'default' : 'outline'} className="capitalize">
                            {member.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => setViewMember(member)} title="View Profile">
                              <Users className="h-4 w-4 text-muted-foreground" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(member)} title="Edit">
                              <Edit className="h-4 w-4 text-muted-foreground" />
                            </Button>
                            <Button
                              variant="ghost" size="icon"
                              onClick={() => setDeleteTarget(member)}
                              title="Remove"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredMembers.length === 0 && !isLoading && (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                          {searchTerm ? 'No members match your search.' : 'No team members found. Add your first member!'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Hiring Tab ── */}
        <TabsContent value="hiring" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {(['Applied', 'Screening', 'Interview', 'Offer', 'Rejected'] as CandidateStatus[]).map(status => (
              <div key={status} className="flex flex-col gap-3">
                <div className="flex items-center justify-between pb-2 border-b">
                  <h3 className="font-semibold text-sm">{status}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {candidates.filter(c => c.status === status).length}
                  </Badge>
                </div>
                <div className="flex flex-col gap-3 h-[600px] overflow-y-auto pr-1">
                  {filteredCandidates.filter(c => c.status === status).map(candidate => (
                    <Card
                      key={candidate.id}
                      className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-md"
                      onClick={() => { setSelectedCandidate(candidate); setIsCandidateModalOpen(true); }}
                    >
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={candidate.avatar} />
                            <AvatarFallback>{candidate.name[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm leading-none">{candidate.name}</p>
                            <p className="text-xs text-muted-foreground mt-1">{candidate.role}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {candidate.skills.slice(0, 2).map(skill => (
                            <span key={skill} className="text-[10px] px-1.5 py-0.5 bg-muted rounded border">{skill}</span>
                          ))}
                          {candidate.skills.length > 2 && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-muted rounded border">+{candidate.skills.length - 2}</span>
                          )}
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground border-t pt-2">
                          <Clock className="h-3 w-3 mr-1" /> {candidate.appliedDate}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {candidates.filter(c => c.status === status).length === 0 && (
                    <div className="h-24 border-2 border-dashed rounded-lg flex items-center justify-center text-xs text-muted-foreground bg-muted/30">
                      Empty
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Add/Edit Member Modal ── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card w-full max-w-2xl rounded-xl shadow-lg border my-4"
            >
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-bold">{editingMember ? 'Edit Team Member' : 'Add Team Member'}</h3>
                <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Full Name *</Label>
                    <Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. John Doe" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email *</Label>
                    <Input required type="email" value={form.email} disabled={!!editingMember} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="john@company.com" />
                  </div>
                </div>

                {!editingMember && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Password *</Label>
                      <Input required type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Min. 8 characters" minLength={8} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Account Role</Label>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={form.role}
                        onChange={e => setForm({ ...form, role: e.target.value as any })}
                      >
                        <option value="team">Team Member</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Position / Job Title *</Label>
                    <Input required value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} placeholder="e.g. Lead Developer" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Department</Label>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      value={form.department}
                      onChange={e => setForm({ ...form, department: e.target.value })}
                    >
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Status</Label>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      value={form.status}
                      onChange={e => setForm({ ...form, status: e.target.value })}
                    >
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Member Role</Label>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      value={form.memberRole}
                      onChange={e => setForm({ ...form, memberRole: e.target.value })}
                    >
                      {MEMBER_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Phone</Label>
                    <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+1 (555) 000-0000" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Experience</Label>
                    <Input value={form.experience} onChange={e => setForm({ ...form, experience: e.target.value })} placeholder="e.g. 5 years" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Bio</Label>
                  <Textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} placeholder="Brief bio about the team member..." rows={3} />
                </div>

                <div className="space-y-1.5">
                  <Label>Skills (comma-separated)</Label>
                  <Input value={form.skills} onChange={e => setForm({ ...form, skills: e.target.value })} placeholder="React, TypeScript, Node.js" />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1"><Linkedin className="h-3 w-3" /> LinkedIn</Label>
                    <Input value={form.linkedin} onChange={e => setForm({ ...form, linkedin: e.target.value })} placeholder="Profile URL" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1"><Github className="h-3 w-3" /> GitHub</Label>
                    <Input value={form.github} onChange={e => setForm({ ...form, github: e.target.value })} placeholder="Profile URL" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1"><Twitter className="h-3 w-3" /> Twitter</Label>
                    <Input value={form.twitter} onChange={e => setForm({ ...form, twitter: e.target.value })} placeholder="Profile URL" />
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={form.featured} onChange={e => setForm({ ...form, featured: e.target.checked })} className="rounded" />
                    Featured on website
                  </label>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Display Order</Label>
                    <Input type="number" value={form.displayOrder} onChange={e => setForm({ ...form, displayOrder: e.target.value })} className="w-20" min={0} />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSaving}>Cancel</Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : editingMember ? 'Save Changes' : 'Add Member'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── View Member Modal ── */}
      <AnimatePresence>
        {viewMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card w-full max-w-lg rounded-xl shadow-lg border overflow-hidden"
            >
              <div className="p-6 border-b flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={viewMember.photo} />
                    <AvatarFallback>{viewMember.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-xl font-bold">{viewMember.name}</h2>
                    <p className="text-muted-foreground">{viewMember.teamProfile?.position}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={statusVariant(viewMember.teamProfile?.status) as any}>
                        {viewMember.teamProfile?.status || 'Active'}
                      </Badge>
                      <Badge variant="outline" className="capitalize">{viewMember.role}</Badge>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setViewMember(null)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-muted-foreground">Email</span><p className="font-medium">{viewMember.email}</p></div>
                  <div><span className="text-muted-foreground">Phone</span><p className="font-medium">{viewMember.teamProfile?.phone || '—'}</p></div>
                  <div><span className="text-muted-foreground">Department</span><p className="font-medium">{viewMember.teamProfile?.department || '—'}</p></div>
                  <div><span className="text-muted-foreground">Experience</span><p className="font-medium">{viewMember.teamProfile?.experience || '—'}</p></div>
                </div>

                {viewMember.teamProfile?.bio && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-medium mb-1">Bio</p>
                    <p className="text-sm leading-relaxed">{viewMember.teamProfile.bio}</p>
                  </div>
                )}

                {(viewMember.teamProfile?.skills || []).length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-medium mb-2">Skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {viewMember.teamProfile!.skills!.map(skill => (
                        <Badge key={skill} variant="outline">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {viewMember.teamProfile?.socialLinks && (
                  <div className="flex gap-3">
                    {viewMember.teamProfile.socialLinks.linkedin && (
                      <a href={viewMember.teamProfile.socialLinks.linkedin} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="icon" className="h-8 w-8"><Linkedin className="h-4 w-4" /></Button>
                      </a>
                    )}
                    {viewMember.teamProfile.socialLinks.github && (
                      <a href={viewMember.teamProfile.socialLinks.github} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="icon" className="h-8 w-8"><Github className="h-4 w-4" /></Button>
                      </a>
                    )}
                    {viewMember.teamProfile.socialLinks.twitter && (
                      <a href={viewMember.teamProfile.socialLinks.twitter} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="icon" className="h-8 w-8"><Twitter className="h-4 w-4" /></Button>
                      </a>
                    )}
                  </div>
                )}
              </div>

              <div className="p-4 border-t flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setViewMember(null); handleOpenEdit(viewMember); }}>
                  <Edit className="h-4 w-4 mr-2" /> Edit Profile
                </Button>
                <Button onClick={() => setViewMember(null)}>Close</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Candidate Details Modal ── */}
      <AnimatePresence>
        {isCandidateModalOpen && selectedCandidate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card w-full max-w-2xl rounded-xl shadow-lg border flex flex-col max-h-[90vh] overflow-hidden"
            >
              <div className="p-6 border-b flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={selectedCandidate.avatar} />
                    <AvatarFallback>{selectedCandidate.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-xl font-bold">{selectedCandidate.name}</h2>
                    <p className="text-muted-foreground">{selectedCandidate.role} • {selectedCandidate.experience}</p>
                    <Badge variant="secondary" className="mt-1">{selectedCandidate.status}</Badge>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsCandidateModalOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-muted-foreground text-xs uppercase">Email</span><p className="font-medium">{selectedCandidate.email}</p></div>
                  {'phone' in selectedCandidate && selectedCandidate.phone && (
                    <div><span className="text-muted-foreground text-xs uppercase">Phone</span><p className="font-medium">{selectedCandidate.phone}</p></div>
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase mb-2">Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCandidate.skills.map(s => <Badge key={s} variant="outline">{s}</Badge>)}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase mb-2">Cover Letter</p>
                  <p className="text-sm italic bg-muted/50 rounded-lg p-4">"{selectedCandidate.coverLetter}"</p>
                </div>
              </div>

              <div className="p-4 border-t flex items-center justify-between">
                <Button
                  variant="ghost"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => { setCandidates(prev => prev.filter(c => c.id !== selectedCandidate.id)); setIsCandidateModalOpen(false); }}
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Delete Application
                </Button>
                <div className="flex gap-2">
                  <select
                    className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                    value={selectedCandidate.status}
                    onChange={e => handleCandidateStatus(e.target.value as CandidateStatus)}
                  >
                    {(['Applied', 'Screening', 'Interview', 'Offer', 'Rejected'] as CandidateStatus[]).map(s => (
                      <option key={s} value={s}>Move to: {s}</option>
                    ))}
                  </select>
                  <Button onClick={() => setIsCandidateModalOpen(false)}>Done</Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        description={deleteTarget ? `Remove ${deleteTarget.name} from the team? This cannot be undone.` : undefined}
      />
    </div>
  );
}
