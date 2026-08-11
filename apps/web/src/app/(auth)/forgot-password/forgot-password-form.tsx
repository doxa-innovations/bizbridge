'use client'

import { useState } from 'react'
import { Mail } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/**
 * Forgot-password form. Calls Better Auth's `forgetPassword` which
 * generates a token, persists it, and invokes the `sendResetPassword`
 * hook we wire in `lib/auth.ts`. Either way (whether the email address
 * matched an account or not) we show the same "check your inbox"
 * confirmation — never leak whether an email is registered.
 */
export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await authClient.requestPasswordReset({
        email,
        redirectTo: '/reset-password',
      })
      setSent(true)
    } catch (err) {
      // Show the generic confirmation on non-network errors too — we
      // don't want to reveal which emails are registered.
      // eslint-disable-next-line no-console
      console.warn('[forgetPassword]', err)
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="rounded-md border border-brand/30 bg-brand/5 p-4">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-brand/15 text-brand">
            <Mail className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-ink">Check your inbox.</p>
            <p className="mt-1 text-sm text-ink-muted">
              If <span className="text-ink">{email}</span> is on an account, we&apos;ve sent a
              reset link. It expires in 1 hour. Check spam if you don&apos;t see it.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
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
      {error ? (
        <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Sending…' : 'Send reset link'}
      </Button>
    </form>
  )
}
