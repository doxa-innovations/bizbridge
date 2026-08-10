import type { Metadata } from 'next'
import { SectorsBrowseFeature, type SectorsBrowseSearchParams } from '@/features/sectors/browse'

export const metadata: Metadata = {
  title: 'Browse business sectors in Ethiopia',
  description:
    'Every sector from MOR Directive 17/2011, with licensing requirements, ministry approvals, costs, and step-by-step setup for Bishoftu and beyond.',
}

export const revalidate = 3600

export default async function SectorBrowserPage({
  searchParams,
}: {
  searchParams: Promise<SectorsBrowseSearchParams>
}) {
  const sp = await searchParams
  return <SectorsBrowseFeature basePath="/sectors" searchParams={sp} />
}
