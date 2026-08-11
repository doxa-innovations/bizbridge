import { NextRequest, NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/payload'
import { getCurrentUser } from '@/lib/auth-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ALLOWED_TYPES = new Set([
  'page_view',
  'search',
  'sector_view',
  'tool_use',
  'signup',
  'onboarding_complete',
  'canvas_create',
  'report_request',
  'suggestion_submit',
])

/**
 * Product-analytics ingestion. Ping from the client after each route
 * change (page_view) or from other server actions when a meaningful
 * event happens (search, sector_view, etc.). Always returns 204 so a
 * failed write can never cascade into a user-visible error — analytics
 * loss is preferable to interrupting the user.
 */
export async function POST(req: NextRequest) {
  let body: {
    type?: string
    path?: string
    referrer?: string
    session_id?: string
    meta?: Record<string, unknown>
  }
  try {
    body = await req.json()
  } catch {
    return new NextResponse(null, { status: 204 })
  }

  const type = body.type ?? 'page_view'
  if (!ALLOWED_TYPES.has(type)) return new NextResponse(null, { status: 204 })

  // Best-effort session/user attribution. Failure to resolve either is
  // fine — anonymous events are still useful in aggregate.
  const user = await getCurrentUser().catch(() => null)

  const country =
    req.headers.get('cf-ipcountry') ??
    req.headers.get('x-vercel-ip-country') ??
    null
  const ua = req.headers.get('user-agent') ?? null

  try {
    const payload = await getPayloadClient()
    await payload.create({
      collection: 'page-events',
      data: {
        event_type: type as
          | 'page_view'
          | 'search'
          | 'sector_view'
          | 'tool_use'
          | 'signup'
          | 'onboarding_complete'
          | 'canvas_create'
          | 'report_request'
          | 'suggestion_submit',
        path: body.path?.slice(0, 500) ?? null,
        referrer: body.referrer?.slice(0, 500) ?? null,
        user_id: user?.id ?? null,
        session_id: body.session_id?.slice(0, 100) ?? null,
        country: country?.slice(0, 8) ?? null,
        ua: ua?.slice(0, 500) ?? null,
        meta: body.meta ?? null,
      },
      overrideAccess: true,
    })
  } catch (err) {
    // Analytics failures are always silent — log for debugging, never
    // surface to the user.
    // eslint-disable-next-line no-console
    console.warn('[track] write failed', (err as Error).message)
  }

  return new NextResponse(null, { status: 204 })
}
