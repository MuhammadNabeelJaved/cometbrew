/**
 * Content Editor Page
 * Admin interface to manage all dynamic website content via CMS API.
 */
import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useContent, TechItem, ProcessStep, WhyChooseUsFeature, ContactInfo, SocialLinks, CustomSocialLink, Testimonial, AboutContent, AboutStat, AboutMilestone, AboutValue, PrivacyPolicyContent, TermsContent, CookiesPolicyContent, LegalSection, CookieCategory } from '../../contexts/ContentContext';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectItem } from '../../components/ui/select';
import { Plus, Trash2, Save, Star, MapPin } from 'lucide-react';
import { Map, MapMarker, MarkerContent, MarkerPopup, MapControls } from '../../components/ui/map';

const SOCIAL_PLATFORMS = [
  { value: 'Youtube', label: 'YouTube' },
  { value: 'Facebook', label: 'Facebook' },
  { value: 'Twitch', label: 'Twitch' },
  { value: 'Slack', label: 'Slack' },
  { value: 'Dribbble', label: 'Dribbble' },
  { value: 'Figma', label: 'Figma' },
  { value: 'Codepen', label: 'CodePen' },
  { value: 'Globe', label: 'Website / Other' },
];
import { toast } from 'sonner';
import { homepageApi } from '../../api/homepage.api';
import NavFooterManager from './NavFooterManager';

