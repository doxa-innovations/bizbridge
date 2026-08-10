'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { AlertTriangle, ArrowLeft, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

/**
 * Route-level error boundary for /dashboard/canvas/*. Catches any error
 * bubbling out of the server component render or the client tree and
 * replaces Next.js's opaque "Server Components render" red toast with
 * something actionable — the error message + a retry button.
 *
 * The `digest` prop (populated in production) is what the user was
 * seeing in the red toast; surfacing it here + logging it makes the next
 * report much easier to diagnose.
 */
export default function CanvasError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log so it's in the browser console too — production strips the
    // message from the toast but leaves it in console for the developer.
    console.error('[canvas] route error', error)
  }, [error])

  return (
    <div className="mx-auto max-w-xl py-16">
      <Card className="p-8">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-danger/15 text-danger">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
              Canvas error
            </p>
            <h1 className="mt-1 text-lg font-semibold tracking-tightish text-ink">
              Something crashed while loading your plan.
            </h1>
            <p className="mt-2 text-sm text-ink-muted">
              {error.message || 'The route threw during render.'}
            </p>
            {error.digest ? (
              <p className="mt-3 rounded bg-surface-2 p-2 font-mono text-[11px] text-ink-faint">
                digest: {error.digest}
              </p>
            ) : null}
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button size="sm" onClick={reset}>
            <RotateCcw className="h-3.5 w-3.5" /> Try again
          </Button>
          <Button asChild size="sm" variant="secondary">
            <Link href="/dashboard/canvas">
              <ArrowLeft className="h-3.5 w-3.5" /> All plans
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  )
}
