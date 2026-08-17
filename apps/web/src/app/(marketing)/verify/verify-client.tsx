'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, Copy, Search, X } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

type Kind = 'tin' | 'license' | 'unknown'

const RECENT_KEY = 'bb.verify.recent'
const MAX_RECENT = 6

function classifyInput(raw: string): { kind: Kind; clean: string; hint: string } {
  const clean = raw.replace(/[\s\-_/]/g, '').trim()
  if (!clean) return { kind: 'unknown', clean, hint: '' }
  if (/^\d{10}$/.test(clean))
    return {
      kind: 'tin',
      clean,
      hint: 'Looks like a 10-digit TIN.',
    }
  if (/^\d{7,9}$/.test(clean))
    return {
      kind: 'license',
      clean,
      hint: 'Looks like a trade license or principal registration number.',
    }
  if (/^\d+$/.test(clean))
    return {
      kind: 'unknown',
      clean,
      hint: `${clean.length} digits — a TIN is 10, a license number is usually 7–9.`,
    }
  return {
    kind: 'unknown',
    clean,
    hint: 'Only digits are valid. Strip spaces, dashes, and letters.',
  }
}

export function VerifyClient() {
  const [query, setQuery] = useState('')
  const [recent, setRecent] = useState<string[]>([])

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(RECENT_KEY)
      if (stored) setRecent(JSON.parse(stored))
    } catch {
      /* noop */
    }
  }, [])

  const { kind, clean, hint } = useMemo(() => classifyInput(query), [query])

  function remember(value: string) {
    setRecent((prev) => {
      const next = [value, ...prev.filter((c) => c !== value)].slice(0, MAX_RECENT)
      window.localStorage.setItem(RECENT_KEY, JSON.stringify(next))
      return next
    })
  }

  function copyValue() {
    if (!clean) return
    navigator.clipboard.writeText(clean)
    toast.success('Copied — now paste into eTrade')
    remember(clean)
  }

  function openEtrade() {
    if (clean) remember(clean)
    window.open('https://etrade.gov.et', '_blank', 'noopener,noreferrer')
  }

  return (
    <div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-faint" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          inputMode="numeric"
          placeholder="Paste TIN or trade license number"
          className="h-16 w-full rounded-xl border border-border bg-surface pl-14 pr-14 font-mono text-lg text-ink shadow-elevated focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
        />
        {query ? (
          <button
            onClick={() => setQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-md p-1 text-ink-faint hover:bg-surface-2 hover:text-ink"
            aria-label="Clear"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {clean ? (
        <div className="mt-4 rounded-xl border border-border bg-surface p-5">
          <div className="flex flex-wrap items-center gap-2">
            {kind === 'tin' ? (
              <Badge variant="brand">TIN</Badge>
            ) : kind === 'license' ? (
              <Badge variant="brand">Trade licence / Principal reg</Badge>
            ) : (
              <Badge variant="mono">Unrecognised</Badge>
            )}
            <span className="font-mono text-sm text-ink-muted">{clean}</span>
          </div>
          <p className="mt-2 text-xs text-ink-faint">{hint}</p>

          <div className="mt-4 grid gap-2 text-sm">
            <Step
              n={1}
              text="Copy the number below and open the eTrade portal."
              action={
                <button
                  onClick={copyValue}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border-strong bg-transparent px-3 py-1.5 font-mono text-[11px] text-ink hover:bg-surface-2"
                >
                  <Copy className="h-3 w-3" /> Copy {clean}
                </button>
              }
            />
            <Step
              n={2}
              text="Sign in (free eTrade account) and paste it into the business-search field."
              action={
                <button
                  onClick={openEtrade}
                  className="inline-flex items-center gap-1.5 rounded-md bg-ink px-3 py-1.5 font-mono text-[11px] text-bg hover:opacity-90"
                >
                  Open eTrade <ArrowUpRight className="h-3 w-3" />
                </button>
              }
            />
            <Step
              n={3}
              text="Confirm business name, sector code, licence status, and renewal date match what the counterparty told you."
            />
          </div>
          <p className="mt-4 text-[11px] leading-relaxed text-ink-faint">
            eTrade is the Ministry of Trade&apos;s official system — BizBridge does not
            replicate or cache their data.
          </p>
        </div>
      ) : null}

      {!query && recent.length > 0 ? (
        <div className="mt-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-faint">
            Recent
          </p>
          <div className="flex flex-wrap gap-2">
            {recent.map((c) => (
              <button
                key={c}
                onClick={() => setQuery(c)}
                className="rounded-full border border-border bg-surface px-3 py-1 font-mono text-xs text-ink-muted hover:border-brand/40 hover:text-ink"
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function Step({ n, text, action }: { n: number; text: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-bg/40 px-3 py-2.5">
      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand/15 text-[11px] font-semibold text-brand">
        {n}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-ink-muted">{text}</p>
        {action ? <div className="mt-2">{action}</div> : null}
      </div>
    </div>
  )
}
