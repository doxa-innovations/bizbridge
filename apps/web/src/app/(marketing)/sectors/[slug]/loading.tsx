import { Skeleton } from '@/components/ui/skeleton'

export default function SectorDetailLoading() {
  return (
    <div>
      <section className="border-b border-border bg-surface">
        <div className="container-page py-10">
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-4" />
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="mt-6 flex items-start gap-5">
            <Skeleton className="h-14 w-14 rounded-md" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-24" />
              </div>
              <Skeleton className="mt-4 h-10 w-3/4 sm:h-12" />
              <Skeleton className="mt-2 h-5 w-1/2" />
              <Skeleton className="mt-5 h-5 w-full max-w-2xl" />
              <Skeleton className="mt-2 h-5 w-4/5 max-w-xl" />
              <div className="mt-6 flex flex-wrap gap-3">
                <Skeleton className="h-10 w-44 rounded-md" />
                <Skeleton className="h-10 w-36 rounded-md" />
                <Skeleton className="h-10 w-32 rounded-md" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-surface p-5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-3 h-7 w-20" />
              <Skeleton className="mt-2 h-3 w-32" />
            </div>
          ))}
        </div>
      </section>

      <section className="container-page pb-20">
        <div className="grid gap-10 lg:grid-cols-[1fr_240px]">
          <main className="space-y-12 min-w-0">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="h-4 w-32" />
                <Skeleton className="mt-2 h-8 w-2/3" />
                <div className="mt-6 space-y-3">
                  <Skeleton className="h-16 w-full rounded-lg" />
                  <Skeleton className="h-16 w-full rounded-lg" />
                  <Skeleton className="h-16 w-full rounded-lg" />
                </div>
              </div>
            ))}
          </main>
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-2 border-l border-border pl-4">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-20" />
            </div>
          </aside>
        </div>
      </section>
    </div>
  )
}
