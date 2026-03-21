/**
 * ShareWidget Component
 * A reusable dialog widget for sharing content via social media or copying the link.
 */
import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogTrigger 
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { 
  Copy, 
  Check, 
  Linkedin, 
  Twitter, 
  Facebook, 
  Mail, 
  Link as LinkIcon,
  Share2
} from 'lucide-react';
import { toast } from 'sonner';

interface ShareWidgetProps {
  title?: string;
  url?: string;
  description?: string;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ShareWidget({ 
  title = "Check this out", 
  url = window.location.href, 
  description = "",
  trigger,
  open,
  onOpenChange
}: ShareWidgetProps) {
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Handle controlled vs uncontrolled state
  const show = open !== undefined ? open : isOpen;
  const setShow = onOpenChange || setIsOpen;

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLinks = [
    {
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'bg-[#0077b5] hover:bg-[#0077b5]/90',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
    },
    {
      name: 'Twitter',
      icon: Twitter,
      color: 'bg-[#1DA1F2] hover:bg-[#1DA1F2]/90',
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`
    },
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'bg-[#4267B2] hover:bg-[#4267B2]/90',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
    },
    {
      name: 'Email',
      icon: Mail,
      color: 'bg-gray-600 hover:bg-gray-700',
      url: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(description + '\n\n' + url)}`
    }
  ];

  const handleShareClick = (shareUrl: string) => {
    if (shareUrl.startsWith('mailto:')) {
      window.location.href = shareUrl;
    } else {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
    setShow(false);
  };

  return (
    <Dialog open={show} onOpenChange={setShow}>
      {trigger && <DialogTrigger className="w-full sm:w-auto">{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 bg-primary/10 rounded-full">
              <Share2 className="w-5 h-5 text-primary" />
            </div>
            Share this page
          </DialogTitle>
          <DialogDescription>
            Share this job position with your network or copy the link.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-2 gap-3">
            {shareLinks.map((link) => (
              <Button
                key={link.name}
                variant="outline"
                className={`h-14 flex flex-col items-center justify-center gap-1 hover:text-white transition-colors border-border/50 ${link.color.replace('bg-', 'hover:bg-').replace('/90', '')} group`}
                onClick={() => handleShareClick(link.url)}
              >
                <link.icon className="w-5 h-5 group-hover:text-white transition-colors" />
                <span className="text-xs font-medium group-hover:text-white">{link.name}</span>
              </Button>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="link" className="text-sm font-medium text-muted-foreground">
              Page Link
            </Label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="link"
                  defaultValue={url}
                  readOnly
                  className="pl-9 pr-4 h-11 bg-muted/30 border-border/50 text-muted-foreground"
                />
              </div>
              <Button 
                size="icon" 
                onClick={handleCopy} 
                className={`h-11 w-11 shrink-0 transition-all duration-200 ${copied ? 'bg-green-600 hover:bg-green-700' : ''}`}
              >
                {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
