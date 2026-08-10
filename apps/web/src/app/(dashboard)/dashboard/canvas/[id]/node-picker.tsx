'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  BookOpen,
  Calendar,
  CheckSquare,
  Contact as ContactIcon,
  FileQuestion,
  Layers,
  Lightbulb,
  Search,
  X,
} from 'lucide-react'
import { humanizeSectorName } from '@/lib/humanize-sector-name'
import { cn } from '@/lib/cn'
import type { CanvasNodeType } from '@/lib/canvas-template'

export interface PaletteEntry {
  type: CanvasNodeType
  label: string
  description: string
  icon: React.ReactNode
  group: 'blocks' | 'people' | 'sectors'
  /** Default `data` payload when the user clicks the entry directly. For
   *  the Sector entry this stays empty because the sector picker handles
   *  the real payload. */
  defaultData: Record<string, unknown>
}

export const PALETTE: PaletteEntry[] = [
  { type: 'idea', label: 'Idea', description: 'A "what if…" you want to capture', icon: <Lightbulb className="h-3.5 w-3.5" />, group: 'blocks', defaultData: { text: '' } },
  { type: 'task', label: 'Task', description: 'Something you need to do', icon: <CheckSquare className="h-3.5 w-3.5" />, group: 'blocks', defaultData: { text: '', done: false } },
  { type: 'question', label: 'Question', description: 'Open question needing research', icon: <FileQuestion className="h-3.5 w-3.5" />, group: 'blocks', defaultData: { text: '' } },
  { type: 'milestone', label: 'Milestone', description: 'Dated goal or checkpoint', icon: <Calendar className="h-3.5 w-3.5" />, group: 'blocks', defaultData: { text: '', target: null } },
  { type: 'contact', label: 'Contact', description: 'Person, expert, or partner', icon: <ContactIcon className="h-3.5 w-3.5" />, group: 'people', defaultData: { name: '', role: '', contact: '' } },
  { type: 'doc', label: 'Doc', description: 'Document, form, or template', icon: <BookOpen className="h-3.5 w-3.5" />, group: 'people', defaultData: { title: '', source: '' } },
  { type: 'sector', label: 'Sector', description: 'Pin an official MOR sector', icon: <Layers className="h-3.5 w-3.5" />, group: 'sectors', defaultData: {} },
]

const GROUP_LABELS: Record<PaletteEntry['group'], string> = {
  blocks: 'Building blocks',
  people: 'People & docs',
  sectors: 'Sectors',
}

interface Props {
  /** Called with a plain preset (Idea, Task, …) to create a normal node.
   *  Not called for the Sector entry — use `onAddSector` instead. */
  onAdd: (entry: PaletteEntry) => void
  /** Called after the user picks a sector from the sector search modal. */
  onAddSector: (sector: { morCode: string; title: string; slug: string }) => void
}

/**
 * Persistent left-side palette panel — n8n-style. Search filters entries
 * by label. Clicking a normal block adds it to the canvas immediately.
 * Clicking Sector opens a live search against the MOR sectors DB and
 * inserts a fully-populated sector node once the user picks one.
 */
