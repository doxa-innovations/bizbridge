import type { Metadata } from 'next'
import Link from 'next/link'
import { AlertTriangle, ArrowLeft, FileSearch } from 'lucide-react'
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
    <div className="mx-auto max-w-2xl space-y-6">
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
          Need a specific PDF from MOR, Trade Bureau, or another Ethiopian body?
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          Tell us what you need. If we already have it, we&apos;ll send it. If we don&apos;t, we&apos;ll
          procure it directly from the source — usually within 2–5 business days. Same
          Telebirr / CBE Birr payment flow as the catalog reports.
        </p>
      </header>

      <Card className="p-5">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-brand/15 text-brand">
            <FileSearch className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1 text-sm text-ink-muted">
            <p>
              <strong className="text-ink">Common asks we&apos;ve fulfilled:</strong>
            </p>
            <ul className="mt-2 space-y-1 text-xs">
              <li>· MOR fee schedule for a specific sector code (e.g. 39141)</li>
              <li>· Trade Bureau licensing forms for a region</li>
              <li>· EIC investment threshold circulars — latest revision</li>
              <li>· NBE forex directive on remittance / export proceeds</li>
              <li>· Customs HS-code lookup for a specific import</li>
              <li>· CSA sector-specific statistics tables</li>
            </ul>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-faint">
          How this works
        </h2>
        <ol className="mt-3 space-y-2 text-sm text-ink-muted">
          <li>1. Fill in what you need + how much you can pay (typical: ETB 150–800).</li>
          <li>2. Send that amount via Telebirr or CBE Birr to the account below.</li>
          <li>3. Upload the payment screenshot with the reference.</li>
          <li>
            4. We verify + procure the doc, upload it, and it appears on
            <Link href="/dashboard/requests" className="ml-1 text-brand hover:underline">
              /dashboard/requests
            </Link>{' '}
            as a Download button. Valid for 30 days.
          </li>
          <li>
            5. If we can&apos;t get it (regulated, non-public, or out-of-scope), we refund.
          </li>
        </ol>

        <div className="mt-6 rounded-lg border border-warn/30 bg-warn/10 p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warn" />
            <div className="text-xs text-ink">
              <p className="font-semibold">Payment accounts</p>
              <p className="mt-1 text-ink-muted">
                <strong>Telebirr:</strong> 0912 345 678 (BizBridge / Cheri Demeke)
                <br />
                <strong>CBE Birr:</strong> 1000 xxxx xxxx (BizBridge account)
              </p>
              <p className="mt-2 text-ink-faint">
                Placeholder — swap for real numbers before this ships. Ideally moved to
                env vars or the SiteSettings global so they can be edited without a deploy.
              </p>
            </div>
          </div>
        </div>
      </Card>

      <RequestDataForm />

      <p className="text-center text-xs text-ink-faint">
        Screenshot must be PNG / JPEG / WebP, up to 5 MB. Max 3 pending requests per hour.
      </p>
    </div>
  )
}
