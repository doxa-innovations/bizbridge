import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { requireUser } from '@/lib/require-user'
import { getPayloadClient } from '@/lib/payload'
import { CanvasEditor } from './canvas-editor'

export const metadata: Metadata = { title: 'Canvas' }
export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

/**
 * Editor for a single planning canvas. Server component loads the doc + does
 * the owner check, then hands the shape off to the CanvasEditor client for
 * the React Flow surface.
 */
export default async function CanvasEditorPage({ params }: PageProps) {
  const [user, { id }] = await Promise.all([requireUser(), params])
  const canvasId = Number(id)
  if (!Number.isFinite(canvasId)) notFound()

  const payload = await getPayloadClient()
  let doc
  try {
    doc = await payload.findByID({
      collection: 'planning-canvases',
      id: canvasId,
      overrideAccess: true,
    })
  } catch {
    notFound()
  }
  if (!doc || doc.user_id !== user.id) notFound()

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard/canvas">
              <ArrowLeft className="h-3.5 w-3.5" /> All plans
            </Link>
          </Button>
          <Badge variant="brand">Canvas</Badge>
        </div>
      </header>

      <div className="min-h-0 flex-1">
        <CanvasEditor
          canvasId={canvasId}
          initialTitle={(doc.title as string) ?? 'Untitled plan'}
          initialNodes={(doc.nodes as never) ?? []}
          initialEdges={(doc.edges as never) ?? []}
          initialIsPublic={Boolean(doc.is_public)}
          initialShareToken={(doc.share_token as string | null) ?? null}
        />
      </div>
    </div>
  )
}
