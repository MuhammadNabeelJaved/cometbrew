/**
 * Team Management Admin Page
 * - Manage Team Members (Add, Edit, Remove, Assign Tasks)
 * - Hiring Process (Review Applications, Kanban Board)
 */
import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  MoreVertical, 
  Mail, 
  Phone, 
  Briefcase, 
  CheckCircle2, 
  Clock, 
  XCircle,
  FileText,
  Calendar,
  MessageSquare,
  Plus,
  Trash2,
  Edit,
  Eye,
  Github,
  Linkedin,
  Twitter,
  ChevronRight,
  AlertCircle,
  Lock,
  MoreHorizontal,
  Briefcase as ProjectIcon,
  CheckSquare,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';

// --- Types ---

interface TeamMember {
  id: number;
  name: string;
  role: string;
  department: string;
  email: string;
  status: 'Active' | 'On Leave' | 'Inactive';
  projects: number;
  avatar: string;
  joinedDate: string;
  assignments?: string[];
}

interface Candidate {
  id: number;
  name: string;
  role: string;
  experience: string;
  email: string;
  phone?: string;
  status: 'Applied' | 'Screening' | 'Interview' | 'Offer' | 'Rejected';
  appliedDate: string;
  avatar: string;
  skills: string[];
  coverLetter?: string;
  portfolio?: string;
}

// --- Mock Data ---

const INITIAL_TEAM: TeamMember[] = [
  {
    id: 1,
    name: 'Sarah Jenkins',
    role: 'Founder & CEO',
    department: 'Management',
    email: 'sarah@nabeel.agency',
    status: 'Active',
    projects: 12,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100',
    joinedDate: 'Jan 2020',
    assignments: ['Strategic Planning', 'Investor Relations']
  },
  {
    id: 2,
    name: 'David Chen',
    role: 'CTO',
    department: 'Engineering',
    email: 'david@nabeel.agency',
    status: 'Active',
    projects: 8,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100',
    joinedDate: 'Mar 2020',
    assignments: ['System Architecture']
  },
  {
    id: 3,
    name: 'Emily Rodriguez',
    role: 'Head of Design',
    department: 'Design',
    email: 'emily@nabeel.agency',
    status: 'Active',
    projects: 15,
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=100',
    joinedDate: 'Jun 2020',
    assignments: ['Brand Refresh']
  },
  {
    id: 4,
    name: 'Michael Chang',
    role: 'Lead Developer',
    department: 'Engineering',
    email: 'michael@nabeel.agency',
    status: 'On Leave',
    projects: 5,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100',
    joinedDate: 'Aug 2021',
    assignments: []
  }
];

const INITIAL_CANDIDATES: Candidate[] = [
  {
    id: 101,
    name: 'Alex Johnson',
    role: 'Senior UI Designer',
    experience: '5 years',
    email: 'alex.j@example.com',
    phone: '+1 (555) 123-4567',
    status: 'Interview',
    appliedDate: '2 days ago',
    avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=100',
    skills: ['Figma', 'Prototyping', 'Design Systems'],
    coverLetter: "I've been following Nabeel Agency's work for years and I'm impressed by the recent fintech dashboard project. I believe my background in complex system design would be a great fit.",
    portfolio: 'alexj.design'
  },
  {
    id: 102,
    name: 'Maria Garcia',
    role: 'Frontend Developer',
    experience: '3 years',
    email: 'maria.g@example.com',
    phone: '+1 (555) 987-6543',
    status: 'Applied',
    appliedDate: '5 hours ago',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=100',
    skills: ['React', 'TypeScript', 'Tailwind'],
    coverLetter: "Passionate about creating accessible and performant web applications. I love Tailwind CSS and React!",
    portfolio: 'github.com/mariag'
  },
  {
    id: 103,
    name: 'Robert Fox',
    role: 'Project Manager',
    experience: '7 years',
    email: 'robert.f@example.com',
    status: 'Screening',
    appliedDate: '1 day ago',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100',
    skills: ['Agile', 'Scrum', 'JIRA'],
    coverLetter: "Certified Scrum Master with 7 years of experience leading cross-functional teams in high-growth startups."
  },
  {
    id: 104,
    name: 'Lisa Wong',
    role: 'UX Researcher',
    experience: '4 years',
    email: 'lisa.w@example.com',
    status: 'Offer',
    appliedDate: '1 week ago',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=100',
    skills: ['User Testing', 'Data Analysis', 'Psychology'],
    coverLetter: "I specialize in turning user insights into actionable design improvements. Excited about the opportunity."
  }
];

