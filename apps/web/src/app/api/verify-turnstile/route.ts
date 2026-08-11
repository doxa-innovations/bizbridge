import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Server-side re-verification of a Cloudflare Turnstile token.
 * Follows Cloudflare's recommended anti-replay pattern:
 *   1. POST the token to siteverify with secret + remoteip
 *   2. Confirm success=true
 *   3. Confirm result.action matches the surface (`signup`, etc.)
 *   4. Confirm result.hostname is in the allowlist derived from
 *      NEXT_PUBLIC_APP_URL + TURNSTILE_HOSTNAMES
 *
 * When TURNSTILE_SECRET_KEY isn't set (local dev without a key
 * configured), degrade to always-pass so local iteration isn't
 * blocked — the signup form hides the widget in that case anyway.
 */
function buildHostnameAllowlist(): Set<string> {
  const out = new Set<string>()
  for (const raw of [
    process.env.NEXT_PUBLIC_APP_URL,
    ...(process.env.TURNSTILE_HOSTNAMES?.split(',') ?? []),
  ]) {
    if (!raw) continue
    try {
      const trimmed = raw.trim()
      if (!trimmed) continue
      const host = trimmed.includes('://') ? new URL(trimmed).hostname : trimmed
      if (host) out.add(host.toLowerCase())
    } catch {
      // ignore malformed entries
    }
  }
  if (process.env.NODE_ENV !== 'production') {
    out.add('localhost')
    out.add('127.0.0.1')
  }
  return out
}

export async function POST(req: NextRequest) {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return NextResponse.json({ ok: true, note: 'no-secret-configured' })

  let body: { token?: string; action?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_body' }, { status: 400 })
  }
  const token = body.token
  const expectedAction = body.action ?? 'default'
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
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: form,
      signal: AbortSignal.timeout(10_000),
    })
    const data = (await res.json()) as {
      success?: boolean
      action?: string
      hostname?: string
      'error-codes'?: string[]
    }

    if (!data.success) {
      return NextResponse.json(
        { ok: false, error: 'turnstile_failed', codes: data['error-codes'] ?? [] },
        { status: 400 },
      )
    }

    // Anti-replay: reject a token whose action doesn't match the
    // surface that requested verification.
    if (data.action && data.action !== expectedAction) {
      return NextResponse.json({ ok: false, error: 'action_mismatch' }, { status: 400 })
    }

    // Anti-replay: reject a token minted from a different origin.
    const hostnames = buildHostnameAllowlist()
    if (data.hostname && hostnames.size > 0 && !hostnames.has(data.hostname.toLowerCase())) {
      return NextResponse.json({ ok: false, error: 'hostname_mismatch' }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[turnstile] siteverify failed', err)
    return NextResponse.json({ ok: false, error: 'verify_unreachable' }, { status: 502 })
  }
}
