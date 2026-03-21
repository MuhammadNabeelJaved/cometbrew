/**
 * Team Clients Page
 * Manage assigned clients
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Search, Mail, Phone, ExternalLink, MoreVertical, Plus, Trash2, Edit } from 'lucide-react';

export default function TeamClients() {
  const navigate = useNavigate();
  const [clients, setClients] = React.useState([
    {
      id: 1,
      name: "FinTech Corp",
      industry: "Finance",
      contact: "john@fintech.com",
      phone: "+1 (555) 123-4567",
      status: "Active",
      projects: 2,
      logo: "FC"
    },
    {
      id: 2,
      name: "Shopify Store",
      industry: "E-commerce",
      contact: "sarah@store.com",
      phone: "+1 (555) 987-6543",
      status: "Active",
      projects: 1,
      logo: "SS"
    },
    {
      id: 3,
      name: "Cloud Systems",
      industry: "SaaS",
      contact: "tech@cloud.com",
      phone: "+1 (555) 456-7890",
      status: "Onboarding",
      projects: 1,
      logo: "CS"
    }
  ]);

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if(confirm('Delete this client?')) {
       setClients(clients.filter(c => c.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Clients</h2>
          <p className="text-muted-foreground">Access client details and contact information.</p>
        </div>
        <Button className="gap-2"><Plus className="h-4 w-4" /> Add New Client</Button>
      </div>

      <div className="flex items-center gap-4 bg-card p-4 rounded-xl border border-border/50">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search clients..." className="pl-10" />
        </div>
        <Button variant="outline">Filters</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {clients.map((client) => (
          <Card 
            key={client.id} 
            className="overflow-hidden cursor-pointer hover:border-primary/50 transition-all group"
            onClick={() => navigate(`/team/clients/${client.id}`)}
          >
            <div className="h-24 bg-gradient-to-r from-primary/10 to-primary/5 relative">
              <Badge className="absolute top-4 right-4" variant={client.status === 'Active' ? 'default' : 'secondary'}>
                {client.status}
              </Badge>
              <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="secondary" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive hover:text-white" onClick={(e) => handleDelete(e, client.id)}>
                   <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <CardContent className="pt-0 relative">
              <div className="h-16 w-16 rounded-xl bg-background border-2 border-border shadow-lg flex items-center justify-center -mt-8 mb-4 text-2xl font-bold text-primary">
                {client.logo}
              </div>
              
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg">{client.name}</h3>
                  <p className="text-sm text-muted-foreground">{client.industry}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); /* Menu logic */ }}>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="truncate">{client.contact}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span>{client.phone}</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border/50 flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{client.projects} Active Projects</span>
                <Button variant="outline" size="sm" className="gap-2">
                  View Details <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}