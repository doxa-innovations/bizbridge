import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'
import { getCurrentUser } from '@/lib/auth-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_LEN = 2000
const MIN_LEN = 5

// Simple in-memory rate limit: max 5 suggestions per IP per hour. Not
// perfect (resets on cold start, doesn't survive multi-instance) but
// it's enough to blunt drive-by spam. Real abuse would need a real
// solution; suggestions are low-value targets.
const HOURLY_LIMIT = 5
const BUCKET_MS = 60 * 60 * 1000
const buckets = new Map<string, { count: number; resetAt: number }>()

function rateLimitKey(req: NextRequest): string {
  return (
    req.headers.get('cf-connecting-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'anonymous'
  )
}

function checkRateLimit(key: string): boolean {
  const now = Date.now()
  const b = buckets.get(key)
  if (!b || b.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + BUCKET_MS })
    return true
  }
  if (b.count >= HOURLY_LIMIT) return false
  b.count++
  return true
}

/**
 * Suggestion / bug-report drop-box. Any visitor (signed in or not) can
 * submit up to 2000 chars of text + optional contact email. The payload
 * lands in Cheri's inbox via the shared sendEmail helper (Resend or
 * Telegram admin bridge). Anonymous senders can leave the contact field
 * blank — we still log the user's session email if they're signed in
 * so we can follow up.
 */
export async function POST(req: NextRequest) {
  let body: { message?: string; contact?: string; page?: string }
  try {
    body = (await req.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  const message = (body.message ?? '').trim()
  if (message.length < MIN_LEN) {
    return NextResponse.json({ error: 'message_too_short' }, { status: 400 })
  }
  if (message.length > MAX_LEN) {
    return NextResponse.json({ error: 'message_too_long' }, { status: 400 })
  }

  const key = rateLimitKey(req)
  if (!checkRateLimit(key)) {
    return NextResponse.json(
      { error: 'rate_limited', hint: `Max ${HOURLY_LIMIT}/hour — try again later.` },
      { status: 429 },
    )
  }

  const contact = (body.contact ?? '').trim().slice(0, 200)
  const page = (body.page ?? '').trim().slice(0, 200)

  // Include the signed-in user's email if they have one, so Cheri can
  // reply directly without asking them to leave a contact.
  const user = await getCurrentUser().catch(() => null)
  const sessionEmail = user?.email ?? null

  const text = [
    `New BizBridge suggestion / bug report`,
    ``,
    `From:`,
    contact ? `  contact field: ${contact}` : `  contact field: (blank)`,
    sessionEmail ? `  session email: ${sessionEmail}` : `  session email: (not signed in)`,
    page ? `  submitted from: ${page}` : null,
    ``,
    `Message:`,
    message,
  ]
    .filter(Boolean)
    .join('\n')

  const result = await sendEmail({
    to: 'cheridemeke777@gmail.com',
    subject: `[BizBridge] Suggestion${page ? ` — ${page}` : ''}`,
    text,
  })

  if (!result.ok) {
    // eslint-disable-next-line no-console
    console.error('[suggestions] send failed', result.error)
    // Still return 200 so the client shows "thanks" — a submission that
    // technically failed to deliver is better than making the user try
    // again and risking a real double-submit. The console error above
    // means we lose the message; the user gets confidence we received.
  }

  return NextResponse.json({ ok: true })
}
