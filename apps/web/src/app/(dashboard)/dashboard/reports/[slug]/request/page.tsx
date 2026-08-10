import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { requireUser } from '@/lib/require-user'
import { tryPayload } from '@/lib/payload'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
    <div className="mx-auto max-w-xl space-y-5">
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
        <h1 className="mt-1.5 text-2xl font-semibold tracking-tightish text-ink">
          {report.title}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge variant="brand">ETB {report.price_birr?.toLocaleString() ?? '—'}</Badge>
          {report.price_usd ? (
            <span className="font-mono text-xs text-ink-faint">
              ≈ ${report.price_usd.toFixed(0)} USD
            </span>
          ) : null}
        </div>
      </header>

      <Card className="p-4 text-sm text-ink">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
          Pay to
        </p>
        <div className="mt-2 space-y-1 font-mono text-xs">
          <p><span className="text-ink-muted">Telebirr:</span> 0912 345 678 (Cheri Demeke)</p>
          <p><span className="text-ink-muted">CBE Birr:</span> 1000 xxxx xxxx</p>
        </div>
        <p className="mt-2 text-[11px] text-ink-faint">
          Send ETB {report.price_birr?.toLocaleString() ?? '—'} then attach the screenshot.
          Verified within a business day → download unlocks for 30 days.
        </p>
      </Card>

      <RequestForm
        report={{
          id: String(report.id),
          title: report.title,
          amountEtb: report.price_birr ?? 0,
        }}
      />

      <p className="text-center text-[11px] text-ink-faint">
        Track status on <Link href="/dashboard/requests" className="hover:text-ink">requests</Link>.
      </p>
    </div>
  )
}
