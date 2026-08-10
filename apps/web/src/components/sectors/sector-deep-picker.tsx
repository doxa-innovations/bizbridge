'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowRight, FileText, Layers, Search, X } from 'lucide-react'
import { humanizeSectorName } from '@/lib/humanize-sector-name'
import { cn } from '@/lib/cn'
import { Badge } from '@/components/ui/badge'

export interface DeepSectorHit {
  id: number
  mor_code: string
  name_en: string
  name_am: string | null
  slug: string
  description_short: string | null
  match_reason: 'code' | 'title' | 'description' | 'operation'
  match_snippet: string | null
}

interface Props {
  onClose: () => void
  onSelect: (sector: DeepSectorHit) => void
  /** Optional preset query — used when the modal is opened via a "search
   *  what you saw" affordance. */
  initialQuery?: string
  /** Placeholder-string override. Defaults to a business-verb-friendly
   *  prompt because the whole point of the deep picker is that users type
   *  what the business DOES, not its official name. */
  placeholder?: string
}

/**
 * Deep sector search modal. Unlike the calculator's inline picker (which
 * only matches on name_en / mor_code), this hits /api/sectors/search which
 * ILIKEs across the sector name, code, description, AND every permitted
 * operation. That means "delivery service" surfaces courier activities
 * even though the sector title doesn't contain "delivery".
 *
 * The result cards show why we matched — a small "via operation" chip
 * with a snippet from the matching operations text — so users understand
 * why a seemingly-unrelated sector appeared.
 */
export function SectorDeepPicker({ onClose, onSelect, initialQuery = '', placeholder }: Props) {
  const [query, setQuery] = useState(initialQuery)
  const [hits, setHits] = useState<DeepSectorHit[]>([])
  const [loading, setLoading] = useState(false)
  const [errored, setErrored] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setHits([])
      setErrored(false)
      return
    }
    setLoading(true)
    setErrored(false)
    const controller = new AbortController()
    const t = setTimeout(async () => {
      try {
        const r = await fetch(
          `/api/sectors/search?q=${encodeURIComponent(q)}&limit=12`,
          { signal: controller.signal },
        )
        if (!r.ok) {
          setErrored(true)
          setHits([])
          return
        }
        const data = await r.json()
        setHits(data.hits ?? [])
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setErrored(true)
          setHits([])
        }
      } finally {
        setLoading(false)
      }
    }, 180)
    return () => {
      clearTimeout(t)
      controller.abort()
    }
  }, [query])

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-20"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-lg overflow-hidden rounded-lg border border-border bg-surface shadow-xl">
        <div className="flex items-center gap-2 border-b border-border p-3">
          <Search className="h-4 w-4 text-ink-faint" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              placeholder ??
              'Describe what the business does — "delivery", "car wash", "food truck"…'
            }
            className="flex-1 bg-transparent text-sm text-ink placeholder:text-ink-faint focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="text-ink-faint hover:text-ink"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {query.trim().length < 2 ? (
            <div className="p-6 text-xs text-ink-faint">
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em]">Tip</p>
              <p className="leading-relaxed">
                You don&apos;t need the MOR code. Type what the business{' '}
                <span className="text-ink">does</span> — courier, catering, mobile-money agent,
                car rental — and we&apos;ll surface the matching sectors, even when the code
                itself is called something different.
              </p>
            </div>
          ) : loading && hits.length === 0 ? (
            <p className="p-6 text-center text-xs text-ink-faint">Searching…</p>
          ) : errored ? (
            <p className="p-6 text-center text-xs text-danger">
              Search failed. Try again in a moment.
            </p>
          ) : hits.length === 0 ? (
            <p className="p-6 text-center text-xs text-ink-faint">
              No sectors match &quot;{query}&quot;. Try a shorter or more generic term.
            </p>
          ) : (
            hits.map((h) => <ResultRow key={h.id} hit={h} onSelect={onSelect} />)
          )}
        </div>
      </div>
    </div>
  )
}

function ResultRow({
  hit,
  onSelect,
}: {
  hit: DeepSectorHit
  onSelect: (h: DeepSectorHit) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(hit)}
      className="flex w-full items-start gap-3 border-b border-border/50 px-4 py-3 text-left transition-colors last:border-0 hover:bg-surface-2"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-ink-faint">MOR {hit.mor_code}</span>
          <MatchBadge reason={hit.match_reason} />
        </div>
        <p className="mt-1 line-clamp-1 text-sm font-medium text-ink">
          {humanizeSectorName(hit.mor_code, hit.name_en)}
        </p>
        {hit.match_reason === 'operation' && hit.match_snippet ? (
          <p className={cn('mt-1 line-clamp-2 text-[11px] leading-snug text-ink-muted')}>
            <FileText className="mr-1 inline h-3 w-3 text-ink-faint" />
            <span className="italic">&ldquo;{hit.match_snippet}…&rdquo;</span>
          </p>
        ) : hit.description_short ? (
          <p className="mt-1 line-clamp-1 text-[11px] text-ink-faint">
            {hit.description_short}
          </p>
        ) : null}
      </div>
      <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-ink-faint" />
    </button>
  )
}

function MatchBadge({ reason }: { reason: DeepSectorHit['match_reason'] }) {
  const map: Record<DeepSectorHit['match_reason'], { label: string; className: string }> = {
    code: { label: 'MOR code', className: 'border-brand/40 text-brand' },
    title: { label: 'Title', className: 'border-ink/30 text-ink' },
    description: { label: 'Description', className: 'border-border text-ink-muted' },
    operation: { label: 'What it does', className: 'border-accent/40 text-accent' },
  }
  const cfg = map[reason]
  return (
    <Badge
      variant="outline"
      className={cn('h-4 gap-1 px-1.5 py-0 font-mono text-[9px] uppercase', cfg.className)}
    >
      <Layers className="h-2.5 w-2.5" /> {cfg.label}
    </Badge>
  )
}
