/**
 * Service Editor Component
 * Detailed editor for service pages including Hero, Stats, Features, Pricing, and FAQs
 */
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Save, Plus, Trash2, GripVertical, Check, 
  ChevronDown, ChevronUp, Code, Smartphone, Globe, 
  Palette, Megaphone, Layout, Info
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Switch } from '../../components/ui/switch';
import { Label } from '../../components/ui/label';

// Define types locally or import (simpler to define here for now)
export interface ServiceData {
  id: number;
  title: string;
  slug: string;
  shortDescription: string;
  icon: string;
  hero: {
    title: string;
    subtitle: string;
  };
  stats: {
    successRate: string;
    projects: string;
    team: string;
    support: string;
  };
  features: {
    title: string;
    description: string;
    list: string[];
    cards: { title: string; description: string; icon: string }[];
  };
  pricing: {
    name: string;
    price: string;
    period: string;
    description: string;
    features: string[];
    popular: boolean;
  }[];
  faqs: { question: string; answer: string }[];
}

interface ServiceEditorProps {
  service?: ServiceData;
  onSave: (data: ServiceData) => void;
  onCancel: () => void;
  isSaving?: boolean;
}

const iconOptions = [
  { value: 'web-development', label: 'Web Dev', icon: Code },
  { value: 'mobile-app', label: 'Mobile', icon: Smartphone },
  { value: 'ecommerce', label: 'Ecommerce', icon: Globe },
  { value: 'design', label: 'Design', icon: Palette },
  { value: 'consulting', label: 'Marketing', icon: Megaphone },
  { value: 'other', label: 'Other', icon: Layout },
];

