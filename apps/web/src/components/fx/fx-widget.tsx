import { getFxRates } from '@/lib/fx'

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'] as const

function formatEtb(n: number) {
  return n.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

function formatRelative(iso: string) {
  if (!iso) return 'baseline'
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return 'baseline'
  const hours = Math.max(0, Math.round((Date.now() - then) / 3_600_000))
  if (hours < 1) return 'just now'
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  return days === 1 ? '1d ago' : `${days}d ago`
}

/**
 * Compact FX card. Server component — renders on the initial page load
 * so the numbers are present without a client fetch. Uses lib/fx which
 * has a 6h fetch cache. Falls back to a hard-coded post-float baseline
 * if the upstream is down; when that happens the "as of" label reads
 * "baseline" so users can tell.
 */
export async function FxWidget({
  compact = false,
  className = '',
}: {
  compact?: boolean
  className?: string
}) {
  const fx = await getFxRates()
  const perEtb = (perUsd: number) => fx.rates.ETB / perUsd

  return (
    <div
      className={`rounded-xl border border-border bg-surface px-4 py-3 text-sm ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
          Live FX → ETB
        </p>
        <p className="font-mono text-[10px] text-ink-faint">
          {fx.source === 'fallback' ? 'baseline' : formatRelative(fx.fetchedAt)}
        </p>
      </div>
      <div
        className={`mt-3 grid gap-2 ${
          compact ? 'grid-cols-3' : 'grid-cols-3 sm:grid-cols-5'
        }`}
      >
        {CURRENCIES.slice(0, compact ? 3 : 5).map((code) => {
          const rate = code === 'USD' ? fx.rates.ETB : perEtb(fx.rates[code])
          return (
            <div
              key={code}
              className="rounded-md border border-border/60 bg-bg/40 px-2.5 py-2"
            >
              <p className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">
                1 {code}
              </p>
              <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-ink">
                {formatEtb(rate)}
              </p>
              <p className="font-mono text-[10px] text-ink-faint">ETB</p>
            </div>
          )
        })}
      </div>
      {fx.source !== 'fallback' ? (
        <p className="mt-3 font-mono text-[10px] leading-relaxed text-ink-faint">
          Market rate — parallel/hawala rates and NBE reference rates differ.
        </p>
      ) : (
        <p className="mt-3 font-mono text-[10px] leading-relaxed text-ink-faint">
          Live rates unavailable — showing 2026 post-float baseline.
        </p>
      )}
    </div>
  )
}
