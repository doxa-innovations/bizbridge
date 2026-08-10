import type { Metadata } from 'next'
import { humanizeSectorName } from '@/lib/humanize-sector-name'
import { requireUser } from '@/lib/require-user'
import {
  SectorDetailFeature,
  fetchSectorForMetadata,
} from '@/features/sectors/detail'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const sector = await fetchSectorForMetadata(slug)
  if (!sector) return { title: 'Sector not found' }
  const cleanName = humanizeSectorName(sector.mor_code, sector.name_en)
  return { title: `${cleanName} · MOR ${sector.mor_code}` }
}

/**
 * Dashboard-shell variant of the sector detail page. Same feature component
 * as the public /sectors/[slug] route, mounted under /dashboard/sectors so
 * the sidebar chrome stays put and breadcrumb/related links keep the user
 * inside the dashboard.
 */
export default async function DashboardSectorDetailPage({ params }: PageProps) {
  const [{ slug }] = await Promise.all([params, requireUser()])
  return <SectorDetailFeature slug={slug} basePath="/dashboard/sectors" />
}
