import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, PiggyBank, TrendingUp } from 'lucide-react'
import { tryPayload } from '@/lib/payload'
import { humanizeSectorName } from '@/lib/humanize-sector-name'
import { CAPITAL_TIERS } from '@/seed/data/capital-suggestions'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { FxWidget } from '@/components/fx/fx-widget'
import { SuggestClient } from './suggest-client'

export const metadata: Metadata = {
  title: 'What business can I open with my birr?',
  description:
    'Enter your starting capital in ETB — get a shortlist of sectors realistic for that budget in Ethiopia today, from a home-based side hustle at ETB 30k up to EIC-tier investment operations.',
}

export const revalidate = 3600

export default async function SuggestPage() {
  const codes = Array.from(new Set(CAPITAL_TIERS.flatMap((t) => t.sector_codes)))

  const sectorsByCode = await tryPayload(async (payload) => {
    const res = await payload.find({
      collection: 'business-sectors',
      where: { or: codes.map((c) => ({ mor_code: { equals: c } })) },
      limit: codes.length,
      depth: 0,
    })
    const map: Record<
      string,
      { mor_code: string; name_en: string; name_am?: string | null; slug: string; description_short?: string | null }
    > = {}
    for (const doc of res.docs) map[doc.mor_code] = doc as (typeof map)[string]
    return map
  })

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border/70">
        <div aria-hidden className="pointer-events-none absolute inset-0 grid-mesh" />
        <div className="relative container-page py-16 sm:py-20">
          <Badge variant="brand" className="mb-4 inline-flex">
            <PiggyBank className="h-3 w-3" /> Suggest a sector
          </Badge>
          <h1 className="text-balance text-4xl font-semibold tracking-crisp sm:text-5xl lg:text-6xl">
            You’ve got the money.
            <br />
            <span className="text-ink-muted">We’ll show you the business.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-balance font-mono text-[13px] leading-relaxed text-ink-muted sm:text-[15px]">
            Drop your starting capital below in birr. We’ll narrow 519 official MOR sectors
            down to a realistic shortlist for that budget in Ethiopia today — no upsell, no
            gatekeeping. Numbers are indicative of post-float 2026 cost reality.
          </p>
          <div className="mt-8 max-w-2xl">
            <FxWidget />
          </div>
        </div>
      </section>

      {/* CLIENT INPUT + FILTERED RESULTS */}
      <SuggestClient
        tiers={CAPITAL_TIERS.map((t) => ({
          ...t,
          sectors: t.sector_codes
            .map((code) => sectorsByCode?.[code])
            .filter((s): s is NonNullable<typeof s> => Boolean(s))
            .map((s) => ({
              mor_code: s.mor_code,
              name_en: humanizeSectorName(s.mor_code, s.name_en),
              name_am: s.name_am ?? null,
              slug: s.slug,
              description_short: s.description_short ?? null,
            })),
        }))}
      />

      {/* DISCLAIMER + LINK OUT */}
      <section className="container-page pb-20">
        <Card className="mt-8 border-dashed p-6">
          <div className="flex items-start gap-4">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-accent/15 text-accent">
              <TrendingUp className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
                Reality check
              </p>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                These tiers are opinion, not law — and Ethiopia is expensive right now. Rent,
                inventory and imported inputs have all repriced since the birr floated in July
                2024, so a shopfront that cost ETB 5k/month in 2023 easily runs ETB 15–20k
                today. Actual minimums depend on the sector-specific licence and — if you’re a
                foreign investor — on Ethiopian Investment Commission thresholds (roughly
                ETB 28M solo, ETB 21M as JV with an Ethiopian, subject to change). Always
                verify the current capital minimum for your specific sector before you commit.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/wizard"
                  className="inline-flex items-center gap-2 rounded-md border border-border-strong bg-transparent px-4 py-2 font-mono text-[12px] text-ink hover:bg-surface"
                >
                  Try the 5-question wizard <ArrowRight className="h-3 w-3" />
                </Link>
                <Link
                  href="/consult"
                  className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 font-mono text-[12px] text-bg hover:opacity-90"
                >
                  Talk to a human <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </Card>
      </section>
    </div>
  )
}
