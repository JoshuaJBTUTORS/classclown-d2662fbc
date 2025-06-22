import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-[hsl(228,59%,20%)] to-[hsl(228,45%,35%)] text-white shadow-[var(--shadow-button)] hover:shadow-[var(--shadow-luxury)] hover:from-[hsl(228,45%,35%)] hover:to-[hsl(228,70%,15%)] hover:-translate-y-0.5",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
        outline:
          "border-2 border-[hsl(228,59%,20%)] bg-white/80 backdrop-blur-sm hover:bg-[hsl(228,59%,20%)] hover:text-white transition-all duration-300",
        secondary:
          "bg-gradient-to-r from-[hsl(150,50%,58%)] to-[hsl(180,58%,40%)] text-white shadow-[var(--shadow-green-accent)] hover:shadow-[var(--shadow-luxury-hover)] hover:-translate-y-0.5",
        ghost: "hover:bg-[hsl(228,59%,20%)]/10 hover:text-[hsl(228,59%,20%)] transition-all duration-300",
        link: "text-[hsl(228,59%,20%)] underline-offset-4 hover:underline font-medium",
        premium: "bg-gradient-to-r from-white to-[hsl(228,59%,98%)] border-2 border-[hsl(228,59%,20%)] text-[hsl(228,59%,20%)] shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-luxury)] hover:border-[hsl(150,50%,58%)] hover:text-[hsl(150,50%,58%)] transition-all duration-300 hover:-translate-y-1 backdrop-blur-sm",
        success: "bg-gradient-to-r from-[hsl(150,50%,58%)] to-[hsl(180,58%,40%)] text-white shadow-[var(--shadow-green-accent)] hover:shadow-[var(--shadow-luxury-hover)] hover:from-[hsl(180,58%,40%)] hover:to-[hsl(180,65%,32%)] hover:-translate-y-0.5",
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
