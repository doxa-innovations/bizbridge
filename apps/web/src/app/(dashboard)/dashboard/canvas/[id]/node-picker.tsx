'use client'

import { useMemo, useState } from 'react'
import {
  BookOpen,
  Calendar,
  CheckSquare,
  Contact as ContactIcon,
  FileQuestion,
  Layers,
  Lightbulb,
  Search,
  StickyNote,
} from 'lucide-react'
import type { CanvasNodeType } from '@/lib/canvas-template'
import { SectorDeepPicker } from '@/components/sectors/sector-deep-picker'

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
  { type: 'note', label: 'Sticky note', description: 'Annotation, reminder, or TODO', icon: <StickyNote className="h-3.5 w-3.5" />, group: 'blocks', defaultData: { text: '' } },
  { type: 'contact', label: 'Contact', description: 'Person, expert, or partner', icon: <ContactIcon className="h-3.5 w-3.5" />, group: 'people', defaultData: { name: '', role: '', contact: '' } },
  { type: 'doc', label: 'Doc', description: 'Document, form, or template', icon: <BookOpen className="h-3.5 w-3.5" />, group: 'people', defaultData: { title: '', source: '' } },
  { type: 'sector', label: 'Sector', description: 'Pin an official MOR sector by what it does', icon: <Layers className="h-3.5 w-3.5" />, group: 'sectors', defaultData: {} },
]

const GROUP_LABELS: Record<PaletteEntry['group'], string> = {
  blocks: 'Building blocks',
  people: 'People & docs',
  sectors: 'Sectors',
}

interface Props {
  onAdd: (entry: PaletteEntry) => void
  onAddSector: (sector: { morCode: string; title: string; slug: string }) => void
}

/**
 * Persistent left-side palette panel — n8n-style. Search filters entries
 * by label. Clicking a normal block adds it to the canvas immediately.
 * Clicking Sector opens the shared SectorDeepPicker which does full-text
 * search across the sector name, MOR code, description, AND every
 * permitted-operation string — so users searching "delivery service"
 * surface courier activities without knowing the exact sector title.
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
        <SectorDeepPicker
          onClose={() => setSectorOpen(false)}
          onSelect={(hit) => {
            setSectorOpen(false)
            onAddSector({
              morCode: hit.mor_code,
              title: hit.name_en,
              slug: hit.slug,
            })
          }}
        />
      ) : null}
    </aside>
  )
}
