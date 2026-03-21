/**
 * Content Editor Page
 * Admin interface to manage dynamic website content.
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useContent, TechItem, ProcessStep, WhyChooseUsFeature } from '../../contexts/ContentContext';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { Plus, Trash2, Save, MoveUp, MoveDown, Image as ImageIcon } from 'lucide-react';

export default function ContentEditor() {
  const { 
    logoUrl, updateLogoUrl,
    techStack, updateTechStack,
    processSteps, updateProcessSteps,
    whyChooseUs, updateWhyChooseUs
  } = useContent();

  const [activeTab, setActiveTab] = useState("logo");

  // --- Handlers ---

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateLogoUrl(e.target.value);
  };

  // Tech Stack Handlers
  const addTechItem = (groupIndex: number) => {
    const newStack = [...techStack];
    newStack[groupIndex].items.push({
      name: "New Tech",
      iconName: "Code2",
      description: "Description",
      color: "text-foreground"
    });
    updateTechStack(newStack);
  };

  const removeTechItem = (groupIndex: number, itemIndex: number) => {
    const newStack = [...techStack];
    newStack[groupIndex].items.splice(itemIndex, 1);
    updateTechStack(newStack);
  };

  const updateTechItem = (groupIndex: number, itemIndex: number, field: keyof TechItem, value: string) => {
    const newStack = [...techStack];
    newStack[groupIndex].items[itemIndex] = {
      ...newStack[groupIndex].items[itemIndex],
      [field]: value
    };
    updateTechStack(newStack);
  };

  // Process/Concept to Reality Handlers
  const addProcessStep = () => {
    const newId = Math.max(...processSteps.map(s => s.id)) + 1;
    const newSteps = [...processSteps, {
      id: newId,
      title: "New Step",
      description: "Step description goes here.",
      iconName: "Lightbulb",
      color: "from-gray-500 to-gray-400",
      details: ["Detail 1"]
    }];
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
    newSteps[stepIndex].details.push("New Detail");
    updateProcessSteps(newSteps);
  };
  
  const removeProcessDetail = (stepIndex: number, detailIndex: number) => {
    const newSteps = [...processSteps];
    newSteps[stepIndex].details.splice(detailIndex, 1);
    updateProcessSteps(newSteps);
  };

  // Why Choose Us Handlers
  const updateWhyChooseUsField = (field: keyof typeof whyChooseUs, value: any) => {
    updateWhyChooseUs({ ...whyChooseUs, [field]: value });
  };

  const updateWhyPoint = (index: number, value: string) => {
    const newPoints = [...whyChooseUs.points];
    newPoints[index] = value;
    updateWhyChooseUs({ ...whyChooseUs, points: newPoints });
  };
  
  const addWhyPoint = () => {
    updateWhyChooseUs({ ...whyChooseUs, points: [...whyChooseUs.points, "New Point"] });
  };

  const removeWhyPoint = (index: number) => {
    const newPoints = [...whyChooseUs.points];
    newPoints.splice(index, 1);
    updateWhyChooseUs({ ...whyChooseUs, points: newPoints });
  };

  const updateWhyFeature = (index: number, field: keyof WhyChooseUsFeature, value: string) => {
    const newFeatures = [...whyChooseUs.features];
    newFeatures[index] = { ...newFeatures[index], [field]: value };
    updateWhyChooseUs({ ...whyChooseUs, features: newFeatures });
  };

  const addWhyFeature = () => {
    updateWhyChooseUs({ 
      ...whyChooseUs, 
      features: [...whyChooseUs.features, { title: "New Feature", iconName: "Zap", desc: "Feature description" }] 
    });
  };

  const removeWhyFeature = (index: number) => {
    const newFeatures = [...whyChooseUs.features];
    newFeatures.splice(index, 1);
    updateWhyChooseUs({ ...whyChooseUs, features: newFeatures });
  };


  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content Management</h1>
          <p className="text-muted-foreground">Manage website content, sections, and assets.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start h-auto p-2 bg-muted/50 rounded-xl mb-8 flex-wrap gap-2">
          <TabsTrigger value="logo" className="px-6 py-3 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Global Logo</TabsTrigger>
          <TabsTrigger value="tech" className="px-6 py-3 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Tech Stack</TabsTrigger>
          <TabsTrigger value="process" className="px-6 py-3 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Concept to Reality</TabsTrigger>
          <TabsTrigger value="why" className="px-6 py-3 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Why Choose Us</TabsTrigger>
        </TabsList>

        {/* --- Logo Tab --- */}
        <TabsContent value="logo">
          <Card>
            <CardHeader>
              <CardTitle>Website Logo</CardTitle>
              <CardDescription>Update the main logo displayed in the navbar and footer.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="p-8 bg-black/5 dark:bg-white/5 rounded-xl border border-border dashed">
                  <img src={logoUrl} alt="Current Logo" className="h-16 w-auto object-contain" />
                </div>
                <div className="flex-1 space-y-4 w-full">
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="logoUrl">Logo URL</Label>
                    <div className="flex gap-2">
                      <Input 
                        id="logoUrl" 
                        value={logoUrl} 
                        onChange={handleLogoChange} 
                        placeholder="https://..." 
                      />
                    </div>
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
                  <CardDescription>Manage logos and items for {group.title} section.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {group.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="relative p-4 rounded-xl border border-border bg-card/50 hover:bg-card transition-colors group">
                        <button 
                          onClick={() => removeTechItem(groupIndex, itemIndex)}
                          className="absolute top-2 right-2 p-1.5 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        
                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <div className="w-10 h-10 rounded bg-muted flex items-center justify-center text-xs overflow-hidden shrink-0">
                                {/* Placeholder for Icon Preview */}
                                {item.iconName.substring(0,2)}
                            </div>
                            <div className="flex-1 space-y-2">
                              <Input 
                                value={item.name} 
                                onChange={(e) => updateTechItem(groupIndex, itemIndex, 'name', e.target.value)}
                                className="h-8 text-sm font-semibold"
                                placeholder="Tech Name"
                              />
                              <Input 
                                value={item.description} 
                                onChange={(e) => updateTechItem(groupIndex, itemIndex, 'description', e.target.value)}
                                className="h-7 text-xs"
                                placeholder="Description"
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                             <div>
                               <Label className="text-[10px] uppercase text-muted-foreground">Icon Key</Label>
                               <Input 
                                 value={item.iconName} 
                                 onChange={(e) => updateTechItem(groupIndex, itemIndex, 'iconName', e.target.value)}
                                 className="h-7 text-xs font-mono"
                               />
                             </div>
                             <div>
                               <Label className="text-[10px] uppercase text-muted-foreground">Color Class</Label>
                               <Input 
                                 value={item.color} 
                                 onChange={(e) => updateTechItem(groupIndex, itemIndex, 'color', e.target.value)}
                                 className="h-7 text-xs font-mono"
                               />
                             </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <button 
                      onClick={() => addTechItem(groupIndex)}
                      className="flex flex-col items-center justify-center p-6 rounded-xl border border-border border-dashed hover:bg-muted/50 transition-colors text-muted-foreground hover:text-primary gap-2 h-full min-h-[160px]"
                    >
                      <Plus className="w-8 h-8" />
                      <span className="text-sm font-medium">Add Tech Item</span>
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* --- Process / Concept to Reality Tab --- */}
        <TabsContent value="process">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>From Concept to Reality</CardTitle>
                <CardDescription>Manage the process steps timeline.</CardDescription>
              </div>
              <Button onClick={addProcessStep} size="sm"><Plus className="w-4 h-4 mr-2" /> Add Step</Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {processSteps.map((step, index) => (
                <div key={step.id} className="p-6 rounded-xl border border-border bg-card/50 relative">
                  <div className="absolute top-4 right-4 flex gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500" onClick={() => removeProcessStep(index)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Step Title</Label>
                        <Input value={step.title} onChange={(e) => updateProcessStep(index, 'title', e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea value={step.description} onChange={(e) => updateProcessStep(index, 'description', e.target.value)} rows={3} />
                      </div>
                      <div className="flex gap-4">
                        <div className="space-y-2 flex-1">
                          <Label>Icon Name</Label>
                          <Input value={step.iconName} onChange={(e) => updateProcessStep(index, 'iconName', e.target.value)} />
                        </div>
                        <div className="space-y-2 flex-1">
                          <Label>Gradient Color</Label>
                          <Input value={step.color} onChange={(e) => updateProcessStep(index, 'color', e.target.value)} />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <Label>Bullet Points / Details</Label>
                      {step.details.map((detail, dIndex) => (
                        <div key={dIndex} className="flex gap-2">
                          <Input 
                            value={detail} 
                            onChange={(e) => updateProcessDetail(index, dIndex, e.target.value)} 
                          />
                          <Button variant="ghost" size="icon" onClick={() => removeProcessDetail(index, dIndex)}>
                            <Trash2 className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={() => addProcessDetail(index)} className="w-full">
                        <Plus className="w-3 h-3 mr-2" /> Add Detail
                      </Button>
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
              <CardHeader>
                <CardTitle>Section Content</CardTitle>
                <CardDescription>Main title and description for "Why Choose Us"</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <Label>Title Line 1</Label>
                      <Input value={whyChooseUs.titleLine1} onChange={(e) => updateWhyChooseUsField('titleLine1', e.target.value)} />
                   </div>
                   <div className="space-y-2">
                      <Label>Title Line 2 (Highlighted)</Label>
                      <Input value={whyChooseUs.titleLine2} onChange={(e) => updateWhyChooseUsField('titleLine2', e.target.value)} />
                   </div>
                </div>
                <div className="space-y-2">
                   <Label>Description</Label>
                   <Textarea value={whyChooseUs.description} onChange={(e) => updateWhyChooseUsField('description', e.target.value)} rows={3} />
                </div>
              </CardContent>
            </Card>
            
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Key Points</CardTitle>
                  <Button size="sm" variant="ghost" onClick={addWhyPoint}><Plus className="w-4 h-4" /></Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {whyChooseUs.points.map((point, i) => (
                    <div key={i} className="flex gap-2">
                      <Input value={point} onChange={(e) => updateWhyPoint(i, e.target.value)} />
                      <Button size="icon" variant="ghost" onClick={() => removeWhyPoint(i)}>
                        <Trash2 className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Scrolling Cards</CardTitle>
                  <Button size="sm" variant="ghost" onClick={addWhyFeature}><Plus className="w-4 h-4" /></Button>
                </CardHeader>
                <CardContent className="max-h-[400px] overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                  {whyChooseUs.features.map((feature, i) => (
                    <div key={i} className="p-4 border rounded-lg bg-muted/20 space-y-3 relative">
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="absolute top-2 right-2 h-6 w-6" 
                        onClick={() => removeWhyFeature(i)}
                      >
                        <Trash2 className="w-3 h-3 text-muted-foreground" />
                      </Button>
                      
                      <div className="space-y-1">
                        <Label className="text-xs">Title</Label>
                        <Input value={feature.title} onChange={(e) => updateWhyFeature(i, 'title', e.target.value)} className="h-8" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Description</Label>
                        <Input value={feature.desc} onChange={(e) => updateWhyFeature(i, 'desc', e.target.value)} className="h-8" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Icon Name</Label>
                        <Input value={feature.iconName} onChange={(e) => updateWhyFeature(i, 'iconName', e.target.value)} className="h-8 font-mono text-xs" />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}