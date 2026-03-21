import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Loader2 } from "lucide-react"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "glow" | "success" | "warning"
  size?: "default" | "sm" | "lg" | "icon"
  asChild?: boolean
  isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, isLoading = false, children, ...props }, ref) => {
    
    const variants = {
      default: "bg-gradient-to-r from-[#0EA5E9] to-[#2563EB] hover:from-[#38BDF8] hover:to-[#3B82F6] text-white shadow-[0_0_30px_-5px_rgba(14,165,233,0.6)] hover:shadow-[0_0_40px_-5px_rgba(14,165,233,0.8)] hover:scale-105 border-none",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-[0_0_30px_-5px_rgba(239,68,68,0.6)]",
      outline: "border-2 border-primary/20 bg-background/50 backdrop-blur-sm hover:bg-primary/10 hover:border-primary/50 text-foreground",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      ghost: "hover:bg-accent hover:text-accent-foreground",
      link: "text-primary underline-offset-4 hover:underline",
      glow: "bg-primary text-primary-foreground relative overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_40px_-10px_rgba(124,58,237,0.5)] after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/20 after:to-transparent after:translate-x-[-200%] hover:after:translate-x-[200%] after:transition-transform after:duration-1000",
      success: "bg-green-500 text-white hover:bg-green-600 shadow-[0_0_30px_-5px_rgba(34,197,94,0.6)] hover:shadow-[0_0_40px_-5px_rgba(34,197,94,0.8)] hover:scale-105 border-none",
      warning: "bg-amber-500 text-white hover:bg-amber-600 shadow-[0_0_30px_-5px_rgba(245,158,11,0.6)] hover:shadow-[0_0_40px_-5px_rgba(245,158,11,0.8)] hover:scale-105 border-none",
    }

    const sizes = {
      default: "h-10 px-4 py-2",
      sm: "h-9 rounded-md px-3",
      lg: "h-11 rounded-md px-8",
      icon: "h-10 w-10",
    }

    const Comp = "button"
    return (
      <Comp
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        disabled={props.disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button }