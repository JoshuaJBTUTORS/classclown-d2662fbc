
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-[var(--shadow-subtle)] hover:shadow-[var(--shadow-glow)] hover:brightness-105 hover:-translate-y-0.5",
        destructive:
          "bg-destructive text-destructive-foreground hover:opacity-90 shadow-sm",
        outline:
          "border-2 border-primary/40 bg-white text-foreground hover:bg-accent hover:border-primary hover:text-primary transition-all duration-200 hover:-translate-y-0.5",
        secondary:
          "bg-primary text-primary-foreground shadow-[var(--shadow-subtle)] hover:shadow-[var(--shadow-card)] hover:opacity-90 hover:-translate-y-0.5",
        ghost: "hover:bg-accent hover:text-primary transition-all duration-200",
        link: "text-primary underline-offset-4 hover:underline font-medium",
        premium: "bg-white border border-primary/30 text-foreground shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elevated)] hover:border-primary hover:text-primary transition-all duration-200 hover:-translate-y-0.5",
        success: "bg-primary text-primary-foreground shadow-[var(--shadow-subtle)] hover:shadow-[var(--shadow-card)] hover:opacity-90 hover:-translate-y-0.5",
      },
      size: {
        default: "h-10 px-6 py-2 rounded-full",
        sm: "h-9 rounded-full px-4",
        lg: "h-12 rounded-full px-8 text-base",
        icon: "h-10 w-10 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
