'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/**
 * Sanity-check the `?next=` param before we redirect to it. Rejects
 * absolute URLs (open-redirect risk) and anything outside the app.
 */
function safeNext(raw: string | null): string {
  if (!raw) return '/dashboard'
  // Only allow same-origin absolute paths
  if (!raw.startsWith('/') || raw.startsWith('//')) return '/dashboard'
  return raw
}

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = safeNext(searchParams.get('next'))
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await signIn.email({ email, password })
      if (res.error) {
        setError(res.error.message ?? 'Login failed')
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
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
      </div>
      {error ? (
        <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Logging in…' : 'Log in'}
      </Button>
    </form>
  )
}
