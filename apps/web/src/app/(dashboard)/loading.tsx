import { Skeleton } from '@/components/ui/skeleton'

/**
 * Group-level fallback that shows while any /dashboard/* route is streaming.
 * Route-specific loading.tsx files override this when they exist.
 */
export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="space-y-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-9 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-lg" />
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
    </div>
  )
}
