import type { Metadata } from 'next'
import Link from 'next/link'
import { Layers3, Share2, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { requireUser } from '@/lib/require-user'
import { getPayloadClient } from '@/lib/payload'
import { CANVAS_TEMPLATES } from '@/lib/canvas-template'
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
      title: (doc.title as string) ?? 'Untitled plan',
      updatedAt: (doc.updatedAt as string) ?? new Date().toISOString(),
      nodeCount: Array.isArray(doc.nodes) ? (doc.nodes as unknown[]).length : 0,
      isPublic: Boolean(doc.is_public),
    }))
  } catch {
    return []
  }
}

/**
 * Canvas gallery — starter templates on top, the user's existing plans
 * underneath. Templates cover common Ethiopian small-business setups
 * (coffee export, restaurant, software startup, retail, consulting) with
 * pre-wired sector + tasks + revenue milestones so the user has something
 * to poke at instead of a blank white page.
 */
export default async function CanvasListPage() {
  const user = await requireUser()
  const canvases = await loadCanvases(user.id)

  return (
    <div className="space-y-8">
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
          Sketch a business as a mind-map of sectors, tasks, questions, contacts, docs and
          milestones. Start from a template with a real Ethiopian sector wired up, or go blank.
        </p>
      </header>

      <section>
        <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
          Start from a template
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CANVAS_TEMPLATES.map((t) => (
            <form key={t.key} action={createCanvas}>
              <input type="hidden" name="template" value={t.key} />
              <button
                type="submit"
                className="group flex h-full w-full flex-col rounded-lg border border-border bg-surface p-4 text-left transition-all hover:border-brand/40"
              >
                <Badge variant="outline" className="mb-2 self-start">
                  {t.vibe}
                </Badge>
                <p className="text-sm font-semibold text-ink group-hover:text-brand">
                  {t.title}
                </p>
                <p className="mt-1 flex-1 text-xs text-ink-muted">{t.description}</p>
                <span className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint group-hover:text-brand">
                  Create →
                </span>
              </button>
            </form>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
          Your plans
        </h2>
        {canvases.length === 0 ? (
          <Card className="border-dashed p-8 text-center">
            <p className="text-sm font-semibold text-ink">No plans yet</p>
            <p className="mt-1 text-sm text-ink-muted">
              Pick a template above to spin one up.
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
      </section>
    </div>
  )
}
