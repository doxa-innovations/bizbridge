'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Sparkles } from 'lucide-react'
import { SectorDeepPicker } from '@/components/sectors/sector-deep-picker'

interface Props {
  /** Where the browser is mounted — '/sectors' (marketing) or
   *  '/dashboard/sectors' (dashboard). Ensures the debounced search
   *  redirect hits the right route. */
  basePath?: string
}

/**
 * Primary sector browser search. Two modes:
 *  - The main input runs a debounced URL-param redirect (?q=…) that the
 *    server component picks up to filter the sector grid. Only matches
 *    name / MOR code — that's what the grid can filter on server-side.
 *  - A "Find by what it does" button opens the SectorDeepPicker modal,
 *    which searches the goldmine field (permitted operations) — so users
 *    who don't know the sector title can still find their business.
 */
export function SectorSearch({ basePath = '/sectors' }: Props) {
  const router = useRouter()
  const params = useSearchParams()
  const [value, setValue] = useState(params.get('q') ?? '')
  const [deepOpen, setDeepOpen] = useState(false)

  useEffect(() => {
    const handle = setTimeout(() => {
      const next = new URLSearchParams(params.toString())
      if (value) next.set('q', value)
      else next.delete('q')
      router.replace(`${basePath}?${next.toString()}`, { scroll: false })
    }, 250)
    return () => clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, basePath])

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <input
            type="search"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Search 519 sectors by name or MOR code — 'coffee', 'hotel', '35216'"
            className="h-12 w-full rounded-lg border border-border bg-surface pl-10 pr-4 text-sm text-ink shadow-sm transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </div>
        <button
          type="button"
          onClick={() => setDeepOpen(true)}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-brand/40 bg-brand/10 px-4 text-sm font-medium text-brand transition-colors hover:bg-brand/15"
        >
          <Sparkles className="h-4 w-4" /> Find by what it does
        </button>
      </div>
      <p className="pl-1 text-[11px] text-ink-faint">
        Don&apos;t know the sector? Click <span className="text-brand">Find by what it does</span>{' '}
        and describe the business — &quot;delivery&quot;, &quot;car wash&quot;,
        &quot;food truck&quot;.
      </p>

      {deepOpen ? (
        <SectorDeepPicker
          onClose={() => setDeepOpen(false)}
          onSelect={(hit) => {
            setDeepOpen(false)
            router.push(`${basePath}/${hit.slug}`)
          }}
        />
      ) : null}
    </div>
  )
}
