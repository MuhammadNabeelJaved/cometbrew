import React, { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
    Workflow, Plus, X, Save, Trash2, Edit3, RefreshCw, Mail,
    Clock, Zap, ChevronDown, ChevronUp, AlertCircle, CheckCircle2,
    Loader2, ToggleLeft, ToggleRight, LayoutTemplate, Eye, ArrowRight,
    Sparkles, Code2, RotateCcw, FileText, Settings, Wand2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Select, SelectItem } from '../../components/ui/select';
import { emailAutomationsApi, EmailAutomation, EmailTemplate, TriggerType } from '../../api/emailAutomations.api';

// ─── Constants ────────────────────────────────────────────────────────────────
const TRIGGERS: { value: TriggerType; label: string; description: string; badge: string; color: string }[] = [
    { value: 'project_completed',   label: 'Project Completed',    description: 'Fires when a project is marked completed',       badge: 'bg-green-500/10 text-green-600 border-green-500/20',   color: '#22c55e' },
    { value: 'project_approved',    label: 'Project Approved',     description: 'Fires when a project request is approved',       badge: 'bg-blue-500/10 text-blue-600 border-blue-500/20',      color: '#3b82f6' },
    { value: 'project_rejected',    label: 'Project Rejected',     description: 'Fires when a project request is rejected',       badge: 'bg-red-500/10 text-red-600 border-red-500/20',         color: '#ef4444' },
    { value: 'milestone_ready',     label: 'Milestone Ready',      description: 'Fires when a milestone needs client approval',   badge: 'bg-amber-500/10 text-amber-600 border-amber-500/20',   color: '#f59e0b' },
    { value: 'milestone_approved',  label: 'Milestone Approved',   description: 'Fires when a client approves a milestone',      badge: 'bg-green-500/10 text-green-600 border-green-500/20',   color: '#22c55e' },
    { value: 'welcome_user',        label: 'Welcome User',         description: 'Fires when a new user verifies their email',    badge: 'bg-violet-500/10 text-violet-600 border-violet-500/20', color: '#7c3aed' },
    { value: 'review_request',      label: 'Review Request',       description: 'Delayed review nudge after project completion', badge: 'bg-pink-500/10 text-pink-600 border-pink-500/20',       color: '#ec4899' },
    { value: 'payment_reminder',    label: 'Payment Reminder',     description: 'Fires when payment is overdue',                 badge: 'bg-orange-500/10 text-orange-600 border-orange-500/20', color: '#f97316' },
    { value: 'inactivity_followup', label: 'Inactivity Follow-up', description: 'Fires after N hours of client inactivity',     badge: 'bg-slate-500/10 text-slate-600 border-slate-500/20',    color: '#64748b' },
];

const PLACEHOLDERS = [
    '{{NAME}}', '{{EMAIL}}', '{{PROJECT_NAME}}', '{{PROJECT_TYPE}}', '{{BUDGET_RANGE}}',
    '{{DEADLINE}}', '{{MILESTONE_TITLE}}', '{{COMPLETED_DATE}}', '{{TOTAL_COST}}',
    '{{PAID_AMOUNT}}', '{{DUE_AMOUNT}}', '{{DASHBOARD_URL}}', '{{REVIEW_URL}}',
    '{{FEEDBACK_URL}}', '{{CLIENT_URL}}', '{{ADMIN_URL}}',
];

const EMPTY_FORM: Partial<EmailAutomation> = {
    name: '', trigger: 'project_completed', delayHours: 0,
    isEnabled: true, emailSubject: '', emailBody: '', emailText: '',
};

// ─── Template Preview Modal ───────────────────────────────────────────────────
function TemplatePreviewModal({ template, onClose }: { template: EmailTemplate; onClose: () => void }) {
    return createPortal(
        <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-background border border-border rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col" style={{ maxHeight: '92vh' }}>
                <div className="flex items-center justify-between px-5 py-4 border-b border-border/50 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <LayoutTemplate className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                            <p className="font-semibold text-sm">{template.name}</p>
                            <p className="text-xs text-muted-foreground">{template.description}</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-8 w-8">
                        <X className="h-4 w-4" />
                    </Button>
                </div>
                <div className="flex-1 overflow-hidden bg-[#f5f5f5] rounded-b-2xl">
                    <iframe title={template.name} srcDoc={template.html} className="w-full border-0" style={{ height: '600px' }} sandbox="allow-same-origin" />
                </div>
            </div>
        </div>,
        document.body
    );
}

