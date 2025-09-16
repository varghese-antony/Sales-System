import * as React from "react"
import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:shadow-sm",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 hover:shadow-md",
        outline: "text-foreground border-border hover:bg-accent hover:text-accent-foreground hover:shadow-sm",
        success:
          "border-transparent bg-green-500 text-white shadow-sm hover:bg-green-600 hover:shadow-md",
        warning:
          "border-transparent bg-yellow-500 text-white shadow-sm hover:bg-yellow-600 hover:shadow-md",
        gradient:
          "border-transparent bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md hover:from-blue-600 hover:to-purple-700 hover:shadow-lg",
        glow:
          "border-transparent bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/40 animate-glow",
      },
      size: {
        default: "px-3 py-1 text-xs",
        sm: "px-2 py-0.5 text-xs",
        lg: "px-4 py-1.5 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Badge({ className, variant, size, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  )
}

export { Badge, badgeVariants }