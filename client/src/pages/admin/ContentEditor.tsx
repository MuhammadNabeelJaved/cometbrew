/**
 * Content Editor Page
 * Admin interface to manage all dynamic website content via CMS API.
 */
import React, { useState } from 'react';
import { useContent, TechItem, ProcessStep, WhyChooseUsFeature, ContactInfo, SocialLinks, Testimonial } from '../../contexts/ContentContext';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { Plus, Trash2, Save, Star } from 'lucide-react';
import { toast } from 'sonner';
import { homepageApi } from '../../api/homepage.api';

export default function ContentEditor() {
  const {
    logoUrl, updateLogoUrl,
    techStack, updateTechStack,
    processSteps, updateProcessSteps,
    whyChooseUs, updateWhyChooseUs,
    contactInfo, updateContactInfo,
    socialLinks, updateSocialLinks,
    testimonials, updateTestimonials,
  } = useContent();

  const [activeTab, setActiveTab] = useState("hero");
  const [isSaving, setIsSaving] = useState(false);

  // Hero state (HomePageHero API)
  const [hero, setHero] = useState({ statusBadge: '', titleLine1: '', titleLine2: '', subtitle: '' });
  const [heroLoaded, setHeroLoaded] = useState(false);

  React.useEffect(() => {
    if (activeTab === 'hero' && !heroLoaded) {
      homepageApi.get().then(res => {
        const data = res.data.data;
        if (data) setHero({ statusBadge: data.statusBadge || '', titleLine1: data.titleLine1 || '', titleLine2: data.titleLine2 || '', subtitle: data.subtitle || '' });
        setHeroLoaded(true);
      }).catch(() => setHeroLoaded(true));
    }
  }, [activeTab, heroLoaded]);

  const saveWithFeedback = async (fn: () => Promise<void>) => {
    setIsSaving(true);
    try {
      await fn();
      toast.success('Saved successfully');
    } catch {
      toast.error('Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  // --- Hero Handlers ---
  const saveHero = () => saveWithFeedback(async () => {
    try {
      await homepageApi.update(hero);
    } catch {
      await homepageApi.create({ ...hero, isActive: true });
    }
  });

  // --- Tech Stack Handlers ---
  const addTechItem = (groupIndex: number) => {
    const newStack = [...techStack];
    newStack[groupIndex].items.push({ name: 'New Tech', iconName: 'Code2', description: 'Description', color: 'text-foreground' });
    updateTechStack(newStack);
  };
  const removeTechItem = (groupIndex: number, itemIndex: number) => {
    const newStack = [...techStack];
    newStack[groupIndex].items.splice(itemIndex, 1);
    updateTechStack(newStack);
  };
  const updateTechItem = (groupIndex: number, itemIndex: number, field: keyof TechItem, value: string) => {
    const newStack = [...techStack];
    newStack[groupIndex].items[itemIndex] = { ...newStack[groupIndex].items[itemIndex], [field]: value };
    updateTechStack(newStack);
  };

  // --- Process Handlers ---
  const addProcessStep = () => {
    const newSteps = [...processSteps, { id: Date.now(), title: 'New Step', description: 'Step description.', iconName: 'Lightbulb', color: 'from-gray-500 to-gray-400', details: [] }];
    updateProcessSteps(newSteps);
  };
  const removeProcessStep = (index: number) => {
    const newSteps = [...processSteps];
    newSteps.splice(index, 1);
    updateProcessSteps(newSteps);
  };
  const updateProcessStep = (index: number, field: keyof ProcessStep, value: any) => {
    const newSteps = [...processSteps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    updateProcessSteps(newSteps);
  };
  const updateProcessDetail = (stepIndex: number, detailIndex: number, value: string) => {
    const newSteps = [...processSteps];
    newSteps[stepIndex].details[detailIndex] = value;
    updateProcessSteps(newSteps);
  };
  const addProcessDetail = (stepIndex: number) => {
    const newSteps = [...processSteps];
    newSteps[stepIndex].details.push('New Detail');
    updateProcessSteps(newSteps);
  };
  const removeProcessDetail = (stepIndex: number, detailIndex: number) => {
    const newSteps = [...processSteps];
    newSteps[stepIndex].details.splice(detailIndex, 1);
    updateProcessSteps(newSteps);
  };

  // --- Why Choose Us Handlers ---
  const updateWhyChooseUsField = (field: keyof typeof whyChooseUs, value: any) => updateWhyChooseUs({ ...whyChooseUs, [field]: value });
  const updateWhyPoint = (i: number, value: string) => { const p = [...whyChooseUs.points]; p[i] = value; updateWhyChooseUs({ ...whyChooseUs, points: p }); };
  const addWhyPoint = () => updateWhyChooseUs({ ...whyChooseUs, points: [...whyChooseUs.points, 'New Point'] });
  const removeWhyPoint = (i: number) => { const p = [...whyChooseUs.points]; p.splice(i, 1); updateWhyChooseUs({ ...whyChooseUs, points: p }); };
  const updateWhyFeature = (i: number, field: keyof WhyChooseUsFeature, value: string) => { const f = [...whyChooseUs.features]; f[i] = { ...f[i], [field]: value }; updateWhyChooseUs({ ...whyChooseUs, features: f }); };
  const addWhyFeature = () => updateWhyChooseUs({ ...whyChooseUs, features: [...whyChooseUs.features, { title: 'New Feature', iconName: 'Zap', desc: 'Feature description' }] });
  const removeWhyFeature = (i: number) => { const f = [...whyChooseUs.features]; f.splice(i, 1); updateWhyChooseUs({ ...whyChooseUs, features: f }); };

  // --- Testimonial Handlers ---
  const addTestimonial = () => updateTestimonials([...testimonials, { content: '', author: '', role: '', rating: 5 }]);
  const removeTestimonial = (i: number) => { const t = [...testimonials]; t.splice(i, 1); updateTestimonials(t); };
  const updateTestimonial = (i: number, field: keyof Testimonial, value: any) => { const t = [...testimonials]; t[i] = { ...t[i], [field]: value }; updateTestimonials(t); };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content Management</h1>
          <p className="text-muted-foreground">Manage website content — all changes save to the database.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start h-auto p-2 bg-muted/50 rounded-xl mb-8 flex-wrap gap-2">
          <TabsTrigger value="hero" className="px-4 py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Hero</TabsTrigger>
          <TabsTrigger value="logo" className="px-4 py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Logo</TabsTrigger>
          <TabsTrigger value="tech" className="px-4 py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Tech Stack</TabsTrigger>
          <TabsTrigger value="process" className="px-4 py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Process Steps</TabsTrigger>
          <TabsTrigger value="why" className="px-4 py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Why Choose Us</TabsTrigger>
          <TabsTrigger value="testimonials" className="px-4 py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Testimonials</TabsTrigger>
          <TabsTrigger value="contact" className="px-4 py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Contact Info</TabsTrigger>
          <TabsTrigger value="social" className="px-4 py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Social Links</TabsTrigger>
        </TabsList>

        {/* --- Hero Tab --- */}
        <TabsContent value="hero">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Homepage Hero Section</CardTitle>
                <CardDescription>Badge, title, and subtitle shown on the homepage.</CardDescription>
              </div>
              <Button onClick={saveHero} isLoading={isSaving} className="gap-2"><Save className="h-4 w-4" /> Save</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Status Badge</Label>
                <Input value={hero.statusBadge} onChange={e => setHero(h => ({ ...h, statusBadge: e.target.value }))} placeholder="e.g. Accepting New Projects for 2026" />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Title Line 1</Label>
                  <Input value={hero.titleLine1} onChange={e => setHero(h => ({ ...h, titleLine1: e.target.value }))} placeholder="We Build" />
                </div>
                <div className="space-y-2">
                  <Label>Title Line 2 (Highlighted)</Label>
                  <Input value={hero.titleLine2} onChange={e => setHero(h => ({ ...h, titleLine2: e.target.value }))} placeholder="Digital Excellence" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Subtitle</Label>
                <Textarea value={hero.subtitle} onChange={e => setHero(h => ({ ...h, subtitle: e.target.value }))} rows={3} placeholder="The agency for forward-thinking brands..." />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- Logo Tab --- */}
        <TabsContent value="logo">
          <Card>
            <CardHeader>
              <CardTitle>Website Logo</CardTitle>
              <CardDescription>Update the main logo displayed in the navbar and footer. Changes save automatically.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="p-8 bg-black/5 dark:bg-white/5 rounded-xl border border-border">
                  <img src={logoUrl} alt="Current Logo" className="h-16 w-auto object-contain" />
                </div>
                <div className="flex-1 space-y-4 w-full">
                  <div className="space-y-2">
                    <Label>Logo URL</Label>
                    <Input value={logoUrl} onChange={e => updateLogoUrl(e.target.value)} placeholder="https://..." />
                    <p className="text-xs text-muted-foreground">Recommended height: 40-60px. PNG or SVG format.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- Tech Stack Tab --- */}
        <TabsContent value="tech">
          <div className="space-y-8">
            {techStack.map((group, groupIndex) => (
              <Card key={group.id}>
                <CardHeader>
                  <CardTitle>{group.title}</CardTitle>
                  <CardDescription>Changes save automatically on each edit.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {group.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="relative p-4 rounded-xl border border-border bg-card/50 hover:bg-card transition-colors group">
                        <button onClick={() => removeTechItem(groupIndex, itemIndex)} className="absolute top-2 right-2 p-1.5 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Input value={item.name} onChange={e => updateTechItem(groupIndex, itemIndex, 'name', e.target.value)} className="h-8 text-sm font-semibold" placeholder="Tech Name" />
                            <Input value={item.description} onChange={e => updateTechItem(groupIndex, itemIndex, 'description', e.target.value)} className="h-7 text-xs" placeholder="Description" />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-[10px] uppercase text-muted-foreground">Icon Key</Label>
                              <Input value={item.iconName} onChange={e => updateTechItem(groupIndex, itemIndex, 'iconName', e.target.value)} className="h-7 text-xs font-mono" />
                            </div>
                            <div>
                              <Label className="text-[10px] uppercase text-muted-foreground">Color Class</Label>
                              <Input value={item.color} onChange={e => updateTechItem(groupIndex, itemIndex, 'color', e.target.value)} className="h-7 text-xs font-mono" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <button onClick={() => addTechItem(groupIndex)} className="flex flex-col items-center justify-center p-6 rounded-xl border border-dashed hover:bg-muted/50 transition-colors text-muted-foreground hover:text-primary gap-2 min-h-[140px]">
                      <Plus className="w-8 h-8" />
                      <span className="text-sm font-medium">Add Tech Item</span>
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* --- Process Tab --- */}
        <TabsContent value="process">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>From Concept to Reality</CardTitle>
                <CardDescription>Process steps — changes save automatically.</CardDescription>
              </div>
              <Button onClick={addProcessStep} size="sm"><Plus className="w-4 h-4 mr-2" /> Add Step</Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {processSteps.map((step, index) => (
                <div key={step.id} className="p-6 rounded-xl border border-border bg-card/50 relative">
                  <Button variant="ghost" size="icon" className="absolute top-4 right-4 h-8 w-8 text-muted-foreground hover:text-red-500" onClick={() => removeProcessStep(index)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <div className="space-y-2"><Label>Step Title</Label><Input value={step.title} onChange={e => updateProcessStep(index, 'title', e.target.value)} /></div>
                      <div className="space-y-2"><Label>Description</Label><Textarea value={step.description} onChange={e => updateProcessStep(index, 'description', e.target.value)} rows={3} /></div>
                      <div className="flex gap-4">
                        <div className="space-y-2 flex-1"><Label>Icon Name</Label><Input value={step.iconName} onChange={e => updateProcessStep(index, 'iconName', e.target.value)} /></div>
                        <div className="space-y-2 flex-1"><Label>Gradient Color</Label><Input value={step.color} onChange={e => updateProcessStep(index, 'color', e.target.value)} /></div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <Label>Bullet Points</Label>
                      {step.details.map((d, dIndex) => (
                        <div key={dIndex} className="flex gap-2">
                          <Input value={d} onChange={e => updateProcessDetail(index, dIndex, e.target.value)} />
                          <Button variant="ghost" size="icon" onClick={() => removeProcessDetail(index, dIndex)}><Trash2 className="w-4 h-4 text-muted-foreground" /></Button>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={() => addProcessDetail(index)} className="w-full"><Plus className="w-3 h-3 mr-2" /> Add Detail</Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- Why Choose Us Tab --- */}
        <TabsContent value="why">
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Section Content</CardTitle><CardDescription>Changes save automatically.</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Title Line 1</Label><Input value={whyChooseUs.titleLine1} onChange={e => updateWhyChooseUsField('titleLine1', e.target.value)} /></div>
                  <div className="space-y-2"><Label>Title Line 2 (Highlighted)</Label><Input value={whyChooseUs.titleLine2} onChange={e => updateWhyChooseUsField('titleLine2', e.target.value)} /></div>
                </div>
                <div className="space-y-2"><Label>Description</Label><Textarea value={whyChooseUs.description} onChange={e => updateWhyChooseUsField('description', e.target.value)} rows={3} /></div>
              </CardContent>
            </Card>
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Key Points</CardTitle><Button size="sm" variant="ghost" onClick={addWhyPoint}><Plus className="w-4 h-4" /></Button></CardHeader>
                <CardContent className="space-y-3">
                  {whyChooseUs.points.map((point, i) => (
                    <div key={i} className="flex gap-2">
                      <Input value={point} onChange={e => updateWhyPoint(i, e.target.value)} />
                      <Button size="icon" variant="ghost" onClick={() => removeWhyPoint(i)}><Trash2 className="w-4 h-4 text-muted-foreground" /></Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Scrolling Cards</CardTitle><Button size="sm" variant="ghost" onClick={addWhyFeature}><Plus className="w-4 h-4" /></Button></CardHeader>
                <CardContent className="max-h-[400px] overflow-y-auto space-y-4 pr-2">
                  {whyChooseUs.features.map((feature, i) => (
                    <div key={i} className="p-4 border rounded-lg bg-muted/20 space-y-3 relative">
                      <Button size="icon" variant="ghost" className="absolute top-2 right-2 h-6 w-6" onClick={() => removeWhyFeature(i)}><Trash2 className="w-3 h-3 text-muted-foreground" /></Button>
                      <div className="space-y-1"><Label className="text-xs">Title</Label><Input value={feature.title} onChange={e => updateWhyFeature(i, 'title', e.target.value)} className="h-8" /></div>
                      <div className="space-y-1"><Label className="text-xs">Description</Label><Input value={feature.desc} onChange={e => updateWhyFeature(i, 'desc', e.target.value)} className="h-8" /></div>
                      <div className="space-y-1"><Label className="text-xs">Icon Name (Lucide)</Label><Input value={feature.iconName} onChange={e => updateWhyFeature(i, 'iconName', e.target.value)} className="h-8 font-mono text-xs" /></div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* --- Testimonials Tab --- */}
        <TabsContent value="testimonials">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div><CardTitle>Client Testimonials</CardTitle><CardDescription>Shown in the scrolling testimonials section. Changes save automatically.</CardDescription></div>
              <Button onClick={addTestimonial} size="sm"><Plus className="w-4 h-4 mr-2" /> Add</Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {testimonials.map((t, i) => (
                <div key={i} className="p-6 border rounded-xl bg-muted/20 space-y-4 relative">
                  <Button variant="ghost" size="icon" className="absolute top-4 right-4 h-8 w-8 text-muted-foreground hover:text-red-500" onClick={() => removeTestimonial(i)}><Trash2 className="w-4 h-4" /></Button>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Author Name</Label><Input value={t.author} onChange={e => updateTestimonial(i, 'author', e.target.value)} placeholder="John Smith" /></div>
                    <div className="space-y-2"><Label>Role / Company</Label><Input value={t.role} onChange={e => updateTestimonial(i, 'role', e.target.value)} placeholder="CEO, Company" /></div>
                  </div>
                  <div className="space-y-2"><Label>Review Content</Label><Textarea value={t.content} onChange={e => updateTestimonial(i, 'content', e.target.value)} placeholder="What they said about you..." rows={3} /></div>
                  <div className="flex items-center gap-2">
                    <Label>Rating</Label>
                    {[1, 2, 3, 4, 5].map(star => (
                      <button key={star} onClick={() => updateTestimonial(i, 'rating', star)}>
                        <Star className={`h-5 w-5 ${star <= (t.rating || 5) ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground'}`} />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {testimonials.length === 0 && <p className="text-center text-muted-foreground py-8">No testimonials yet. Add one above.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- Contact Info Tab --- */}
        <TabsContent value="contact">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div><CardTitle>Contact Information</CardTitle><CardDescription>Shown on the Contact page. Changes save automatically.</CardDescription></div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2"><Label>Address</Label><Textarea value={contactInfo.address} onChange={e => updateContactInfo({ ...contactInfo, address: e.target.value })} placeholder="123 Tech Blvd, San Francisco, CA 94107" rows={2} /></div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Email</Label><Input value={contactInfo.email} onChange={e => updateContactInfo({ ...contactInfo, email: e.target.value })} placeholder="hello@agency.com" /></div>
                <div className="space-y-2"><Label>Phone</Label><Input value={contactInfo.phone} onChange={e => updateContactInfo({ ...contactInfo, phone: e.target.value })} placeholder="+1 (555) 123-4567" /></div>
              </div>
              <div className="space-y-2"><Label>Business Hours</Label><Textarea value={contactInfo.businessHours} onChange={e => updateContactInfo({ ...contactInfo, businessHours: e.target.value })} placeholder="Monday - Friday&#10;9:00 AM - 6:00 PM PST" rows={2} /></div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- Social Links Tab --- */}
        <TabsContent value="social">
          <Card>
            <CardHeader>
              <CardTitle>Social Media Links</CardTitle>
              <CardDescription>Shown in the Footer. Changes save automatically. Leave blank to hide.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2"><Label>Twitter / X URL</Label><Input value={socialLinks.twitter} onChange={e => updateSocialLinks({ ...socialLinks, twitter: e.target.value })} placeholder="https://twitter.com/..." /></div>
              <div className="space-y-2"><Label>LinkedIn URL</Label><Input value={socialLinks.linkedin} onChange={e => updateSocialLinks({ ...socialLinks, linkedin: e.target.value })} placeholder="https://linkedin.com/company/..." /></div>
              <div className="space-y-2"><Label>Instagram URL</Label><Input value={socialLinks.instagram} onChange={e => updateSocialLinks({ ...socialLinks, instagram: e.target.value })} placeholder="https://instagram.com/..." /></div>
              <div className="space-y-2"><Label>GitHub URL</Label><Input value={socialLinks.github} onChange={e => updateSocialLinks({ ...socialLinks, github: e.target.value })} placeholder="https://github.com/..." /></div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
