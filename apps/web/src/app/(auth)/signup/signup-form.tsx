'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signUp } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const USER_TYPES = [
  { value: 'local', label: 'Local entrepreneur' },
  { value: 'diaspora', label: 'Diaspora' },
  { value: 'foreign_investor', label: 'Foreign investor' },
]

export function SignupForm() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [country, setCountry] = useState('ET')
  const [userType, setUserType] = useState('local')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await signUp.email({
        email,
        password,
        name: fullName,
        // @ts-expect-error — Better Auth additionalFields aren't in the typed signature
        country,
        userType,
        fullName,
      })
      if (res.error) {
        setError(res.error.message ?? 'Signup failed')
        return
      }
      router.replace('/dashboard')
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
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="country">Country (ISO)</Label>
          <Input
            id="country"
            value={country}
            onChange={(e) => setCountry(e.target.value.toUpperCase())}
            maxLength={2}
            required
            className="uppercase"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="user_type">I am a…</Label>
          <select
            id="user_type"
            value={userType}
            onChange={(e) => setUserType(e.target.value)}
            className="flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          >
            {USER_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      {error ? (
        <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Creating account…' : 'Create account'}
      </Button>
      <p className="text-center text-2xs text-ink-faint">
        By signing up you agree to our terms and the welcome email sequence. No spam.
      </p>
    </form>
  )
}
