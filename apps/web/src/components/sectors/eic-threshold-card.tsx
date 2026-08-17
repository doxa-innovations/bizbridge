import { AlertTriangle, ArrowUpRight, Globe2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { getFxRates } from '@/lib/fx'
import {
  EIC_SOURCED_AT,
  eicThresholdForCategory,
  type EicThreshold,
} from '@/seed/data/eic-thresholds'

function usdToEtb(usd: number, etbPerUsd: number): string {
  const etb = Math.round(usd * etbPerUsd)
  if (etb >= 1_000_000) return `${(etb / 1_000_000).toFixed(1)}M`
  if (etb >= 1_000) return `${Math.round(etb / 1_000).toLocaleString()}k`
  return etb.toLocaleString()
}

function usd(n: number): string {
  return n.toLocaleString('en-US')
}

/**
 * "Foreign investor minimum capital" card for the sector-detail page.
 * Renders only when the sector's category has a mapped EIC threshold
 * dataset. The numbers are broad indicative rules under Proclamation
 * 1180/2020 — the card links out to EIC for the current, definitive
 * per-application figure.
 */
export async function EicThresholdCard({
  categorySlug,
}: {
  categorySlug: string | null | undefined
}) {
  const threshold = eicThresholdForCategory(categorySlug)
  if (!threshold) return null

  const fx = await getFxRates()
  const etbPerUsd = fx.rates.ETB

  return (
    <Card className="p-6">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-brand/15 text-brand">
          <Globe2 className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
            Foreign investor minimum capital
          </p>
          <h3 className="mt-1 text-lg font-semibold tracking-tightish text-ink">
            EIC investment permit thresholds
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">{threshold.note}</p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <ThresholdTile
              label="100% foreign-owned"
              usdValue={threshold.foreignSoloUsd}
              etbLabel={usdToEtb(threshold.foreignSoloUsd, etbPerUsd)}
              reduced={threshold.reduced}
            />
            <ThresholdTile
              label="Joint venture with Ethiopian"
              usdValue={threshold.jvUsd}
              etbLabel={usdToEtb(threshold.jvUsd, etbPerUsd)}
              reduced={threshold.reduced}
            />
          </div>

          {threshold.restrictions.length > 0 ? (
            <div className="mt-5 rounded-lg border border-warn/30 bg-warn/5 p-4">
              <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-warn">
                <AlertTriangle className="h-3 w-3" /> Restrictions in this category
              </p>
              <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-ink-muted">
                {threshold.restrictions.map((r) => (
                  <li key={r} className="flex gap-2">
                    <span className="text-warn">·</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-4">
            <a
              href="https://investethiopia.gov.et"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md bg-ink px-3 py-1.5 font-mono text-[11px] text-bg hover:opacity-90"
            >
              Verify with EIC <ArrowUpRight className="h-3 w-3" />
            </a>
            <p className="font-mono text-[10px] leading-relaxed text-ink-faint">
              Broad rules under Proclamation 1180/2020 · sourced {EIC_SOURCED_AT} ·
              per-application figure may differ · profit reinvestment by existing
              investors is exempt.
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}

function ThresholdTile({
  label,
  usdValue,
  etbLabel,
  reduced,
}: {
  label: string
  usdValue: EicThreshold['foreignSoloUsd']
  etbLabel: string
  reduced: boolean
}) {
  return (
    <div className="rounded-lg border border-border bg-surface px-4 py-3">
      <p className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">
        {label}
      </p>
      <p className="mt-2 font-mono text-xl font-semibold tabular-nums text-ink">
        ${usd(usdValue)}
      </p>
      <p className="mt-0.5 font-mono text-[11px] text-ink-muted">
        ≈ ETB {etbLabel}
      </p>
      {reduced ? (
        <p className="mt-2 inline-block rounded-full bg-brand/15 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-brand">
          Reduced tier
        </p>
      ) : null}
    </div>
  )
}
