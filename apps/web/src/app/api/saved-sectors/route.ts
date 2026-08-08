import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getPayloadClient } from '@/lib/payload'
import { getCurrentUser } from '@/lib/auth-server'

function invalidateDashboardPaths() {
  // Keep the personalized surfaces in sync after a bookmark change.
  try {
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/research')
  } catch {
    // revalidatePath throws when called outside a request context (e.g. tests);
    // ignore — the pages will pick up the new state on next natural fetch.
  }
}

/**
 * Bookmark a sector.
 *
 *   POST /api/saved-sectors { sectorId: number, note?: string }
 *
 * Idempotent — hitting POST for an already-saved sector is a no-op that
 * returns 200 with the existing row.
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = (await req.json().catch(() => null)) as { sectorId?: number | string; note?: string } | null
  if (!body?.sectorId) {
    return NextResponse.json({ error: 'sectorId required' }, { status: 400 })
  }
  const sectorId = Number.isFinite(Number(body.sectorId)) ? Number(body.sectorId) : null
  if (sectorId === null) {
    return NextResponse.json({ error: 'invalid sectorId' }, { status: 400 })
  }

  const payload = await getPayloadClient()

  const existing = await payload.find({
    collection: 'saved-sectors',
    where: {
      and: [{ user_id: { equals: user.id } }, { sector: { equals: sectorId } }],
    },
    limit: 1,
    overrideAccess: true,
  })

  if (existing.docs[0]) {
    return NextResponse.json({ id: existing.docs[0].id, saved: true }, { status: 200 })
  }

  const note = typeof body.note === 'string' ? body.note.slice(0, 200) : undefined
  const created = await payload.create({
    collection: 'saved-sectors',
    data: {
      user_id: user.id,
      sector: sectorId,
      saved_at: new Date().toISOString(),
      ...(note ? { note } : {}),
    },
    overrideAccess: true,
  })

  invalidateDashboardPaths()
  return NextResponse.json({ id: created.id, saved: true }, { status: 201 })
}

/**
 * Remove a bookmark by sectorId.
 *
 *   DELETE /api/saved-sectors?sectorId=123
 */
export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const sectorIdRaw = req.nextUrl.searchParams.get('sectorId')
  const sectorId = sectorIdRaw && Number.isFinite(Number(sectorIdRaw)) ? Number(sectorIdRaw) : null
  if (!sectorId) return NextResponse.json({ error: 'sectorId required' }, { status: 400 })

  const payload = await getPayloadClient()
  const existing = await payload.find({
    collection: 'saved-sectors',
    where: {
      and: [{ user_id: { equals: user.id } }, { sector: { equals: sectorId } }],
    },
    limit: 1,
    overrideAccess: true,
  })
  if (!existing.docs[0]) {
    return NextResponse.json({ saved: false }, { status: 200 })
  }
  await payload.delete({
    collection: 'saved-sectors',
    id: existing.docs[0].id,
    overrideAccess: true,
  })
  invalidateDashboardPaths()
  return NextResponse.json({ saved: false }, { status: 200 })
}

/**
 * List the caller's saved sectors.
 *
 *   GET /api/saved-sectors
 */
export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const payload = await getPayloadClient()
  const res = await payload.find({
    collection: 'saved-sectors',
    where: { user_id: { equals: user.id } },
    sort: '-saved_at',
    limit: 200,
    depth: 1,
    overrideAccess: true,
  })
  return NextResponse.json({ saved: res.docs })
}