export function ServiceEditor({ service, onSave, onCancel, isSaving = false }: ServiceEditorProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'features' | 'pricing' | 'faqs'>('general');
  const [formData, setFormData] = useState<ServiceData>({
    id: Date.now(),
    title: '',
    slug: '',
    shortDescription: '',
    icon: 'web-development',
    hero: { title: '', subtitle: '' },
    stats: { successRate: '99%', projects: '250+', team: 'Top 1%', support: '24/7' },
    features: { 
      title: 'Transforming ideas into digital reality', 
      description: 'We build robust web applications that drive business growth.', 
      list: ['Agile Development Methodology'], 
      cards: [{ title: 'Custom Web Apps', description: 'Tailored solutions built from scratch.', icon: 'Smartphone' }] 
    },
    pricing: [{ name: 'Starter', price: '$2,500', period: 'project', description: 'For small businesses', features: ['5 Pages'], popular: false }],
    faqs: [{ question: 'What tech stack do you use?', answer: 'We use React, Node.js, and TypeScript.' }]
  });

  useEffect(() => {
    if (service) {
      setFormData(service);
    }
  }, [service]);

  // Generic handler for nested updates
  const updateNested = (path: string[], value: any) => {
    setFormData(prev => {
      const newData = { ...prev };
      let current: any = newData;
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }
      current[path[path.length - 1]] = value;
      return newData;
    });
  };

  // Helper to get Icon component
  const getIcon = (name: string) => {
    const opt = iconOptions.find(o => o.value === name);
    const IconComp = opt ? opt.icon : Code;
    return <IconComp className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between sticky top-0 z-20 bg-background/80 backdrop-blur-md py-4 border-b border-border/50 -mx-6 px-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-xl font-bold">{service ? 'Edit Service' : 'New Service'}</h2>
            <p className="text-sm text-muted-foreground">{formData.title || 'Untitled Service'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isSaving}>Cancel</Button>
          <Button onClick={() => onSave(formData)} className="gap-2" disabled={isSaving} isLoading={isSaving}>
            {!isSaving && <Save className="h-4 w-4" />} Save Changes
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border w-full overflow-x-auto">
        {(['general', 'features', 'pricing', 'faqs'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab 
                ? 'border-primary text-primary' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="space-y-8 max-w-4xl mx-auto pb-20">
        
        {/* GENERAL TAB */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Service Name</Label>
                    <Input 
                      value={formData.title} 
                      onChange={e => setFormData({...formData, title: e.target.value})} 
                      placeholder="e.g. Web Development"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Slug (URL)</Label>
                    <Input 
                      value={formData.slug} 
                      onChange={e => setFormData({...formData, slug: e.target.value})} 
                      placeholder="e.g. web-development"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Short Description (for lists)</Label>
                  <Textarea 
                    value={formData.shortDescription} 
                    onChange={e => setFormData({...formData, shortDescription: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Icon</Label>
                  <div className="flex gap-2 flex-wrap">
                    {iconOptions.map(opt => (
                      <div 
                        key={opt.value}
                        onClick={() => setFormData({...formData, icon: opt.value})}
                        className={`h-10 w-10 rounded-md border flex items-center justify-center cursor-pointer transition-all ${
                          formData.icon === opt.value ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'
                        }`}
                      >
                        <opt.icon className="h-5 w-5" />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Hero Section</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Hero Title</Label>
                  <Input 
                    value={formData.hero.title} 
                    onChange={e => updateNested(['hero', 'title'], e.target.value)} 
                    placeholder="Large title at top of page"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hero Subtitle</Label>
                  <Textarea 
                    value={formData.hero.subtitle} 
                    onChange={e => updateNested(['hero', 'subtitle'], e.target.value)} 
                    placeholder="Descriptive text under the title"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Key Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(formData.stats).map(([key, value]) => (
                    <div key={key} className="space-y-2">
                      <Label className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</Label>
                      <Input 
                        value={value} 
                        onChange={e => updateNested(['stats', key], e.target.value)} 
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* FEATURES TAB */}
        {activeTab === 'features' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Features Intro</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Section Title</Label>
                  <Input 
                    value={formData.features.title} 
                    onChange={e => updateNested(['features', 'title'], e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea 
                    value={formData.features.description} 
                    onChange={e => updateNested(['features', 'description'], e.target.value)} 
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row justify-between items-center">
                <CardTitle>Bullet Points</CardTitle>
                <Button size="sm" variant="outline" onClick={() => updateNested(['features', 'list'], [...formData.features.list, ''])}>
                  <Plus className="h-4 w-4 mr-1" /> Add Point
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {formData.features.list.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <Input 
                      value={item} 
                      onChange={e => {
                        const newList = [...formData.features.list];
                        newList[index] = e.target.value;
                        updateNested(['features', 'list'], newList);
                      }}
                      placeholder="Feature bullet point"
                    />
                    <Button 
                      size="icon" variant="ghost" className="text-muted-foreground hover:text-destructive"
                      onClick={() => updateNested(['features', 'list'], formData.features.list.filter((_, i) => i !== index))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row justify-between items-center">
                <CardTitle>Feature Cards</CardTitle>
                <Button size="sm" variant="outline" onClick={() => updateNested(['features', 'cards'], [...formData.features.cards, { title: '', description: '', icon: 'Code' }])}>
                  <Plus className="h-4 w-4 mr-1" /> Add Card
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {formData.features.cards.map((card, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-4 bg-muted/20 relative group">
                     <Button 
                      size="icon" variant="ghost" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                      onClick={() => updateNested(['features', 'cards'], formData.features.cards.filter((_, i) => i !== index))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Title</Label>
                        <Input 
                          value={card.title} 
                          onChange={e => {
                            const newCards = [...formData.features.cards];
                            newCards[index].title = e.target.value;
                            updateNested(['features', 'cards'], newCards);
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Icon</Label>
                        <div className="flex gap-2">
                          {iconOptions.map(opt => (
                            <div 
                              key={opt.value}
                              onClick={() => {
                                const newCards = [...formData.features.cards];
                                newCards[index].icon = opt.value;
                                updateNested(['features', 'cards'], newCards);
                              }}
                              className={`h-9 w-9 rounded border flex items-center justify-center cursor-pointer ${
                                card.icon === opt.value ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'
                              }`}
                            >
                              <opt.icon className="h-4 w-4" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea 
                        value={card.description} 
                        onChange={e => {
                          const newCards = [...formData.features.cards];
                          newCards[index].description = e.target.value;
                          updateNested(['features', 'cards'], newCards);
                        }}
                        className="min-h-[60px]"
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* PRICING TAB */}
        {activeTab === 'pricing' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Pricing Plans</h3>
              <Button onClick={() => updateNested(['pricing'], [...formData.pricing, { name: 'New Plan', price: '$0', period: 'project', description: '', features: [''], popular: false }])}>
                <Plus className="h-4 w-4 mr-2" /> Add Plan
              </Button>
            </div>
            
            <div className="grid lg:grid-cols-3 gap-6">
              {formData.pricing.map((plan, index) => (
                <Card key={index} className={`relative ${plan.popular ? 'border-primary' : ''}`}>
                  {plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">Most Popular</div>}
                  <CardContent className="p-6 space-y-4">
                    <div className="flex justify-between">
                      <Label>Plan {index + 1}</Label>
                      <Button 
                        size="icon" variant="ghost" className="h-6 w-6 text-destructive"
                        onClick={() => updateNested(['pricing'], formData.pricing.filter((_, i) => i !== index))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <Input 
                      value={plan.name} 
                      onChange={e => {
                        const newPricing = [...formData.pricing];
                        newPricing[index].name = e.target.value;
                        updateNested(['pricing'], newPricing);
                      }}
                      placeholder="Plan Name"
                      className="font-bold text-lg"
                    />
                    
                    <div className="flex gap-2 items-center">
                      <Input 
                        value={plan.price} 
                        onChange={e => {
                          const newPricing = [...formData.pricing];
                          newPricing[index].price = e.target.value;
                          updateNested(['pricing'], newPricing);
                        }}
                        placeholder="Price"
                        className="w-1/2"
                      />
                      <span className="text-muted-foreground">/</span>
                      <Input 
                        value={plan.period} 
                        onChange={e => {
                          const newPricing = [...formData.pricing];
                          newPricing[index].period = e.target.value;
                          updateNested(['pricing'], newPricing);
                        }}
                        placeholder="period"
                        className="w-1/2"
                      />
                    </div>
                    
                    <div className="flex items-center gap-2">
                       <Switch 
                        checked={plan.popular}
                        onCheckedChange={checked => {
                          const newPricing = [...formData.pricing];
                          newPricing[index].popular = checked;
                          updateNested(['pricing'], newPricing);
                        }}
                       />
                       <Label>Mark as Popular</Label>
                    </div>

                    <Textarea 
                      value={plan.description} 
                      onChange={e => {
                        const newPricing = [...formData.pricing];
                        newPricing[index].description = e.target.value;
                        updateNested(['pricing'], newPricing);
                      }}
                      placeholder="Short description"
                    />

                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">FEATURES (One per line)</Label>
                      <Textarea 
                        value={plan.features.join('\n')} 
                        onChange={e => {
                          const newPricing = [...formData.pricing];
                          newPricing[index].features = e.target.value.split('\n');
                          updateNested(['pricing'], newPricing);
                        }}
                        placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                        className="min-h-[120px]"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* FAQS TAB */}
        {activeTab === 'faqs' && (
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row justify-between items-center">
                <CardTitle>Frequently Asked Questions</CardTitle>
                <Button size="sm" onClick={() => updateNested(['faqs'], [...formData.faqs, { question: '', answer: '' }])}>
                  <Plus className="h-4 w-4 mr-1" /> Add FAQ
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {formData.faqs.map((faq, index) => (
                  <div key={index} className="flex gap-4 items-start p-4 border rounded-lg bg-muted/20">
                    <div className="grid gap-4 flex-1">
                      <Input 
                        value={faq.question} 
                        onChange={e => {
                          const newFaqs = [...formData.faqs];
                          newFaqs[index].question = e.target.value;
                          updateNested(['faqs'], newFaqs);
                        }}
                        placeholder="Question"
                        className="font-medium"
                      />
                      <Textarea 
                        value={faq.answer} 
                        onChange={e => {
                          const newFaqs = [...formData.faqs];
                          newFaqs[index].answer = e.target.value;
                          updateNested(['faqs'], newFaqs);
                        }}
                        placeholder="Answer"
                      />
                    </div>
                    <Button 
                      size="icon" variant="ghost" className="text-muted-foreground hover:text-destructive shrink-0 mt-1"
                      onClick={() => updateNested(['faqs'], formData.faqs.filter((_, i) => i !== index))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}