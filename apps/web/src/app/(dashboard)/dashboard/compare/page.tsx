import type { Metadata } from 'next'
import { Rows3 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { requireUser } from '@/lib/require-user'
import { CompareClient } from '@/app/(marketing)/compare/compare-client'

export const metadata: Metadata = { title: 'Compare sectors' }
export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ add?: string }>
}

/**
 * Dashboard-shell variant of the sector comparison tool. Same client
 * component as the public /compare route, wrapped in a compact header.
 */
export default async function DashboardComparePage({ searchParams }: PageProps) {
  const [, sp] = await Promise.all([requireUser(), searchParams])
  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-brand/15 text-brand">
            <Rows3 className="h-4 w-4" />
          </span>
          <Badge variant="brand">Compare</Badge>
        </div>
        <h1 className="mt-3 text-2xl font-semibold tracking-tightish text-ink sm:text-3xl">
          Three sectors, side by side.
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-muted">
          Fees, timelines, ministry approvals, and required certificates next to each other.
          Share the URL to debate it with a cofounder or advisor.
        </p>
      </header>
      <CompareClient initialAdd={sp.add ?? null} />
    </div>
  )
}
