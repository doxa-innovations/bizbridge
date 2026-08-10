import type { Metadata } from 'next'
import { ListTodo } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { requireUser } from '@/lib/require-user'
import { tryPayload } from '@/lib/payload'
import { ChecklistClient } from '@/app/(marketing)/checklist/checklist-client'

export const metadata: Metadata = { title: 'Setup checklist' }
export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ sector?: string }>
}

/**
 * Dashboard-shell variant of the setup checklist. Same client component as
 * the public /checklist page, wrapped in a compact header.
 *
 * Personalization: falls back to the user's first bookmarked interest sector
 * when the URL doesn't already carry `?sector=`.
 */
export default async function DashboardChecklistPage({ searchParams }: PageProps) {
  const [user, sp] = await Promise.all([requireUser(), searchParams])

  let initialSectorSlug = sp.sector ?? null
  if (!initialSectorSlug && user.interestSectors && user.interestSectors.length > 0) {
    initialSectorSlug = await resolveMorCodeToSlug(user.interestSectors[0]!)
  }

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-brand/15 text-brand">
            <ListTodo className="h-4 w-4" />
          </span>
          <Badge variant="brand">Setup checklist</Badge>
        </div>
        <h1 className="mt-3 text-2xl font-semibold tracking-tightish text-ink sm:text-3xl">
          Don&apos;t lose a step.
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-muted">
          A personalized checklist for opening your business in Ethiopia. Sequenced correctly,
          with the right office and document at each step. Progress saves automatically.
        </p>
      </header>
      <ChecklistClient initialSectorSlug={initialSectorSlug} />
    </div>
  )
}

async function resolveMorCodeToSlug(morCode: string): Promise<string | null> {
  const slug = await tryPayload(async (payload) => {
    const res = await payload.find({
      collection: 'business-sectors',
      where: { mor_code: { equals: morCode } },
      limit: 1,
      depth: 0,
    })
    return res.docs[0]?.slug ?? null
  })
  return slug ?? null
}
