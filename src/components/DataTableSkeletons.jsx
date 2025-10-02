// Skeleton components for data management page loading states
export function StatsCardsSkeleton({ count = 5 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="border border-border/50 rounded-lg p-6 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-24"></div>
              <div className="h-6 bg-muted rounded w-16"></div>
            </div>
            <div className="h-8 w-8 bg-muted rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function DataTableSkeleton() {
  return (
    <div className="border border-border/50 rounded-lg">
      <div className="p-6 border-b border-border/50">
        <div className="h-6 bg-muted rounded w-48 animate-pulse"></div>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-4 animate-pulse">
              <div className="h-4 w-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded flex-1"></div>
              <div className="h-4 bg-muted rounded w-20"></div>
              <div className="h-4 bg-muted rounded w-16"></div>
              <div className="h-4 bg-muted rounded w-12"></div>
              <div className="h-4 bg-muted rounded w-8"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
