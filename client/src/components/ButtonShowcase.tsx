/**
 * Button Showcase Component
 * Demonstrates various button states and variants (Success, Error, Warning, Loading)
 */
import React from 'react';
import { Button } from './ui/button';
import { Check, AlertTriangle, X, Loader2, ArrowRight } from 'lucide-react';

export const ButtonShowcase = () => {
  return (
    <div className="w-full max-w-7xl mx-auto p-6 mt-8 border-t border-border/40 pt-12">
      <div className="text-center mb-10">
        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-2">Interactive States</h3>
        <p className="text-muted-foreground">Production-ready button variants with built-in states</p>
      </div>
      
      <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8">
        {/* Success State */}
        <div className="flex flex-col items-center gap-3">
          <Button variant="success" size="lg">
            <Check className="mr-2 h-4 w-4" />
            Success Action
          </Button>
          <span className="text-xs text-muted-foreground font-mono">variant="success"</span>
        </div>

        {/* Warning State */}
        <div className="flex flex-col items-center gap-3">
          <Button variant="warning" size="lg">
            <AlertTriangle className="mr-2 h-4 w-4" />
            Warning Action
          </Button>
          <span className="text-xs text-muted-foreground font-mono">variant="warning"</span>
        </div>

        {/* Error/Destructive State */}
        <div className="flex flex-col items-center gap-3">
          <Button variant="destructive" size="lg">
            <X className="mr-2 h-4 w-4" />
            Error Action
          </Button>
          <span className="text-xs text-muted-foreground font-mono">variant="destructive"</span>
        </div>

        {/* Loading State */}
        <div className="flex flex-col items-center gap-3">
          <Button size="lg" isLoading>
            Loading State
          </Button>
          <span className="text-xs text-muted-foreground font-mono">isLoading={'{'}true{'}'}</span>
        </div>

        {/* Default State */}
        <div className="flex flex-col items-center gap-3">
           <Button variant="default" size="lg">
            Standard Action
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground font-mono">variant="default"</span>
        </div>
      </div>
    </div>
  );
};

export default ButtonShowcase;
