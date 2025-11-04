"use client"

import { useState } from "react"
import { Image as ImageIcon, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export function ImageWithLoading({ 
  src, 
  alt, 
  className = "", 
  containerClassName = "",
  loadingClassName = "",
  errorClassName = "",
  showErrorIcon = true,
  showLoadingIcon = true,
  ...props 
}) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  
  // Check if it's a placeholder image
  const isPlaceholder = src?.includes('placeholder-product.svg')

  const handleLoad = () => {
    setIsLoading(false)
    setHasError(false)
  }

  const handleError = () => {
    setIsLoading(false)
    // Don't show error for placeholder images
    if (!isPlaceholder) {
      setHasError(true)
    }
  }

  return (
    <div className={cn("relative overflow-hidden", containerClassName)}>
      {/* Loading State */}
      {isLoading && (
        <div className={cn(
          "absolute inset-0 bg-muted animate-pulse flex items-center justify-center",
          loadingClassName
        )}>
          {showLoadingIcon && (
            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                <ImageIcon className="w-8 h-8 text-muted-foreground animate-pulse" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              </div>
              <div className="w-16 h-1 bg-muted-foreground/20 rounded-full overflow-hidden">
                <div className="h-full bg-primary/50 rounded-full animate-loading-bar" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error State */}
      {hasError && (
        <div className={cn(
          "absolute inset-0 bg-muted/50 flex items-center justify-center",
          errorClassName
        )}>
          {showErrorIcon && (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <AlertCircle className="w-8 h-8" />
              <span className="text-xs text-center">Image unavailable</span>
            </div>
          )}
        </div>
      )}

      {/* Actual Image */}
      {src && !hasError && (
        <img
          src={src}
          alt={alt}
          className={cn(
            "transition-opacity duration-300",
            isLoading ? "opacity-0" : "opacity-100",
            className
          )}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
          {...props}
        />
      )}
    </div>
  )
}

// Skeleton loader component for consistent loading states
export function ImageSkeleton({ className = "", children }) {
  return (
    <div className={cn(
      "bg-muted animate-pulse rounded-lg flex items-center justify-center",
      className
    )}>
      {children || (
        <div className="flex flex-col items-center gap-2">
          <ImageIcon className="w-8 h-8 text-muted-foreground" />
          <div className="w-12 h-1 bg-muted-foreground/20 rounded-full" />
        </div>
      )}
    </div>
  )
}

// Shimmer effect component
export function ShimmerLoader({ className = "" }) {
  return (
    <div className={cn("relative overflow-hidden bg-muted rounded-lg", className)}>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
    </div>
  )
}