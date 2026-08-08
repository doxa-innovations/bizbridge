'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Bookmark, BookmarkCheck, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/cn'

interface Props {
  sectorId: number | string
  initialSaved: boolean
  /** When true, user is not signed in — button prompts to log in with return path. */
  guest?: boolean
  /** Preserve where to return the user after login. */
  returnTo?: string
  className?: string
}

/**
 * Optimistic bookmark toggle for a sector. Guests get a login CTA that
 * preserves the current path so they land back on the sector after auth.
 */
export function BookmarkButton({ sectorId, initialSaved, guest, returnTo, className }: Props) {
  const router = useRouter()
  const [saved, setSaved] = useState(initialSaved)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function toggle() {
    if (guest) {
      const next = returnTo ?? window.location.pathname
      router.push(`/login?next=${encodeURIComponent(next)}`)
      return
    }
    setError(null)
    // Optimistic
    const previous = saved
    setSaved(!previous)
    startTransition(async () => {
      try {
        const res = await fetch(
          previous
            ? `/api/saved-sectors?sectorId=${sectorId}`
            : '/api/saved-sectors',
          {
            method: previous ? 'DELETE' : 'POST',
            headers: { 'content-type': 'application/json' },
            body: previous ? undefined : JSON.stringify({ sectorId }),
          },
        )
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
      } catch (err) {
        setSaved(previous)
        setError((err as Error).message)
      }
    })
  }

  const Icon = saved ? BookmarkCheck : Bookmark
  return (
    <Button
      type="button"
      onClick={toggle}
      variant={saved ? 'primary' : 'secondary'}
      size="sm"
      disabled={isPending}
      className={cn(className)}
      aria-pressed={saved}
      title={saved ? 'Remove from saved' : 'Save to dashboard'}
    >
      {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icon className="h-3.5 w-3.5" />}
      {saved ? 'Saved' : 'Save'}
      {error ? <span className="sr-only">Failed: {error}</span> : null}
    </Button>
  )
}
