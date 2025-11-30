
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-[hsl(var(--cleo-green))] to-[hsl(145,70%,50%)] text-white shadow-[0_12px_26px_rgba(22,160,90,0.35)] hover:shadow-[0_16px_42px_rgba(22,160,90,0.4)] hover:brightness-105 hover:-translate-y-0.5",
        destructive:
          "bg-gradient-to-r from-[hsl(var(--cleo-danger))] to-[hsl(10,85%,60%)] text-white hover:opacity-90 shadow-sm",
        outline:
          "border-2 border-[hsl(var(--cleo-green))]/50 bg-white/80 text-[hsl(var(--cleo-text-dark))] hover:bg-[hsl(var(--cleo-green-soft))]/90 hover:border-[hsl(var(--cleo-green))] transition-all duration-200 hover:-translate-y-0.5",
        secondary:
          "bg-gradient-to-r from-[hsl(var(--cleo-green))] to-[hsl(145,65%,55%)] text-white shadow-[var(--shadow-subtle)] hover:shadow-[var(--shadow-card)] hover:opacity-90 hover:-translate-y-0.5",
        ghost: "hover:bg-[hsl(var(--cleo-green-soft))]/50 hover:text-[hsl(var(--cleo-green))] transition-all duration-200",
        link: "text-[hsl(var(--cleo-green))] underline-offset-4 hover:underline font-medium",
        premium: "bg-gradient-to-r from-white to-[hsl(var(--cleo-green-soft))]/20 border border-[hsl(var(--cleo-green))] text-[hsl(var(--cleo-text-dark))] shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elevated)] hover:border-[hsl(var(--cleo-green))] hover:text-[hsl(var(--cleo-green))] transition-all duration-200 hover:-translate-y-0.5",
        success: "bg-gradient-to-r from-[hsl(var(--cleo-green))] to-[hsl(145,70%,45%)] text-white shadow-[var(--shadow-subtle)] hover:shadow-[var(--shadow-card)] hover:opacity-90 hover:-translate-y-0.5",
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
