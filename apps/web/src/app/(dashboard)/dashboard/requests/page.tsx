import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Clock, Download, FileText, ShieldCheck, XCircle } from 'lucide-react'
import { requireUser } from '@/lib/require-user'
import { tryPayload } from '@/lib/payload'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = { title: 'Requests' }
export const dynamic = 'force-dynamic'

interface RequestRow {
  id: number | string
  createdAt: string
  status: 'pending' | 'verified' | 'rejected'
  payment_method: 'telebirr' | 'cbe_birr'
  payment_reference: string | null
  amount_etb: number | null
  admin_note: string | null
  download_expires_at: string | null
  download_count: number | null
  report: { id: number | string; title: string; slug: string } | null
}

const STATUS_META: Record<
  RequestRow['status'],
  { label: string; badge: 'brand' | 'outline' | 'default'; icon: React.ComponentType<{ className?: string }> }
> = {
  pending: { label: 'Pending review', badge: 'outline', icon: Clock },
  verified: { label: 'Verified', badge: 'brand', icon: ShieldCheck },
  rejected: { label: 'Rejected', badge: 'default', icon: XCircle },
}

export default async function RequestsPage() {
  const user = await requireUser()

  const requests = await tryPayload(async (payload) => {
    const res = await payload.find({
      collection: 'report-requests',
      where: { user_id: { equals: user.id } },
      sort: '-createdAt',
      limit: 100,
      depth: 1,
    })
    return res.docs as unknown as RequestRow[]
  })

  const rows = requests ?? []

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">Requests</p>
          <h1 className="mt-1.5 text-3xl font-semibold tracking-crisp text-ink sm:text-4xl">
            Your report requests.
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-muted">
            When you request a report and upload (or DM) payment proof, it lands here as
            <em> pending</em>. An admin verifies against the Telebirr dashboard — usually
            within a business day — and the download unlocks for 30 days.
          </p>
        </div>
        {rows.length > 0 ? (
          <a
            href="/api/export/requests"
            className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-surface px-3 py-1.5 text-xs text-ink-muted hover:border-brand/40 hover:text-ink"
          >
            <Download className="h-3.5 w-3.5" /> Export history
          </a>
        ) : null}
      </header>

      {rows.length === 0 ? (
        <Card className="flex flex-col items-start gap-3 border-dashed p-6 sm:flex-row sm:items-center">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand/15 text-brand">
            <FileText className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-ink">No requests yet</p>
            <p className="text-xs text-ink-muted">
              Browse the catalog or ask us to research something specific.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 sm:ml-auto">
            <Button asChild size="sm" variant="ghost">
              <Link href="/consult">Request custom</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/dashboard/reports">
                Browse reports <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => {
            const meta = STATUS_META[row.status]
            const Icon = meta.icon
            const isExpired = row.download_expires_at
              ? new Date(row.download_expires_at) < new Date()
              : false
            const canDownload = row.status === 'verified' && !isExpired
            return (
              <Card key={row.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={meta.badge}>
                        <Icon className="h-3 w-3" /> {meta.label}
                      </Badge>
                      <Badge variant="mono" className="capitalize">
                        {row.payment_method.replace('_', ' ')}
                      </Badge>
                      {row.amount_etb ? (
                        <span className="font-mono text-xs text-ink-faint">
                          ETB {row.amount_etb.toLocaleString()}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm font-semibold text-ink">
                      {row.report?.title ?? 'Report'}
                    </p>
                    {row.payment_reference ? (
                      <p className="mt-1 font-mono text-[11px] text-ink-faint">
                        Ref: {row.payment_reference}
                      </p>
                    ) : null}
                    {row.admin_note ? (
                      <p className="mt-2 rounded border border-border/50 bg-bg/60 p-2 text-xs text-ink-muted">
                        Admin note: {row.admin_note}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {canDownload ? (
                      <Button asChild size="sm">
                        <Link href={`/api/downloads/${row.id}`}>
                          Download PDF <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    ) : row.status === 'verified' && isExpired ? (
                      <Badge variant="outline">Download expired</Badge>
                    ) : row.status === 'rejected' ? (
                      <Button asChild size="sm" variant="ghost">
                        <Link href="/dashboard/reports">Try again</Link>
                      </Button>
                    ) : (
                      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                        Awaiting verify
                      </p>
                    )}
                    {row.download_expires_at ? (
                      <p className="font-mono text-[10px] text-ink-faint">
                        Expires {new Date(row.download_expires_at).toLocaleDateString()}
                      </p>
                    ) : null}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
