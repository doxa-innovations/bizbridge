import { NextRequest, NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/payload'
import { getCurrentUser } from '@/lib/auth-server'

/** Bookmark a report (idempotent). */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = (await req.json().catch(() => null)) as { reportId?: number | string } | null
  const reportId = body?.reportId && Number.isFinite(Number(body.reportId)) ? Number(body.reportId) : null
  if (!reportId) return NextResponse.json({ error: 'reportId required' }, { status: 400 })

  const payload = await getPayloadClient()
  const existing = await payload.find({
    collection: 'saved-reports',
    where: {
      and: [{ user_id: { equals: user.id } }, { report: { equals: reportId } }],
    },
    limit: 1,
    overrideAccess: true,
  })
  if (existing.docs[0]) {
    return NextResponse.json({ id: existing.docs[0].id, saved: true }, { status: 200 })
  }
  const created = await payload.create({
    collection: 'saved-reports',
    data: {
      user_id: user.id,
      report: reportId,
      saved_at: new Date().toISOString(),
    },
    overrideAccess: true,
  })
  return NextResponse.json({ id: created.id, saved: true }, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const reportIdRaw = req.nextUrl.searchParams.get('reportId')
  const reportId = reportIdRaw && Number.isFinite(Number(reportIdRaw)) ? Number(reportIdRaw) : null
  if (!reportId) return NextResponse.json({ error: 'reportId required' }, { status: 400 })
  const payload = await getPayloadClient()
  const existing = await payload.find({
    collection: 'saved-reports',
    where: {
      and: [{ user_id: { equals: user.id } }, { report: { equals: reportId } }],
    },
    limit: 1,
    overrideAccess: true,
  })
  if (!existing.docs[0]) return NextResponse.json({ saved: false }, { status: 200 })
  await payload.delete({
    collection: 'saved-reports',
    id: existing.docs[0].id,
    overrideAccess: true,
  })
  return NextResponse.json({ saved: false }, { status: 200 })
}
