'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Briefcase,
  Calculator,
  CheckSquare,
  GitCompareArrows,
  Home,
  LayoutDashboard,
  LineChart,
  ListChecks,
  SearchCheck,
  Tag,
  Users,
} from 'lucide-react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command'

interface SectorHit {
  id: string | number
  slug: string
  mor_code: string
  name_en: string
}

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<SectorHit[]>([])
  const [loading, setLoading] = useState(false)

  // Cmd/Ctrl-K toggle
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Debounced sector search against Payload REST
  useEffect(() => {
    if (!open) return
    const q = query.trim()
    if (q.length === 0) {
      setHits([])
      return
    }
    setLoading(true)
    const timeout = setTimeout(async () => {
      try {
        const params = new URLSearchParams()
        params.set('limit', '8')
        params.set('depth', '0')
        // Search by name OR mor_code
        params.set('where[or][0][name_en][like]', q)
        params.set('where[or][1][mor_code][like]', q)
        const res = await fetch(`/api/business-sectors?${params.toString()}`)
        if (!res.ok) {
          setHits([])
          return
        }
        const data = await res.json()
        setHits(
          (data.docs ?? []).map((d: SectorHit) => ({
            id: d.id,
            slug: d.slug,
            mor_code: d.mor_code,
            name_en: d.name_en,
          })),
        )
      } catch {
        setHits([])
      } finally {
        setLoading(false)
      }
    }, 180)
    return () => clearTimeout(timeout)
  }, [query, open])

  const navigate = (href: string) => {
    setOpen(false)
    router.push(href)
  }

  return (
    <>
      {children}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search 519 sectors, MOR codes, or jump to a page…"
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {loading && query.length > 0 ? (
            <div className="px-4 py-6 text-center text-sm text-ink-muted">Searching…</div>
          ) : null}
          {!loading && query.length > 0 && hits.length === 0 ? (
            <CommandEmpty>No sectors match &quot;{query}&quot;</CommandEmpty>
          ) : null}

          {hits.length > 0 ? (
            <CommandGroup heading="Sectors">
              {hits.map((s) => (
                <CommandItem
                  key={String(s.id)}
                  value={`${s.name_en} ${s.mor_code}`}
                  onSelect={() => navigate(`/sectors/${s.slug}`)}
                >
                  <Briefcase className="text-brand" />
                  <div className="flex flex-1 items-center justify-between gap-3">
                    <span className="text-ink">{s.name_en}</span>
                    <span className="font-mono text-xs text-ink-faint">MOR {s.mor_code}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}

          {query.length === 0 ? (
            <>
              <CommandGroup heading="Jump to">
                <CommandItem onSelect={() => navigate('/')}>
                  <Home /> Home <CommandShortcut>G H</CommandShortcut>
                </CommandItem>
                <CommandItem onSelect={() => navigate('/sectors')}>
                  <ListChecks /> All sectors <CommandShortcut>G S</CommandShortcut>
                </CommandItem>
                <CommandItem onSelect={() => navigate('/pricing')}>
                  <Tag /> Pricing
                </CommandItem>
                <CommandItem onSelect={() => navigate('/dashboard')}>
                  <LayoutDashboard /> Dashboard
                </CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="Tools">
                <CommandItem onSelect={() => navigate('/lookup')}>
                  <SearchCheck /> MOR code lookup
                </CommandItem>
                <CommandItem onSelect={() => navigate('/compare')}>
                  <GitCompareArrows /> Compare sectors
                </CommandItem>
                <CommandItem onSelect={() => navigate('/calculator')}>
                  <Calculator /> Cost calculator
                </CommandItem>
                <CommandItem onSelect={() => navigate('/checklist')}>
                  <CheckSquare /> Setup checklist
                </CommandItem>
                <CommandItem onSelect={() => navigate('/bishoftu')}>
                  <LineChart /> Bishoftu Pulse
                </CommandItem>
                <CommandItem onSelect={() => navigate('/experts')}>
                  <Users /> Experts
                </CommandItem>
              </CommandGroup>
            </>
          ) : null}
        </CommandList>
      </CommandDialog>
    </>
  )
}
