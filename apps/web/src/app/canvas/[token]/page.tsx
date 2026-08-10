import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Share2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { getPayloadClient } from '@/lib/payload'
import { CanvasSharedView } from './shared-view'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ token: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params
  const doc = await loadShared(token)
  return {
    title: doc ? `${doc.title} · Shared plan` : 'Plan not found',
    robots: { index: false, follow: false },
  }
}

async function loadShared(token: string) {
  try {
    const payload = await getPayloadClient()
    const res = await payload.find({
      collection: 'planning-canvases',
      where: {
        and: [{ share_token: { equals: token } }, { is_public: { equals: true } }],
      },
      limit: 1,
      overrideAccess: true,
    })
    const doc = res.docs[0]
    if (!doc) return null
    return {
      id: Number(doc.id),
      title: doc.title as string,
      nodes: (doc.nodes as never) ?? [],
      edges: (doc.edges as never) ?? [],
      updatedAt: doc.updatedAt as string,
    }
  } catch {
    return null
  }
}

/**
 * Public read-only share view for a planning canvas. Reached via the
 * share_token minted when the owner publishes. No auth required, indexed
 * out via robots meta.
 */
export default async function SharedCanvasPage({ params }: PageProps) {
  const { token } = await params
  const doc = await loadShared(token)
  if (!doc) notFound()

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-sm font-semibold tracking-tightish text-ink hover:text-brand">
            BizBridge
          </Link>
          <Badge variant="brand" className="gap-1">
            <Share2 className="h-3 w-3" /> Shared plan (read-only)
          </Badge>
          <h1 className="text-sm text-ink-muted">{doc.title}</h1>
        </div>
      </header>
      <div className="flex-1">
        <CanvasSharedView nodes={doc.nodes} edges={doc.edges} />
      </div>
    </div>
  )
}
