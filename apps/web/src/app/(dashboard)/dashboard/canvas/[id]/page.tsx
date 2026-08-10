import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/require-user'
import { getPayloadClient } from '@/lib/payload'
import { CanvasEditor } from './canvas-editor'

export const metadata: Metadata = { title: 'Canvas' }
export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

/**
 * Editor for a single planning canvas. Server component loads the doc +
 * does the owner check, then hands the shape off to the CanvasEditor
 * client for the React Flow surface.
 *
 * The editor renders in a position:fixed inset:0 z-50 wrapper so it
 * covers the surrounding dashboard shell — the sidebar is still there,
 * just hidden underneath. The back link in the editor toolbar returns
 * the user to /dashboard/canvas, which restores the shell.
 *
 * Defensive: always coerces nodes/edges to arrays before handing them
 * off, and swallows a findByID failure with notFound() rather than
 * letting a Server Components error bubble up to the user.
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
    <div className="fixed inset-0 z-50 flex flex-col bg-bg">
      <CanvasEditor
        canvasId={canvasId}
        initialTitle={(doc.title as string) ?? 'Untitled plan'}
        initialNodes={Array.isArray(doc.nodes) ? (doc.nodes as never) : []}
        initialEdges={Array.isArray(doc.edges) ? (doc.edges as never) : []}
        initialIsPublic={Boolean(doc.is_public)}
        initialShareToken={(doc.share_token as string | null) ?? null}
      />
    </div>
  )
}
