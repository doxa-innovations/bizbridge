import type { Metadata } from 'next'
import Link from 'next/link'
import { Layers3, Plus, Share2, Trash2 } from 'lucide-react'

/** Small hand-rolled relative-time formatter — no dep needed for a single
 *  "updated 2h ago" string. Deliberately terse; use Intl.RelativeTimeFormat
 *  for anything user-facing that needs localisation. */
function relativeFromNow(iso: string): string {
  const then = new Date(iso).getTime()
  const seconds = Math.round((Date.now() - then) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.round(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.round(months / 12)}y ago`
}
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { requireUser } from '@/lib/require-user'
import { getPayloadClient } from '@/lib/payload'
import { createCanvas, deleteCanvas } from './actions'

export const metadata: Metadata = { title: 'Planning canvas' }
export const dynamic = 'force-dynamic'

interface CanvasSummary {
  id: number
  title: string
  updatedAt: string
  nodeCount: number
  isPublic: boolean
}

async function loadCanvases(userId: string): Promise<CanvasSummary[]> {
  try {
    const payload = await getPayloadClient()
    const res = await payload.find({
      collection: 'planning-canvases',
      where: { user_id: { equals: userId } },
      sort: '-updatedAt',
      limit: 50,
      overrideAccess: true,
    })
    return res.docs.map((doc) => ({
      id: Number(doc.id),
      title: doc.title as string,
      updatedAt: doc.updatedAt as string,
      nodeCount: Array.isArray(doc.nodes) ? doc.nodes.length : 0,
      isPublic: Boolean(doc.is_public),
    }))
  } catch {
    return []
  }
}

/**
 * List view for a user's planning canvases. Two seed options — Blank or
 * Auto-seed from onboarding (which pins their interest sectors + a
 * question/task/milestone scaffold).
 */
export default async function CanvasListPage() {
  const user = await requireUser()
  const canvases = await loadCanvases(user.id)

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-brand/15 text-brand">
            <Layers3 className="h-4 w-4" />
          </span>
          <Badge variant="brand">Canvas</Badge>
        </div>
        <h1 className="mt-3 text-2xl font-semibold tracking-tightish text-ink sm:text-3xl">
          Plan on a canvas.
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-muted">
          Sketch a business idea as a mind-map of sectors, tasks, questions, contacts and
          milestones. Nothing to install. Publish a share link when you&apos;re ready to loop in
          a co-founder or advisor.
        </p>
      </header>

      <div className="flex flex-wrap gap-3">
        <form action={createCanvas}>
          <input type="hidden" name="template" value="onboarding" />
          <Button type="submit">
            <Plus className="h-4 w-4" /> New plan (auto-seeded)
          </Button>
        </form>
        <form action={createCanvas}>
          <input type="hidden" name="template" value="blank" />
          <Button type="submit" variant="secondary">
            <Plus className="h-4 w-4" /> Blank canvas
          </Button>
        </form>
      </div>

      {canvases.length === 0 ? (
        <Card className="border-dashed p-8 text-center">
          <p className="text-sm font-semibold text-ink">No plans yet</p>
          <p className="mt-1 text-sm text-ink-muted">
            Start from an auto-seeded plan tuned to your onboarding interests, or go blank.
          </p>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {canvases.map((c) => (
            <Card key={c.id} className="flex flex-col p-5">
              <div className="flex items-start justify-between gap-2">
                <Link
                  href={`/dashboard/canvas/${c.id}`}
                  className="flex-1 text-sm font-semibold text-ink hover:text-brand"
                >
                  {c.title}
                </Link>
                {c.isPublic ? (
                  <Badge variant="brand" className="shrink-0">
                    <Share2 className="h-3 w-3" /> Shared
                  </Badge>
                ) : null}
              </div>
              <p className="mt-1 text-xs text-ink-faint">
                {c.nodeCount} node{c.nodeCount === 1 ? '' : 's'} · updated{' '}
                {relativeFromNow(c.updatedAt)}
              </p>
              <div className="mt-4 flex items-center justify-between gap-2">
                <Button asChild size="sm" variant="secondary">
                  <Link href={`/dashboard/canvas/${c.id}`}>Open</Link>
                </Button>
                <form action={deleteCanvas}>
                  <input type="hidden" name="id" value={c.id} />
                  <Button type="submit" size="sm" variant="ghost">
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </Button>
                </form>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
