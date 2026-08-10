import type { Metadata } from 'next'
import { requireUser } from '@/lib/require-user'
import {
  SectorsBrowseFeature,
  type SectorsBrowseSearchParams,
} from '@/features/sectors/browse'

export const metadata: Metadata = { title: 'Sectors' }
export const dynamic = 'force-dynamic'

/**
 * Dashboard-shell variant of the sectors browser. Same feature component
 * as the public /sectors route, mounted under /dashboard/sectors so the
 * sidebar chrome stays put and every sector card links back into the
 * dashboard shell.
 *
 * Personalization: if the user hasn't explicitly picked a category from the
 * chip nav, we default to their first onboarding interest category (if any).
 * That gives someone who said "I'm interested in software" a filtered view
 * on first visit without hiding the "All" chip.
 */
export default async function DashboardSectorsPage({
  searchParams,
}: {
  searchParams: Promise<SectorsBrowseSearchParams>
}) {
  const [user, sp] = await Promise.all([requireUser(), searchParams])
  const defaultCategory =
    user.interestCategories && user.interestCategories.length > 0
      ? user.interestCategories[0] ?? null
      : null

  return (
    <SectorsBrowseFeature
      basePath="/dashboard/sectors"
      searchParams={sp}
      defaultCategory={defaultCategory}
    />
  )
}
