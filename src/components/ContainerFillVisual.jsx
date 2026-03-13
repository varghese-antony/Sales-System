"use client"

/**
 * Visual representation of container fill level - shows a container outline
 * with a colored fill rising from the bottom based on utilization percentage.
 */
export function ContainerFillVisual({ percentage, label = "Container", className = "" }) {
  const fillPercent = Math.min(100, Math.max(0, Number(percentage) || 0))

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {/* Container outline - rectangular like a shipping container */}
      <div className="relative w-full min-w-[80px] max-w-[120px] h-20 border-2 border-foreground/30 rounded-sm bg-muted overflow-hidden shadow-inner">
        {/* Fill level - rises from bottom like cargo loading */}
        <div
          className="absolute bottom-0 left-0 right-0 bg-primary transition-all duration-500"
          style={{ height: `${fillPercent}%` }}
          aria-hidden
        />
      </div>
      <span className="text-sm font-bold tabular-nums text-primary">{fillPercent.toFixed(1)}% filled</span>
    </div>
  )
}
