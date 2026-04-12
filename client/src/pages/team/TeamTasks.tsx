/**
 * Team Tasks – Kanban board connected to DB.
 * CRUD: Add / Edit / Delete tasks, change priority, move between columns.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../../components/ui/dialog';
import {
  Plus, MoreHorizontal, Calendar, AlertCircle, Loader2,
  Pencil, Trash2, MoveRight, X, CheckSquare, Square, CheckCheck, Download,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { tasksApi } from '../../api/tasks.api';
import { toast } from 'sonner';
import ConfirmDeleteDialog from '../../components/ui/ConfirmDeleteDialog';
import { exportToCsv } from '../../lib/exportCsv';
import { useBulkSelect } from '../../hooks/useBulkSelect';
import { useDataRealtime } from '../../hooks/useDataRealtime';
import { BulkActionBar } from '../../components/BulkActionBar';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Task {
  _id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'in_review' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  tags?: string[];
  project?: { projectTitle: string; category: string } | null;
  createdBy?: { name: string };
}

interface FormState {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  tags: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COLUMNS: { id: Task['status']; label: string }[] = [
  { id: 'todo',        label: 'To Do'       },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'in_review',   label: 'In Review'   },
  { id: 'completed',   label: 'Completed'   },
];

const PRIORITY_STYLES: Record<string, string> = {
  high:   'bg-red-500/10 text-red-500 border-red-500/20',
  medium: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  low:    'bg-blue-500/10 text-blue-500 border-blue-500/20',
};

const BLANK_FORM: FormState = {
  title: '', description: '', priority: 'medium', dueDate: '', tags: '',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDue(dateStr?: string) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.round((d.getTime() - now.getTime()) / 86400000);
  if (diff === 0)  return 'Today';
  if (diff === 1)  return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff < -1)   return `${Math.abs(diff)}d overdue`;
  if (diff <= 7)   return `In ${diff} days`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function isOverdue(dateStr?: string) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

// ─── Card Menu ────────────────────────────────────────────────────────────────

function TaskMenu({
  task,
  onEdit,
  onDelete,
  onMove,
}: {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
  onMove: (status: Task['status']) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const moveTargets = COLUMNS.filter(c => c.id !== task.status);

  return (
    <div ref={ref} className="relative">
      <Button
        variant="ghost" size="icon"
        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity -mr-2 -mt-2"
        onClick={() => setOpen(v => !v)}
      >
        <MoreHorizontal className="h-3 w-3" />
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            className="absolute right-0 top-6 z-50 w-44 bg-popover border border-border rounded-xl shadow-xl py-1 overflow-hidden"
          >
            <button
              onClick={() => { onEdit(); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors text-left"
            >
              <Pencil className="h-3.5 w-3.5" /> Edit
            </button>

            <div className="border-t border-border/50 my-1" />
            <p className="px-3 py-1 text-[10px] uppercase tracking-wider text-muted-foreground">Move to</p>
            {moveTargets.map(col => (
              <button
                key={col.id}
                onClick={() => { onMove(col.id); setOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors text-left"
              >
                <MoveRight className="h-3.5 w-3.5 text-muted-foreground" /> {col.label}
              </button>
            ))}

            <div className="border-t border-border/50 my-1" />
            <button
              onClick={() => { onDelete(); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-destructive/10 text-destructive transition-colors text-left"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TeamTasks() {
  const [grouped, setGrouped] = useState<Record<Task['status'], Task[]>>({
    todo: [], in_progress: [], in_review: [], completed: [],
  });
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(BLANK_FORM);
  const [saving, setSaving] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // ── Flat list for bulk select (all tasks across columns) ──────────────────
  const allTasks = Object.values(grouped).flat();
  const bulk = useBulkSelect(allTasks);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await tasksApi.getAll();
      const tasks: Task[] = res.data.data?.tasks ?? res.data.data ?? [];
      const g: Record<Task['status'], Task[]> = {
        todo: [], in_progress: [], in_review: [], completed: [],
      };
      tasks.forEach(t => { if (g[t.status]) g[t.status].push(t); });
      setGrouped(g);
    } catch (err: any) {
      toast.error('Failed to load tasks', { description: err?.response?.data?.message || 'Please try again.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useDataRealtime('tasks', fetchTasks);
  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  // ── Modal helpers ──────────────────────────────────────────────────────────

  const openAdd = (defaultStatus: Task['status'] = 'todo') => {
    setEditingTask(null);
    setForm({ ...BLANK_FORM });
    setModalOpen(true);
  };

  const openEdit = (task: Task) => {
    setEditingTask(task);
    setForm({
      title:       task.title,
      description: task.description ?? '',
      priority:    task.priority,
      dueDate:     task.dueDate ? task.dueDate.slice(0, 10) : '',
      tags:        (task.tags ?? []).join(', '),
    });
    setModalOpen(true);
  };

  // ── Save (create or update) ────────────────────────────────────────────────

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    setSaving(true);
    const payload = {
      title:       form.title.trim(),
      description: form.description.trim() || undefined,
      priority:    form.priority,
      dueDate:     form.dueDate || undefined,
      tags:        form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    };
    try {
      if (editingTask) {
        await tasksApi.update(editingTask._id, payload);
        toast.success('Task updated');
      } else {
        await tasksApi.create(payload);
        toast.success('Task added');
      }
      setModalOpen(false);
      fetchTasks();
    } catch (err: any) {
      toast.error('Failed to save task', { description: err?.response?.data?.message || 'Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await tasksApi.delete(deleteTargetId);
      toast.success('Task deleted');
      setDeleteTargetId(null);
      fetchTasks();
    } catch (err: any) {
      toast.error('Failed to delete task', { description: err?.response?.data?.message || 'Please try again.' });
      setDeleteTargetId(null);
    }
  };

  // ── Move (status change) ───────────────────────────────────────────────────

  const handleMove = async (id: string, status: Task['status']) => {
    try {
      await tasksApi.updateStatus(id, status);
      fetchTasks();
    } catch (err: any) {
      toast.error('Failed to move task', { description: err?.response?.data?.message || 'Please try again.' });
    }
  };

  // ── Bulk actions ──────────────────────────────────────────────────────────

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    try {
      await tasksApi.bulkDelete(bulk.ids);
      toast.success(`${bulk.count} task(s) deleted`);
      bulk.clear();
      fetchTasks();
    } catch (err: any) {
      toast.error('Bulk delete failed', { description: err?.response?.data?.message });
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleBulkMarkComplete = async () => {
    try {
      await tasksApi.bulkUpdateStatus(bulk.ids, 'completed');
      toast.success(`${bulk.count} task(s) marked complete`);
      bulk.clear();
      fetchTasks();
    } catch (err: any) {
      toast.error('Failed to update tasks', { description: err?.response?.data?.message });
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">My Tasks</h2>
            <p className="text-muted-foreground">Manage your daily tasks and workflow.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2"
              onClick={() => {
                const allTasks = Object.values(grouped).flat();
                const rows = allTasks.map(t => ({
                  Title: t.title, Status: t.status, Priority: t.priority,
                  'Due Date': t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '',
                  Tags: (t.tags ?? []).join(', '),
                  Description: t.description ?? '',
                }));
                exportToCsv(rows, 'my-tasks');
                toast.success('Tasks exported');
              }}
              disabled={Object.values(grouped).flat().length === 0}
            >
              <Download className="h-4 w-4" /> Export
            </Button>
            <Button onClick={() => openAdd()}>
              <Plus className="mr-2 h-4 w-4" /> New Task
            </Button>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="flex gap-5 overflow-x-auto pb-4 h-full">
          {COLUMNS.map(col => {
            const colTasks = grouped[col.id] ?? [];
            return (
              <div
                key={col.id}
                className="min-w-[290px] w-[310px] flex-shrink-0 flex flex-col h-full bg-muted/20 rounded-xl border border-border/50 p-4"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center gap-2 text-sm">
                    {col.label}
                    <Badge variant="secondary" className="rounded-full px-2 text-xs">
                      {colTasks.length}
                    </Badge>
                  </h3>
                  <Button
                    variant="ghost" size="icon" className="h-7 w-7"
                    onClick={() => openAdd(col.id)}
                    title={`Add to ${col.label}`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {/* Tasks */}
                <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                  <AnimatePresence>
                    {colTasks.map(task => {
                      const due = formatDue(task.dueDate);
                      const overdue = isOverdue(task.dueDate) && task.status !== 'completed';
                      return (
                        <motion.div
                          key={task._id}
                          layout
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className={`group bg-card border p-4 rounded-lg shadow-sm transition-colors ${bulk.isSelected(task._id) ? 'border-primary ring-1 ring-primary' : 'border-border/50 hover:border-primary/30'}`}
                        >
                          {/* Top row: checkbox + priority + menu */}
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => { e.stopPropagation(); bulk.toggle(task._id); }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                {bulk.isSelected(task._id)
                                  ? <CheckSquare className="h-3.5 w-3.5 text-primary" />
                                  : <Square className="h-3.5 w-3.5 text-muted-foreground" />
                                }
                              </button>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full border capitalize ${PRIORITY_STYLES[task.priority]}`}>
                                {task.priority}
                              </span>
                            </div>
                            <TaskMenu
                              task={task}
                              onEdit={() => openEdit(task)}
                              onDelete={() => setDeleteTargetId(task._id)}
                              onMove={(status) => handleMove(task._id, status)}
                            />
                          </div>

                          {/* Title */}
                          <h4
                            className="font-medium text-sm mb-1 leading-snug cursor-pointer hover:text-primary transition-colors"
                            onClick={() => openEdit(task)}
                          >
                            {task.title}
                          </h4>

                          {/* Project or tags */}
                          <p className="text-xs text-muted-foreground mb-3">
                            {task.project?.projectTitle ?? (task.tags?.[0] ?? 'General')}
                          </p>

                          {/* Footer */}
                          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/30">
                            {due ? (
                              <div className={`flex items-center gap-1 ${overdue ? 'text-red-500' : ''}`}>
                                <Calendar className="h-3 w-3" />
                                {due}
                              </div>
                            ) : (
                              <span />
                            )}
                            {task.priority === 'high' && (
                              <AlertCircle className="h-3 w-3 text-red-500" />
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {/* Add Task inline button */}
                  <button
                    onClick={() => openAdd(col.id)}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground border border-dashed border-border/50 hover:border-primary/40 hover:bg-muted/50 transition-all"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Task
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Add / Edit Modal ─────────────────────────────────────────────── */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Edit Task' : 'New Task'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Title <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Task title..."
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Description
              </label>
              <Textarea
                placeholder="Add details..."
                className="resize-none min-h-[80px]"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>

            {/* Priority */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Priority
              </label>
              <div className="flex gap-2">
                {(['low', 'medium', 'high'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setForm(f => ({ ...f, priority: p }))}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium capitalize border transition-all ${
                      form.priority === p
                        ? PRIORITY_STYLES[p] + ' ring-2 ring-offset-1 ring-current'
                        : 'border-border text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Due Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Due Date
              </label>
              <Input
                type="date"
                value={form.dueDate}
                onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
              />
            </div>

            {/* Tags */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Tags <span className="text-muted-foreground font-normal">(comma separated)</span>
              </label>
              <Input
                placeholder="e.g. bug, frontend, urgent"
                value={form.tags}
                onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingTask ? 'Update Task' : 'Add Task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDelete}
        description="Are you sure you want to delete this task? This action cannot be undone."
      />

      <BulkActionBar
        count={bulk.count}
        onClear={bulk.clear}
        itemLabel="task"
        actions={[
          {
            label: 'Mark Complete',
            icon: CheckCheck,
            onClick: handleBulkMarkComplete,
          },
          {
            label: 'Delete Selected',
            icon: Trash2,
            variant: 'destructive',
            loading: isBulkDeleting,
            onClick: handleBulkDelete,
          },
        ]}
      />
    </>
  );
}
