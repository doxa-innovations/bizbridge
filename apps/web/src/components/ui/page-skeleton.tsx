import { Skeleton } from '@/components/ui/skeleton'

/**
 * Generic full-page loading skeleton used by every route's loading.tsx
 * that doesn't need a bespoke shape. Matches the standard
 * "hero + content grid" pattern most marketing + dashboard pages use
 * so the transition is visually stable.
 */
export function PageSkeleton({
  variant = 'default',
}: {
  variant?: 'default' | 'dashboard' | 'hero'
}) {
  if (variant === 'dashboard') {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-3 w-96" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-surface p-5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-3 h-7 w-20" />
              <Skeleton className="mt-2 h-3 w-32" />
            </div>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-surface p-4">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="mt-2 h-3 w-full" />
              <Skeleton className="mt-1 h-3 w-2/3" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      {variant === 'hero' ? (
        <section className="border-b border-border">
          <div className="container-page py-16">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-4 h-10 w-3/4 max-w-2xl" />
            <Skeleton className="mt-2 h-10 w-1/2 max-w-xl" />
            <Skeleton className="mt-6 h-4 w-full max-w-2xl" />
          </div>
        </section>
      ) : null}
      <section className="container-page py-10">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-surface p-5">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="mt-3 h-3 w-full" />
              <Skeleton className="mt-1 h-3 w-4/5" />
              <Skeleton className="mt-4 h-8 w-24" />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
