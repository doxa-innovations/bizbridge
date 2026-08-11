'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/**
 * Reset-password form. Called from the link in the reset email — the
 * token arrives on `?token=…`. On success we redirect to /dashboard so
 * the user lands signed in.
 */
export function ResetPasswordForm() {
  const router = useRouter()
  const params = useSearchParams()
  const token = params.get('token')

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  if (!token) {
    return (
      <div className="rounded-md border border-danger/30 bg-danger/10 p-4 text-sm text-danger">
        Missing or expired reset token. Request a new link from{' '}
        <a href="/forgot-password" className="font-medium underline">
          forgot-password
        </a>
        .
      </div>
    )
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords don’t match.')
      return
    }

    setLoading(true)
    try {
      const res = await authClient.resetPassword({
        newPassword: password,
        token: token ?? undefined,
      })
      if (res.error) {
        setError(res.error.message ?? 'Reset failed — the link may have expired.')
        return
      }
      setDone(true)
      // Small delay so the user sees the success state before we redirect.
      setTimeout(() => {
        router.replace('/login?next=/dashboard')
        router.refresh()
      }, 900)
    } catch (err) {
      setError((err as Error).message ?? 'Unexpected error resetting password.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="rounded-md border border-brand/30 bg-brand/5 p-4">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-brand/15 text-brand">
            <CheckCircle2 className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-ink">Password updated.</p>
            <p className="mt-1 text-sm text-ink-muted">
              Redirecting you to log in with the new one…
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="password">New password (min 8)</Label>
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
      <div className="space-y-1.5">
        <Label htmlFor="confirm">Confirm new password</Label>
        <Input
          id="confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="••••••••"
        />
      </div>
      {error ? (
        <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Saving…' : 'Set new password'}
      </Button>
    </form>
  )
}
