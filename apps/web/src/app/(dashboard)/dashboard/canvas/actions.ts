'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/require-user'
import { getPayloadClient } from '@/lib/payload'
import {
  findTemplate,
  type CanvasEdge,
  type CanvasNode,
} from '@/lib/canvas-template'

/** Create a new canvas seeded from a template, then send the user to it.
 *  Accepts any key registered in CANVAS_TEMPLATES; unknown keys fall
 *  through to Blank via `findTemplate`. */
export async function createCanvas(formData: FormData) {
  const user = await requireUser()
  const templateKey = (formData.get('template') as string) ?? 'blank'
  const template = findTemplate(templateKey)
  const seed = await template.build(user)

  // Only two values are persisted on the row itself — everything else is
  // in nodes/edges. The DB enum accepts 'blank' | 'onboarding' so
  // anything else stores as 'blank' to satisfy the constraint (the seed
  // still reflects the picked template).
  const persistedTemplate: 'blank' | 'onboarding' =
    template.key === 'onboarding' ? 'onboarding' : 'blank'

  const payload = await getPayloadClient()
  const doc = await payload.create({
    collection: 'planning-canvases',
    data: {
      user_id: user.id,
      title: template.key === 'blank' ? 'Untitled plan' : template.title,
      template: persistedTemplate,
      nodes: seed.nodes,
      edges: seed.edges,
    },
    overrideAccess: true,
  })

  revalidatePath('/dashboard/canvas')
  redirect(`/dashboard/canvas/${doc.id}`)
}

/** Save nodes + edges + title back onto the canvas. Owner-only.
 *
 *  Uses `payload.update` with a `where` filter on both `id` AND
 *  `user_id` so the ownership check happens inline in the UPDATE
 *  statement instead of requiring a separate findByID first. That
 *  halves the round-trip count on every autosave and — because
 *  document-locking is disabled on this collection — the wide
 *  payload_locked_documents scan no longer runs at all. Neon likes
 *  this a lot.
 *
 *  Returns a discriminated union instead of throwing so a transient
 *  server-side failure never surfaces as an opaque "Server Components
 *  render" red toast in the client. */
export async function saveCanvas(input: {
  id: number
  title: string
  nodes: CanvasNode[]
  edges: CanvasEdge[]
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const user = await requireUser()
    const payload = await getPayloadClient()

    const res = await payload.update({
      collection: 'planning-canvases',
      where: {
        and: [
          { id: { equals: input.id } },
          { user_id: { equals: user.id } },
        ],
      },
      data: {
        title: input.title.slice(0, 200) || 'Untitled plan',
        nodes: input.nodes,
        edges: input.edges,
      },
      overrideAccess: true,
    })

    // `update` with `where` returns an object with `docs` — 0 rows
    // means the id didn't exist OR wasn't owned by this user (both
    // resolve to the same "not authorised" answer, which is what we
    // want — no ownership-leak by returning a distinct 404).
    if (res.docs.length === 0) {
      return { ok: false, error: 'Not authorised or canvas missing' }
    }

    // Deliberately NOT calling revalidatePath here — autosave fires
    // frequently and background revalidation of the list/editor page
    // was crashing on any transient render hiccup and surfacing as
    // "Server Components render" red toasts. The list card timestamp
    // catches up when the user navigates back.
    return { ok: true }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[saveCanvas] failed', err)
    return { ok: false, error: (err as Error).message ?? 'unknown' }
  }
}

/** Toggle is_public. Minting the share_token is handled by the beforeChange
 *  hook on the collection so it happens on first publish and only then. */
export async function togglePublish(input: { id: number; publish: boolean }) {
  const user = await requireUser()
  const payload = await getPayloadClient()
  const existing = await payload.findByID({
    collection: 'planning-canvases',
    id: input.id,
    overrideAccess: true,
  })
  if (existing.user_id !== user.id) throw new Error('Not authorised')

  const updated = await payload.update({
    collection: 'planning-canvases',
    id: input.id,
    data: { is_public: input.publish },
    overrideAccess: true,
  })

  // Same reasoning as saveCanvas — the client updates its local
  // is_public/shareToken state directly from this action's return, so
  // there's nothing to revalidate on the editor route.
  return {
    ok: true,
    isPublic: Boolean(updated.is_public),
    shareToken: updated.share_token ?? null,
  }
}

/** Owner-only delete. */
export async function deleteCanvas(formData: FormData) {
  const user = await requireUser()
  const id = Number(formData.get('id'))
  if (!Number.isFinite(id)) return

  const payload = await getPayloadClient()
  const existing = await payload.findByID({
    collection: 'planning-canvases',
    id,
    overrideAccess: true,
  })
  if (existing.user_id !== user.id) return

  await payload.delete({
    collection: 'planning-canvases',
    id,
    overrideAccess: true,
  })
  revalidatePath('/dashboard/canvas')
}
