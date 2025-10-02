import { Skeleton } from "./skeleton"

// Data table skeleton
export function DataTableSkeleton({ rows = 10, columns = 6 }) {
  return (
    <div className="space-y-4">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-[200px]" />
        <div className="flex space-x-2">
          <Skeleton className="h-8 w-[100px]" />
          <Skeleton className="h-8 w-[120px]" />
        </div>
      </div>

      {/* Search and filters skeleton */}
      <div className="flex items-center space-x-2">
        <Skeleton className="h-10 w-[250px]" />
        <Skeleton className="h-10 w-[150px]" />
        <Skeleton className="h-10 w-[100px]" />
      </div>

      {/* Table skeleton */}
      <div className="border rounded-md">
        {/* Table header */}
        <div className="border-b p-4">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </div>

        {/* Table rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="border-b p-4 last:border-b-0">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton key={colIndex} className="h-4 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-[100px]" />
        <div className="flex space-x-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
    </div>
  )
}

// Statistics cards skeleton
export function StatsCardsSkeleton({ count = 4 }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-8 w-[80px]" />
            </div>
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      ))}
    </div>
  )
}

// Chart skeleton
export function ChartSkeleton({ height = 300 }) {
  return (
    <div className="rounded-lg border p-6">
      <div className="space-y-4">
        <Skeleton className="h-6 w-[200px]" />
        <div className="space-y-2">
          <Skeleton className={`h-${height} w-full`} />
        </div>
      </div>
    </div>
  )
}

// Form skeleton
export function FormSkeleton({ fields = 6 }) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-[150px]" />
        <Skeleton className="h-10 w-full" />
      </div>

      {Array.from({ length: fields - 1 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}

      <div className="flex space-x-2">
        <Skeleton className="h-10 w-[100px]" />
        <Skeleton className="h-10 w-[100px]" />
      </div>
    </div>
  )
}

// Admin dashboard layout skeleton
export function AdminDashboardSkeleton() {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar skeleton */}
      <div className="w-64 bg-white border-r">
        <div className="p-6">
          <Skeleton className="h-8 w-[150px]" />
        </div>
        <div className="px-3 space-y-1">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header skeleton */}
        <div className="bg-white border-b p-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-[200px]" />
            <div className="flex items-center space-x-4">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-[100px]" />
            </div>
          </div>
        </div>

        {/* Page content skeleton */}
        <div className="flex-1 p-6 space-y-6">
          <StatsCardsSkeleton />
          <div className="grid gap-6 md:grid-cols-2">
            <DataTableSkeleton />
            <ChartSkeleton />
          </div>
        </div>
      </div>
    </div>
  )
}

// Enquiry management skeleton
export function EnquiryManagementSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-[200px]" />
        <div className="flex space-x-2">
          <Skeleton className="h-10 w-[150px]" />
          <Skeleton className="h-10 w-[100px]" />
        </div>
      </div>

      <StatsCardsSkeleton count={4} />

      <div className="space-y-4">
        <div className="flex space-x-2">
          <Skeleton className="h-10 w-[250px]" />
          <Skeleton className="h-10 w-[150px]" />
          <Skeleton className="h-10 w-[120px]" />
        </div>

        <DataTableSkeleton rows={8} columns={5} />
      </div>
    </div>
  )
}
