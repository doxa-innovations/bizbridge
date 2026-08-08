'use client'

import Link from 'next/link'
import { useState, useMemo } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

type Sector = {
  mor_code: string
  name_en: string
  name_am: string | null
  slug: string
  description_short: string | null
}

type Tier = {
  key: string
  min_etb: number
  max_etb: number
  label: string
  headline: string
  vibe: string
  sectors: Sector[]
}

// Approximate FX for display only. Post-2024-float official rate has been
// climbing; 140 is a conservative mid-2026 benchmark. Curb rate runs higher.
const ETB_PER_USD = 140

function tierForEtb(amount: number, tiers: Tier[]): Tier {
  for (const t of tiers) {
    if (amount >= t.min_etb && amount < t.max_etb) return t
  }
  return tiers[tiers.length - 1]!
}

function formatEtb(n: number) {
  if (n >= 1_000_000) return `ETB ${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`
  if (n >= 1_000) return `ETB ${(n / 1_000).toFixed(0)}k`
  return `ETB ${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}
function formatEtbFull(n: number) {
  return `ETB ${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}
function formatUsd(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

const PRESETS = [
  { label: 'ETB 30k', etb: 30_000 },
  { label: 'ETB 100k', etb: 100_000 },
  { label: 'ETB 500k', etb: 500_000 },
  { label: 'ETB 2M', etb: 2_000_000 },
  { label: 'ETB 15M', etb: 15_000_000 },
  { label: 'ETB 150M', etb: 150_000_000 },
]

const SLIDER_MIN = 30_000
const SLIDER_MAX = 500_000_000

// Log-scale slider so tiny amounts get room without dominating the track.
function sliderToEtb(v: number): number {
  const min = Math.log(SLIDER_MIN)
  const max = Math.log(SLIDER_MAX)
  return Math.round(Math.exp(min + (max - min) * (v / 1000)) / 1000) * 1000
}
function etbToSlider(etb: number): number {
  const min = Math.log(SLIDER_MIN)
  const max = Math.log(SLIDER_MAX)
  return Math.round(((Math.log(etb) - min) / (max - min)) * 1000)
}

export function SuggestClient({ tiers }: { tiers: Tier[] }) {
  const [amountEtb, setAmountEtb] = useState<number>(300_000)
  const [currency, setCurrency] = useState<'ETB' | 'USD'>('ETB')

  const tier = useMemo(() => tierForEtb(amountEtb, tiers), [amountEtb, tiers])
  const usdEquivalent = amountEtb / ETB_PER_USD

  return (
    <section className="container-page pt-12 pb-14 sm:pt-16">
      {/* INPUT PANEL */}
      <Card className="p-6 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
              your capital
            </p>
            <p className="mt-2 text-4xl font-semibold tracking-crisp text-ink sm:text-5xl">
              {currency === 'ETB' ? formatEtbFull(amountEtb) : formatUsd(usdEquivalent)}
            </p>
            <p className="mt-1 text-sm text-ink-muted">
              {currency === 'ETB'
                ? `≈ ${formatUsd(usdEquivalent)} at ETB ${ETB_PER_USD}/$`
                : `≈ ${formatEtbFull(amountEtb)}`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrency('ETB')}
              className={`rounded-md border px-2.5 py-1 font-mono text-[11px] transition-colors ${
                currency === 'ETB'
                  ? 'border-brand/60 bg-brand/10 text-ink'
                  : 'border-border/70 bg-surface text-ink-muted hover:text-ink'
              }`}
            >
              ETB
            </button>
            <button
              type="button"
              onClick={() => setCurrency('USD')}
              className={`rounded-md border px-2.5 py-1 font-mono text-[11px] transition-colors ${
                currency === 'USD'
                  ? 'border-brand/60 bg-brand/10 text-ink'
                  : 'border-border/70 bg-surface text-ink-muted hover:text-ink'
              }`}
            >
              USD
            </button>
          </div>
        </div>

        <div className="mt-6">
          <input
            type="range"
            min={0}
            max={1000}
            step={1}
            value={etbToSlider(amountEtb)}
            onChange={(e) => setAmountEtb(sliderToEtb(Number(e.target.value)))}
            className="w-full accent-brand"
            aria-label="Starting capital in ETB"
          />
          <div className="mt-1 flex justify-between font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
            <span>ETB 30k</span>
            <span>ETB 500M+</span>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.etb}
              type="button"
              onClick={() => setAmountEtb(p.etb)}
              className={`rounded-md border px-3 py-1.5 font-mono text-[11px] transition-colors ${
                amountEtb === p.etb
                  ? 'border-brand/60 bg-brand/10 text-ink'
                  : 'border-border/70 bg-surface text-ink-muted hover:text-ink'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </Card>

      {/* TIER SUMMARY */}
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Badge variant="accent">{tier.label} tier</Badge>
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
          {formatEtb(tier.min_etb)}
          {tier.max_etb < 5_000_000_000 ? ` – ${formatEtb(tier.max_etb)}` : '+'}
        </p>
      </div>
      <h2 className="mt-3 text-balance text-2xl font-semibold tracking-tightish sm:text-3xl">
        {tier.headline}
      </h2>
      <p className="mt-3 max-w-2xl text-sm text-ink-muted">{tier.vibe}</p>

      {/* SECTOR RESULTS */}
      {tier.sectors.length === 0 ? (
        <p className="mt-8 rounded-lg border border-dashed border-border/70 bg-surface/40 p-6 font-mono text-[12px] text-ink-muted">
          No suggested sectors seeded for this tier yet. Try adjusting the amount.
        </p>
      ) : (
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tier.sectors.map((s) => (
            <Link
              key={s.mor_code}
              href={`/sectors/${s.slug}`}
              className="group rounded-xl border border-border/70 bg-surface p-5 transition-all hover:border-brand/40 hover:bg-surface-2"
            >
              <div className="flex items-start justify-between gap-2">
                <Badge variant="mono">{s.mor_code}</Badge>
                <ArrowUpRight className="h-4 w-4 text-ink-faint transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand" />
              </div>
              <p className="mt-3 text-base font-semibold leading-snug text-ink group-hover:text-brand">
                {s.name_en}
              </p>
              {s.name_am ? (
                <p className="mt-0.5 truncate font-amharic text-xs text-ink-faint">
                  {s.name_am}
                </p>
              ) : null}
              {s.description_short ? (
                <p className="mt-3 line-clamp-3 text-sm text-ink-muted">{s.description_short}</p>
              ) : null}
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
