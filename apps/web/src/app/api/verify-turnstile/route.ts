import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Server-side re-verification of a Cloudflare Turnstile token. The
 * client widget hands us a token; we ask Cloudflare's siteverify to
 * confirm it's valid + issued for our sitekey.
 *
 * When TURNSTILE_SECRET_KEY isn't set (local dev without a key
 * configured), we degrade to always-pass so local iteration isn't
 * blocked — the signup form only shows the widget when
 * NEXT_PUBLIC_TURNSTILE_SITE_KEY is set anyway, so both need to be
 * present in prod for the check to actually mean anything.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return NextResponse.json({ ok: true, note: 'no-secret-configured' })

  let body: { token?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_body' }, { status: 400 })
  }
  const token = body.token
  if (!token) return NextResponse.json({ ok: false, error: 'missing_token' }, { status: 400 })

  const ip =
    req.headers.get('cf-connecting-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    null

  const form = new URLSearchParams()
  form.set('secret', secret)
  form.set('response', token)
  if (ip) form.set('remoteip', ip)

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: form,
    })
    const data = (await res.json()) as { success?: boolean; 'error-codes'?: string[] }
    if (!data.success) {
      return NextResponse.json(
        { ok: false, error: 'turnstile_failed', codes: data['error-codes'] ?? [] },
        { status: 400 },
      )
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[turnstile] siteverify failed', err)
    return NextResponse.json({ ok: false, error: 'verify_unreachable' }, { status: 502 })
  }
}