export default function ContentEditor() {
  const {
    logoUrl, updateLogoUrl,
    techStack, updateTechStack,
    processSteps, updateProcessSteps,
    whyChooseUs, updateWhyChooseUs,
    contactInfo, updateContactInfo,
    socialLinks, updateSocialLinks,
    testimonials, updateTestimonials,
    about, updateAbout,
    privacyPolicy, updatePrivacyPolicy,
    termsOfService, updateTermsOfService,
    cookiesPolicy, updateCookiesPolicy,
  } = useContent();

  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    const tab = new URLSearchParams(location.search).get('tab');
    return tab || 'hero';
  });
  const [isSaving, setIsSaving] = useState(false);

  // Sync tab when URL search changes (e.g. navigated from search palette)
  useEffect(() => {
    const tab = new URLSearchParams(location.search).get('tab');
    if (tab) setActiveTab(tab);
  }, [location.search]);

  // About draft state — local edits accumulate here; only saved on explicit button click
  const [aboutDraft, setAboutDraft] = useState<AboutContent>(about);
  useEffect(() => { setAboutDraft(about); }, [about]);

  const normalizeMapUrl = (raw: string) => {
    const m = raw.trim().match(/src=["']([^"']+)["']/);
    return m ? m[1] : raw.trim();
  };

  // Contact draft is initialised once from context and only synced again from the
  // server-confirmed response after an explicit Save click. This prevents any
  // socket refresh or context update from overwriting the user's edits.
  const [contactDraft, setContactDraft] = useState<ContactInfo>({
    ...contactInfo,
    mapEmbedUrl: normalizeMapUrl(contactInfo.mapEmbedUrl),
  });
  const contactInitRef = useRef(false);
  useEffect(() => {
    // Sync once when context first loads real data (e.g. after page refresh)
    if (!contactInitRef.current && contactInfo.address) {
      contactInitRef.current = true;
      setContactDraft({ ...contactInfo, mapEmbedUrl: normalizeMapUrl(contactInfo.mapEmbedUrl) });
    }
  }, [contactInfo]);

  // Legal pages draft states
  const [privacyDraft, setPrivacyDraft] = useState<PrivacyPolicyContent>(privacyPolicy);
  useEffect(() => { setPrivacyDraft(privacyPolicy); }, [privacyPolicy]);

  const [termsDraft, setTermsDraft] = useState<TermsContent>(termsOfService);
  useEffect(() => { setTermsDraft(termsOfService); }, [termsOfService]);

  const [cookiesDraft, setCookiesDraft] = useState<CookiesPolicyContent>(cookiesPolicy);
  useEffect(() => { setCookiesDraft(cookiesPolicy); }, [cookiesPolicy]);

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
    } catch (err: any) {
      toast.error('Save failed', { description: err?.response?.data?.message || 'Please try again.' });
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
          <TabsTrigger value="about" className="px-4 py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">About Page</TabsTrigger>
          <TabsTrigger value="privacy" className="px-4 py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Privacy Policy</TabsTrigger>
          <TabsTrigger value="terms" className="px-4 py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Terms</TabsTrigger>
          <TabsTrigger value="cookies-policy" className="px-4 py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Cookies Policy</TabsTrigger>
          <TabsTrigger value="nav-footer" className="px-4 py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Nav & Footer</TabsTrigger>
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
              <div><CardTitle>Contact Information</CardTitle><CardDescription>Shown on the Contact page.</CardDescription></div>
              <Button size="sm" disabled={isSaving} onClick={() => saveWithFeedback(async () => {
                const confirmed = await updateContactInfo(contactDraft);
                setContactDraft({ ...confirmed, mapEmbedUrl: normalizeMapUrl(confirmed.mapEmbedUrl) });
              })}>
                <Save className="h-4 w-4 mr-1" />{isSaving ? 'Saving…' : 'Save'}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2"><Label>Address</Label><Textarea value={contactDraft.address} onChange={e => setContactDraft(d => ({ ...d, address: e.target.value }))} placeholder="123 Tech Blvd, San Francisco, CA 94107" rows={2} /></div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Email</Label><Input value={contactDraft.email} onChange={e => setContactDraft(d => ({ ...d, email: e.target.value }))} placeholder="hello@agency.com" /></div>
                <div className="space-y-2"><Label>Phone</Label><Input value={contactDraft.phone} onChange={e => setContactDraft(d => ({ ...d, phone: e.target.value }))} placeholder="+1 (555) 123-4567" /></div>
              </div>
              <div className="space-y-2"><Label>Business Hours</Label><Textarea value={contactDraft.businessHours} onChange={e => setContactDraft(d => ({ ...d, businessHours: e.target.value }))} placeholder="Monday - Friday&#10;9:00 AM - 6:00 PM PST" rows={2} /></div>
              {/* ── Map Provider Selector ── */}
              <div className="space-y-2">
                <Label>Map Type</Label>
                <Select
                  value={contactDraft.mapProvider}
                  onChange={e => setContactDraft(d => ({ ...d, mapProvider: e.target.value as 'google' | 'mapcn' | 'both' }))}
                >
                  <SelectItem value="google">Google Maps (iframe embed)</SelectItem>
                  <SelectItem value="mapcn">MapCN — MapLibre (auto dark/light)</SelectItem>
                  <SelectItem value="both">Both maps</SelectItem>
                </Select>
              </div>

              {/* ── Google Maps section ── */}
              {(contactDraft.mapProvider === 'google' || contactDraft.mapProvider === 'both') && (
                <div className="space-y-2 rounded-xl border border-border/50 p-4">
                  <Label className="flex items-center gap-1.5 font-semibold"><MapPin className="h-4 w-4 text-red-500" /> Google Maps Embed URL</Label>
                  <Input
                    value={contactDraft.mapEmbedUrl}
                    onChange={e => setContactDraft(d => ({ ...d, mapEmbedUrl: normalizeMapUrl(e.target.value) }))}
                    placeholder="https://www.google.com/maps/embed?pb=..."
                  />
                  {contactDraft.mapEmbedUrl && !contactDraft.mapEmbedUrl.includes('google.com/maps/embed') && (
                    <div className="rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-400 space-y-1">
                      <p className="font-semibold">⚠ Not an embeddable URL</p>
                      <p>Use the <strong>"Embed a map"</strong> tab in Google Maps → Share, NOT "Send a link". Copy the full iframe HTML and paste it here.</p>
                    </div>
                  )}
                  {!contactDraft.mapEmbedUrl && (
                    <p className="text-xs text-muted-foreground">Google Maps → Share → <strong>Embed a map</strong> tab → Copy HTML → paste here.</p>
                  )}
                  {contactDraft.mapEmbedUrl && contactDraft.mapEmbedUrl.includes('google.com/maps/embed') && (
                    <div className="mt-2 rounded-xl overflow-hidden border border-border/50 aspect-video">
                      <iframe src={contactDraft.mapEmbedUrl} width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Google Map preview" />
                    </div>
                  )}
                </div>
              )}

              {/* ── MapCN section ── */}
              {(contactDraft.mapProvider === 'mapcn' || contactDraft.mapProvider === 'both') && (
                <div className="space-y-3 rounded-xl border border-border/50 p-4">
                  <Label className="flex items-center gap-1.5 font-semibold"><MapPin className="h-4 w-4 text-violet-500" /> MapCN — Coordinates</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Latitude</Label>
                      <Input
                        type="number"
                        step="any"
                        value={contactDraft.mapLat ?? ''}
                        onChange={e => setContactDraft(d => ({ ...d, mapLat: e.target.value === '' ? null : parseFloat(e.target.value) }))}
                        placeholder="e.g. 25.2048"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Longitude</Label>
                      <Input
                        type="number"
                        step="any"
                        value={contactDraft.mapLng ?? ''}
                        onChange={e => setContactDraft(d => ({ ...d, mapLng: e.target.value === '' ? null : parseFloat(e.target.value) }))}
                        placeholder="e.g. 55.2708"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Zoom (1–20)</Label>
                      <Input
                        type="number"
                        min={1} max={20}
                        value={contactDraft.mapZoom}
                        onChange={e => setContactDraft(d => ({ ...d, mapZoom: parseInt(e.target.value) || 13 }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Marker Label</Label>
                      <Input
                        value={contactDraft.mapMarkerLabel}
                        onChange={e => setContactDraft(d => ({ ...d, mapMarkerLabel: e.target.value }))}
                        placeholder="e.g. Our Office"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Google Maps → right-click your location → click the coordinates to copy them.
                  </p>
                  {contactDraft.mapLat !== null && contactDraft.mapLng !== null && (
                    <div className="mt-2 rounded-xl overflow-hidden border border-border/50" style={{ height: 260 }}>
                      <Map
                        center={[contactDraft.mapLng!, contactDraft.mapLat!]}
                        zoom={contactDraft.mapZoom}
                      >
                        <MapControls />
                        <MapMarker
                          longitude={contactDraft.mapLng!}
                          latitude={contactDraft.mapLat!}
                        >
                          <MarkerContent />
                          {contactDraft.mapMarkerLabel && (
                            <MarkerPopup>
                              <div className="px-2 py-1 text-sm font-medium">{contactDraft.mapMarkerLabel}</div>
                            </MarkerPopup>
                          )}
                        </MapMarker>
                      </Map>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- Social Links Tab --- */}
        <TabsContent value="social">
          <div className="space-y-6">
            {/* Built-in platforms */}
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

            {/* Extra / custom social links */}
            <Card>
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle>Additional Social Links</CardTitle>
                  <CardDescription>Add any extra platforms — YouTube, Discord, TikTok, etc.</CardDescription>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    const newLink: CustomSocialLink = { label: '', url: '', icon: 'Globe' };
                    updateSocialLinks({ ...socialLinks, customSocialLinks: [...(socialLinks.customSocialLinks || []), newLink] });
                  }}
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Link
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {(socialLinks.customSocialLinks || []).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No extra links yet. Click "Add Link" to add one.</p>
                )}
                {(socialLinks.customSocialLinks || []).map((link, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_1fr_auto_auto] gap-3 items-end">
                    <div className="space-y-1">
                      <Label className="text-xs">Label</Label>
                      <Input
                        value={link.label}
                        onChange={e => {
                          const updated = [...(socialLinks.customSocialLinks || [])];
                          updated[idx] = { ...updated[idx], label: e.target.value };
                          updateSocialLinks({ ...socialLinks, customSocialLinks: updated });
                        }}
                        placeholder="e.g. YouTube"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">URL</Label>
                      <Input
                        value={link.url}
                        onChange={e => {
                          const updated = [...(socialLinks.customSocialLinks || [])];
                          updated[idx] = { ...updated[idx], url: e.target.value };
                          updateSocialLinks({ ...socialLinks, customSocialLinks: updated });
                        }}
                        placeholder="https://..."
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Icon</Label>
                      <Select
                        value={link.icon}
                        onValueChange={val => {
                          const updated = [...(socialLinks.customSocialLinks || [])];
                          updated[idx] = { ...updated[idx], icon: val };
                          updateSocialLinks({ ...socialLinks, customSocialLinks: updated });
                        }}
                      >
                        {SOCIAL_PLATFORMS.map(p => (
                          <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                        ))}
                      </Select>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        const updated = (socialLinks.customSocialLinks || []).filter((_, i) => i !== idx);
                        updateSocialLinks({ ...socialLinks, customSocialLinks: updated });
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        {/* --- About Page Tab --- */}
        <TabsContent value="about">
          <div className="space-y-8">

            {/* Hero subtitle + Save All */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>About Page Hero</CardTitle>
                  <CardDescription>The subtitle shown below the main heading on the About page.</CardDescription>
                </div>
                <Button onClick={() => saveWithFeedback(() => updateAbout(aboutDraft))} isLoading={isSaving} className="gap-2">
                  <Save className="h-4 w-4" /> Save All
                </Button>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={aboutDraft.heroSubtitle}
                  onChange={e => setAboutDraft(d => ({ ...d, heroSubtitle: e.target.value }))}
                  rows={3}
                  placeholder="Describe what your agency does…"
                />
              </CardContent>
            </Card>

            {/* Stats */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div><CardTitle>Stats Bar</CardTitle><CardDescription>Number stats shown in the banner row (e.g. 50+ Projects).</CardDescription></div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setAboutDraft(d => ({ ...d, stats: [...d.stats, { value: '0+', label: 'New Stat', order: d.stats.length }] }))}>
                    <Plus className="w-4 h-4 mr-2" /> Add Stat
                  </Button>
                  <Button size="sm" onClick={() => saveWithFeedback(() => updateAbout(aboutDraft))} isLoading={isSaving}>
                    <Save className="w-4 h-4 mr-2" /> Save
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {aboutDraft.stats
                  .slice()
                  .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                  .map((stat, i) => (
                    <div key={i} className="flex gap-3 items-center">
                      <Input
                        className="w-28 font-bold text-center"
                        value={stat.value}
                        onChange={e => {
                          const s = [...aboutDraft.stats]; s[i] = { ...s[i], value: e.target.value };
                          setAboutDraft(d => ({ ...d, stats: s }));
                        }}
                        placeholder="50+"
                      />
                      <Input
                        className="flex-1"
                        value={stat.label}
                        onChange={e => {
                          const s = [...aboutDraft.stats]; s[i] = { ...s[i], label: e.target.value };
                          setAboutDraft(d => ({ ...d, stats: s }));
                        }}
                        placeholder="Projects Delivered"
                      />
                      <Button size="icon" variant="ghost" onClick={() => {
                        const s = [...aboutDraft.stats]; s.splice(i, 1);
                        setAboutDraft(d => ({ ...d, stats: s }));
                      }}><Trash2 className="w-4 h-4 text-muted-foreground" /></Button>
                    </div>
                  ))}
              </CardContent>
            </Card>

            {/* Our Story */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div><CardTitle>Our Story</CardTitle><CardDescription>Title, paragraphs, and bullet checkpoints for the story section.</CardDescription></div>
                <Button size="sm" onClick={() => saveWithFeedback(() => updateAbout(aboutDraft))} isLoading={isSaving}>
                  <Save className="w-4 h-4 mr-2" /> Save
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Section Title</Label>
                  <Input
                    value={aboutDraft.storyTitle}
                    onChange={e => setAboutDraft(d => ({ ...d, storyTitle: e.target.value }))}
                    placeholder="From Freelance Roots to a Full-Service Agency"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Story Paragraphs</Label>
                    <Button size="sm" variant="ghost" onClick={() => setAboutDraft(d => ({ ...d, storyParagraphs: [...d.storyParagraphs, ''] }))}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {aboutDraft.storyParagraphs.map((para, i) => (
                    <div key={i} className="flex gap-2">
                      <Textarea
                        value={para}
                        onChange={e => {
                          const p = [...aboutDraft.storyParagraphs]; p[i] = e.target.value;
                          setAboutDraft(d => ({ ...d, storyParagraphs: p }));
                        }}
                        rows={2}
                        className="flex-1"
                        placeholder={`Paragraph ${i + 1}`}
                      />
                      <Button size="icon" variant="ghost" onClick={() => {
                        const p = [...aboutDraft.storyParagraphs]; p.splice(i, 1);
                        setAboutDraft(d => ({ ...d, storyParagraphs: p }));
                      }}><Trash2 className="w-4 h-4 text-muted-foreground" /></Button>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Bullet Checkpoints</Label>
                    <Button size="sm" variant="ghost" onClick={() => setAboutDraft(d => ({ ...d, storyPoints: [...d.storyPoints, ''] }))}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {aboutDraft.storyPoints.map((point, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        value={point}
                        onChange={e => {
                          const p = [...aboutDraft.storyPoints]; p[i] = e.target.value;
                          setAboutDraft(d => ({ ...d, storyPoints: p }));
                        }}
                        className="flex-1"
                        placeholder="Client-first approach in every project"
                      />
                      <Button size="icon" variant="ghost" onClick={() => {
                        const p = [...aboutDraft.storyPoints]; p.splice(i, 1);
                        setAboutDraft(d => ({ ...d, storyPoints: p }));
                      }}><Trash2 className="w-4 h-4 text-muted-foreground" /></Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Milestones */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div><CardTitle>Company Timeline</CardTitle><CardDescription>Milestone entries shown in the timeline on the story section.</CardDescription></div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setAboutDraft(d => ({
                    ...d,
                    milestones: [...d.milestones, { year: String(new Date().getFullYear()), title: 'New Milestone', desc: '', order: d.milestones.length }]
                  }))}>
                    <Plus className="w-4 h-4 mr-2" /> Add Milestone
                  </Button>
                  <Button size="sm" onClick={() => saveWithFeedback(() => updateAbout(aboutDraft))} isLoading={isSaving}>
                    <Save className="w-4 h-4 mr-2" /> Save
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {aboutDraft.milestones
                  .slice()
                  .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                  .map((m, i) => (
                    <div key={i} className="p-4 rounded-xl border border-border bg-muted/20 space-y-3 relative">
                      <Button size="icon" variant="ghost" className="absolute top-2 right-2 h-7 w-7"
                        onClick={() => {
                          const ms = [...aboutDraft.milestones]; ms.splice(i, 1);
                          setAboutDraft(d => ({ ...d, milestones: ms }));
                        }}>
                        <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                      </Button>
                      <div className="grid grid-cols-[80px_1fr] gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Year</Label>
                          <Input value={m.year} onChange={e => {
                            const ms = [...aboutDraft.milestones]; ms[i] = { ...ms[i], year: e.target.value };
                            setAboutDraft(d => ({ ...d, milestones: ms }));
                          }} className="h-8 font-mono text-sm" placeholder="2024" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Title</Label>
                          <Input value={m.title} onChange={e => {
                            const ms = [...aboutDraft.milestones]; ms[i] = { ...ms[i], title: e.target.value };
                            setAboutDraft(d => ({ ...d, milestones: ms }));
                          }} className="h-8" placeholder="Going Global" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Description</Label>
                        <Textarea value={m.desc} onChange={e => {
                          const ms = [...aboutDraft.milestones]; ms[i] = { ...ms[i], desc: e.target.value };
                          setAboutDraft(d => ({ ...d, milestones: ms }));
                        }} rows={2} placeholder="What happened in this year…" />
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>

            {/* Core Values */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div><CardTitle>Core Values</CardTitle><CardDescription>Value cards shown in the grid section. Icon names are Lucide icon keys (e.g. Target, Shield, Zap).</CardDescription></div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setAboutDraft(d => ({
                    ...d,
                    values: [...d.values, { title: 'New Value', description: '', iconName: 'Star', order: d.values.length }]
                  }))}>
                    <Plus className="w-4 h-4 mr-2" /> Add Value
                  </Button>
                  <Button size="sm" onClick={() => saveWithFeedback(() => updateAbout(aboutDraft))} isLoading={isSaving}>
                    <Save className="w-4 h-4 mr-2" /> Save
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {aboutDraft.values
                  .slice()
                  .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                  .map((v, i) => (
                    <div key={i} className="p-4 rounded-xl border border-border bg-muted/20 space-y-3 relative">
                      <Button size="icon" variant="ghost" className="absolute top-2 right-2 h-7 w-7"
                        onClick={() => {
                          const vs = [...aboutDraft.values]; vs.splice(i, 1);
                          setAboutDraft(d => ({ ...d, values: vs }));
                        }}>
                        <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                      </Button>
                      <div className="grid grid-cols-[1fr_auto] gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Title</Label>
                          <Input value={v.title} onChange={e => {
                            const vs = [...aboutDraft.values]; vs[i] = { ...vs[i], title: e.target.value };
                            setAboutDraft(d => ({ ...d, values: vs }));
                          }} className="h-8" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Icon (Lucide)</Label>
                          <Input value={v.iconName} onChange={e => {
                            const vs = [...aboutDraft.values]; vs[i] = { ...vs[i], iconName: e.target.value };
                            setAboutDraft(d => ({ ...d, values: vs }));
                          }} className="h-8 font-mono text-xs w-24" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Description</Label>
                        <Textarea value={v.description} onChange={e => {
                          const vs = [...aboutDraft.values]; vs[i] = { ...vs[i], description: e.target.value };
                          setAboutDraft(d => ({ ...d, values: vs }));
                        }} rows={2} />
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>

          </div>
        </TabsContent>

        {/* --- Privacy Policy Tab --- */}
        <TabsContent value="privacy">
          <div className="space-y-6">
            {/* Meta */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div><CardTitle>Privacy Policy</CardTitle><CardDescription>Page header info and contact email shown in the footer of the page.</CardDescription></div>
                <Button onClick={() => saveWithFeedback(() => updatePrivacyPolicy(privacyDraft))} isLoading={isSaving} className="gap-2">
                  <Save className="h-4 w-4" /> Save All
                </Button>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Last Updated</Label>
                  <Input value={privacyDraft.lastUpdated} onChange={e => setPrivacyDraft(d => ({ ...d, lastUpdated: e.target.value }))} placeholder="October 24, 2023" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Contact Email</Label>
                  <Input value={privacyDraft.contactEmail} onChange={e => setPrivacyDraft(d => ({ ...d, contactEmail: e.target.value }))} placeholder="privacy@yoursite.com" />
                </div>
                <div className="space-y-2 md:col-span-3">
                  <Label>Page Subtitle</Label>
                  <Textarea value={privacyDraft.subtitle} onChange={e => setPrivacyDraft(d => ({ ...d, subtitle: e.target.value }))} rows={2} placeholder="We value your privacy…" />
                </div>
              </CardContent>
            </Card>

            {/* Sections */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div><CardTitle>Sections</CardTitle><CardDescription>Add, edit, or remove policy sections. Each section appears as a card on the page.</CardDescription></div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setPrivacyDraft(d => ({ ...d, sections: [...d.sections, { title: 'New Section', content: '', order: d.sections.length }] }))}>
                    <Plus className="w-4 h-4 mr-2" /> Add Section
                  </Button>
                  <Button size="sm" onClick={() => saveWithFeedback(() => updatePrivacyPolicy(privacyDraft))} isLoading={isSaving}>
                    <Save className="w-4 h-4 mr-2" /> Save
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {[...privacyDraft.sections]
                  .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                  .map((section, i) => (
                    <div key={i} className="p-4 rounded-xl border border-border bg-muted/20 space-y-3 relative">
                      <Button size="icon" variant="ghost" className="absolute top-2 right-2 h-7 w-7"
                        onClick={() => { const s = [...privacyDraft.sections]; s.splice(i, 1); setPrivacyDraft(d => ({ ...d, sections: s })); }}>
                        <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                      </Button>
                      <div className="space-y-1 pr-10">
                        <Label className="text-xs">Section Title</Label>
                        <Input value={section.title} onChange={e => {
                          const s = [...privacyDraft.sections]; s[i] = { ...s[i], title: e.target.value };
                          setPrivacyDraft(d => ({ ...d, sections: s }));
                        }} placeholder="1. Introduction" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Content</Label>
                        <Textarea value={section.content} onChange={e => {
                          const s = [...privacyDraft.sections]; s[i] = { ...s[i], content: e.target.value };
                          setPrivacyDraft(d => ({ ...d, sections: s }));
                        }} rows={4} placeholder="Section body text…" />
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* --- Terms of Service Tab --- */}
        <TabsContent value="terms">
          <div className="space-y-6">
            {/* Meta */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div><CardTitle>Terms of Service</CardTitle><CardDescription>Page header info and contact email shown in the footer of the page.</CardDescription></div>
                <Button onClick={() => saveWithFeedback(() => updateTermsOfService(termsDraft))} isLoading={isSaving} className="gap-2">
                  <Save className="h-4 w-4" /> Save All
                </Button>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Last Updated</Label>
                  <Input value={termsDraft.lastUpdated} onChange={e => setTermsDraft(d => ({ ...d, lastUpdated: e.target.value }))} placeholder="October 24, 2023" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Contact Email</Label>
                  <Input value={termsDraft.contactEmail} onChange={e => setTermsDraft(d => ({ ...d, contactEmail: e.target.value }))} placeholder="legal@yoursite.com" />
                </div>
                <div className="space-y-2 md:col-span-3">
                  <Label>Page Subtitle</Label>
                  <Textarea value={termsDraft.subtitle} onChange={e => setTermsDraft(d => ({ ...d, subtitle: e.target.value }))} rows={2} placeholder="Please read these terms carefully…" />
                </div>
              </CardContent>
            </Card>

            {/* Sections */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div><CardTitle>Sections</CardTitle><CardDescription>Add, edit, or remove terms sections. Each section appears as a card on the page.</CardDescription></div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setTermsDraft(d => ({ ...d, sections: [...d.sections, { title: 'New Section', content: '', order: d.sections.length }] }))}>
                    <Plus className="w-4 h-4 mr-2" /> Add Section
                  </Button>
                  <Button size="sm" onClick={() => saveWithFeedback(() => updateTermsOfService(termsDraft))} isLoading={isSaving}>
                    <Save className="w-4 h-4 mr-2" /> Save
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {[...termsDraft.sections]
                  .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                  .map((section, i) => (
                    <div key={i} className="p-4 rounded-xl border border-border bg-muted/20 space-y-3 relative">
                      <Button size="icon" variant="ghost" className="absolute top-2 right-2 h-7 w-7"
                        onClick={() => { const s = [...termsDraft.sections]; s.splice(i, 1); setTermsDraft(d => ({ ...d, sections: s })); }}>
                        <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                      </Button>
                      <div className="space-y-1 pr-10">
                        <Label className="text-xs">Section Title</Label>
                        <Input value={section.title} onChange={e => {
                          const s = [...termsDraft.sections]; s[i] = { ...s[i], title: e.target.value };
                          setTermsDraft(d => ({ ...d, sections: s }));
                        }} placeholder="1. Agreement to Terms" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Content</Label>
                        <Textarea value={section.content} onChange={e => {
                          const s = [...termsDraft.sections]; s[i] = { ...s[i], content: e.target.value };
                          setTermsDraft(d => ({ ...d, sections: s }));
                        }} rows={4} placeholder="Section body text…" />
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* --- Cookies Policy Tab --- */}
        <TabsContent value="cookies-policy">
          <div className="space-y-6">
            {/* Page subtitle */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div><CardTitle>Cookies Policy</CardTitle><CardDescription>The subtitle shown at the top of the Cookies Settings page.</CardDescription></div>
                <Button onClick={() => saveWithFeedback(() => updateCookiesPolicy(cookiesDraft))} isLoading={isSaving} className="gap-2">
                  <Save className="h-4 w-4" /> Save All
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label>Page Subtitle</Label>
                  <Textarea value={cookiesDraft.subtitle} onChange={e => setCookiesDraft(d => ({ ...d, subtitle: e.target.value }))} rows={2} placeholder="Manage your cookie preferences…" />
                </div>
              </CardContent>
            </Card>

            {/* Categories */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div><CardTitle>Cookie Categories</CardTitle><CardDescription>Edit the title and description for each consent category. The four keys (essential, functional, analytics, marketing) are fixed.</CardDescription></div>
                <Button size="sm" onClick={() => saveWithFeedback(() => updateCookiesPolicy(cookiesDraft))} isLoading={isSaving}>
                  <Save className="w-4 h-4 mr-2" /> Save
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {[...cookiesDraft.categories]
                  .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                  .map((cat, i) => (
                    <div key={i} className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded text-muted-foreground">{cat.key}</span>
                        <span className="text-xs text-muted-foreground">(key is fixed)</span>
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Title</Label>
                          <Input value={cat.title} onChange={e => {
                            const c = [...cookiesDraft.categories]; c[i] = { ...c[i], title: e.target.value };
                            setCookiesDraft(d => ({ ...d, categories: c }));
                          }} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Description</Label>
                          <Textarea value={cat.description} onChange={e => {
                            const c = [...cookiesDraft.categories]; c[i] = { ...c[i], description: e.target.value };
                            setCookiesDraft(d => ({ ...d, categories: c }));
                          }} rows={3} />
                        </div>
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* --- Nav & Footer Tab --- */}
        <TabsContent value="nav-footer">
          <NavFooterManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
