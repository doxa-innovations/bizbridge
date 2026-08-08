'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { AlertTriangle, ArrowRight, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

/**
 * Group-level error boundary. React errors thrown during rendering of any
 * /dashboard/* route land here so users see a real recovery UI instead of a
 * blank white screen. The full error object is logged to the browser console
 * so we don't leak stack traces into the UI itself.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('[dashboard] render error:', error)
  }, [error])

  return (
    <div className="mx-auto max-w-2xl py-16">
      <Card className="p-8">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-danger/15 text-danger">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
              Dashboard error
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tightish text-ink">
              Something went wrong loading this page.
            </h1>
            <p className="mt-2 text-sm text-ink-muted">
              This is on us, not you. Try again — if it keeps failing, let us know.
            </p>
            {error.digest ? (
              <p className="mt-3 font-mono text-[10px] text-ink-faint">
                Error id: {error.digest}
              </p>
            ) : null}
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button onClick={() => reset()} size="sm">
            <RefreshCw className="h-3.5 w-3.5" /> Try again
          </Button>
          <Button asChild size="sm" variant="secondary">
            <Link href="/dashboard">
              Go home <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
          <Button asChild size="sm" variant="ghost">
            <Link href="/consult">Report the issue</Link>
          </Button>
        </div>
      </Card>
    </div>
  )
}
