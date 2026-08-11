'use client'

import { useCallback, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signUp } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Turnstile } from '@/components/ui/turnstile'

function safeNext(raw: string | null): string {
  if (!raw) return '/dashboard'
  if (!raw.startsWith('/') || raw.startsWith('//')) return '/dashboard'
  return raw
}

/**
 * Bare-minimum signup form — three required fields (name, email,
 * password) + one optional marketing opt-in. Country and user-type
 * used to live here and were the biggest friction points (people
 * hesitate at "country ISO" and stall on choosing "diaspora vs
 * foreign investor"). Both moved to /dashboard/onboarding where the
 * multi-step flow gives them proper context.
 *
 * Transactional email (welcome, password reset) fires regardless of
 * `marketingOptIn` — the flag only gates bulk product updates.
 */
export function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = safeNext(searchParams.get('next'))
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [marketingOptIn, setMarketingOptIn] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)

  const turnstileEnabled = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY)

  const onTurnstileVerify = useCallback((token: string) => {
    setTurnstileToken(token)
  }, [])
  const onTurnstileExpire = useCallback(() => {
    setTurnstileToken(null)
  }, [])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    // Server-side re-verify the Turnstile token before we let signup
    // proceed. Skipped if Turnstile isn't configured (no site key set).
    if (turnstileEnabled) {
      if (!turnstileToken) {
        setError('Please complete the human-verification step above.')
        return
      }
      setLoading(true)
      try {
        const verify = await fetch('/api/verify-turnstile', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ token: turnstileToken, action: 'signup' }),
        })
        const verifyBody = (await verify.json().catch(() => ({}))) as { ok?: boolean }
        if (!verifyBody.ok) {
          setError('Verification failed. Try again.')
          setLoading(false)
          setTurnstileToken(null)
          return
        }
      } catch {
        setError('Verification network error. Try again.')
        setLoading(false)
        return
      }
    } else {
      setLoading(true)
    }

    try {
      const res = await signUp.email({
        email,
        password,
        name: fullName,
        // @ts-expect-error — Better Auth additionalFields aren't in the typed signature
        fullName,
        marketingOptIn,
      })
      if (res.error) {
        setError(res.error.message ?? 'Signup failed')
        return
      }
      router.replace(next)
      router.refresh()
    } catch (err) {
      setError((err as Error).message ?? 'Unexpected error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="name">Full name</Label>
        <Input
          id="name"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Abebe Bekele"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Password (min 8)</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
      </div>
      <label className="flex items-start gap-2 text-xs text-ink-muted">
        <input
          type="checkbox"
          checked={marketingOptIn}
          onChange={(e) => setMarketingOptIn(e.target.checked)}
          className="mt-0.5 accent-brand"
        />
        <span>
          Send me occasional product updates and hand-written notes from Cheri. Uncheck to
          only receive account emails (password reset, verification). No spam either way.
        </span>
      </label>
      {turnstileEnabled ? (
        <Turnstile
          action="signup"
          onVerify={onTurnstileVerify}
          onExpire={onTurnstileExpire}
        />
      ) : null}
      {error ? (
        <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Creating account…' : 'Create account'}
      </Button>
      <p className="text-center text-2xs text-ink-faint">
        Next step: 30-second onboarding to tailor your dashboard.
      </p>
    </form>
  )
}
