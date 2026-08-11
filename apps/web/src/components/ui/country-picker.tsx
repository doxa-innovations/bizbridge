'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Search } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/cn'
import { getCountryOptions, countryName } from '@/lib/countries'

interface Props {
  value: string
  onChange: (code: string) => void
  id?: string
  className?: string
  placeholder?: string
}

/**
 * Country picker with search. Replaces the "type an ISO code" input on
 * signup — most users don't know their country's alpha-2 code, and a
 * blank field labelled "Country (ISO)" was silently rejecting valid
 * signups. The list is priority-ordered (Ethiopia + common
 * diaspora/investor origins first, then everything alphabetically) so
 * the most common signups take one click.
 */
export function CountryPicker({
  value,
  onChange,
  id,
  className,
  placeholder = 'Choose your country',
}: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const options = useMemo(() => getCountryOptions(), [])
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter(
      (o) => o.name.toLowerCase().includes(q) || o.code.toLowerCase().includes(q),
    )
  }, [query, options])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 0)
    else setQuery('')
  }, [open])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          className={cn(
            'flex h-10 w-full items-center justify-between gap-2 rounded-md border border-border bg-surface px-3 text-left text-sm transition-colors hover:border-brand/40 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20',
            !value && 'text-ink-faint',
            className,
          )}
        >
          <span className="truncate">
            {value ? (
              <>
                <span className="font-mono text-[11px] text-ink-faint">{value}</span>
                <span className="ml-2 text-ink">{countryName(value)}</span>
              </>
            ) : (
              placeholder
            )}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-ink-faint" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <div className="flex items-center gap-2 border-b border-border p-2">
          <Search className="h-3.5 w-3.5 text-ink-faint" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a country name…"
            className="flex-1 bg-transparent text-sm text-ink placeholder:text-ink-faint focus:outline-none"
          />
        </div>
        <div className="max-h-72 overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <p className="p-4 text-center text-xs text-ink-faint">
              No countries match &quot;{query}&quot;.
            </p>
          ) : (
            filtered.map((o) => (
              <button
                key={o.code}
                type="button"
                onClick={() => {
                  onChange(o.code)
                  setOpen(false)
                }}
                className={cn(
                  'flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-sm hover:bg-surface-2',
                  o.priority && 'font-medium',
                )}
              >
                <span className="min-w-0 flex-1 truncate text-ink">{o.name}</span>
                <span className="font-mono text-[11px] text-ink-faint">{o.code}</span>
                {value === o.code ? <Check className="h-3.5 w-3.5 text-brand" /> : null}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
