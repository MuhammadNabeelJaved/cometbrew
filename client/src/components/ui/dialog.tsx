/**
 * Dialog Component
 * A simple dialog modal component.
 */
import * as React from "react"
import { X } from "lucide-react"
import { cn } from "../../lib/utils"
import { AnimatePresence, motion } from "framer-motion"

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

const DialogContext = React.createContext<DialogProps>({})

const Dialog: React.FC<DialogProps> = ({ children, open, onOpenChange }) => {
  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      {children}
    </DialogContext.Provider>
  )
}

const DialogTrigger: React.FC<{ asChild?: boolean; children: React.ReactNode; className?: string }> = ({ 
  children, 
  className 
}) => {
  const { onOpenChange } = React.useContext(DialogContext)
  return (
    <div onClick={() => onOpenChange?.(true)} className={className}>
      {children}
    </div>
  )
}

const DialogContent: React.FC<{ children: React.ReactNode; className?: string; title?: string }> = ({ 
  children, 
  className,
  title
}) => {
  const { open, onOpenChange } = React.useContext(DialogContext)
  
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className={cn("relative w-full max-w-lg rounded-lg bg-background p-6 shadow-lg border border-border", className)}>
        <button 
          onClick={() => onOpenChange?.(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
        {children}
      </div>
    </div>
  )
}

const DialogHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className 
}) => (
  <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left mb-4", className)}>
    {children}
  </div>
)

const DialogFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className 
}) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-4", className)}>
    {children}
  </div>
)

const DialogTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className 
}) => (
  <h3 className={cn("text-lg font-semibold leading-none tracking-tight", className)}>
    {children}
  </h3>
)

const DialogDescription: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className 
}) => (
  <p className={cn("text-sm text-muted-foreground", className)}>
    {children}
  </p>
)

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}