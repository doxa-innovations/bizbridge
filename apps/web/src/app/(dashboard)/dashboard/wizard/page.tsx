import type { Metadata } from 'next'
import { ClipboardList } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { requireUser } from '@/lib/require-user'
import { WizardClient } from '@/app/(marketing)/wizard/wizard-client'

export const metadata: Metadata = { title: 'Sector wizard' }
export const dynamic = 'force-dynamic'

/**
 * Dashboard-shell variant of the 5-question sector wizard. Wraps the
 * marketing WizardClient in a compact header — the wizard state itself is
 * stateless enough that no prefill is needed.
 */
export default async function DashboardWizardPage() {
  await requireUser()
  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-brand/15 text-brand">
            <ClipboardList className="h-4 w-4" />
          </span>
          <Badge variant="brand">Sector wizard</Badge>
        </div>
        <h1 className="mt-3 text-2xl font-semibold tracking-tightish text-ink sm:text-3xl">
          Five questions — three sectors that fit.
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-muted">
          Tell us your situation and we&apos;ll narrow 519 official sectors down to the three
          best matches with reasoning.
        </p>
      </header>
      <WizardClient />
    </div>
  )
}
