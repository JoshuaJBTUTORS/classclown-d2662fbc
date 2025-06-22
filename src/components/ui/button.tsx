
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-[hsl(162,45%,58%)] to-[hsl(174,58%,40%)] text-white shadow-[var(--shadow-button)] hover:shadow-[var(--shadow-luxury)] hover:from-[hsl(174,58%,40%)] hover:to-[hsl(186,67%,32%)] hover:-translate-y-0.5",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
        outline:
          "border-2 border-[hsl(162,45%,85%)] bg-white/80 backdrop-blur-sm hover:bg-[hsl(162,45%,95%)] hover:border-[hsl(162,45%,58%)] hover:text-[hsl(195,100%,35%)] transition-all duration-300",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-[hsl(162,45%,95%)] hover:text-[hsl(195,100%,35%)] transition-all duration-300",
        link: "text-[hsl(162,45%,58%)] underline-offset-4 hover:underline font-medium",
        premium: "bg-gradient-to-r from-white to-[hsl(162,45%,98%)] border-2 border-[hsl(162,45%,85%)] text-[hsl(195,100%,35%)] shadow-[var(--shadow-car)] hover:shadow-[var(--shadow-luxury)] hover:border-[hsl(162,45%,58%)] transition-all duration-300 hover:-translate-y-1 backdrop-blur-sm",
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
