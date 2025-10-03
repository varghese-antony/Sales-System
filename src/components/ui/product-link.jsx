"use client"

import Link from "next/link"
import { ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function ProductLink({
  table,
  productType,
  productId,
  modelNumber,
  children,
  variant = "outline",
  className,
  ...buttonProps
}) {
  const disabled = !table || !productType
  const href = disabled
    ? "#"
    : `/${table}/${encodeURIComponent(productType)}?productId=${productId ?? ""}`

  const content = children ?? (
    <span className="flex items-center gap-2">
      <ExternalLink className="h-4 w-4" />
      View Product
    </span>
  )

  return (
    <Button
      asChild={!disabled}
      variant={variant}
      className={cn("gap-2", className)}
      disabled={disabled}
      {...buttonProps}
    >
      {disabled ? (
        <span className="flex items-center gap-2 text-muted-foreground">
          <ExternalLink className="h-4 w-4" />
          Product unavailable
        </span>
      ) : (
        <Link href={href} prefetch={false} target="_blank" rel="noopener noreferrer">
          {content}
          {modelNumber && <span className="sr-only">{modelNumber}</span>}
        </Link>
      )}
    </Button>
  )
}
