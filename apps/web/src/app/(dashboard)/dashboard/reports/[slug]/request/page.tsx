import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AlertTriangle, ArrowLeft } from 'lucide-react'
import { requireUser } from '@/lib/require-user'
import { tryPayload } from '@/lib/payload'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RequestForm } from './request-form'

interface PageProps {
  params: Promise<{ slug: string }>
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  return { title: `Request report — ${slug}` }
}

interface Report {
  id: number | string
  title: string
  slug: string
  description: string | null
  price_birr: number | null
  price_usd: number | null
}

export default async function RequestReportPage({ params }: PageProps) {
  await requireUser()
  const { slug } = await params

  const report = await tryPayload(async (payload) => {
    const res = await payload.find({
      collection: 'reports',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
    })
    return (res.docs[0] as unknown as Report | undefined) ?? null
  })

  if (!report) notFound()

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/dashboard/reports"
        className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to reports
      </Link>

      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
          Request access
        </p>
        <h1 className="mt-1.5 text-2xl font-semibold tracking-tightish text-ink sm:text-3xl">
          {report.title}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge variant="brand">ETB {report.price_birr?.toLocaleString() ?? '—'}</Badge>
          {report.price_usd ? (
            <span className="font-mono text-xs text-ink-faint">
              ≈ ${report.price_usd.toFixed(0)} USD
            </span>
          ) : null}
        </div>
      </header>

      {report.description ? (
        <Card className="p-4 text-sm text-ink-muted">{report.description}</Card>
      ) : null}

      <Card className="p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-faint">
          How this works
        </h2>
        <ol className="mt-3 space-y-2 text-sm text-ink-muted">
          <li>1. Send ETB {report.price_birr?.toLocaleString() ?? '—'} via Telebirr or CBE Birr to the account below.</li>
          <li>2. Screenshot the confirmation from the payment app.</li>
          <li>3. Upload it here with the transaction reference.</li>
          <li>4. An admin verifies within a business day; you&apos;ll get a download link on /dashboard/requests that&apos;s valid for 30 days.</li>
        </ol>

        <div className="mt-6 rounded-lg border border-warn/30 bg-warn/10 p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warn" />
            <div className="text-xs text-ink">
              <p className="font-semibold">Payment accounts</p>
              <p className="mt-1 text-ink-muted">
                <strong>Telebirr:</strong> 0912 345 678 (BizBridge / Cheri Demeke)<br />
                <strong>CBE Birr:</strong> 1000 xxxx xxxx (BizBridge account)
              </p>
              <p className="mt-2 text-ink-faint">
                Placeholder — Cheri: swap these for real numbers before shipping.
                Configure via env or admin UI later.
              </p>
            </div>
          </div>
        </div>
      </Card>

      <RequestForm
        report={{
          id: String(report.id),
          title: report.title,
          amountEtb: report.price_birr ?? 0,
        }}
      />

      <p className="text-center text-xs text-ink-faint">
        Screenshot must be PNG / JPEG / WebP, up to 5 MB. Max 3 pending requests per hour.
      </p>

      <Card className="border-dashed p-4 text-xs text-ink-muted">
        Not ready to buy? <Link href="/consult" className="text-brand hover:underline">Book a consult</Link> instead — we can walk you through the report highlights first.
      </Card>

      <Button asChild variant="ghost" size="sm">
        <Link href="/dashboard/requests">See your request history →</Link>
      </Button>
    </div>
  )
}
