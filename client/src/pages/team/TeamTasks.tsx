/**
 * Team Tasks Page
 * Kanban-style task management
 */
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Plus, MoreHorizontal, Calendar, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TeamTasks() {
  // Mock data for Kanban board
  const [columns] = useState([
    {
      id: 'todo',
      title: 'To Do',
      tasks: [
        { id: 1, title: 'Fix Mobile Navigation', project: 'E-commerce App', priority: 'High', date: 'Today' },
        { id: 2, title: 'Research Competitors', project: 'Marketing Site', priority: 'Low', date: 'Mar 12' },
      ]
    },
    {
      id: 'in-progress',
      title: 'In Progress',
      tasks: [
        { id: 3, title: 'Homepage Hero Animation', project: 'Fintech Dashboard', priority: 'High', date: 'Today' },
        { id: 4, title: 'Client Feedback Meeting', project: 'Internal', priority: 'Medium', date: 'Tomorrow' },
      ]
    },
    {
      id: 'review',
      title: 'In Review',
      tasks: [
        { id: 5, title: 'Update Documentation', project: 'SaaS Platform', priority: 'Low', date: 'In 2 days' },
      ]
    },
    {
      id: 'done',
      title: 'Completed',
      tasks: [
        { id: 6, title: 'Setup Project Repo', project: 'Fintech Dashboard', priority: 'High', date: 'Yesterday' },
        { id: 7, title: 'Design System V1', project: 'Internal', priority: 'High', date: 'Last week' },
      ]
    }
  ]);

  return (
    <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">My Tasks</h2>
          <p className="text-muted-foreground">Manage your daily tasks and workflow.</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> New Task
        </Button>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-4 h-full">
        {columns.map((column) => (
          <div key={column.id} className="min-w-[300px] w-full max-w-[350px] flex flex-col h-full bg-muted/20 rounded-xl border border-border/50 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                {column.title}
                <Badge variant="secondary" className="rounded-full px-2 text-xs">
                  {column.tasks.length}
                </Badge>
              </h3>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {column.tasks.map((task) => (
                <motion.div
                  key={task.id}
                  layoutId={`task-${task.id}`}
                  className="group bg-card hover:bg-card/80 border border-border/50 p-4 rounded-lg shadow-sm cursor-grab active:cursor-grabbing transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                      task.priority === 'High' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                      task.priority === 'Medium' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                      'bg-blue-500/10 text-blue-500 border-blue-500/20'
                    }`}>
                      {task.priority}
                    </span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity -mr-2 -mt-2">
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <h4 className="font-medium text-sm mb-1">{task.title}</h4>
                  <p className="text-xs text-muted-foreground mb-3">{task.project}</p>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/30">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {task.date}
                    </div>
                    {task.priority === 'High' && (
                      <AlertCircle className="h-3 w-3 text-red-500" />
                    )}
                  </div>
                </motion.div>
              ))}
              
              <Button variant="ghost" className="w-full text-muted-foreground hover:text-foreground border border-dashed border-border/50">
                <Plus className="mr-2 h-4 w-4" /> Add Task
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}