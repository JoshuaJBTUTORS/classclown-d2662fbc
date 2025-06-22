import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-[hsl(15,45%,75%)] to-[hsl(20,35%,85%)] text-white shadow-[var(--shadow-subtle)] hover:shadow-[var(--shadow-card)] hover:opacity-90 hover:-translate-y-0.5",
        destructive:
          "bg-gradient-to-r from-[hsl(0,45%,75%)] to-[hsl(0,35%,85%)] text-white hover:opacity-90 shadow-sm",
        outline:
          "border border-[hsl(15,45%,75%)] bg-white hover:bg-[hsl(15,45%,75%)] hover:text-white transition-all duration-200",
        secondary:
          "bg-gradient-to-r from-[hsl(270,25%,75%)] to-[hsl(270,20%,85%)] text-[hsl(270,45%,25%)] shadow-[var(--shadow-subtle)] hover:shadow-[var(--shadow-card)] hover:opacity-90 hover:-translate-y-0.5",
        ghost: "hover:bg-[hsl(340,25%,85%)]/30 hover:text-[hsl(340,35%,35%)] transition-all duration-200",
        link: "text-[hsl(15,45%,75%)] underline-offset-4 hover:underline font-medium",
        premium: "bg-gradient-to-r from-white to-[hsl(270,20%,95%)] border border-[hsl(270,25%,75%)] text-[hsl(270,35%,35%)] shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elevated)] hover:border-[hsl(120,25%,75%)] hover:text-[hsl(120,35%,35%)] transition-all duration-200 hover:-translate-y-0.5",
        success: "bg-gradient-to-r from-[hsl(120,25%,75%)] to-[hsl(120,15%,85%)] text-[hsl(120,35%,25%)] shadow-[var(--shadow-subtle)] hover:shadow-[var(--shadow-card)] hover:opacity-90 hover:-translate-y-0.5",
      },
      size: {
        default: "h-10 px-6 py-2",
        sm: "h-9 rounded-md px-4",
        lg: "h-12 rounded-lg px-8 text-base",
        icon: "h-10 w-10",
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
