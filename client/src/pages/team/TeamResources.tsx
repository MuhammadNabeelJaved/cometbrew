/**
 * Team Resources Page
 * Shared assets, documents, and tools for the team
 */
import React from 'react';
import { FileText, Image as ImageIcon, Link as LinkIcon, Download, MoreHorizontal, Folder } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

export default function TeamResources() {
  const resources = [
    { type: 'folder', name: 'Brand Guidelines', items: '12 items', updated: '2 days ago' },
    { type: 'folder', name: 'Project Assets', items: '45 items', updated: '1 week ago' },
    { type: 'folder', name: 'Legal Documents', items: '8 items', updated: '1 month ago' },
    { type: 'file', name: 'Q3_Report.pdf', size: '2.4 MB', updated: 'Yesterday', icon: FileText },
    { type: 'file', name: 'Hero_Banner.png', size: '4.1 MB', updated: '3 days ago', icon: ImageIcon },
    { type: 'link', name: 'Design System Figma', size: 'External', updated: '1 week ago', icon: LinkIcon },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Resources</h1>
          <p className="text-muted-foreground mt-2">Access shared files and team documents.</p>
        </div>
        <Button>Upload New</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {resources.map((item, i) => (
          <Card key={i} className="group hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="p-6 flex flex-col items-center text-center gap-4">
              <div className={`h-16 w-16 rounded-2xl flex items-center justify-center ${
                item.type === 'folder' ? 'bg-yellow-500/10 text-yellow-500' :
                item.type === 'link' ? 'bg-blue-500/10 text-blue-500' :
                'bg-gray-500/10 text-gray-500'
              }`}>
                {item.type === 'folder' ? <Folder className="h-8 w-8" /> : 
                 item.icon ? <item.icon className="h-8 w-8" /> : <FileText className="h-8 w-8" />}
              </div>
              <div className="w-full">
                <h3 className="font-semibold truncate group-hover:text-primary transition-colors">{item.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{item.type === 'folder' ? item.items : item.size}</p>
              </div>
              <div className="w-full flex justify-between items-center pt-2 border-t mt-2">
                <span className="text-[10px] text-muted-foreground">{item.updated}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6"><MoreHorizontal className="h-3 w-3" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}