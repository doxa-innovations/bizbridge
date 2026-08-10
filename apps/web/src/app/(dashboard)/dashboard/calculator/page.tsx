import type { Metadata } from 'next'
import { Calculator } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { requireUser } from '@/lib/require-user'
import { tryPayload } from '@/lib/payload'
import { CalculatorClient } from '@/app/(marketing)/calculator/calculator-client'

export const metadata: Metadata = { title: 'Cost calculator' }
export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ sector?: string }>
}

/**
 * Dashboard-shell variant of the setup-cost calculator. Same client component
 * as the public /calculator page, wrapped in a compact header instead of the
 * marketing hero so it sits neatly beside the sidebar chrome.
 *
 * Personalization: if the URL doesn't already carry `?sector=`, we prefill
 * from the user's first bookmarked interest sector (if any) — one less
 * click for someone who came here from their saved-sectors card.
 */
export default async function DashboardCalculatorPage({ searchParams }: PageProps) {
  const [user, sp] = await Promise.all([requireUser(), searchParams])

  let initialSectorSlug = sp.sector ?? null
  if (!initialSectorSlug && user.interestSectors && user.interestSectors.length > 0) {
    initialSectorSlug = await resolveMorCodeToSlug(user.interestSectors[0]!)
  }

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-brand/15 text-brand">
            <Calculator className="h-4 w-4" />
          </span>
          <Badge variant="brand">Cost calculator</Badge>
        </div>
        <h1 className="mt-3 text-2xl font-semibold tracking-tightish text-ink sm:text-3xl">
          What will it actually cost?
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-muted">
          Move the sliders. See your end-to-end setup cost — government fees, professional
          services, capital floor, contingency — recompute live.
        </p>
      </header>
      <CalculatorClient initialSectorSlug={initialSectorSlug} />
    </div>
  )
}

/** Onboarding stores interest as MOR codes; the calculator client expects a
 *  sector slug. Resolve one to the other. Returns null if the code isn't in
 *  the DB (bad data or seed regressed). */
async function resolveMorCodeToSlug(morCode: string): Promise<string | null> {
  const slug = await tryPayload(async (payload) => {
    const res = await payload.find({
      collection: 'business-sectors',
      where: { mor_code: { equals: morCode } },
      limit: 1,
      depth: 0,
    })
    return res.docs[0]?.slug ?? null
  })
  return slug ?? null
}