// ─── Template Editor Modal ────────────────────────────────────────────────────
function TemplateEditorModal({
    template,
    onSave,
    onClose,
}: {
    template: EmailTemplate | null;
    onSave: (t: EmailTemplate, html: string, meta: Partial<EmailTemplate>) => Promise<void>;
    onClose: () => void;
}) {
    const isNew = !template;
    const [html, setHtml] = useState(template?.html || '');
    const [name, setName] = useState(template?.name || '');
    const [description, setDescription] = useState(template?.description || '');
    const [bestFor, setBestFor] = useState<string>(template?.bestFor || 'custom');
    const [suggestedSubject, setSuggestedSubject] = useState(template?.suggestedSubject || '');
    const [saving, setSaving] = useState(false);
    const [previewHtml, setPreviewHtml] = useState(template?.html || '');
    const previewRef = useRef<HTMLIFrameElement>(null);

    const updatePreview = () => setPreviewHtml(html);

    const handleSave = async () => {
        if (!name.trim()) { toast.error('Template name is required'); return; }
        if (!html.trim()) { toast.error('HTML is required'); return; }
        setSaving(true);
        try {
            await onSave(template as EmailTemplate, html, { name, description, bestFor: bestFor as any, suggestedSubject });
            onClose();
        } catch (e: any) {
            toast.error(e?.response?.data?.message || e.message || 'Failed to save');
        } finally { setSaving(false); }
    };

    return createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-background border border-border rounded-2xl w-full shadow-2xl flex flex-col" style={{ maxWidth: 'min(95vw, 1200px)', maxHeight: '95vh', height: '95vh' }}>
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border/50 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <Code2 className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                            <h2 className="font-bold">{isNew ? 'New Template' : `Edit: ${template?.name}`}</h2>
                            <p className="text-xs text-muted-foreground">Edit HTML · live preview on right</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={updatePreview} className="gap-1.5 h-8 text-xs">
                            <Eye className="h-3.5 w-3.5" /> Refresh Preview
                        </Button>
                        <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5 h-8 text-xs">
                            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                            {saving ? 'Saving…' : 'Save Template'}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-8 w-8">
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Meta fields */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-5 py-3 border-b border-border/40 bg-muted/20 shrink-0">
                    <div className="sm:col-span-1 space-y-1">
                        <Label className="text-xs">Template Name *</Label>
                        <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Welcome Email" className="h-8 text-xs" />
                    </div>
                    <div className="sm:col-span-1 space-y-1">
                        <Label className="text-xs">Best For (trigger)</Label>
                        <Select value={bestFor} onValueChange={setBestFor}>
                            <SelectItem value="custom">Custom / General</SelectItem>
                            {TRIGGERS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                        </Select>
                    </div>
                    <div className="sm:col-span-1 space-y-1">
                        <Label className="text-xs">Suggested Subject</Label>
                        <Input value={suggestedSubject} onChange={e => setSuggestedSubject(e.target.value)} placeholder='e.g. Your project is ready!' className="h-8 text-xs" />
                    </div>
                    <div className="sm:col-span-1 space-y-1">
                        <Label className="text-xs">Description</Label>
                        <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Short description" className="h-8 text-xs" />
                    </div>
                </div>

                {/* Split pane */}
                <div className="flex-1 grid grid-cols-2 overflow-hidden min-h-0">
                    {/* Left — HTML editor */}
                    <div className="border-r border-border/40 flex flex-col overflow-hidden">
                        <div className="px-4 py-2 border-b border-border/30 bg-muted/10 shrink-0 flex items-center gap-2">
                            <Code2 className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs font-medium text-muted-foreground">HTML Editor</span>
                            <span className="ml-auto text-[10px] text-muted-foreground/60">{html.length} chars</span>
                        </div>
                        <textarea
                            value={html}
                            onChange={e => setHtml(e.target.value)}
                            className="flex-1 w-full resize-none font-mono text-xs p-4 bg-background outline-none text-foreground leading-relaxed overflow-y-auto"
                            placeholder="<!DOCTYPE html>..."
                            spellCheck={false}
                        />
                    </div>

                    {/* Right — live preview */}
                    <div className="flex flex-col overflow-hidden bg-[#f5f5f5]">
                        <div className="px-4 py-2 border-b border-border/30 bg-muted/10 shrink-0 flex items-center gap-2">
                            <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs font-medium text-muted-foreground">Live Preview</span>
                            <span className="ml-auto text-[10px] text-muted-foreground/60 italic">Placeholders shown as-is</span>
                        </div>
                        <div className="flex-1 overflow-auto">
                            <iframe
                                ref={previewRef}
                                title="preview"
                                srcDoc={previewHtml}
                                className="w-full border-0"
                                style={{ minHeight: '100%', height: '100%' }}
                                sandbox="allow-same-origin"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}

// ─── AI Generate Dialog ───────────────────────────────────────────────────────
function AIGenerateDialog({
    onClose,
    onGenerated,
}: {
    onClose: () => void;
    onGenerated: (html: string, meta: Partial<EmailTemplate>) => void;
}) {
    const [trigger, setTrigger] = useState<string>('custom');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [tone, setTone] = useState('professional and friendly');
    const [generating, setGenerating] = useState(false);
    const [generatedHtml, setGeneratedHtml] = useState('');
    const [step, setStep] = useState<'form' | 'preview'>('form');

    const triggerInfo = TRIGGERS.find(t => t.value === trigger);

    const handleGenerate = async () => {
        if (!name.trim() && !description.trim()) {
            toast.error('Please enter a name or description for the template');
            return;
        }
        setGenerating(true);
        try {
            const { html } = await emailAutomationsApi.generateTemplate({ trigger: trigger !== 'custom' ? trigger : undefined, name, description, tone });
            setGeneratedHtml(html);
            setStep('preview');
            toast.success('Template generated!');
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'AI generation failed. Check server logs.');
        } finally {
            setGenerating(false);
        }
    };

    const handleUse = () => {
        onGenerated(generatedHtml, {
            name: name || 'AI Generated Template',
            description,
            bestFor: (trigger !== 'custom' ? trigger : 'custom') as any,
            suggestedSubject: triggerInfo ? triggerInfo.description : '',
        });
        onClose();
    };

    return createPortal(
        <div className="fixed inset-0 z-[205] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200"
                style={{ background: 'linear-gradient(135deg, rgba(15,10,30,0.98) 0%, rgba(20,10,40,0.98) 100%)', border: '1px solid rgba(255,255,255,0.08)' }}>

                {/* Ambient glow */}
                <div className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none"
                    style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />

                {/* Header */}
                <div className="relative flex items-center justify-between px-6 py-5 border-b border-white/8">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(236,72,153,0.15))', border: '1px solid rgba(124,58,237,0.3)' }}>
                            <Sparkles className="h-5 w-5 text-violet-400" />
                        </div>
                        <div>
                            <h2 className="font-bold text-base text-white">Design with AI</h2>
                            <p className="text-xs text-white/50 mt-0.5">Tell Claude what you need — it'll design the full template</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {step === 'form' ? (
                    <div className="relative p-6 space-y-4">
                        {/* Trigger */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-white/60 uppercase tracking-wide">What is this email for?</label>
                            <Select value={trigger} onValueChange={setTrigger}
                                className="w-full h-9 text-sm rounded-lg text-white"
                                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}>
                                <SelectItem value="custom">Custom / General</SelectItem>
                                {TRIGGERS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                            </Select>
                            {triggerInfo && <p className="text-xs text-violet-400/80">{triggerInfo.description}</p>}
                        </div>

                        {/* Name */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-white/60 uppercase tracking-wide">Template name</label>
                            <input
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="e.g. New Service Launch Announcement"
                                className="w-full h-9 px-3 text-sm rounded-lg text-white placeholder-white/25 outline-none transition-colors focus:border-violet-500/60"
                                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-white/60 uppercase tracking-wide">Describe what this email should say</label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                rows={4}
                                placeholder="e.g. Tell the client their project has started, mention the team lead name ({{TEAM_LEAD}}), show the deadline, include a warm welcome and a dashboard link..."
                                className="w-full px-3 py-2 text-sm rounded-lg text-white placeholder-white/25 outline-none resize-none transition-colors focus:border-violet-500/60"
                                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                            />
                            <p className="text-xs text-white/35">The more detail you give, the better the result.</p>
                        </div>

                        {/* Tone */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-white/60 uppercase tracking-wide">Tone</label>
                            <Select value={tone} onValueChange={setTone}
                                className="w-full h-9 text-sm rounded-lg text-white"
                                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}>
                                <SelectItem value="professional and friendly">Professional &amp; Friendly</SelectItem>
                                <SelectItem value="warm and personal">Warm &amp; Personal</SelectItem>
                                <SelectItem value="formal and corporate">Formal &amp; Corporate</SelectItem>
                                <SelectItem value="casual and conversational">Casual &amp; Conversational</SelectItem>
                                <SelectItem value="urgent and action-oriented">Urgent &amp; Action-Oriented</SelectItem>
                                <SelectItem value="celebratory and exciting">Celebratory &amp; Exciting</SelectItem>
                            </Select>
                        </div>

                        {/* Design reference note */}
                        <div className="flex items-start gap-2.5 p-3 rounded-xl" style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)' }}>
                            <Sparkles className="h-4 w-4 text-violet-400 mt-0.5 shrink-0" />
                            <p className="text-xs text-white/50">
                                AI will design the template using the <span className="text-white font-medium">same design system</span> as your existing templates — same colors, logo, responsive layout, inline CSS, and CTA buttons.
                            </p>
                        </div>

                        <div className="flex gap-3 pt-1">
                            <button
                                onClick={handleGenerate}
                                disabled={generating}
                                className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60"
                                style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)' }}
                            >
                                {generating
                                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Designing template…</>
                                    : <><Wand2 className="h-4 w-4" /> Generate Template</>
                                }
                            </button>
                            <button onClick={onClose}
                                className="px-5 h-10 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/8 transition-colors"
                                style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col" style={{ maxHeight: '80vh' }}>
                        <div className="px-6 py-3 border-b shrink-0 flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                <span className="text-sm font-medium text-white/80">Template generated — preview below</span>
                            </div>
                            <button onClick={() => setStep('form')}
                                className="flex items-center gap-1.5 px-3 h-7 rounded-lg text-xs text-white/50 hover:text-white hover:bg-white/8 transition-colors"
                                style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                                <RotateCcw className="h-3 w-3" /> Regenerate
                            </button>
                        </div>
                        <div className="flex-1 overflow-hidden bg-[#f5f5f5]">
                            <iframe title="ai-preview" srcDoc={generatedHtml} className="w-full border-0" style={{ height: '400px' }} sandbox="allow-same-origin" />
                        </div>
                        <div className="flex gap-3 p-4 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                            <button onClick={handleUse}
                                className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-semibold text-white transition-opacity"
                                style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
                                <Save className="h-4 w-4" /> Use &amp; Edit this Template
                            </button>
                            <button onClick={() => setStep('form')}
                                className="px-5 h-10 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/8 transition-colors"
                                style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                                Back
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}

