/**
 * AI Tools Admin Page
 * Management interface for AI integrations
 */
import React, { useState } from 'react';
import { Bot, Sparkles, Image as ImageIcon, Code2, BarChart3, Power, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';

interface AITool {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  status: 'active' | 'inactive';
  usage: number; // percentage
  tokens: string;
}

const initialTools: AITool[] = [
  {
    id: 'chatbot',
    name: 'Customer Support Bot',
    description: 'Automated customer support agent powered by GPT-4.',
    icon: Bot,
    status: 'active',
    usage: 78,
    tokens: '1.2M'
  },
  {
    id: 'generator',
    name: 'Content Generator',
    description: 'Blog post and marketing copy generation assistant.',
    icon: Sparkles,
    status: 'active',
    usage: 45,
    tokens: '850K'
  },
  {
    id: 'image',
    name: 'Image Creator',
    description: 'AI image generation for social media assets.',
    icon: ImageIcon,
    status: 'inactive',
    usage: 0,
    tokens: '0'
  },
  {
    id: 'code',
    name: 'Code Assistant',
    description: 'Internal development helper for code refactoring.',
    icon: Code2,
    status: 'active',
    usage: 92,
    tokens: '2.5M'
  }
];

export default function AITools() {
  const [tools, setTools] = useState<AITool[]>(initialTools);

  const toggleTool = (id: string) => {
    setTools(tools.map(tool => 
      tool.id === id 
        ? { ...tool, status: tool.status === 'active' ? 'inactive' : 'active' }
        : tool
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">AI Tools</h2>
          <p className="text-muted-foreground">Manage your active AI integrations and monitor usage.</p>
        </div>
        <Button className="gap-2">
          <Sparkles className="h-4 w-4" /> Browse Marketplace
        </Button>
      </div>

      {/* Usage Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.5M</div>
            <p className="text-xs text-muted-foreground">+20.1% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3/4</div>
            <p className="text-xs text-muted-foreground">Running optimally</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Est. Cost</CardTitle>
            <Badge variant="secondary" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">Low</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$124.50</div>
            <p className="text-xs text-muted-foreground">Current billing cycle</p>
          </CardContent>
        </Card>
      </div>

      {/* Tools List */}
      <div className="grid gap-6 md:grid-cols-2">
        {tools.map((tool) => (
          <Card key={tool.id} className={`transition-all ${tool.status === 'inactive' ? 'opacity-75 grayscale-[0.5]' : ''}`}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div className="flex gap-4">
                <div className={`p-2 rounded-lg ${tool.status === 'active' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  <tool.icon className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-base">{tool.name}</CardTitle>
                  <CardDescription className="text-xs mt-1 max-w-[200px]">{tool.description}</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                 <Badge variant={tool.status === 'active' ? 'success' : 'secondary'}>
                    {tool.status === 'active' ? 'Running' : 'Paused'}
                 </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Monthly Usage Limit</span>
                    <span className="font-medium">{tool.usage}%</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${tool.usage > 90 ? 'bg-red-500' : 'bg-primary'}`} 
                      style={{ width: `${tool.usage}%` }} 
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="text-xs text-muted-foreground">
                    Tokens Used: <span className="font-mono text-foreground">{tool.tokens}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant={tool.status === 'active' ? "destructive" : "default"} 
                      size="sm" 
                      className="h-8 px-3 text-xs"
                      onClick={() => toggleTool(tool.id)}
                    >
                      <Power className="h-3 w-3 mr-1" />
                      {tool.status === 'active' ? 'Disable' : 'Enable'}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