export function NodePalette({ onAdd, onAddSector }: Props) {
  const [query, setQuery] = useState('')
  const [sectorOpen, setSectorOpen] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return PALETTE
    return PALETTE.filter(
      (p) => p.label.toLowerCase().includes(q) || p.description.toLowerCase().includes(q),
    )
  }, [query])

  const grouped = useMemo(() => {
    const g: Record<PaletteEntry['group'], PaletteEntry[]> = {
      blocks: [],
      people: [],
      sectors: [],
    }
    for (const entry of filtered) g[entry.group].push(entry)
    return g
  }, [filtered])

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-r border-border bg-surface-2">
      <div className="border-b border-border p-2.5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search blocks…"
            className="h-8 w-full rounded border border-border bg-surface pl-8 pr-2 text-xs text-ink placeholder:text-ink-faint focus:border-brand focus:outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {(['blocks', 'people', 'sectors'] as const).map((group) =>
          grouped[group].length > 0 ? (
            <div key={group} className="mb-3">
              <p className="mb-1 px-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                {GROUP_LABELS[group]}
              </p>
              <div className="space-y-0.5">
                {grouped[group].map((entry) => (
                  <button
                    key={entry.type}
                    type="button"
                    onClick={() => {
                      if (entry.type === 'sector') {
                        setSectorOpen(true)
                      } else {
                        onAdd(entry)
                      }
                    }}
                    className="group flex w-full items-start gap-2 rounded-md border border-transparent px-2 py-1.5 text-left transition-colors hover:border-brand/30 hover:bg-surface"
                  >
                    <span className="mt-0.5 text-ink-muted group-hover:text-brand">
                      {entry.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-ink">{entry.label}</p>
                      <p className="line-clamp-1 text-[11px] text-ink-faint">{entry.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : null,
        )}
      </div>

      {sectorOpen ? (
        <SectorSearchModal
          onClose={() => setSectorOpen(false)}
          onSelect={(s) => {
            setSectorOpen(false)
            onAddSector(s)
          }}
        />
      ) : null}
    </aside>
  )
}

interface SectorHit {
  id: string | number
  mor_code: string
  name_en: string
  slug: string
}

/** Search modal for the Sector palette entry. Live-queries the Payload
 *  REST endpoint for business-sectors — same shape the calculator's
 *  sector picker uses so the DX is familiar. */
function SectorSearchModal({
  onClose,
  onSelect,
}: {
  onClose: () => void
  onSelect: (s: { morCode: string; title: string; slug: string }) => void
}) {
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<SectorHit[]>([])
  const [loading, setLoading] = useState(false)
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
      return
    }
    setLoading(true)
    const t = setTimeout(async () => {
      try {
        const params = new URLSearchParams()
        params.set('limit', '12')
        params.set('depth', '0')
        params.set('where[or][0][name_en][like]', q)
        params.set('where[or][1][mor_code][like]', q)
        const r = await fetch(`/api/business-sectors?${params.toString()}`)
        if (r.ok) {
          const data = await r.json()
          setHits(data.docs ?? [])
        }
      } finally {
        setLoading(false)
      }
    }, 180)
    return () => clearTimeout(t)
  }, [query])

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-24"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-md overflow-hidden rounded-lg border border-border bg-surface shadow-xl">
        <div className="flex items-center gap-2 border-b border-border p-3">
          <Search className="h-4 w-4 text-ink-faint" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search 519 sectors — try 'coffee' or '11115'…"
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
        <div className="max-h-80 overflow-y-auto">
          {query.trim().length < 2 ? (
            <p className="p-6 text-center text-xs text-ink-faint">
              Type at least 2 characters to search.
            </p>
          ) : loading && hits.length === 0 ? (
            <p className="p-6 text-center text-xs text-ink-faint">Searching…</p>
          ) : hits.length === 0 ? (
            <p className="p-6 text-center text-xs text-ink-faint">
              No sectors match &quot;{query}&quot;.
            </p>
          ) : (
            hits.map((h) => (
              <button
                key={String(h.id)}
                type="button"
                onClick={() =>
                  onSelect({
                    morCode: h.mor_code,
                    title: humanizeSectorName(h.mor_code, h.name_en),
                    slug: h.slug,
                  })
                }
                className={cn(
                  'flex w-full items-start justify-between gap-3 border-b border-border/50 px-4 py-2.5 text-left transition-colors last:border-0 hover:bg-surface-2',
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-medium text-ink">
                    {humanizeSectorName(h.mor_code, h.name_en)}
                  </p>
                </div>
                <span className="shrink-0 font-mono text-[11px] text-ink-faint">{h.mor_code}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
