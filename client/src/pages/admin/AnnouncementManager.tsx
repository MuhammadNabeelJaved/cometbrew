/**
 * Admin Announcement Manager (Multi-bar version)
 * Each bar has its own settings, colors, and announcements.
 */
import React, { useState, useEffect } from 'react';
import {
  Megaphone, Plus, Trash2, Edit, Eye, EyeOff, Loader2, RefreshCw,
  ExternalLink, Link as LinkIcon, Check, X, ChevronDown, ChevronUp,
  AlignLeft, AlignCenter, AlignRight, Play, PauseCircle, Layers,
  Settings2,
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '../../components/ui/dialog';
import { toast } from 'sonner';
import { announcementsApi, type AnnouncementItem, type AnnouncementPayload } from '../../api/announcements.api';
import { announcementBarsApi, type AnnouncementBarConfig, type AnnouncementBarGroup } from '../../api/announcementBars.api';
import { useContent } from '../../contexts/ContentContext';
import ConfirmDeleteDialog from '../../components/ui/ConfirmDeleteDialog';

const BG_PRESETS = [
  { label: 'Violet', bg: '#7c3aed', text: '#ffffff' },
  { label: 'Blue',   bg: '#2563eb', text: '#ffffff' },
  { label: 'Sky',    bg: '#0284c7', text: '#ffffff' },
  { label: 'Green',  bg: '#16a34a', text: '#ffffff' },
  { label: 'Amber',  bg: '#d97706', text: '#ffffff' },
  { label: 'Red',    bg: '#dc2626', text: '#ffffff' },
  { label: 'Pink',   bg: '#db2777', text: '#ffffff' },
  { label: 'Dark',   bg: '#0f172a', text: '#ffffff' },
  { label: 'White',  bg: '#ffffff', text: '#1e293b' },
  { label: 'Gold',   bg: '#f59e0b', text: '#1e293b' },
];

// ─── Announcement Form Dialog ─────────────────────────────────────────────────
const emptyAnnouncementForm = () => ({
  text: '', emoji: '', link: '', linkLabel: 'Learn More', isActive: true, order: 0,
});

function AnnouncementFormDialog({
  open, onClose, onSave, saving, initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: Pick<AnnouncementPayload, 'text' | 'emoji' | 'link' | 'linkLabel' | 'isActive' | 'order'>) => Promise<void>;
  saving: boolean;
  initial?: AnnouncementItem | null;
}) {
  const [form, setForm] = useState(emptyAnnouncementForm());

  useEffect(() => {
    if (initial) {
      setForm({
        text: initial.text,
        emoji: initial.emoji || '',
        link: initial.link || '',
        linkLabel: initial.linkLabel || 'Learn More',
        isActive: initial.isActive,
        order: initial.order,
      });
    } else {
      setForm(emptyAnnouncementForm());
    }
  }, [initial, open]);

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit Announcement' : 'Add Announcement'}</DialogTitle>
          <DialogDescription>Enter the announcement text and optional link.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>Text <span className="text-destructive">*</span></Label>
            <Textarea
              value={form.text}
              onChange={e => set('text', e.target.value)}
              placeholder="🎉 New service — Web App Development now available!"
              rows={2}
              maxLength={300}
            />
            <p className="text-xs text-muted-foreground text-right">{form.text.length}/300</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Emoji</Label>
              <Input
                value={form.emoji}
                onChange={e => set('emoji', e.target.value)}
                placeholder="🎉 🚀 🔥"
                maxLength={4}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Order</Label>
              <Input
                type="number"
                min={0}
                value={form.order}
                onChange={e => set('order', Number(e.target.value))}
              />
              <p className="text-[10px] text-muted-foreground">Lower = shown first</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <LinkIcon className="h-3.5 w-3.5" /> Link URL
              </Label>
              <Input
                value={form.link}
                onChange={e => set('link', e.target.value)}
                placeholder="/services or https://…"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Link Label</Label>
              <Input
                value={form.linkLabel}
                onChange={e => set('linkLabel', e.target.value)}
                disabled={!form.link}
              />
            </div>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-muted/20">
            <p className="text-sm font-medium">Show on website</p>
            <button
              type="button"
              onClick={() => set('isActive', !form.isActive)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.isActive ? 'bg-primary' : 'bg-muted-foreground/30'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>
        <DialogFooter className="pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(form)} disabled={saving || !form.text.trim()}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {initial ? 'Save Changes' : 'Add Announcement'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Create Bar Dialog ────────────────────────────────────────────────────────
function CreateBarDialog({
  open, onClose, onSave, saving,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: { name: string; bgColor: string; textColor: string; scrollEnabled: boolean }) => Promise<void>;
  saving: boolean;
}) {
  const [name, setName] = useState('');
  const [bgColor, setBgColor] = useState('#7c3aed');
  const [textColor, setTextColor] = useState('#ffffff');
  const [scrollEnabled, setScrollEnabled] = useState(true);

  useEffect(() => {
    if (open) { setName(''); setBgColor('#7c3aed'); setTextColor('#ffffff'); setScrollEnabled(true); }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>New Announcement Bar</DialogTitle>
          <DialogDescription>Create a new bar. You can add announcements to it after.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>Bar Name <span className="text-destructive">*</span></Label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Main Ticker, Promo Bar, etc."
            />
          </div>
          <div className="space-y-2">
            <Label>Color Theme</Label>
            <div className="flex flex-wrap gap-2">
              {BG_PRESETS.map(p => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => { setBgColor(p.bg); setTextColor(p.text); }}
                  title={p.label}
                  className={`h-8 w-8 rounded-lg border-2 transition-all hover:scale-110 ${bgColor === p.bg ? 'border-foreground scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: p.bg }}
                />
              ))}
            </div>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={bgColor}
                onChange={e => setBgColor(e.target.value)}
                className="h-9 w-12 rounded-lg border border-border cursor-pointer p-0.5"
              />
              <Input
                value={bgColor}
                onChange={e => setBgColor(e.target.value)}
                className="font-mono text-sm flex-1"
                maxLength={7}
              />
              <input
                type="color"
                value={textColor}
                onChange={e => setTextColor(e.target.value)}
                className="h-9 w-12 rounded-lg border border-border cursor-pointer p-0.5"
              />
              <Input
                value={textColor}
                onChange={e => setTextColor(e.target.value)}
                className="font-mono text-sm flex-1"
                maxLength={7}
              />
            </div>
            <div
              className="h-8 rounded-lg flex items-center justify-center text-sm font-semibold"
              style={{ backgroundColor: bgColor, color: textColor }}
            >
              {name || 'Preview Bar'}
            </div>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-muted/20">
            <div>
              <p className="text-sm font-medium">Scroll Animation</p>
              <p className="text-xs text-muted-foreground">
                {scrollEnabled ? 'Infinite ticker mode' : 'Static/sticky bar'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setScrollEnabled(v => !v)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${scrollEnabled ? 'bg-primary' : 'bg-muted-foreground/30'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${scrollEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>
        <DialogFooter className="pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => onSave({ name, bgColor, textColor, scrollEnabled })}
            disabled={saving || !name.trim()}
          >
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Bar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Bar Settings Panel ───────────────────────────────────────────────────────
function BarSettingsPanel({ bar, onSave }: {
  bar: AnnouncementBarConfig;
  onSave: (updates: Partial<AnnouncementBarConfig>) => Promise<void>;
}) {
  const [local, setLocal] = useState({ ...bar });
  const [saving, setSaving] = useState(false);

  useEffect(() => { setLocal({ ...bar }); }, [bar]);

  const set = (k: keyof AnnouncementBarConfig, v: any) => setLocal(f => ({ ...f, [k]: v }));
  const hasChanged = JSON.stringify(local) !== JSON.stringify(bar);

  const save = async () => {
    setSaving(true);
    await onSave(local);
    setSaving(false);
  };

  return (
    <div className="space-y-4 p-4 bg-muted/10 rounded-xl border border-border/40">
      {/* Colors */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Bar Colors</p>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {BG_PRESETS.map(p => (
            <button
              key={p.label}
              type="button"
              title={p.label}
              onClick={() => { set('bgColor', p.bg); set('textColor', p.text); }}
              className={`h-7 w-7 rounded-lg border-2 transition-all hover:scale-110 ${local.bgColor === p.bg ? 'border-foreground' : 'border-transparent'}`}
              style={{ backgroundColor: p.bg }}
            />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex gap-2 items-center">
            <input
              type="color"
              value={local.bgColor}
              onChange={e => set('bgColor', e.target.value)}
              className="h-8 w-10 rounded border border-border cursor-pointer p-0.5 shrink-0"
            />
            <Input
              value={local.bgColor}
              onChange={e => set('bgColor', e.target.value)}
              className="font-mono text-sm"
              maxLength={7}
            />
          </div>
          <div className="flex gap-2 items-center">
            <input
              type="color"
              value={local.textColor}
              onChange={e => set('textColor', e.target.value)}
              className="h-8 w-10 rounded border border-border cursor-pointer p-0.5 shrink-0"
            />
            <Input
              value={local.textColor}
              onChange={e => set('textColor', e.target.value)}
              className="font-mono text-sm"
              maxLength={7}
            />
          </div>
        </div>
        <div className="text-[10px] text-muted-foreground flex gap-4">
          <span>← Background Color</span><span>Text Color →</span>
        </div>
      </div>

      {/* Scroll Animation */}
      <div className="flex items-center justify-between p-2.5 rounded-lg border border-border/50">
        <div className="flex items-center gap-2">
          {local.scrollEnabled
            ? <Play className="h-3.5 w-3.5 text-primary" />
            : <PauseCircle className="h-3.5 w-3.5 text-muted-foreground" />}
          <p className="text-sm font-medium">
            {local.scrollEnabled ? 'Scrolling (Ticker)' : 'Static (Sticky)'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => set('scrollEnabled', !local.scrollEnabled)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${local.scrollEnabled ? 'bg-primary' : 'bg-muted-foreground/30'}`}
        >
          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${local.scrollEnabled ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
        </button>
      </div>

      {/* Speed or Alignment */}
      {local.scrollEnabled ? (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className="font-medium uppercase tracking-wider">Speed</span>
            <span className="font-mono">{local.tickerDuration}s per loop</span>
          </div>
          <input
            type="range"
            min={5}
            max={120}
            step={5}
            value={local.tickerDuration}
            onChange={e => set('tickerDuration', Number(e.target.value))}
            className="w-full h-1.5 rounded-full accent-primary cursor-pointer"
          />
          <div className="flex gap-1 flex-wrap">
            {[{ l: 'Fast', v: 15 }, { l: 'Normal', v: 35 }, { l: 'Slow', v: 60 }, { l: 'Very Slow', v: 90 }].map(p => (
              <button
                key={p.l}
                type="button"
                onClick={() => set('tickerDuration', p.v)}
                className={`px-2 py-0.5 rounded-full text-[10px] font-medium border transition-all ${local.tickerDuration === p.v ? 'border-primary bg-primary/10 text-primary' : 'border-border/50 text-muted-foreground'}`}
              >
                {p.l}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Alignment</p>
          <div className="flex gap-2">
            {([
              { v: 'left' as const, Icon: AlignLeft, l: 'Left' },
              { v: 'center' as const, Icon: AlignCenter, l: 'Center' },
              { v: 'right' as const, Icon: AlignRight, l: 'Right' },
            ]).map(({ v, Icon, l }) => (
              <button
                key={v}
                type="button"
                onClick={() => set('textAlign', v)}
                className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg border text-xs font-medium transition-all ${local.textAlign === v ? 'border-primary bg-primary/10 text-primary' : 'border-border/50 text-muted-foreground'}`}
              >
                <Icon className="h-3.5 w-3.5" />{l}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Separator */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">Separator ◆</p>
        <button
          type="button"
          onClick={() => set('separatorVisible', !local.separatorVisible)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${local.separatorVisible ? 'bg-primary' : 'bg-muted-foreground/30'}`}
        >
          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${local.separatorVisible ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
        </button>
      </div>
      {local.separatorVisible && (
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={local.separatorColor || '#888888'}
            onChange={e => set('separatorColor', e.target.value)}
            className="h-7 w-9 rounded border border-border cursor-pointer p-0.5 shrink-0"
          />
          <span className="text-xs text-muted-foreground">Separator color</span>
          {local.separatorColor && (
            <button
              type="button"
              onClick={() => set('separatorColor', '')}
              className="text-[10px] text-muted-foreground hover:text-foreground underline ml-auto"
            >
              Reset
            </button>
          )}
        </div>
      )}

      {/* Spacing */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span className="font-medium uppercase tracking-wider">Item Spacing</span>
          <span className="font-mono">{local.itemSpacing}px</span>
        </div>
        <input
          type="range"
          min={4}
          max={96}
          step={4}
          value={local.itemSpacing}
          onChange={e => set('itemSpacing', Number(e.target.value))}
          className="w-full h-1.5 rounded-full accent-primary cursor-pointer"
        />
        <div className="flex gap-1 flex-wrap">
          {[{ l: 'Tight', v: 8 }, { l: 'Default', v: 32 }, { l: 'Loose', v: 56 }, { l: 'Wide', v: 80 }].map(p => (
            <button
              key={p.l}
              type="button"
              onClick={() => set('itemSpacing', p.v)}
              className={`px-2 py-0.5 rounded-full text-[10px] font-medium border transition-all ${local.itemSpacing === p.v ? 'border-primary bg-primary/10 text-primary' : 'border-border/50 text-muted-foreground'}`}
            >
              {p.l}
            </button>
          ))}
        </div>
      </div>

      {/* Save button */}
      <Button size="sm" onClick={save} disabled={saving || !hasChanged} className="w-full gap-1.5">
        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
        Save Bar Settings
      </Button>
    </div>
  );
}

// ─── Bar Card ─────────────────────────────────────────────────────────────────
function BarCard({
  barGroup, onUpdate, onDelete, onAddAnnouncement, onEditAnnouncement,
  onDeleteAnnouncement, onToggleAnnouncement,
}: {
  barGroup: AnnouncementBarGroup;
  onUpdate: (id: string, updates: Partial<AnnouncementBarConfig>) => Promise<void>;
  onDelete: (id: string) => void;
  onAddAnnouncement: (barId: string) => void;
  onEditAnnouncement: (item: AnnouncementItem, barId: string) => void;
  onDeleteAnnouncement: (item: AnnouncementItem) => void;
  onToggleAnnouncement: (item: AnnouncementItem) => Promise<void>;
}) {
  const { bar, items } = barGroup;
  const [expanded, setExpanded] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal] = useState(bar.name);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const activeCount = items.filter(i => i.isActive).length;

  const saveName = async () => {
    if (nameVal.trim() && nameVal !== bar.name) {
      await onUpdate(bar._id, { name: nameVal.trim() });
    }
    setEditingName(false);
  };

  const handleToggleBar = async () => {
    await onUpdate(bar._id, { isActive: !bar.isActive });
  };

  const handleToggleAnn = async (item: AnnouncementItem) => {
    setTogglingId(item._id);
    await onToggleAnnouncement(item);
    setTogglingId(null);
  };

  const previewItems = bar.scrollEnabled
    ? [...items.filter(i => i.isActive), ...items.filter(i => i.isActive), ...items.filter(i => i.isActive)]
    : items.filter(i => i.isActive);

  return (
    <Card className={`border-border/50 overflow-hidden transition-all duration-300 ${!bar.isActive ? 'opacity-60' : ''}`}>
      {/* Bar color stripe at top */}
      <div className="h-1.5" style={{ backgroundColor: bar.bgColor }} />

      <CardContent className="p-0">
        {/* Bar Header */}
        <div className="flex items-center gap-3 p-4">
          {/* Color indicator */}
          <div
            className="h-8 w-8 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold"
            style={{ backgroundColor: bar.bgColor, color: bar.textColor }}
          >
            {bar.order + 1}
          </div>

          {/* Name */}
          <div className="flex-1 min-w-0">
            {editingName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={nameVal}
                  onChange={e => setNameVal(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') saveName();
                    if (e.key === 'Escape') { setEditingName(false); setNameVal(bar.name); }
                  }}
                  className="h-7 text-sm"
                  autoFocus
                />
                <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={saveName}>
                  <Check className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <h3 className="font-semibold text-sm">{bar.name}</h3>
                <button
                  onClick={() => setEditingName(true)}
                  className="opacity-0 group-hover:opacity-100 hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity"
                >
                  <Edit className="h-3 w-3" />
                </button>
              </div>
            )}
            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
              <span>{bar.scrollEnabled ? '⟳ Ticker' : '— Static'}</span>
              <span>·</span>
              <span>{activeCount}/{items.length} active</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleToggleBar}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${bar.isActive ? 'bg-primary' : 'bg-muted-foreground/30'}`}
              title={bar.isActive ? 'Deactivate bar' : 'Activate bar'}
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${bar.isActive ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
            </button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setExpanded(e => !e)}
              title={expanded ? 'Collapse' : 'Expand settings'}
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => onDelete(bar._id)}
              title="Delete bar"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mini preview bar */}
        {items.filter(i => i.isActive).length > 0 && (
          <div
            className="mx-4 mb-3 rounded-lg overflow-hidden h-7 flex items-center"
            style={{ backgroundColor: bar.bgColor }}
          >
            {bar.scrollEnabled ? (
              <div
                className="flex items-center whitespace-nowrap overflow-hidden text-xs px-2"
                style={{ color: bar.textColor }}
              >
                {previewItems.map((item, idx) => (
                  <React.Fragment key={`prev-${item._id}-${idx}`}>
                    {bar.separatorVisible && <span className="mx-2 opacity-40 text-[10px]">◆</span>}
                    <span>
                      {item.emoji && <span className="mr-1">{item.emoji}</span>}
                      {item.text}
                    </span>
                  </React.Fragment>
                ))}
              </div>
            ) : (
              <div
                className={`w-full flex items-center text-xs px-3 ${bar.textAlign === 'left' ? 'justify-start' : bar.textAlign === 'right' ? 'justify-end' : 'justify-center'}`}
                style={{ color: bar.textColor }}
              >
                {items.filter(i => i.isActive).map((item, idx) => (
                  <React.Fragment key={`prev-${item._id}-${idx}`}>
                    {bar.separatorVisible && <span className="mx-2 opacity-40 text-[10px]">◆</span>}
                    <span>
                      {item.emoji && <span className="mr-1">{item.emoji}</span>}
                      {item.text}
                    </span>
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Expanded: Settings + Announcements */}
        {expanded && (
          <div className="border-t border-border/30">
            <div className="p-4 space-y-4">
              {/* Settings Panel */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Settings2 className="h-3.5 w-3.5" /> Bar Settings
                </p>
                <BarSettingsPanel
                  bar={bar}
                  onSave={async (updates) => { await onUpdate(bar._id, updates); }}
                />
              </div>

              {/* Announcements */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Megaphone className="h-3.5 w-3.5" /> Announcements ({items.length})
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 gap-1 text-xs"
                    onClick={() => onAddAnnouncement(bar._id)}
                  >
                    <Plus className="h-3 w-3" /> Add
                  </Button>
                </div>

                {items.length === 0 ? (
                  <button
                    onClick={() => onAddAnnouncement(bar._id)}
                    className="w-full border-2 border-dashed border-border/50 rounded-xl p-6 text-center hover:border-primary/40 hover:bg-primary/5 transition-all group"
                  >
                    <Plus className="h-6 w-6 mx-auto mb-1 text-muted-foreground/40 group-hover:text-primary" />
                    <p className="text-xs text-muted-foreground group-hover:text-foreground">
                      Add first announcement
                    </p>
                  </button>
                ) : (
                  <div className="space-y-2">
                    {items.map(item => (
                      <div
                        key={item._id}
                        className={`flex items-center gap-3 p-2.5 rounded-lg border border-border/40 ${!item.isActive ? 'opacity-50' : ''}`}
                      >
                        <div
                          className="h-6 w-20 rounded flex items-center px-2 text-[10px] font-medium shrink-0 overflow-hidden"
                          style={{ backgroundColor: bar.bgColor, color: bar.textColor }}
                        >
                          {item.emoji && <span className="mr-1">{item.emoji}</span>}
                          <span className="truncate">{item.text}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{item.text}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {item.link && (
                              <span className="text-[10px] text-primary truncate max-w-[120px]">{item.link}</span>
                            )}
                            <span className="text-[10px] text-muted-foreground">#{item.order}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            title={item.isActive ? 'Hide' : 'Show'}
                            onClick={() => handleToggleAnn(item)}
                            disabled={togglingId === item._id}
                          >
                            {togglingId === item._id
                              ? <Loader2 className="h-3 w-3 animate-spin" />
                              : item.isActive
                              ? <EyeOff className="h-3 w-3 text-muted-foreground" />
                              : <Eye className="h-3 w-3 text-muted-foreground" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => onEditAnnouncement(item, bar._id)}
                          >
                            <Edit className="h-3 w-3 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => onDeleteAnnouncement(item)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AnnouncementManager() {
  const { setAnnouncementBars } = useContent();
  const [barGroups, setBarGroups] = useState<AnnouncementBarGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  // Announcement form state
  const [annFormOpen, setAnnFormOpen] = useState(false);
  const [annFormBarId, setAnnFormBarId] = useState<string>('');
  const [annEditing, setAnnEditing] = useState<AnnouncementItem | null>(null);
  const [annSaving, setAnnSaving] = useState(false);
  const [annDeleteTarget, setAnnDeleteTarget] = useState<AnnouncementItem | null>(null);

  // Bar state
  const [createBarOpen, setCreateBarOpen] = useState(false);
  const [barSaving, setBarSaving] = useState(false);
  const [barDeleteId, setBarDeleteId] = useState<string | null>(null);

  const showNotif = (type: 'success' | 'error', title: string, message?: string) => {
    if (type === 'success') toast.success(title, message ? { description: message } : undefined);
    else toast.error(title, message ? { description: message } : undefined);
  };

  const syncContext = (groups: AnnouncementBarGroup[]) => {
    setAnnouncementBars(groups.filter(g => g.bar.isActive && g.items.some(i => i.isActive)));
  };

  const load = async (quiet = false) => {
    if (!quiet) setIsLoading(true); else setIsRefreshing(true);
    try {
      const res = await announcementBarsApi.getAll();
      const data: AnnouncementBarGroup[] = (res.data as any).data ?? [];
      setBarGroups(data);
      syncContext(data);
    } catch (err: any) {
      showNotif('error', 'Failed to load', err?.response?.data?.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ── Bar actions ──
  const handleCreateBar = async (data: { name: string; bgColor: string; textColor: string; scrollEnabled: boolean }) => {
    setBarSaving(true);
    try {
      await announcementBarsApi.create({ ...data, order: barGroups.length });
      setCreateBarOpen(false);
      showNotif('success', 'Bar created');
      await load(true);
    } catch (err: any) {
      showNotif('error', 'Failed to create bar', err?.response?.data?.message);
    } finally {
      setBarSaving(false);
    }
  };

  const handleUpdateBar = async (id: string, updates: Partial<AnnouncementBarConfig>) => {
    try {
      const res = await announcementBarsApi.update(id, updates);
      const updatedBar: AnnouncementBarConfig = (res.data as any).data;
      const newGroups = barGroups.map(g => g.bar._id === id ? { ...g, bar: updatedBar } : g);
      setBarGroups(newGroups);
      syncContext(newGroups);
      showNotif('success', 'Bar updated');
    } catch (err: any) {
      showNotif('error', 'Update failed', err?.response?.data?.message);
      throw err;
    }
  };

  const handleDeleteBar = async () => {
    if (!barDeleteId) return;
    try {
      await announcementBarsApi.delete(barDeleteId);
      const newGroups = barGroups.filter(g => g.bar._id !== barDeleteId);
      setBarGroups(newGroups);
      syncContext(newGroups);
      showNotif('success', 'Bar deleted');
    } catch (err: any) {
      showNotif('error', 'Delete failed', err?.response?.data?.message);
    } finally {
      setBarDeleteId(null);
    }
  };

  // ── Announcement actions ──
  const handleSaveAnnouncement = async (form: any) => {
    setAnnSaving(true);
    try {
      if (annEditing) {
        const res = await announcementsApi.update(annEditing._id, form);
        const updated: AnnouncementItem = (res.data as any).data;
        const newGroups = barGroups.map(g => ({
          ...g,
          items: g.items.map(i => i._id === annEditing._id ? updated : i),
        }));
        setBarGroups(newGroups);
        syncContext(newGroups);
        showNotif('success', 'Announcement updated');
      } else {
        const res = await announcementsApi.create({ ...form, barId: annFormBarId });
        const created: AnnouncementItem = (res.data as any).data;
        const newGroups = barGroups.map(g =>
          g.bar._id === annFormBarId
            ? { ...g, items: [...g.items, created].sort((a, b) => a.order - b.order) }
            : g
        );
        setBarGroups(newGroups);
        syncContext(newGroups);
        showNotif('success', 'Announcement added');
      }
      setAnnFormOpen(false);
      setAnnEditing(null);
    } catch (err: any) {
      showNotif('error', 'Save failed', err?.response?.data?.message);
    } finally {
      setAnnSaving(false);
    }
  };

  const handleToggleAnnouncement = async (item: AnnouncementItem) => {
    try {
      const res = await announcementsApi.update(item._id, { isActive: !item.isActive });
      const updated: AnnouncementItem = (res.data as any).data;
      const newGroups = barGroups.map(g => ({
        ...g,
        items: g.items.map(i => i._id === item._id ? updated : i),
      }));
      setBarGroups(newGroups);
      syncContext(newGroups);
    } catch (err: any) {
      showNotif('error', 'Toggle failed', err?.response?.data?.message);
      throw err;
    }
  };

  const handleDeleteAnnouncement = async () => {
    if (!annDeleteTarget) return;
    try {
      await announcementsApi.delete(annDeleteTarget._id);
      const newGroups = barGroups.map(g => ({
        ...g,
        items: g.items.filter(i => i._id !== annDeleteTarget._id),
      }));
      setBarGroups(newGroups);
      syncContext(newGroups);
      showNotif('success', 'Announcement deleted');
    } catch (err: any) {
      showNotif('error', 'Delete failed', err?.response?.data?.message);
    } finally {
      setAnnDeleteTarget(null);
    }
  };

  const totalAnnouncements = barGroups.reduce((sum, g) => sum + g.items.length, 0);
  const activeBars = barGroups.filter(g => g.bar.isActive).length;

  return (
    <div className="space-y-6">
      <AnnouncementFormDialog
        open={annFormOpen}
        onClose={() => { setAnnFormOpen(false); setAnnEditing(null); }}
        onSave={handleSaveAnnouncement}
        saving={annSaving}
        initial={annEditing}
      />

      <CreateBarDialog
        open={createBarOpen}
        onClose={() => setCreateBarOpen(false)}
        onSave={handleCreateBar}
        saving={barSaving}
      />

      <ConfirmDeleteDialog
        open={!!barDeleteId}
        onClose={() => setBarDeleteId(null)}
        onConfirm={handleDeleteBar}
        description="This will permanently delete the bar and ALL its announcements."
      />

      <ConfirmDeleteDialog
        open={!!annDeleteTarget}
        onClose={() => setAnnDeleteTarget(null)}
        onConfirm={handleDeleteAnnouncement}
        description="This announcement will be permanently deleted."
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Announcement Bars</h2>
          <p className="text-muted-foreground mt-1">
            Stack multiple bars at the top — animated tickers, static promos, and more.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => load(true)}
            disabled={isRefreshing}
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button className="gap-2" onClick={() => setCreateBarOpen(true)}>
            <Plus className="h-4 w-4" /> Add New Bar
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Bars',    value: barGroups.length,  color: 'text-foreground',  bg: 'bg-primary/10',   Icon: Layers   },
          { label: 'Active Bars',   value: activeBars,        color: 'text-green-600',   bg: 'bg-green-500/10', Icon: EyeOff   },
          { label: 'Announcements', value: totalAnnouncements, color: 'text-primary',    bg: 'bg-primary/10',   Icon: Megaphone },
        ].map(({ label, value, color, bg, Icon }) => (
          <Card key={label} className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${bg}`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stacking order info */}
      {barGroups.length > 1 && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/5 border border-primary/20 text-sm text-primary">
          <Layers className="h-4 w-4 shrink-0" />
          <span>
            Bars stack top to bottom in order.{' '}
            <strong>Bar #1</strong> appears at the very top of the page.
          </span>
        </div>
      )}

      {/* Bar list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-3" /> Loading bars...
        </div>
      ) : barGroups.length === 0 ? (
        <button
          onClick={() => setCreateBarOpen(true)}
          className="w-full border-2 border-dashed border-border/50 rounded-2xl p-12 text-center hover:border-primary/40 hover:bg-primary/5 transition-all group"
        >
          <Layers className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40 group-hover:text-primary transition-colors" />
          <p className="font-semibold text-muted-foreground group-hover:text-foreground">No bars yet</p>
          <p className="text-sm text-muted-foreground/60 mt-1">Click to create your first announcement bar</p>
        </button>
      ) : (
        <div className="space-y-4">
          {barGroups.map(barGroup => (
            <BarCard
              key={barGroup.bar._id}
              barGroup={barGroup}
              onUpdate={handleUpdateBar}
              onDelete={(id) => setBarDeleteId(id)}
              onAddAnnouncement={(barId) => { setAnnFormBarId(barId); setAnnEditing(null); setAnnFormOpen(true); }}
              onEditAnnouncement={(item, barId) => { setAnnFormBarId(barId); setAnnEditing(item); setAnnFormOpen(true); }}
              onDeleteAnnouncement={(item) => setAnnDeleteTarget(item)}
              onToggleAnnouncement={handleToggleAnnouncement}
            />
          ))}
        </div>
      )}
    </div>
  );
}
