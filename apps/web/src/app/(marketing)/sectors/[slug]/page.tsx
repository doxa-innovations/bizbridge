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
  const data = await tryPayload(async (payload) => {
    const res = await payload.find({
      collection: 'business-sectors',
      where: { is_active: { equals: true } },
      limit: 1000,
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
