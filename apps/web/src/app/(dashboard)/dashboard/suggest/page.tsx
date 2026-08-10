import type { Metadata } from 'next'
import { PiggyBank } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { requireUser } from '@/lib/require-user'
import { tryPayload } from '@/lib/payload'
import { humanizeSectorName } from '@/lib/humanize-sector-name'
import { CAPITAL_TIERS } from '@/seed/data/capital-suggestions'
import { SuggestClient } from '@/app/(marketing)/suggest/suggest-client'

export const metadata: Metadata = { title: 'Suggest a sector' }
export const dynamic = 'force-dynamic'

/**
 * Dashboard-shell variant of the capital-to-sectors suggestion tool. Same
 * client component as the public /suggest route, wrapped in a compact
 * header. Server-side data fetch mirrors the marketing route's shape so the
 * client receives the same tiers[] payload.
 */
export default async function DashboardSuggestPage() {
  await requireUser()

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
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-brand/15 text-brand">
            <PiggyBank className="h-4 w-4" />
          </span>
          <Badge variant="brand">Suggest a sector</Badge>
        </div>
        <h1 className="mt-3 text-2xl font-semibold tracking-tightish text-ink sm:text-3xl">
          You&apos;ve got the money — we&apos;ll show you the business.
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-muted">
          Drop your starting capital in birr. We narrow 519 official sectors down to a realistic
          shortlist for that budget in Ethiopia today.
        </p>
      </header>
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
    </div>
  )
}
