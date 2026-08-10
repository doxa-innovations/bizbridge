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

/** Save nodes + edges + title back onto the canvas. Owner-only. */
export async function saveCanvas(input: {
  id: number
  title: string
  nodes: CanvasNode[]
  edges: CanvasEdge[]
}) {
  const user = await requireUser()
  const payload = await getPayloadClient()
  const existing = await payload.findByID({
    collection: 'planning-canvases',
    id: input.id,
    overrideAccess: true,
  })
  if (existing.user_id !== user.id) throw new Error('Not authorised')

  await payload.update({
    collection: 'planning-canvases',
    id: input.id,
    data: {
      title: input.title.slice(0, 200) || 'Untitled plan',
      nodes: input.nodes,
      edges: input.edges,
    },
    overrideAccess: true,
  })

  revalidatePath('/dashboard/canvas')
  revalidatePath(`/dashboard/canvas/${input.id}`)
  return { ok: true }
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

  revalidatePath(`/dashboard/canvas/${input.id}`)
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