export default function TeamManagement() {
  const [activeTab, setActiveTab] = useState('members');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(INITIAL_TEAM);
  const [candidates, setCandidates] = useState<Candidate[]>(INITIAL_CANDIDATES);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Member Modal State
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [memberFormData, setMemberFormData] = useState({ name: '', role: '', email: '', department: '', status: 'Active' as const });

  // Assign Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignTargetMember, setAssignTargetMember] = useState<TeamMember | null>(null);
  const [assignData, setAssignData] = useState({ type: 'Project', title: '', deadline: '' });

  // Candidate Modal State
  const [isCandidateModalOpen, setIsCandidateModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  // --- Member Handlers ---

  const handleOpenAddMember = () => {
    setEditingMember(null);
    setMemberFormData({ name: '', role: '', email: '', department: '', status: 'Active' });
    setIsMemberModalOpen(true);
  };

  const handleOpenEditMember = (member: TeamMember) => {
    setEditingMember(member);
    setMemberFormData({
      name: member.name,
      role: member.role,
      email: member.email,
      department: member.department,
      status: member.status
    });
    setIsMemberModalOpen(true);
  };

  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMember) {
      // Edit existing
      setTeamMembers(teamMembers.map(m => m.id === editingMember.id ? {
        ...m,
        ...memberFormData
      } : m));
    } else {
      // Add new
      const newMember: TeamMember = {
        id: Date.now(),
        name: memberFormData.name,
        role: memberFormData.role,
        email: memberFormData.email,
        department: memberFormData.department,
        status: memberFormData.status,
        projects: 0,
        joinedDate: 'Just now',
        avatar: `https://ui-avatars.com/api/?name=${memberFormData.name}&background=random`,
        assignments: []
      };
      setTeamMembers([...teamMembers, newMember]);
    }
    setIsMemberModalOpen(false);
  };

  const handleDeleteMember = (id: number) => {
    if (confirm('Are you sure you want to remove this team member? This action cannot be undone.')) {
      setTeamMembers(teamMembers.filter(m => m.id !== id));
    }
  };

  // --- Assign Handlers ---

  const handleOpenAssign = (member: TeamMember) => {
    setAssignTargetMember(member);
    setAssignData({ type: 'Project', title: '', deadline: '' });
    setIsAssignModalOpen(true);
  };

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTargetMember) return;

    setTeamMembers(teamMembers.map(m => {
      if (m.id === assignTargetMember.id) {
        return {
          ...m,
          projects: m.projects + (assignData.type === 'Project' ? 1 : 0),
          assignments: [...(m.assignments || []), `${assignData.type}: ${assignData.title}`]
        };
      }
      return m;
    }));

    setIsAssignModalOpen(false);
  };

  // --- Candidate Handlers ---

  const handleOpenCandidate = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setIsCandidateModalOpen(true);
  };

  const handleUpdateCandidateStatus = (status: Candidate['status']) => {
    if (!selectedCandidate) return;
    
    setCandidates(candidates.map(c => c.id === selectedCandidate.id ? { ...c, status } : c));
    setSelectedCandidate({ ...selectedCandidate, status });
  };

  const handleDeleteCandidate = (id: number) => {
    if (confirm('Delete this job application?')) {
      setCandidates(candidates.filter(c => c.id !== id));
      setIsCandidateModalOpen(false);
    }
  };

  // --- Filtering ---

  const filteredMembers = teamMembers.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCandidates = candidates.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Team Management</h2>
          <p className="text-muted-foreground">Manage your team members, assignments, and hiring pipeline.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Mail className="h-4 w-4" /> Invite Member
          </Button>
          <Button className="gap-2" onClick={handleOpenAddMember}>
            <UserPlus className="h-4 w-4" /> Add Member
          </Button>
        </div>
      </div>

      <Tabs defaultValue="members" onValueChange={setActiveTab} className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="members" className="gap-2"><Users className="h-4 w-4" /> Team Members</TabsTrigger>
            <TabsTrigger value="hiring" className="gap-2"><Briefcase className="h-4 w-4" /> Hiring & Applications</TabsTrigger>
          </TabsList>
          
          <div className="relative w-64 hidden sm:block">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search people..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* --- Team Members Tab --- */}
        <TabsContent value="members" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
             <Card>
               <CardContent className="p-4 flex items-center justify-between">
                 <div>
                   <p className="text-sm font-medium text-muted-foreground">Total Members</p>
                   <h3 className="text-2xl font-bold">{teamMembers.length}</h3>
                 </div>
                 <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                   <Users className="h-5 w-5" />
                 </div>
               </CardContent>
             </Card>
             <Card>
               <CardContent className="p-4 flex items-center justify-between">
                 <div>
                   <p className="text-sm font-medium text-muted-foreground">Active Now</p>
                   <h3 className="text-2xl font-bold">{teamMembers.filter(m => m.status === 'Active').length}</h3>
                 </div>
                 <div className="h-10 w-10 bg-green-500/10 rounded-full flex items-center justify-center text-green-500">
                   <CheckCircle2 className="h-5 w-5" />
                 </div>
               </CardContent>
             </Card>
             <Card>
               <CardContent className="p-4 flex items-center justify-between">
                 <div>
                   <p className="text-sm font-medium text-muted-foreground">On Leave</p>
                   <h3 className="text-2xl font-bold">{teamMembers.filter(m => m.status === 'On Leave').length}</h3>
                 </div>
                 <div className="h-10 w-10 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-500">
                   <Clock className="h-5 w-5" />
                 </div>
               </CardContent>
             </Card>
             <Card>
               <CardContent className="p-4 flex items-center justify-between">
                 <div>
                   <p className="text-sm font-medium text-muted-foreground">Open Roles</p>
                   <h3 className="text-2xl font-bold">{INITIAL_CANDIDATES.filter(c => c.status === 'Applied').length}</h3>
                 </div>
                 <div className="h-10 w-10 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500">
                   <Briefcase className="h-5 w-5" />
                 </div>
               </CardContent>
             </Card>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Projects / Tasks</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback>{member.name.substring(0, 2)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{member.name}</p>
                            <p className="text-xs text-muted-foreground">{member.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{member.role}</TableCell>
                      <TableCell>{member.department}</TableCell>
                      <TableCell>
                        <Badge variant={member.status === 'Active' ? 'success' : member.status === 'On Leave' ? 'warning' : 'secondary'}>
                          {member.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{member.projects} Active</span>
                          {member.assignments && member.assignments.length > 0 && (
                            <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                              Latest: {member.assignments[member.assignments.length - 1]}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{member.joinedDate}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenEditMember(member)} title="Edit Profile">
                            <Edit className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleOpenAssign(member)} title="Assign Task">
                            <ProjectIcon className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteMember(member.id)} title="Remove Member" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredMembers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                        No team members found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- Hiring Tab --- */}
        <TabsContent value="hiring" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {['Applied', 'Screening', 'Interview', 'Offer', 'Rejected'].map((status) => (
              <div key={status} className="flex flex-col gap-3 min-w-[200px]">
                <div className="flex items-center justify-between pb-2 border-b">
                  <h3 className="font-semibold text-sm">{status}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {candidates.filter(c => c.status === status).length}
                  </Badge>
                </div>
                
                <div className="flex flex-col gap-3 h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {filteredCandidates
                    .filter(c => c.status === status)
                    .map(candidate => (
                    <Card 
                      key={candidate.id} 
                      className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-md group"
                      onClick={() => handleOpenCandidate(candidate)}
                    >
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between">
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
                        </div>
                        
                        <div className="flex flex-wrap gap-1">
                          {candidate.skills.slice(0, 2).map(skill => (
                            <span key={skill} className="text-[10px] px-1.5 py-0.5 bg-muted rounded border">
                              {skill}
                            </span>
                          ))}
                          {candidate.skills.length > 2 && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-muted rounded border">
                              +{candidate.skills.length - 2}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {candidate.appliedDate}
                          </span>
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

      {/* --- Add/Edit Member Modal --- */}
      <AnimatePresence>
        {isMemberModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card w-full max-w-md rounded-xl shadow-lg border p-6 space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">{editingMember ? 'Edit Team Member' : 'Add Team Member'}</h3>
                <Button variant="ghost" size="icon" onClick={() => setIsMemberModalOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              <form onSubmit={handleSaveMember} className="space-y-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input 
                    required
                    value={memberFormData.name}
                    onChange={e => setMemberFormData({...memberFormData, name: e.target.value})}
                    placeholder="e.g. John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input 
                    required
                    type="email"
                    value={memberFormData.email}
                    onChange={e => setMemberFormData({...memberFormData, email: e.target.value})}
                    placeholder="john@company.com"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Input 
                      required
                      value={memberFormData.role}
                      onChange={e => setMemberFormData({...memberFormData, role: e.target.value})}
                      placeholder="e.g. Designer"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <select 
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      value={memberFormData.department}
                      onChange={e => setMemberFormData({...memberFormData, department: e.target.value})}
                    >
                      <option value="">Select...</option>
                      <option value="Engineering">Engineering</option>
                      <option value="Design">Design</option>
                      <option value="Product">Product</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Management">Management</option>
                    </select>
                  </div>
                </div>
                
                <div className="space-y-2">
                   <Label>Status</Label>
                   <select
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      value={memberFormData.status}
                      onChange={e => setMemberFormData({...memberFormData, status: e.target.value as any})}
                    >
                      <option value="Active">Active</option>
                      <option value="On Leave">On Leave</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                </div>

                <div className="pt-4 flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsMemberModalOpen(false)}>Cancel</Button>
                  <Button type="submit">{editingMember ? 'Save Changes' : 'Add Member'}</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- Assign Project/Task Modal --- */}
      <AnimatePresence>
        {isAssignModalOpen && assignTargetMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card w-full max-w-md rounded-xl shadow-lg border p-6 space-y-6"
            >
               <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">Assign Work</h3>
                <Button variant="ghost" size="icon" onClick={() => setIsAssignModalOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={assignTargetMember.avatar} />
                  <AvatarFallback>{assignTargetMember.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                   <p className="font-medium">{assignTargetMember.name}</p>
                   <p className="text-xs text-muted-foreground">{assignTargetMember.role}</p>
                </div>
              </div>

              <form onSubmit={handleAssignSubmit} className="space-y-4">
                 <div className="space-y-2">
                    <Label>Assignment Type</Label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input 
                          type="radio" 
                          name="type" 
                          checked={assignData.type === 'Project'} 
                          onChange={() => setAssignData({...assignData, type: 'Project'})}
                        />
                        Project
                      </label>
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input 
                          type="radio" 
                          name="type" 
                          checked={assignData.type === 'Task'} 
                          onChange={() => setAssignData({...assignData, type: 'Task'})}
                        />
                        Task
                      </label>
                    </div>
                 </div>

                 <div className="space-y-2">
                    <Label>{assignData.type} Title</Label>
                    <Input 
                       required
                       placeholder={`e.g. ${assignData.type === 'Project' ? 'Website Redesign' : 'Fix Homepage Bug'}`}
                       value={assignData.title}
                       onChange={e => setAssignData({...assignData, title: e.target.value})}
                    />
                 </div>

                 <div className="space-y-2">
                    <Label>Due Date</Label>
                    <Input 
                       type="date"
                       value={assignData.deadline}
                       onChange={e => setAssignData({...assignData, deadline: e.target.value})}
                    />
                 </div>

                 <div className="pt-4 flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsAssignModalOpen(false)}>Cancel</Button>
                  <Button type="submit">Assign {assignData.type}</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- Candidate Details Modal --- */}
      <AnimatePresence>
        {isCandidateModalOpen && selectedCandidate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
             <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card w-full max-w-2xl rounded-xl shadow-lg border p-0 flex flex-col max-h-[90vh] overflow-hidden"
            >
               <div className="p-6 border-b flex items-start justify-between">
                  <div className="flex items-center gap-4">
                     <Avatar className="h-16 w-16">
                        <AvatarImage src={selectedCandidate.avatar} />
                        <AvatarFallback>{selectedCandidate.name[0]}</AvatarFallback>
                     </Avatar>
                     <div>
                        <h2 className="text-xl font-bold">{selectedCandidate.name}</h2>
                        <p className="text-muted-foreground">{selectedCandidate.role} • {selectedCandidate.experience}</p>
                        <div className="flex items-center gap-2 mt-2">
                           <Badge variant={
                             selectedCandidate.status === 'Offer' ? 'success' : 
                             selectedCandidate.status === 'Rejected' ? 'destructive' : 'secondary'
                           }>
                             {selectedCandidate.status}
                           </Badge>
                           <span className="text-xs text-muted-foreground flex items-center gap-1">
                             <Clock className="h-3 w-3" /> Applied {selectedCandidate.appliedDate}
                           </span>
                        </div>
                     </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setIsCandidateModalOpen(false)}>
                    <X className="h-5 w-5" />
                  </Button>
               </div>

               <div className="p-6 overflow-y-auto space-y-6 flex-1">
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground uppercase">Email</Label>
                        <p className="text-sm font-medium">{selectedCandidate.email}</p>
                     </div>
                     <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground uppercase">Phone</Label>
                        <p className="text-sm font-medium">{selectedCandidate.phone || 'N/A'}</p>
                     </div>
                  </div>

                  <div className="space-y-2">
                     <Label className="text-xs text-muted-foreground uppercase">Skills</Label>
                     <div className="flex flex-wrap gap-2">
                        {selectedCandidate.skills.map(skill => (
                           <Badge key={skill} variant="outline">{skill}</Badge>
                        ))}
                     </div>
                  </div>

                  <div className="space-y-2">
                     <Label className="text-xs text-muted-foreground uppercase">Cover Letter / Note</Label>
                     <div className="p-4 bg-muted/50 rounded-lg text-sm leading-relaxed italic">
                        "{selectedCandidate.coverLetter || 'No cover letter provided.'}"
                     </div>
                  </div>
               </div>

               <div className="p-6 border-t bg-muted/30 flex items-center justify-between">
                  <Button variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteCandidate(selectedCandidate.id)}>
                     <Trash2 className="h-4 w-4 mr-2" /> Delete Application
                  </Button>
                  
                  <div className="flex gap-2">
                     <select 
                       className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                       value={selectedCandidate.status}
                       onChange={(e) => handleUpdateCandidateStatus(e.target.value as any)}
                     >
                        <option value="Applied">Move to: Applied</option>
                        <option value="Screening">Move to: Screening</option>
                        <option value="Interview">Move to: Interview</option>
                        <option value="Offer">Move to: Offer</option>
                        <option value="Rejected">Move to: Rejected</option>
                     </select>
                     <Button onClick={() => setIsCandidateModalOpen(false)}>Done</Button>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}