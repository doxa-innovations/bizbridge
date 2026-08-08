import { NextRequest, NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/payload'
import { getCurrentUser } from '@/lib/auth-server'

/**
 * Auth-gated proxy-stream for a purchased report PDF.
 *
 * Flow:
 *  1. Look up the ReportRequest by id.
 *  2. Assert request.user_id === session.user.id (owner-only).
 *  3. Assert status === 'verified' and download_expires_at > now.
 *  4. Fetch the underlying report file URL from Payload (works for both
 *     R2-hosted and locally-served files).
 *  5. Stream the response back with private cache headers. Never redirects —
 *     the underlying R2/URL is not exposed to the client.
 *  6. Increment download_count.
 */

interface ReportRow {
  id: number | string
  user_id: string
  status: 'pending' | 'verified' | 'rejected'
  download_expires_at: string | null
  download_count: number | null
  report: {
    id: number | string
    title: string
    filename?: string
    mimeType?: string
    url?: string
  } | null
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ requestId: string }> },
) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { requestId } = await ctx.params
  const payload = await getPayloadClient()

  const requestNumericId = Number.isFinite(Number(requestId)) ? Number(requestId) : requestId
  let row: ReportRow | null = null
  try {
    row = (await payload.findByID({
      collection: 'report-requests',
      id: requestNumericId as number,
      depth: 1,
      overrideAccess: true,
    })) as unknown as ReportRow
  } catch {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }
  if (!row) return NextResponse.json({ error: 'not found' }, { status: 404 })

  if (row.user_id !== user.id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }
  if (row.status !== 'verified') {
    return NextResponse.json({ error: 'not verified' }, { status: 403 })
  }
  if (row.download_expires_at && new Date(row.download_expires_at) < new Date()) {
    return NextResponse.json({ error: 'download expired' }, { status: 410 })
  }
  if (!row.report?.url) {
    return NextResponse.json({ error: 'report file missing' }, { status: 500 })
  }

  // Stream the file back
  let upstream: Response
  try {
    upstream = await fetch(row.report.url)
    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ error: 'upstream fetch failed' }, { status: 502 })
    }
  } catch {
    return NextResponse.json({ error: 'upstream fetch failed' }, { status: 502 })
  }

  // Increment download_count (fire-and-forget to keep the response fast)
  const newCount = (row.download_count ?? 0) + 1
  void payload
    .update({
      collection: 'report-requests',
      id: row.id,
      data: { download_count: newCount },
      overrideAccess: true,
    })
    .catch((err) => console.error('[downloads] count update failed:', err))

  const filename = row.report.filename ?? `${slugify(row.report.title)}.pdf`
  const mime = row.report.mimeType ?? 'application/pdf'

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      'content-type': mime,
      'content-disposition': `attachment; filename="${filename}"`,
      'cache-control': 'private, no-store',
      'x-robots-tag': 'noindex',
    },
  })
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}
