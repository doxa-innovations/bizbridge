import Link from 'next/link'
import { ArrowRight, Map } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function DashboardNotFound() {
  return (
    <div className="mx-auto max-w-2xl py-16">
      <Card className="p-8">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand/15 text-brand">
            <Map className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
              404
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tightish text-ink">
              We couldn&apos;t find that page.
            </h1>
            <p className="mt-2 text-sm text-ink-muted">
              The link may have moved, or you may not have access to it.
            </p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link href="/dashboard">
              Dashboard home <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
          <Button asChild size="sm" variant="secondary">
            <Link href="/dashboard/sectors">Browse sectors</Link>
          </Button>
          <Button asChild size="sm" variant="ghost">
            <Link href="/dashboard/pulse">Open Pulse</Link>
          </Button>
        </div>
      </Card>
    </div>
  )
}
