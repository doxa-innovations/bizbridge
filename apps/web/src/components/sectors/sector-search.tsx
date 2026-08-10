'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'

interface Props {
  /** Where the browser is mounted — '/sectors' (marketing) or
   *  '/dashboard/sectors' (dashboard). Ensures the debounced search
   *  redirect hits the right route. */
  basePath?: string
}

export function SectorSearch({ basePath = '/sectors' }: Props) {
  const router = useRouter()
  const params = useSearchParams()
  const [value, setValue] = useState(params.get('q') ?? '')

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
    <div className="relative">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search 519 sectors — try 'coffee', 'hotel', or '35216'"
        className="h-12 w-full rounded-lg border border-border bg-surface pl-10 pr-4 text-sm text-ink shadow-sm transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
      />
    </div>
  )
}
