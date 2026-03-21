/**
 * Team Client Detail Page
 * Full page view for a specific client
 */
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  ArrowLeft, 
  MoreVertical,
  Briefcase,
  FileText,
  Clock
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';

export default function TeamClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Mock data
  const client = {
    id: 1,
    name: "FinTech Corp",
    industry: "Finance",
    status: "Active",
    email: "contact@fintechcorp.com",
    phone: "+1 (555) 123-4567",
    website: "www.fintechcorp.com",
    address: "123 Innovation Dr, San Francisco, CA",
    description: "Leading provider of digital banking solutions for millennials. They are focused on mobile-first experiences and AI-driven insights.",
    logo: "FC",
    activeProjects: [
      { id: 1, name: "Fintech Dashboard Redesign", status: "Active", due: "Mar 15" },
      { id: 2, name: "Mobile App Refresh", status: "Planning", due: "May 20" }
    ],
    notes: [
      { id: 1, text: "Weekly syncs are on Tuesdays at 10 AM PST", date: "2 days ago", author: "Sarah J." },
      { id: 2, text: "Key stakeholder: Michael (CTO)", date: "1 week ago", author: "David C." }
    ]
  };

  return (
    <div className="space-y-6">
       <Button variant="ghost" onClick={() => navigate('/team/clients')} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Back to Clients
      </Button>

      {/* Header */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="h-24 w-24 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl font-bold text-primary shrink-0">
          {client.logo}
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{client.name}</h1>
              <div className="flex items-center gap-3 mt-2">
                <Badge>{client.industry}</Badge>
                <Badge variant={client.status === 'Active' ? 'default' : 'secondary'}>{client.status}</Badge>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">Edit Client</Button>
              <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
            </div>
          </div>
          <p className="mt-4 text-muted-foreground max-w-2xl">{client.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Contact Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded bg-muted flex items-center justify-center text-muted-foreground">
                  <Mail className="h-4 w-4" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs text-muted-foreground font-medium uppercase">Email</p>
                  <p className="text-sm truncate" title={client.email}>{client.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded bg-muted flex items-center justify-center text-muted-foreground">
                  <Phone className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase">Phone</p>
                  <p className="text-sm">{client.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded bg-muted flex items-center justify-center text-muted-foreground">
                  <Globe className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase">Website</p>
                  <p className="text-sm text-primary cursor-pointer hover:underline">{client.website}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded bg-muted flex items-center justify-center text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase">Address</p>
                  <p className="text-sm">{client.address}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="projects">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="files">Documents</TabsTrigger>
            </TabsList>
            
            <TabsContent value="projects" className="mt-4 space-y-4">
              {client.activeProjects.map(project => (
                <Card key={project.id} className="hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => navigate(`/team/projects/${project.id}`)}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded bg-primary/20 flex items-center justify-center text-primary">
                        <Briefcase className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{project.name}</h3>
                        <p className="text-xs text-muted-foreground">Due: {project.due}</p>
                      </div>
                    </div>
                    <Badge variant={project.status === 'Active' ? 'default' : 'secondary'}>{project.status}</Badge>
                  </CardContent>
                </Card>
              ))}
              <Button className="w-full" variant="outline"><Briefcase className="h-4 w-4 mr-2" /> Assign New Project</Button>
            </TabsContent>

            <TabsContent value="notes" className="mt-4 space-y-4">
              {client.notes.map(note => (
                <Card key={note.id}>
                  <CardContent className="p-4">
                    <p className="text-sm mb-2">{note.text}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{note.author}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {note.date}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <div className="relative">
                <textarea className="w-full rounded-md border bg-background p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary min-h-[100px]" placeholder="Add a note..." />
                <Button size="sm" className="absolute bottom-2 right-2">Add Note</Button>
              </div>
            </TabsContent>

            <TabsContent value="files" className="mt-4">
               <div className="text-center py-10 text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
                  <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>No documents uploaded yet.</p>
                  <Button variant="link">Upload Document</Button>
               </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}