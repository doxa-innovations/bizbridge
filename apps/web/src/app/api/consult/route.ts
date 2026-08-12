import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'
import { CONSULT_EMAIL } from '@/lib/flags'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_LEN = 2000
const MIN_LEN = 10

// In-memory rate limit: 3 submissions per IP per 10 minutes. Blunts
// drive-by spam without needing infrastructure.
const LIMIT = 3
const BUCKET_MS = 10 * 60 * 1000
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
  if (b.count >= LIMIT) return false
  b.count++
  return true
}

/**
 * Consult / contact-form drop-box. Replaces the previous Formsubmit.co
 * external POST — everything now goes through Resend via sendEmail
 * (falls back to Telegram / console per lib/email.ts). One less
 * third-party dependency, same recipient inbox.
 */
export async function POST(req: NextRequest) {
  let body: {
    name?: string
    email?: string
    sector?: string
    message?: string
    contact_pref?: string
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_body' }, { status: 400 })
  }

  const name = (body.name ?? '').trim().slice(0, 200)
  const email = (body.email ?? '').trim().slice(0, 200)
  const message = (body.message ?? '').trim().slice(0, MAX_LEN)
  const sector = (body.sector ?? '').trim().slice(0, 200)
  const contactPref = (body.contact_pref ?? '').trim().slice(0, 200)

  if (!name || !email || !message) {
    return NextResponse.json(
      { ok: false, error: 'name, email and message are required' },
      { status: 400 },
    )
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ ok: false, error: 'invalid_email' }, { status: 400 })
  }
  if (message.length < MIN_LEN) {
    return NextResponse.json({ ok: false, error: 'message_too_short' }, { status: 400 })
  }

  if (!checkRateLimit(rateLimitKey(req))) {
    return NextResponse.json(
      { ok: false, error: 'rate_limited', hint: `Max ${LIMIT} per 10 min.` },
      { status: 429 },
    )
  }

  const text = [
    `New BizBridge consult request`,
    ``,
    `From:`,
    `  name: ${name}`,
    `  email: ${email}`,
    sector ? `  sector interest: ${sector}` : null,
    contactPref ? `  preferred contact: ${contactPref}` : null,
    ``,
    `Message:`,
    message,
  ]
    .filter(Boolean)
    .join('\n')

  const result = await sendEmail({
    to: CONSULT_EMAIL,
    subject: `[BizBridge consult] ${name}`,
    text,
  })

  if (!result.ok) {
    // eslint-disable-next-line no-console
    console.error('[consult] send failed', result.error)
    // Return 200 so the user still sees "message received" — a lost
    // send is better than making them try again and risking a
    // real double-submit. Server log has the failure for debugging.
  }

  return NextResponse.json({ ok: true })
}
