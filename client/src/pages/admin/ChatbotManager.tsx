/**
 * Admin Chatbot Manager
 * Tabs: Overview (stats), Knowledge Base, Configuration, Conversation Logs
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Bot, BarChart3, BookOpen, Settings2, MessageSquare,
  Plus, Trash2, Edit, Upload, RefreshCw, Loader2,
  Check, X, Eye, EyeOff, AlertCircle, FileText,
  Key, ChevronDown, ChevronUp, Tag, ToggleLeft, ToggleRight,
  Sparkles, Users, TrendingUp, Calendar, Shield, Info,
  CheckCircle, Circle, Download, Globe, Link,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '../../components/ui/dialog';
import { toast } from 'sonner';
import {
  getStats, getSessions, getSession, deleteSession, resolveSession,
  getConfig, updateConfig, addApiKey, removeApiKey, activateApiKey,
  getKnowledge, createKnowledge, updateKnowledge, deleteKnowledge,
  uploadKnowledgeFile, crawlUrl, syncFromDatabase,
} from '../../api/chatbot.api';
import type {
  ChatbotStats, ChatbotSession, ChatbotConfigFull,
  KnowledgeEntry, ApiKeyMeta, ChatbotTone, SyncResult, AnthropicModel,
} from '../../api/chatbot.api';

// ─── Types ─────────────────────────────────────────────────────────────────────
type Tab = 'overview' | 'knowledge' | 'config' | 'logs';

const TABS: { id: Tab; label: string; Icon: React.ElementType }[] = [
  { id: 'overview',  label: 'Overview',          Icon: BarChart3     },
  { id: 'knowledge', label: 'Knowledge Base',     Icon: BookOpen      },
  { id: 'config',    label: 'Configuration',      Icon: Settings2     },
  { id: 'logs',      label: 'Conversation Logs',  Icon: MessageSquare },
];

// ─── Toggle ────────────────────────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent transition-colors focus:outline-none ${
        checked ? 'bg-primary' : 'bg-muted-foreground/30'
      }`}
    >
      <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-lg transition-transform ${
        checked ? 'translate-x-5' : 'translate-x-0'
      }`} />
    </button>
  );
}

// ─── Overview Tab ──────────────────────────────────────────────────────────────
function OverviewTab() {
  const [stats, setStats] = useState<ChatbotStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setStats(await getStats());
    } catch {
      toast.error('Failed to load stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  if (!stats) return null;

  const resolvedPct = stats.totalSessions > 0
    ? Math.round((stats.resolvedSessions / stats.totalSessions) * 100)
    : 0;

  const statCards = [
    { label: 'Total Sessions', value: stats.totalSessions,   icon: Users,      color: 'text-blue-500'   },
    { label: 'Total Messages', value: stats.totalMessages,   icon: MessageSquare, color: 'text-violet-500' },
    { label: 'Knowledge Entries', value: stats.totalKnowledge, icon: BookOpen,  color: 'text-emerald-500' },
    { label: 'Resolved Sessions', value: stats.resolvedSessions, icon: CheckCircle, color: 'text-green-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Chatbot Overview</h2>
        <Button variant="outline" size="sm" onClick={load} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="bg-card/50 border-border/50">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">{label}</span>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <p className="text-3xl font-bold">{value.toLocaleString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Resolution rate */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Resolution Rate</CardTitle>
          <CardDescription>Percentage of sessions marked resolved</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-grow bg-muted rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-green-500 transition-all duration-500"
                style={{ width: `${resolvedPct}%` }}
              />
            </div>
            <span className="text-lg font-bold w-14 text-right">{resolvedPct}%</span>
          </div>
        </CardContent>
      </Card>

      {/* Daily activity */}
      {stats.dailyActivity.length > 0 && (
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Daily Activity (last 7 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-24">
              {stats.dailyActivity.map((d) => {
                const maxCount = Math.max(...stats.dailyActivity.map(x => x.count), 1);
                const pct = Math.round((d.count / maxCount) * 100);
                return (
                  <div key={d._id} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">{d.count}</span>
                    <div className="w-full bg-primary/80 rounded-t" style={{ height: `${Math.max(pct, 4)}%` }} />
                    <span className="text-[10px] text-muted-foreground truncate w-full text-center">
                      {new Date(d._id).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent activity */}
      {stats.recentActivity.length > 0 && (
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Recent Sessions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.recentActivity.map((s) => (
              <div key={s._id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                <div>
                  <p className="text-sm font-medium font-mono">
                    {s.sessionId.slice(0, 8)}…
                    {s.userId && <span className="text-muted-foreground ml-2 font-sans text-xs">({s.userId.name})</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">{new Date(s.lastActivity).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={s.isResolved ? 'default' : 'secondary'} className="text-xs">
                    {s.isResolved ? 'Resolved' : 'Open'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{s.totalMessages} msgs</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Knowledge Tab ─────────────────────────────────────────────────────────────
function KnowledgeTab() {
  const [entries, setEntries]   = useState<KnowledgeEntry[]>([]);
  const [loading, setLoading]   = useState(true);
  const [saving,  setSaving]    = useState(false);
  const [page,    setPage]      = useState(1);
  const [total,   setTotal]     = useState(0);
  const [pages,   setPages]     = useState(1);
  const [showForm,    setShowForm]    = useState(false);
  const [showUrlForm, setShowUrlForm] = useState(false);
  const [syncing,     setSyncing]     = useState(false);
  const [syncResult,  setSyncResult]  = useState<SyncResult | null>(null);
  const [editing,  setEditing]  = useState<KnowledgeEntry | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: '', content: '', type: 'text' as 'text' | 'faq', tags: '',
  });

  const [urlForm, setUrlForm] = useState({ url: '', title: '', tags: '' });

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await getKnowledge({ page: p, limit: 10 });
      setEntries(res.entries);
      setTotal(res.pagination.total);
      setPages(res.pagination.pages);
      setPage(p);
    } catch {
      toast.error('Failed to load knowledge base');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', content: '', type: 'text', tags: '' });
    setShowForm(true);
  };

  const openEdit = (e: KnowledgeEntry) => {
    setEditing(e);
    setForm({ title: e.title, content: e.content, type: e.type === 'faq' ? 'faq' : 'text', tags: e.tags.join(', ') });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error('Title and content are required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        content: form.content.trim(),
        type: form.type,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      };
      if (editing) {
        await updateKnowledge(editing._id, payload);
        toast.success('Entry updated');
      } else {
        await createKnowledge(payload);
        toast.success('Entry created');
      }
      setShowForm(false);
      load(page);
    } catch {
      toast.error('Failed to save entry');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (e: KnowledgeEntry) => {
    try {
      await updateKnowledge(e._id, { isActive: !e.isActive });
      setEntries(prev => prev.map(x => x._id === e._id ? { ...x, isActive: !x.isActive } : x));
    } catch {
      toast.error('Failed to update entry');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteKnowledge(deleteId);
      toast.success('Entry deleted');
      setDeleteId(null);
      load(page);
    } catch {
      toast.error('Failed to delete entry');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('title', file.name.replace(/\.[^.]+$/, ''));
      await uploadKnowledgeFile(fd);
      toast.success(`"${file.name}" uploaded to knowledge base`);
      load(page);
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setSaving(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCrawlUrl = async () => {
    if (!urlForm.url.trim()) { toast.error('URL is required'); return; }
    setSaving(true);
    try {
      const entry = await crawlUrl({
        url:   urlForm.url.trim(),
        title: urlForm.title.trim() || undefined,
        tags:  urlForm.tags ? urlForm.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      });
      toast.success(`Page crawled: "${entry.title}"`);
      setShowUrlForm(false);
      setUrlForm({ url: '', title: '', tags: '' });
      load(page);
    } catch (err: any) {
      toast.error(err.message || 'Failed to crawl page');
    } finally {
      setSaving(false);
    }
  };

  const handleSyncFromDatabase = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const result = await syncFromDatabase();
      setSyncResult(result);
      toast.success(`Sync complete — ${result.created} created, ${result.updated} updated`);
      load(1);
    } catch (err: any) {
      toast.error(err.message || 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const typeColor = (t: string) => {
    const m: Record<string, string> = {
      text: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      faq:  'bg-violet-500/10 text-violet-400 border-violet-500/20',
      file: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      url:  'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      auto: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    };
    return m[t] || 'bg-muted text-muted-foreground';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Knowledge Base</h2>
          <p className="text-sm text-muted-foreground">{total} entries — used as context for the AI</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.txt,.md,.doc,.docx,.csv,.json" onChange={handleFileUpload} />
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Upload File
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowUrlForm(true)} disabled={saving || syncing} className="gap-2">
            <Globe className="h-4 w-4" /> Add Page URL
          </Button>
          <Button variant="outline" size="sm" onClick={handleSyncFromDatabase} disabled={saving || syncing} className="gap-2 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10">
            {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Sync from DB
          </Button>
          <Button size="sm" onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" /> Add Entry
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : entries.length === 0 ? (
        <Card className="bg-card/50 border-border/50 border-dashed">
          <CardContent className="py-16 text-center text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No knowledge entries yet.</p>
            <p className="text-sm mt-1">Add text, FAQs, or upload documents to train the chatbot.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {entries.map((e) => (
            <Card key={e._id} className={`bg-card/50 border-border/50 transition-opacity ${e.isActive ? '' : 'opacity-50'}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${typeColor(e.type)}`}>
                        {e.type.toUpperCase()}
                      </span>
                      {e.tags.slice(0, 3).map(t => (
                        <span key={t} className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{t}</span>
                      ))}
                      <span className="text-xs text-muted-foreground ml-auto">{e.wordCount} words</span>
                    </div>
                    <p className="font-medium text-sm truncate">{e.title}</p>
                    {e.type === 'url' ? (
                      <a href={e.sourceUrl || e.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-cyan-400 hover:underline flex items-center gap-1 mt-1 truncate">
                        <Globe className="h-3 w-3 shrink-0" /> {e.sourceUrl || e.fileUrl}
                      </a>
                    ) : e.type === 'file' ? (
                      <a href={e.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 mt-1">
                        <Download className="h-3 w-3" /> {e.fileName || 'View file'}
                      </a>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{e.content}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleToggleActive(e)}
                      title={e.isActive ? 'Deactivate' : 'Activate'}
                      className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                    >
                      {e.isActive
                        ? <ToggleRight className="h-4 w-4 text-green-500" />
                        : <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                      }
                    </button>
                    {e.type !== 'file' && e.type !== 'url' && (
                      <button
                        onClick={() => openEdit(e)}
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                      >
                        <Edit className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                      </button>
                    )}
                    <button
                      onClick={() => setDeleteId(e._id)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => load(page - 1)}>Prev</Button>
          <span className="text-sm text-muted-foreground">Page {page} / {pages}</span>
          <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => load(page + 1)}>Next</Button>
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Entry' : 'New Knowledge Entry'}</DialogTitle>
            <DialogDescription>
              This text will be injected into the AI's context when relevant questions are asked.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Title *</Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="E.g. Pricing Overview" />
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <select
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value as 'text' | 'faq' }))}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="text">Text</option>
                  <option value="faq">FAQ</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Content *</Label>
              <Textarea
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                placeholder="Enter the knowledge content here…"
                rows={8}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tags (comma-separated)</Label>
              <Input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="pricing, plans, services" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {editing ? 'Save Changes' : 'Create Entry'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Page URL dialog */}
      <Dialog open={showUrlForm} onOpenChange={setShowUrlForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-cyan-400" /> Add Website Page
            </DialogTitle>
            <DialogDescription>
              The page will be fetched and its text extracted automatically. The chatbot will use this content to answer questions about your website.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Page URL *</Label>
              <Input
                value={urlForm.url}
                onChange={e => setUrlForm(f => ({ ...f, url: e.target.value }))}
                placeholder="https://yourwebsite.com/services"
                type="url"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Custom Title (optional)</Label>
              <Input
                value={urlForm.title}
                onChange={e => setUrlForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Leave blank to use the page's &lt;title&gt;"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tags (comma-separated, optional)</Label>
              <Input
                value={urlForm.tags}
                onChange={e => setUrlForm(f => ({ ...f, tags: e.target.value }))}
                placeholder="services, pricing, about"
              />
            </div>
            <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 space-y-1">
              <span className="font-medium text-foreground block">Tips:</span>
              <span className="block">• Use publicly accessible URLs (e.g. <code className="bg-muted px-1 rounded">https://yoursite.com/services</code>).</span>
              <span className="block">• <strong className="text-foreground">Avoid localhost</strong> — the server cannot render your React SPA; crawl the deployed site instead.</span>
              <span className="block">• Add each page separately — Services, About, Pricing, Contact, Portfolio, etc.</span>
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowUrlForm(false); setUrlForm({ url: '', title: '', tags: '' }); }}>
              Cancel
            </Button>
            <Button onClick={handleCrawlUrl} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
              Fetch & Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Entry</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Business Context Template ─────────────────────────────────────────────────
const BUSINESS_CONTEXT_TEMPLATE = `## Agency Overview
[Agency Name] is a full-service digital agency specialising in web development, UI/UX design, branding, and digital marketing. We work with startups, SMEs, and enterprise clients worldwide.

## Our Services
- **Web Development**: Custom websites, web apps, e-commerce (React, Next.js, Node.js, Laravel)
- **Mobile Apps**: iOS & Android development (React Native, Flutter)
- **UI/UX Design**: User research, wireframing, prototyping, design systems (Figma)
- **Branding**: Logo design, brand identity, style guides
- **Digital Marketing**: SEO, social media management, paid advertising, email campaigns
- **Maintenance & Support**: Hosting, updates, performance optimisation, security audits

## Pricing
- Projects are quoted individually based on scope and complexity
- Typical web project range: $1,500 – $25,000+
- Monthly retainers available for ongoing support: starting at $500/month
- Free initial consultation for all new clients

## Our Process
1. **Discovery** — Understanding your goals, audience, and requirements (1–2 days)
2. **Proposal** — Detailed scope, timeline, and cost estimate (2–3 days)
3. **Design** — Wireframes + visual designs with your feedback (1–2 weeks)
4. **Development** — Agile build with regular progress updates (2–8 weeks)
5. **Testing & QA** — Cross-browser, responsive, and accessibility testing (1 week)
6. **Launch** — Deployment, handover, and documentation
7. **Support** — Post-launch monitoring and ongoing maintenance

## Why Choose Us
- 5+ years of industry experience with 100+ successful projects delivered
- Dedicated project manager assigned to every client
- Transparent communication — weekly updates, shared project board
- On-time delivery guarantee with milestone-based payments
- Post-launch support included for 30 days on all projects

## Team
- [Number] full-time designers, developers, and marketers
- Experienced with both startups and Fortune 500 clients
- Remote-first, distributed across multiple time zones for fast turnaround

## Contact & Availability
- Email: hello@[yourdomain].com
- Phone: +1 (000) 000-0000
- Working hours: Mon–Fri, 9 AM – 6 PM (your timezone)
- Response time: Within 24 hours on business days
- Book a free call: [calendly/scheduling link]

## Location
[City, Country] — serving clients globally with remote project delivery.`;

// ─── Model catalog (mirrors server ANTHROPIC_MODELS — used as fallback) ────────
const DEFAULT_MODELS: AnthropicModel[] = [
  {
    id:    'claude-haiku-4-5-20251001',
    name:  'Claude Haiku 4.5',
    tier:  'fast',
    badge: '⚡ Fastest · Most Affordable',
    desc:  'Best for simple queries, greetings, and FAQ-style answers. Very low cost.',
  },
  {
    id:    'claude-sonnet-4-6',
    name:  'Claude Sonnet 4.6',
    tier:  'balanced',
    badge: '⚖️ Balanced · Recommended',
    desc:  'Best balance of quality and cost. Ideal for most customer interactions.',
  },
  {
    id:    'claude-opus-4-6',
    name:  'Claude Opus 4.6',
    tier:  'advanced',
    badge: '🧠 Most Capable · Highest Cost',
    desc:  'Maximum reasoning depth. Use for complex, nuanced conversations.',
  },
];

const TIER_COLORS: Record<string, string> = {
  fast:     'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  balanced: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  advanced: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
};

function ModelSelector({
  label, sublabel, value, models, onChange,
}: {
  label: string;
  sublabel: string;
  value: string;
  models: AnthropicModel[];
  onChange: (id: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div>
        <Label>{label}</Label>
        <p className="text-xs text-muted-foreground mt-0.5">{sublabel}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {models.map(m => {
          const active = value === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onChange(m.id)}
              className={`relative flex flex-col gap-1 p-3 rounded-xl border text-left transition-all ${
                active
                  ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                  : 'border-border/50 bg-muted/20 hover:border-border hover:bg-muted/40'
              }`}
            >
              {active && (
                <Check className="absolute top-2.5 right-2.5 h-3.5 w-3.5 text-primary" />
              )}
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border self-start ${
                TIER_COLORS[m.tier] ?? 'bg-muted text-muted-foreground'
              }`}>
                {m.badge}
              </span>
              <span className={`text-sm font-semibold mt-0.5 ${active ? 'text-primary' : 'text-foreground'}`}>
                {m.name}
              </span>
              <span className="text-[11px] text-muted-foreground leading-snug">{m.desc}</span>
              <code className="text-[10px] text-muted-foreground/60 font-mono mt-0.5">{m.id}</code>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Config Tab ────────────────────────────────────────────────────────────────
function ConfigTab() {
  const [cfg,     setCfg]     = useState<ChatbotConfigFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});

  // API key form
  const [addKeyOpen,  setAddKeyOpen]  = useState(false);
  const [newKeyForm,  setNewKeyForm]  = useState({ provider: 'anthropic', apiKey: '', label: '' });
  const [addingKey,   setAddingKey]   = useState(false);
  const [deleteKeyId, setDeleteKeyId] = useState<string | null>(null);

  // Local editable state
  const [local, setLocal] = useState<Partial<ChatbotConfigFull>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const c = await getConfig();
      setCfg(c);
      setLocal({
        botName:             c.botName,
        welcomeMessage:      c.welcomeMessage,
        systemPrompt:        c.systemPrompt,
        businessContext:     c.businessContext,
        activeModel:         c.activeModel,
        simpleModel:         c.simpleModel,
        maxTokens:           c.maxTokens,
        temperature:         c.temperature,
        maxMessagesPerHour:  c.maxMessagesPerHour,
        maxMessagesPerDay:   c.maxMessagesPerDay,
        isEnabled:           c.isEnabled,
        tone:                c.tone,
      });
    } catch {
      toast.error('Failed to load configuration');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateConfig(local);
      toast.success('Configuration saved');
      load();
    } catch {
      toast.error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleAddKey = async () => {
    if (!newKeyForm.apiKey.trim()) { toast.error('API key is required'); return; }
    setAddingKey(true);
    try {
      await addApiKey({ ...newKeyForm, setActive: true });
      toast.success('API key added and set as active');
      setAddKeyOpen(false);
      setNewKeyForm({ provider: 'anthropic', apiKey: '', label: '' });
      load();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add key');
    } finally {
      setAddingKey(false);
    }
  };

  const handleRemoveKey = async () => {
    if (!deleteKeyId) return;
    try {
      await removeApiKey(deleteKeyId);
      toast.success('API key removed');
      setDeleteKeyId(null);
      load();
    } catch {
      toast.error('Failed to remove key');
    }
  };

  const handleActivateKey = async (id: string) => {
    try {
      await activateApiKey(id);
      toast.success('Key set as active');
      load();
    } catch {
      toast.error('Failed to activate key');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Configuration</h2>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Save Changes
        </Button>
      </div>

      {/* Widget settings */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary" /> Widget Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Chatbot Enabled</p>
              <p className="text-xs text-muted-foreground">Show the chat widget on the public site</p>
            </div>
            <Toggle checked={!!local.isEnabled} onChange={() => setLocal(l => ({ ...l, isEnabled: !l.isEnabled }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Bot Name</Label>
            <Input value={local.botName ?? ''} onChange={e => setLocal(l => ({ ...l, botName: e.target.value }))} placeholder="Nova" />
          </div>

          {/* ── Model Selector ─────────────────────────────────────────────── */}
          <ModelSelector
            label="Primary Model"
            sublabel="Used for complex, multi-turn conversations"
            value={local.activeModel ?? 'claude-sonnet-4-6'}
            models={cfg?.availableModels ?? DEFAULT_MODELS}
            onChange={id => setLocal(l => ({ ...l, activeModel: id }))}
          />
          <ModelSelector
            label="Simple Model (Smart Routing)"
            sublabel="Auto-selected for short queries to reduce cost"
            value={local.simpleModel ?? 'claude-haiku-4-5-20251001'}
            models={cfg?.availableModels ?? DEFAULT_MODELS}
            onChange={id => setLocal(l => ({ ...l, simpleModel: id }))}
          />
          <div className="space-y-1.5">
            <Label>Welcome Message</Label>
            <Textarea value={local.welcomeMessage ?? ''} onChange={e => setLocal(l => ({ ...l, welcomeMessage: e.target.value }))} rows={3} />
          </div>

          {/* Tone selector */}
          <div className="space-y-3">
            <Label>Conversation Tone</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {([
                { value: 'professional', label: 'Professional', desc: 'Polished & business-focused', emoji: '💼' },
                { value: 'friendly',     label: 'Friendly',     desc: 'Warm, approachable & helpful', emoji: '😊' },
                { value: 'formal',       label: 'Formal',       desc: 'Strictly formal language', emoji: '🎩' },
                { value: 'casual',       label: 'Casual',       desc: 'Relaxed & conversational', emoji: '✌️' },
                { value: 'expert',       label: 'Expert',       desc: 'Technical & authoritative', emoji: '🧠' },
                { value: 'empathetic',   label: 'Empathetic',   desc: 'Caring & understanding', emoji: '🤝' },
              ] as { value: ChatbotTone; label: string; desc: string; emoji: string }[]).map((t) => {
                const active = (local.tone || 'professional') === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setLocal(l => ({ ...l, tone: t.value }))}
                    className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                      active
                        ? 'border-primary bg-primary/10 text-foreground'
                        : 'border-border/50 bg-muted/30 text-muted-foreground hover:border-border hover:bg-muted/60'
                    }`}
                  >
                    <span className="text-lg mb-1">{t.emoji}</span>
                    <span className={`text-sm font-medium ${active ? 'text-primary' : ''}`}>{t.label}</span>
                    <span className="text-xs mt-0.5 leading-snug">{t.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Prompts */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> AI Prompts
          </CardTitle>
          <CardDescription>These are injected into every Claude request as the system prompt.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>System Prompt</Label>
            <Textarea value={local.systemPrompt ?? ''} onChange={e => setLocal(l => ({ ...l, systemPrompt: e.target.value }))} rows={5} className="font-mono text-xs" />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Business Context</Label>
              <button
                type="button"
                onClick={() => setLocal(l => ({ ...l, businessContext: BUSINESS_CONTEXT_TEMPLATE }))}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <Sparkles className="h-3 w-3" /> Use Template
              </button>
            </div>
            <Textarea value={local.businessContext ?? ''} onChange={e => setLocal(l => ({ ...l, businessContext: e.target.value }))} rows={6} placeholder="Describe your business, services, and contact info here…" />
            <p className="text-xs text-muted-foreground">This context is appended to every Claude request so the AI knows your business thoroughly.</p>
          </div>
        </CardContent>
      </Card>

      {/* Model parameters */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-primary" /> Model Parameters
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Max Tokens',          key: 'maxTokens',          min: 256,  max: 8192 },
            { label: 'Temperature',         key: 'temperature',         min: 0,    max: 1,   step: 0.1 },
            { label: 'Max Messages/Hour',   key: 'maxMessagesPerHour',  min: 1,    max: 200  },
            { label: 'Max Messages/Day',    key: 'maxMessagesPerDay',   min: 1,    max: 1000 },
          ].map(({ label, key, min, max, step }) => (
            <div key={key} className="space-y-1.5">
              <Label className="text-xs">{label}</Label>
              <Input
                type="number"
                min={min}
                max={max}
                step={step}
                value={(local as any)[key] ?? ''}
                onChange={e => setLocal(l => ({ ...l, [key]: parseFloat(e.target.value) }))}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* API Keys */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Key className="h-4 w-4 text-primary" /> API Keys
          </CardTitle>
          <CardDescription>Keys are encrypted with AES-256-GCM before storage.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {(cfg?.apiKeys ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No API keys configured yet.</p>
          ) : (
            cfg?.apiKeys.map((k: ApiKeyMeta) => (
              <div key={k._id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50">
                <div className="flex items-center gap-3">
                  <div className={`h-2 w-2 rounded-full ${k.isActive ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                  <div>
                    <p className="text-sm font-medium">{k.label || k.provider}</p>
                    <p className="text-xs text-muted-foreground font-mono">{k.keyHint} · added {new Date(k.addedAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!k.isActive && (
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleActivateKey(k._id)}>
                      Set Active
                    </Button>
                  )}
                  {k.isActive && (
                    <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-xs">Active</Badge>
                  )}
                  <button onClick={() => setDeleteKeyId(k._id)} className="p-1 rounded hover:bg-red-500/10 transition-colors">
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </button>
                </div>
              </div>
            ))
          )}
          <Button variant="outline" size="sm" className="gap-2 w-full mt-2" onClick={() => setAddKeyOpen(true)}>
            <Plus className="h-4 w-4" /> Add API Key
          </Button>
        </CardContent>
      </Card>

      {/* Add key dialog */}
      <Dialog open={addKeyOpen} onOpenChange={setAddKeyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add API Key</DialogTitle>
            <DialogDescription>The key is encrypted with AES-256-GCM before being stored.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Provider</Label>
              <select
                value={newKeyForm.provider}
                onChange={e => setNewKeyForm(f => ({ ...f, provider: e.target.value }))}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="anthropic">Anthropic (Claude)</option>
                <option value="openai">OpenAI</option>
                <option value="gemini">Google Gemini</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>API Key *</Label>
              <Input
                type="password"
                value={newKeyForm.apiKey}
                onChange={e => setNewKeyForm(f => ({ ...f, apiKey: e.target.value }))}
                placeholder="sk-ant-…"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Label (optional)</Label>
              <Input
                value={newKeyForm.label}
                onChange={e => setNewKeyForm(f => ({ ...f, label: e.target.value }))}
                placeholder="Production key"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddKeyOpen(false)}>Cancel</Button>
            <Button onClick={handleAddKey} disabled={addingKey} className="gap-2">
              {addingKey ? <Loader2 className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />}
              Add Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete key confirm */}
      <Dialog open={!!deleteKeyId} onOpenChange={() => setDeleteKeyId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove API Key</DialogTitle>
            <DialogDescription>This will permanently remove the key. This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteKeyId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleRemoveKey}>Remove</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Logs Tab ──────────────────────────────────────────────────────────────────
function LogsTab() {
  const [sessions,  setSessions]  = useState<ChatbotSession[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [page,      setPage]      = useState(1);
  const [pages,     setPages]     = useState(1);
  const [total,     setTotal]     = useState(0);
  const [viewId,    setViewId]    = useState<string | null>(null);
  const [viewData,  setViewData]  = useState<ChatbotSession | null>(null);
  const [viewLoad,  setViewLoad]  = useState(false);
  const [deleteId,  setDeleteId]  = useState<string | null>(null);
  const [filterResolved, setFilterResolved] = useState<boolean | undefined>(undefined);

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await getSessions({ page: p, limit: 15, resolved: filterResolved });
      setSessions(res.sessions);
      setTotal(res.pagination.total);
      setPages(res.pagination.pages);
      setPage(p);
    } catch {
      toast.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }, [filterResolved]);

  useEffect(() => { load(1); }, [load]);

  const openSession = async (id: string) => {
    setViewId(id);
    setViewLoad(true);
    try {
      setViewData(await getSession(id));
    } catch {
      toast.error('Failed to load session');
    } finally {
      setViewLoad(false);
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await resolveSession(id);
      toast.success('Session marked as resolved');
      setSessions(prev => prev.map(s => s._id === id ? { ...s, isResolved: true } : s));
      if (viewData?._id === id) setViewData(d => d ? { ...d, isResolved: true } : d);
    } catch {
      toast.error('Failed to resolve session');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteSession(deleteId);
      toast.success('Session deleted');
      setDeleteId(null);
      if (viewId === deleteId) setViewId(null);
      load(page);
    } catch {
      toast.error('Failed to delete session');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold">Conversation Logs</h2>
          <p className="text-sm text-muted-foreground">{total} total sessions</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filterResolved === undefined ? '' : String(filterResolved)}
            onChange={e => setFilterResolved(e.target.value === '' ? undefined : e.target.value === 'true')}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All Sessions</option>
            <option value="false">Open</option>
            <option value="true">Resolved</option>
          </select>
          <Button variant="outline" size="sm" onClick={() => load(1)} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : sessions.length === 0 ? (
        <Card className="bg-card/50 border-border/50 border-dashed">
          <CardContent className="py-16 text-center text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No sessions found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {sessions.map((s) => (
            <Card key={s._id} className="bg-card/50 border-border/50 hover:border-primary/30 transition-colors cursor-pointer" onClick={() => openSession(s._id)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${s.isResolved ? 'bg-green-500' : 'bg-amber-500'}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-mono text-muted-foreground truncate">{s.sessionId.slice(0, 12)}…</p>
                      {s.userId && <p className="text-xs text-foreground">{s.userId.name} · {s.userId.email}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 text-right">
                    <div className="hidden sm:block">
                      <p className="text-xs text-muted-foreground">{new Date(s.lastActivity).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{s.totalMessages} messages</p>
                    </div>
                    <Badge variant={s.isResolved ? 'default' : 'secondary'} className="text-xs">
                      {s.isResolved ? 'Resolved' : 'Open'}
                    </Badge>
                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      {!s.isResolved && (
                        <button onClick={() => handleResolve(s._id)} title="Mark resolved" className="p-1.5 rounded hover:bg-green-500/10 transition-colors">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        </button>
                      )}
                      <button onClick={() => setDeleteId(s._id)} title="Delete" className="p-1.5 rounded hover:bg-red-500/10 transition-colors">
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => load(page - 1)}>Prev</Button>
          <span className="text-sm text-muted-foreground">Page {page} / {pages}</span>
          <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => load(page + 1)}>Next</Button>
        </div>
      )}

      {/* Session detail dialog */}
      <Dialog open={!!viewId} onOpenChange={(o) => { if (!o) { setViewId(null); setViewData(null); } }}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-mono text-sm">Session: {viewData?.sessionId?.slice(0, 16)}…</DialogTitle>
            <DialogDescription>
              {viewData?.totalMessages} messages ·{' '}
              {viewData?.lastActivity && new Date(viewData.lastActivity).toLocaleString()}
              {viewData?.userId && ` · ${viewData.userId.name}`}
            </DialogDescription>
          </DialogHeader>

          {viewLoad ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-y-auto flex-grow space-y-3 pr-1">
              {(viewData?.messages ?? []).map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                    m.role === 'user'
                      ? 'bg-primary/90 text-primary-foreground rounded-tr-none'
                      : 'bg-muted text-foreground rounded-tl-none'
                  }`}>
                    <p className="leading-relaxed whitespace-pre-wrap">{m.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <DialogFooter className="gap-2 pt-4 border-t border-border/50">
            {viewData && !viewData.isResolved && (
              <Button variant="outline" size="sm" className="gap-2" onClick={() => handleResolve(viewData._id)}>
                <CheckCircle className="h-4 w-4 text-green-500" /> Mark Resolved
              </Button>
            )}
            {viewData && (
              <Button variant="destructive" size="sm" className="gap-2" onClick={() => { setDeleteId(viewData._id); setViewId(null); }}>
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Session</DialogTitle>
            <DialogDescription>All messages in this session will be permanently deleted.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function ChatbotManager() {
  const location = useLocation();
  const [tab, setTab] = useState<Tab>(() => {
    const t = new URLSearchParams(location.search).get('tab') as Tab;
    return TABS.some(x => x.id === t) ? t : 'overview';
  });

  useEffect(() => {
    const t = new URLSearchParams(location.search).get('tab') as Tab;
    if (t && TABS.some(x => x.id === t)) setTab(t);
  }, [location.search]);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-gradient-to-br from-primary to-purple-600 rounded-xl shadow-lg shadow-primary/25">
          <Bot className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Chatbot Manager</h1>
          <p className="text-sm text-muted-foreground">Configure Nova AI, manage knowledge, and review conversations</p>
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 bg-muted/50 p-1 rounded-xl w-fit flex-wrap">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview'  && <OverviewTab />}
      {tab === 'knowledge' && <KnowledgeTab />}
      {tab === 'config'    && <ConfigTab />}
      {tab === 'logs'      && <LogsTab />}
    </div>
  );
}
