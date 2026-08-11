import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { requireUser } from '@/lib/require-user'
import { Card } from '@/components/ui/card'
import { RequestDataForm } from './request-data-form'

export const metadata: Metadata = {
  title: 'Request a document',
  description:
    'Ask us to procure a specific PDF or dataset from MOR, Trade Bureau, EIC or another Ethiopian body.',
}

export const dynamic = 'force-dynamic'

export default async function RequestDataPage() {
  await requireUser()

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to dashboard
      </Link>

      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
          Request a document
        </p>
        <h1 className="mt-1.5 text-2xl font-semibold tracking-tightish text-ink sm:text-3xl">
          Need a doc from MOR, Trade Bureau, or another Ethiopian body?
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          Pay via Telebirr to the number below, then attach the screenshot (or DM it on
          Telegram). We procure the doc — usually within 2–5 business days.
        </p>
      </header>

      <Card className="p-4 text-sm text-ink">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
          Pay to
        </p>
        <div className="mt-2 space-y-1 font-mono text-xs">
          <p><span className="text-ink-muted">Telebirr:</span> 0989 932 714 (Cheri)</p>
        </div>
        <p className="mt-2 text-[11px] text-ink-faint">
          Typical fee ETB 150–800 · full refund if we can&apos;t get it.
        </p>
      </Card>

      <RequestDataForm />

      <p className="text-center text-[11px] text-ink-faint">
        Track status on <Link href="/dashboard/requests" className="hover:text-ink">requests</Link>.
      </p>
    </div>
  )
}
