/**
 * Services Admin Page
 * Management interface for services
 */
import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Code,
  Smartphone,
  Globe,
  Palette,
  Megaphone,
  Layout,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { ServiceEditor, ServiceData } from './ServiceEditor';
import { toast } from 'sonner';
import { servicesApi } from '../../api/services.api';
import ConfirmDeleteDialog from '../../components/ui/ConfirmDeleteDialog';

const iconOptions = [
  { value: 'web-development', label: 'Web Dev', icon: Code },
  { value: 'mobile-app', label: 'Mobile', icon: Smartphone },
  { value: 'ecommerce', label: 'Ecommerce', icon: Globe },
  { value: 'design', label: 'Design', icon: Palette },
  { value: 'consulting', label: 'Marketing', icon: Megaphone },
  { value: 'other', label: 'UI/UX', icon: Layout },
];

export default function ServicesAdmin() {
  const [view, setView] = useState<'list' | 'edit'>('list');
  const [services, setServices] = useState<ServiceData[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<ServiceData | null>(null);
  const [editingService, setEditingService] = useState<ServiceData | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    setIsLoading(true);
    try {
      const response = await servicesApi.getAll();
      const data = response.data.data;
      // Map backend _id to id for ServiceData compatibility
      const mapped = (Array.isArray(data) ? data : []).map((s: any) => ({
        ...s,
        id: s._id || s.id,
      }));
      setServices(mapped);
    } catch (err: any) {
      toast.error('Failed to load services', { description: err?.response?.data?.message || 'Could not connect to the server.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNew = () => {
    setEditingService(undefined);
    setView('edit');
  };

  const handleEdit = (service: ServiceData) => {
    const s = service as any;
    const mapped: ServiceData = {
      id: s._id || service.id,
      title: s.title || '',
      slug: s.slug || '',
      shortDescription: s.description || s.shortDescription || '',
      icon: s.category || s.icon || 'web-development',
      hero: {
        title: s.heroSection?.title || s.hero?.title || '',
        subtitle: s.subtitle || s.hero?.subtitle || '',
      },
      stats: s.stats || { successRate: '99%', projects: '250+', team: 'Top 1%', support: '24/7' },
      features: {
        title: 'Transforming ideas into digital reality',
        description: '',
        list: [],
        cards: Array.isArray(s.features)
          ? s.features.map((f: any) => ({ title: f.title || '', description: f.description || '', icon: f.icon || 'Code' }))
          : Array.isArray(s.features?.cards) ? s.features.cards : [],
      },
      pricing: Array.isArray(s.pricingPlans)
        ? s.pricingPlans.map((p: any) => ({
            name: p.name || '',
            price: p.price?.amount != null ? `$${p.price.amount}` : (p.price || ''),
            period: p.price?.period || p.period || 'project',
            description: p.description || '',
            features: Array.isArray(p.features) ? p.features : [],
            popular: p.isPopular ?? p.popular ?? false,
          }))
        : [],
      faqs: Array.isArray(s.faqs)
        ? s.faqs.map((f: any) => ({ question: f.question || '', answer: f.answer || '' }))
        : [],
    };
    setEditingService(mapped);
    setView('edit');
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const id = (deleteTarget as any)._id || String(deleteTarget.id);
    try {
      await servicesApi.delete(id);
      setServices(prev => prev.filter(s => ((s as any)._id || String(s.id)) !== id));
      toast.success('Service deleted', { description: 'The service has been removed.' });
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error('Delete failed', { description: err?.response?.data?.message || 'Could not delete the service.' });
      setDeleteTarget(null);
    }
  };

  const handleSave = async (savedService: ServiceData) => {
    if (!savedService.title?.trim()) {
      toast.error('Validation Error', { description: 'Service Name is required.' });
      return;
    }
    if (!savedService.slug?.trim()) {
      toast.error('Validation Error', { description: 'Slug (URL) is required.' });
      return;
    }
    if (!savedService.shortDescription?.trim()) {
      toast.error('Validation Error', { description: 'Short Description is required.' });
      return;
    }

    setIsSaving(true);
    // Map frontend ServiceData fields to backend model fields
    const payload = {
      title: savedService.title,
      slug: savedService.slug,
      description: savedService.shortDescription,
      subtitle: savedService.hero?.subtitle,
      category: savedService.icon,
      faqs: savedService.faqs?.map((f, i) => ({
        question: f.question,
        answer: f.answer,
        order: i,
      })),
      features: savedService.features?.cards?.map(card => ({
        icon: card.icon,
        title: card.title,
        description: card.description,
      })),
      pricingPlans: savedService.pricing?.map(plan => ({
        name: plan.name,
        price: {
          amount: parseFloat(plan.price.replace(/[^0-9.]/g, '')) || 0,
          currency: 'USD',
          period: plan.period,
        },
        description: plan.description,
        features: plan.features.filter(f => f.trim() !== ''),
        isPopular: plan.popular,
      })),
    };

    try {
      if (editingService) {
        const id = (editingService as any)._id || String(editingService.id);
        const response = await servicesApi.update(id, payload);
        const updated = response.data.data;
        setServices(prev =>
          prev.map(s => {
            const sid = (s as any)._id || String(s.id);
            return sid === id ? { ...updated, id: updated._id || updated.id } : s;
          })
        );
        toast.success('Service updated', { description: 'Changes have been saved.' });
      } else {
        const response = await servicesApi.create(payload);
        const created = response.data.data;
        setServices(prev => [...prev, { ...created, id: created._id || created.id }]);
        toast.success('Service created', { description: 'New service has been added.' });
      }
      setView('list');
    } catch (err: any) {
      toast.error('Save failed', { description: err?.response?.data?.message || 'Could not save the service.' });
    } finally {
      setIsSaving(false);
    }
  };

  const getIconComponent = (iconName: string) => {
    const option = iconOptions.find(o => o.value === iconName);
    return option ? option.icon : Code;
  };

  const filteredServices = services.filter(s =>
    s.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (view === 'edit') {
    return (
      <>
        <ServiceEditor
          service={editingService}
          onSave={handleSave}
          onCancel={() => setView('list')}
          isSaving={isSaving}
        />
      </>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Services</h1>
          <p className="text-muted-foreground">Manage your service offerings and details.</p>
        </div>
        <Button onClick={handleCreateNew} className="gap-2">
          <Plus className="h-4 w-4" /> Add New Service
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-80 pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredServices.map((service) => {
            const Icon = getIconComponent(service.icon || (service as any).category || 'Code');
            const serviceId = (service as any)._id || String(service.id);
            const pricingCount = service.pricing?.length ?? (service as any).pricingPlans?.length ?? 0;
            return (
              <Card key={serviceId} className="group hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 z-10 bg-gradient-to-l from-background via-background/80 to-transparent pl-8">
                  <Button variant="outline" size="icon" className="h-8 w-8 bg-background" onClick={() => handleEdit(service)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8 bg-background hover:text-red-500 hover:border-red-200" onClick={() => setDeleteTarget(service)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>

                  <h3 className="text-xl font-bold mb-2">{service.title}</h3>
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-2 h-10">
                    {service.shortDescription || (service as any).description}
                  </p>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                    <div className="text-sm text-muted-foreground">
                      <span className="font-semibold text-foreground">{pricingCount}</span> pricing plans
                    </div>
                    <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => handleEdit(service)}>
                      Manage <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Add New Card (Empty State) */}
          <button
            onClick={handleCreateNew}
            className="flex flex-col items-center justify-center h-full min-h-[250px] rounded-xl border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5 transition-all group"
          >
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Plus className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-lg">Add New Service</h3>
            <p className="text-sm text-muted-foreground mt-1">Create a custom service package</p>
          </button>
        </div>
      )}

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        description="Are you sure you want to delete this service? This action cannot be undone."
      />
    </div>
  );
}