// ─── Templates Tab ─────────────────────────────────────────────────────────────
function TemplatesTab() {
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [previewing, setPreviewing] = useState<EmailTemplate | null>(null);
    const [editing, setEditing] = useState<EmailTemplate | null | 'new'>(null);
    const [showAI, setShowAI] = useState(false);
    const [aiInitial, setAiInitial] = useState<{ html: string; meta: Partial<EmailTemplate> } | null>(null);
    const [filter, setFilter] = useState<'all' | 'builtin' | 'custom'>('all');

    const load = useCallback(async () => {
        setLoading(true);
        try { setTemplates(await emailAutomationsApi.getTemplates()); }
        catch { toast.error('Failed to load templates'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleSave = async (t: EmailTemplate | null, html: string, meta: Partial<EmailTemplate>) => {
        if (!t) {
            // New custom template
            await emailAutomationsApi.createTemplate({ ...meta, html, isCustom: true });
            toast.success('Template saved');
        } else if (t.isCustom && t._id) {
            // Update custom
            await emailAutomationsApi.updateTemplate(t._id, { ...meta, html });
            toast.success('Template updated');
        } else {
            // Update built-in (upsert override) — id is the file name
            const id = t.file!;
            await emailAutomationsApi.updateTemplate(id, { ...meta, html });
            toast.success('Template updated');
        }
        await load();
    };

    const handleDelete = async (t: EmailTemplate) => {
        if (!confirm(`Delete "${t.name}"? This cannot be undone.`)) return;
        try {
            await emailAutomationsApi.deleteTemplate(t._id!);
            toast.success('Template deleted');
            await load();
        } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed to delete'); }
    };

    const handleReset = async (t: EmailTemplate) => {
        if (!confirm(`Reset "${t.name}" to its original built-in version? Your edits will be lost.`)) return;
        try {
            await emailAutomationsApi.resetTemplate(t.file!);
            toast.success('Template reset to original');
            await load();
        } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed to reset'); }
    };

    const handleAIGenerated = (html: string, meta: Partial<EmailTemplate>) => {
        setAiInitial({ html, meta });
        setEditing('new');
    };

    const filtered = templates.filter(t => {
        if (filter === 'builtin') return !t.isCustom;
        if (filter === 'custom') return t.isCustom;
        return true;
    });

    const getTriggerInfo = (bt: string) => TRIGGERS.find(x => x.value === bt);

    return (
        <>
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-2">
                    {(['all', 'builtin', 'custom'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                                ${filter === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                        >
                            {f === 'all' ? `All (${templates.length})` : f === 'builtin' ? `Built-in (${templates.filter(t => !t.isCustom).length})` : `Custom (${templates.filter(t => t.isCustom).length})`}
                        </button>
                    ))}
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={load} className="gap-1.5 h-8 text-xs">
                        <RefreshCw className="h-3.5 w-3.5" /> Refresh
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setShowAI(true)} className="gap-1.5 h-8 text-xs border-violet-500/30 text-violet-600 hover:bg-violet-500/10">
                        <Sparkles className="h-3.5 w-3.5" /> Design with AI
                    </Button>
                    <Button size="sm" onClick={() => { setAiInitial(null); setEditing('new'); }} className="gap-1.5 h-8 text-xs">
                        <Plus className="h-3.5 w-3.5" /> New Template
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filtered.map(t => {
                        const info = getTriggerInfo(t.bestFor);
                        return (
                            <div key={t._id || t.file} className="group border border-border/40 rounded-xl bg-card overflow-hidden flex flex-col hover:border-border/70 transition-colors">
                                {/* Preview thumbnail */}
                                <div className="relative h-40 bg-[#f5f5f5] overflow-hidden border-b border-border/30 shrink-0">
                                    <iframe
                                        title={t.name}
                                        srcDoc={t.html}
                                        className="w-full border-0 pointer-events-none"
                                        style={{ height: '400px', transform: 'scale(0.35)', transformOrigin: 'top left', width: '285%' }}
                                        sandbox="allow-same-origin"
                                    />
                                    {/* Overlay badges */}
                                    <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
                                        {t.aiGenerated && (
                                            <span className="flex items-center gap-0.5 text-[10px] font-semibold bg-violet-600 text-white px-1.5 py-0.5 rounded-full">
                                                <Sparkles className="h-2.5 w-2.5" /> AI
                                            </span>
                                        )}
                                        {t.isCustom && !t.aiGenerated && (
                                            <span className="text-[10px] font-semibold bg-blue-600 text-white px-1.5 py-0.5 rounded-full">Custom</span>
                                        )}
                                        {t.isEdited && (
                                            <span className="text-[10px] font-medium bg-amber-500 text-white px-1.5 py-0.5 rounded-full">Edited</span>
                                        )}
                                    </div>
                                    {/* Hover overlay */}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                        <Button size="sm" variant="secondary" onClick={() => setPreviewing(t)} className="gap-1.5 shadow-lg h-8 text-xs">
                                            <Eye className="h-3.5 w-3.5" /> Preview
                                        </Button>
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="p-4 flex flex-col gap-2 flex-1">
                                    <div>
                                        <p className="font-semibold text-sm leading-tight">{t.name}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{t.description}</p>
                                    </div>
                                    {info && (
                                        <Badge className={`border text-[10px] w-fit ${info.badge}`}>{info.label}</Badge>
                                    )}
                                    {!info && t.bestFor === 'custom' && (
                                        <Badge className="border text-[10px] w-fit bg-muted text-muted-foreground border-border/40">Custom</Badge>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="px-4 pb-4 flex gap-2">
                                    <Button variant="outline" size="sm" className="flex-1 gap-1.5 h-8 text-xs" onClick={() => setEditing(t)}>
                                        <Edit3 className="h-3 w-3" /> Edit
                                    </Button>
                                    {t.isEdited && t.file && (
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-500/10" title="Reset to original" onClick={() => handleReset(t)}>
                                            <RotateCcw className="h-3.5 w-3.5" />
                                        </Button>
                                    )}
                                    {t.isCustom && t._id && (
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(t)}>
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Template Editor */}
            {editing !== null && (
                <TemplateEditorModal
                    template={editing === 'new' ? (aiInitial ? { ...aiInitial.meta, html: aiInitial.html, _id: null, file: null, isCustom: true, aiGenerated: !!aiInitial, placeholders: [], isEdited: false } as EmailTemplate : null) : editing}
                    onSave={handleSave}
                    onClose={() => { setEditing(null); setAiInitial(null); }}
                />
            )}

            {/* AI Dialog */}
            {showAI && <AIGenerateDialog onClose={() => setShowAI(false)} onGenerated={handleAIGenerated} />}

            {/* Preview Modal */}
            {previewing && <TemplatePreviewModal template={previewing} onClose={() => setPreviewing(null)} />}
        </>
    );
}

// ─── Automation Form ──────────────────────────────────────────────────────────
function AutomationForm({ initial, onSave, onClose }: {
    initial?: Partial<EmailAutomation>;
    onSave: (data: Partial<EmailAutomation>) => Promise<void>;
    onClose: () => void;
}) {
    const [form, setForm] = useState<Partial<EmailAutomation>>({ ...EMPTY_FORM, ...initial });
    const [saving, setSaving] = useState(false);
    const [showPlaceholders, setShowPlaceholders] = useState(false);
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [showTemplates, setShowTemplates] = useState(false);
    const [appliedTemplate, setAppliedTemplate] = useState<string | null>(null);
    const [previewing, setPreviewing] = useState<EmailTemplate | null>(null);
    const isEdit = !!initial?._id;

    useEffect(() => {
        emailAutomationsApi.getTemplates().then(setTemplates).catch(() => {});
    }, []);

    const set = (k: keyof EmailAutomation, v: any) => setForm(f => ({ ...f, [k]: v }));
    const insertPlaceholder = (p: string) => setForm(f => ({ ...f, emailBody: (f.emailBody || '') + p }));

    const applyTemplate = (t: EmailTemplate) => {
        setForm(f => ({ ...f, emailBody: t.html, emailSubject: f.emailSubject || t.suggestedSubject }));
        setAppliedTemplate(t.name);
        setShowTemplates(false);
        toast.success(`Template "${t.name}" loaded`);
    };

    const handleSubmit = async () => {
        if (!form.name || !form.trigger || !form.emailSubject || !form.emailBody) {
            toast.error('Name, trigger, subject, and body are required');
            return;
        }
        setSaving(true);
        try { await onSave(form); onClose(); }
        catch (e: any) { toast.error(e?.response?.data?.message || e.message || 'Failed to save'); }
        finally { setSaving(false); }
    };

    const triggerInfo = TRIGGERS.find(t => t.value === form.trigger);
    const sortedTemplates = [...templates].sort((a, b) => {
        const aM = a.bestFor === form.trigger ? 0 : 1;
        const bM = b.bestFor === form.trigger ? 0 : 1;
        return aM - bM;
    });

    return createPortal(
        <div className="fixed inset-0 z-[200] flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-background border border-border rounded-2xl w-full max-w-2xl my-4 shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="p-6 space-y-5">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-border/50 pb-4">
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-xl font-bold">{isEdit ? 'Edit Automation' : 'New Automation'}</h2>
                                {appliedTemplate && (
                                    <span className="flex items-center gap-1 text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-medium">
                                        <LayoutTemplate className="h-3 w-3" />{appliedTemplate}
                                    </span>
                                )}
                            </div>
                            <p className="text-muted-foreground text-sm mt-0.5">Configure an automated email rule.</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full"><X className="h-4 w-4" /></Button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Name */}
                        <div className="lg:col-span-2 space-y-1.5">
                            <Label>Automation Name</Label>
                            <Input value={form.name || ''} onChange={e => set('name', e.target.value)} placeholder="e.g. Project Completed — Thank You Email" />
                        </div>

                        {/* Trigger */}
                        <div className="space-y-1.5">
                            <Label>Trigger Event</Label>
                            <Select value={form.trigger} onValueChange={(val: any) => set('trigger', val as TriggerType)}>
                                {TRIGGERS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                            </Select>
                            {triggerInfo && <p className="text-xs text-muted-foreground">{triggerInfo.description}</p>}
                        </div>

                        {/* Delay */}
                        <div className="space-y-1.5">
                            <Label>Delay (hours, 0 = immediate)</Label>
                            <Input type="number" min={0} max={8760} value={form.delayHours ?? 0} onChange={e => set('delayHours', Number(e.target.value))} />
                            {(form.delayHours || 0) > 0 && (
                                <p className="text-xs text-muted-foreground">Sends {form.delayHours}h ({((form.delayHours || 0) / 24).toFixed(1)} days) after trigger</p>
                            )}
                        </div>

                        {/* Template picker */}
                        {sortedTemplates.length > 0 && (
                            <div className="lg:col-span-2">
                                <button
                                    type="button"
                                    onClick={() => setShowTemplates(o => !o)}
                                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors text-sm font-medium text-primary"
                                >
                                    <span className="flex items-center gap-2">
                                        <LayoutTemplate className="h-4 w-4" />
                                        {appliedTemplate ? `Template: ${appliedTemplate} — change` : 'Use a pre-built email template'}
                                    </span>
                                    {showTemplates ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </button>

                                {showTemplates && (
                                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                                        {sortedTemplates.map(t => {
                                            const isRecommended = t.bestFor === form.trigger;
                                            return (
                                                <div key={t._id || t.file} className={`relative border rounded-xl p-3 flex flex-col gap-2 transition-colors ${isRecommended ? 'border-primary/40 bg-primary/5' : 'border-border/40 bg-card'}`}>
                                                    {isRecommended && <span className="absolute top-2 right-2 text-[10px] font-semibold bg-primary text-primary-foreground px-2 py-0.5 rounded-full">Best match</span>}
                                                    <p className="font-semibold text-xs pr-16">{t.name}</p>
                                                    <p className="text-[11px] text-muted-foreground line-clamp-1">{t.description}</p>
                                                    <div className="flex gap-1.5 mt-auto">
                                                        <Button type="button" variant="outline" size="sm" className="flex-1 h-7 text-[11px] gap-1" onClick={() => setPreviewing(t)}>
                                                            <Eye className="h-3 w-3" /> Preview
                                                        </Button>
                                                        <Button type="button" size="sm" className="flex-1 h-7 text-[11px] gap-1" onClick={() => applyTemplate(t)}>
                                                            <ArrowRight className="h-3 w-3" /> Use
                                                        </Button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Subject */}
                        <div className="lg:col-span-2 space-y-1.5">
                            <Label>Email Subject</Label>
                            <Input value={form.emailSubject || ''} onChange={e => set('emailSubject', e.target.value)} placeholder="Your project {{PROJECT_NAME}} is complete!" />
                        </div>

                        {/* Body */}
                        <div className="lg:col-span-2 space-y-1.5">
                            <div className="flex items-center justify-between">
                                <Label>Email Body (HTML)</Label>
                                <Button type="button" variant="ghost" size="sm" onClick={() => setShowPlaceholders(o => !o)} className="h-7 gap-1.5 text-xs text-primary">
                                    <Zap className="h-3 w-3" /> Placeholders
                                </Button>
                            </div>
                            {appliedTemplate && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <LayoutTemplate className="h-3 w-3 text-primary" />
                                    Using <strong className="text-primary">{appliedTemplate}</strong> — edit below or pick a different template above.
                                </p>
                            )}
                            {showPlaceholders && (
                                <div className="flex flex-wrap gap-1.5 p-3 bg-muted/50 rounded-lg border border-border/40">
                                    {PLACEHOLDERS.map(p => (
                                        <button key={p} type="button" onClick={() => insertPlaceholder(p)} className="text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-1 rounded-md hover:bg-primary/20 transition-colors font-mono">
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            )}
                            <Textarea
                                value={form.emailBody || ''}
                                onChange={e => set('emailBody', e.target.value)}
                                rows={8}
                                placeholder={`<p>Hi {{NAME}},</p>\n<p>Your project <strong>{{PROJECT_NAME}}</strong> is complete!</p>`}
                                className="font-mono text-xs"
                            />
                        </div>

                        {/* Plain text */}
                        <div className="lg:col-span-2 space-y-1.5">
                            <Label>Plain-text fallback <span className="text-xs font-normal text-muted-foreground ml-1">(optional)</span></Label>
                            <Textarea value={form.emailText || ''} onChange={e => set('emailText', e.target.value)} rows={3} placeholder="Hi {{NAME}}, your project {{PROJECT_NAME}} is complete..." />
                        </div>

                        {/* Enabled toggle */}
                        <div className="lg:col-span-2">
                            <div onClick={() => set('isEnabled', !form.isEnabled)} className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-border/40 hover:bg-muted/50 transition-colors">
                                <div className={`w-9 h-5 rounded-full relative transition-colors shrink-0 ${form.isEnabled ? 'bg-green-500' : 'bg-muted-foreground/30'}`}>
                                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${form.isEnabled ? 'left-[18px]' : 'left-0.5'}`} />
                                </div>
                                <span className="text-sm">{form.isEnabled ? 'Enabled — will fire on trigger' : 'Disabled — will not fire'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex gap-3 pt-1 border-t border-border/50">
                        <Button onClick={handleSubmit} disabled={saving} className="flex-1 gap-2">
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {saving ? 'Saving…' : (isEdit ? 'Update Automation' : 'Create Automation')}
                        </Button>
                        <Button variant="outline" onClick={onClose}>Cancel</Button>
                    </div>
                </div>
            </div>

            {previewing && <TemplatePreviewModal template={previewing} onClose={() => setPreviewing(null)} />}
        </div>,
        document.body
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminEmailAutomations() {
    const [activeTab, setActiveTab] = useState<'automations' | 'templates'>('automations');
    const [automations, setAutomations] = useState<EmailAutomation[]>([]);
    const [stats, setStats]             = useState<any>(null);
    const [loading, setLoading]         = useState(true);
    const [showForm, setShowForm]       = useState(false);
    const [editing, setEditing]         = useState<EmailAutomation | null>(null);
    const [expanded, setExpanded]       = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [data, s] = await Promise.all([
                emailAutomationsApi.getAll(),
                emailAutomationsApi.getStats().catch(() => null),
            ]);
            setAutomations(data);
            setStats(s);
        } catch { toast.error('Failed to load automations'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { if (activeTab === 'automations') load(); }, [load, activeTab]);

    const handleCreate = async (data: Partial<EmailAutomation>) => {
        const a = await emailAutomationsApi.create(data);
        setAutomations(prev => [a, ...prev]);
        toast.success('Automation created');
    };

    const handleUpdate = async (data: Partial<EmailAutomation>) => {
        const a = await emailAutomationsApi.update(editing!._id, data);
        setAutomations(prev => prev.map(x => x._id === a._id ? a : x));
        toast.success('Automation updated');
    };

    const handleToggle = async (id: string) => {
        try {
            const a = await emailAutomationsApi.toggle(id);
            setAutomations(prev => prev.map(x => x._id === id ? a : x));
        } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed to toggle'); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this automation?')) return;
        try {
            await emailAutomationsApi.delete(id);
            setAutomations(prev => prev.filter(x => x._id !== id));
            toast.success('Automation deleted');
        } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed to delete'); }
    };

    const getTriggerInfo = (t: TriggerType) => TRIGGERS.find(x => x.value === t);
    const enabledCount   = automations.filter(a => a.isEnabled).length;
    const totalSent      = stats?.totalSent || 0;

    return (
        <div className="space-y-6 p-6 max-w-7xl mx-auto">
            {/* Page header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Email Automations</h1>
                    <p className="text-muted-foreground mt-1">Configure automated emails and manage your email templates.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 border-b border-border/40">
                {([
                    { id: 'automations', label: 'Automations', icon: Workflow },
                    { id: 'templates',   label: 'Templates',   icon: LayoutTemplate },
                ] as const).map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px
                            ${activeTab === tab.id
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                    >
                        <tab.icon className="h-4 w-4" />
                        {tab.label}
                        {tab.id === 'automations' && automations.length > 0 && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${activeTab === 'automations' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                {automations.length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* ── Automations tab ── */}
            {activeTab === 'automations' && (
                <div className="space-y-6">
                    {/* Toolbar */}
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={load} className="gap-2"><RefreshCw className="h-4 w-4" /> Refresh</Button>
                        <Button onClick={() => { setEditing(null); setShowForm(true); }} className="gap-2"><Plus className="h-4 w-4" /> New Automation</Button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[
                            { label: 'Total Rules',  value: automations.length, color: 'text-foreground' },
                            { label: 'Active',       value: enabledCount,        color: 'text-green-600' },
                            { label: 'Disabled',     value: automations.length - enabledCount, color: 'text-red-500' },
                            { label: 'Emails Sent',  value: totalSent,           color: 'text-primary' },
                        ].map(s => (
                            <Card key={s.label}>
                                <CardContent className="pt-4 text-center">
                                    <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
                                    <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Trigger breakdown */}
                    {stats?.byTrigger?.length > 0 && (
                        <Card>
                            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Activity by Trigger</CardTitle></CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {stats.byTrigger.map((b: any) => {
                                        const info = getTriggerInfo(b._id);
                                        return (
                                            <div key={b._id} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs ${info?.badge || 'bg-muted text-muted-foreground border-border/40'}`}>
                                                <span className="font-medium">{info?.label || b._id}</span>
                                                <span className="opacity-70">{b.total} rule{b.total !== 1 ? 's' : ''} · {b.sentCount} sent</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* List */}
                    {loading ? (
                        <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                    ) : automations.length === 0 ? (
                        <div className="text-center py-16 border border-dashed rounded-xl bg-muted/10">
                            <Workflow className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium">No Automations Yet</h3>
                            <p className="text-muted-foreground text-sm mt-1 mb-4">Create your first email automation to get started.</p>
                            <Button onClick={() => { setEditing(null); setShowForm(true); }} className="gap-2"><Plus className="h-4 w-4" /> New Automation</Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {automations.map(a => {
                                const info = getTriggerInfo(a.trigger);
                                const isExpanded = expanded === a._id;
                                return (
                                    <div key={a._id} className={`border rounded-xl overflow-hidden bg-card transition-opacity ${!a.isEnabled ? 'opacity-60' : ''} ${a.isEnabled ? 'border-border/40' : 'border-border/20'}`}>
                                        <div className="flex items-center gap-4 px-5 py-4">
                                            <div className={`p-2 rounded-lg ${a.isEnabled ? 'bg-primary/10' : 'bg-muted'}`}>
                                                <Mail className={`h-4 w-4 ${a.isEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-semibold text-sm">{a.name}</span>
                                                    {info && <Badge className={`border text-xs ${info.badge}`}>{info.label}</Badge>}
                                                    {a.delayHours > 0 && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" />{a.delayHours}h delay</span>}
                                                    {a.isEnabled ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> : <AlertCircle className="h-3.5 w-3.5 text-muted-foreground/50" />}
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-0.5">{a.sentCount} emails sent{a.lastFiredAt ? ` · Last: ${new Date(a.lastFiredAt).toLocaleDateString()}` : ''}</p>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => handleToggle(a._id)} className="h-8 w-8">
                                                    {a.isEnabled ? <ToggleRight className="h-5 w-5 text-green-500" /> : <ToggleLeft className="h-5 w-5 text-muted-foreground" />}
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => { setEditing(a); setShowForm(true); }} className="h-8 w-8"><Edit3 className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(a._id)} className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="icon" onClick={() => setExpanded(isExpanded ? null : a._id)} className="h-8 w-8">
                                                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                                </Button>
                                            </div>
                                        </div>
                                        {isExpanded && (
                                            <div className="border-t border-border/40 px-5 py-4 space-y-3 bg-muted/10">
                                                <div className="space-y-1">
                                                    <p className="text-xs font-medium text-muted-foreground">Subject</p>
                                                    <p className="text-sm font-mono">{a.emailSubject}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs font-medium text-muted-foreground">Body preview</p>
                                                    <div className="text-xs font-mono text-muted-foreground bg-muted rounded-lg p-3 max-h-24 overflow-y-auto whitespace-pre-wrap border border-border/40">
                                                        {a.emailBody.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 300)}…
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ── Templates tab ── */}
            {activeTab === 'templates' && <TemplatesTab />}

            {/* Automation form modal */}
            {showForm && (
                <AutomationForm
                    initial={editing || undefined}
                    onSave={editing ? handleUpdate : handleCreate}
                    onClose={() => { setShowForm(false); setEditing(null); }}
                />
            )}
        </div>
    );
}
