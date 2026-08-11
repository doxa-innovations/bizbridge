import type { Metadata } from 'next'
import { tryPayload } from '@/lib/payload'
import { humanizeSectorName } from '@/lib/humanize-sector-name'
import {
  SectorDetailFeature,
  fetchSectorForMetadata,
} from '@/features/sectors/detail'

export const revalidate = 3600
export const dynamicParams = true

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  // Only prerender the featured sectors at build time. Prerendering all
  // 519 hammers Neon with 3000+ concurrent queries in a few seconds and
  // triggers connection-drop noise in the build log (pages still render
  // via defensive fallbacks, but the log is ugly and builds take twice
  // as long as they should). The remaining sectors render on first
  // request and get cached via ISR (`revalidate = 3600` above),
  // combined with `dynamicParams = true` so any slug outside the
  // featured set works. Same UX for the visitor, ~10× faster + quieter
  // build.
  const data = await tryPayload(async (payload) => {
    const res = await payload.find({
      collection: 'business-sectors',
      where: {
        and: [
          { is_active: { equals: true } },
          { is_featured: { equals: true } },
        ],
      },
      limit: 60,
      depth: 0,
    })
    return res.docs.map((s) => ({ slug: s.slug }))
  })
  return data ?? []
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const sector = await fetchSectorForMetadata(slug)
  if (!sector) return { title: 'Sector not found' }
  const cleanName = humanizeSectorName(sector.mor_code, sector.name_en)
  return {
    title: `${cleanName} · MOR ${sector.mor_code}`,
    description:
      sector.description_short ??
      `Complete setup guide for ${cleanName} in Ethiopia. MOR code ${sector.mor_code}.`,
  }
}

export default async function SectorDetailPage({ params }: PageProps) {
  const { slug } = await params
  return <SectorDetailFeature slug={slug} basePath="/sectors" />
}
