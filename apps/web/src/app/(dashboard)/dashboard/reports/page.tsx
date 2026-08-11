import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, ArrowUpRight, FileText, ReceiptText } from 'lucide-react'
import { requireUser } from '@/lib/require-user'
import { tryPayload } from '@/lib/payload'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = { title: 'Reports' }
export const dynamic = 'force-dynamic'

interface Report {
  id: number | string
  title: string
  slug: string
  description: string | null
  price_birr: number | null
  price_usd: number | null
  sector?: { id: number | string; mor_code: string; slug: string } | null
}

export default async function ReportsPage() {
  const user = await requireUser()

  const data = await tryPayload(async (payload) => {
    const [reports, mine] = await Promise.all([
      payload.find({
        collection: 'reports',
        sort: '-updatedAt',
        limit: 30,
        depth: 1,
      }),
      payload.find({
        collection: 'report-requests',
        where: {
          user_id: { equals: user.id },
          status: { equals: 'verified' },
        },
        limit: 20,
        depth: 1,
      }),
    ])
    return {
      reports: reports.docs as unknown as Report[],
      verified: mine.docs as unknown as Array<{
        id: number | string
        report: Report | null
      }>,
    }
  })

  const reports = data?.reports ?? []
  const verifiedReports = new Set(
    (data?.verified ?? [])
      .map((v) => (v.report ? String(v.report.id) : null))
      .filter((x): x is string => Boolean(x)),
  )

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">Reports</p>
        <h1 className="mt-1.5 text-3xl font-semibold tracking-crisp text-ink sm:text-4xl">
          Research reports catalog.
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-muted">
          Hand-written market briefs on Ethiopian sectors. Sector data everywhere else on the
          site is free forever — briefs are the one place we cover our research costs with a
          small handling fee (Telebirr; upload the screenshot or DM it, verified within a day).
        </p>
      </header>

      {reports.length === 0 ? (
        <Card className="flex flex-col items-start gap-3 border-dashed p-6 sm:flex-row sm:items-center">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand/15 text-brand">
            <FileText className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-ink">Catalog is empty right now</p>
            <p className="text-xs text-ink-muted">
              First reports are being written. Tell us what you need in the meantime.
            </p>
          </div>
          <Button asChild size="sm">
            <Link href="/consult">
              Request a report <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {reports.map((r) => {
            const isUnlocked = verifiedReports.has(String(r.id))
            return (
              <Card key={r.id} className="flex flex-col p-5">
                <div className="flex items-start justify-between gap-2">
                  <FileText className="h-4 w-4 text-brand" />
                  {isUnlocked ? (
                    <Badge variant="brand">Unlocked</Badge>
                  ) : (
                    <Badge variant="mono">
                      ETB {r.price_birr?.toLocaleString() ?? '—'}
                    </Badge>
                  )}
                </div>
                <p className="mt-3 line-clamp-2 text-sm font-semibold leading-snug text-ink">
                  {r.title}
                </p>
                {r.description ? (
                  <p className="mt-1 line-clamp-3 flex-1 text-xs text-ink-muted">{r.description}</p>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="secondary">
                    <Link href={`/reports/${r.slug}`}>
                      Preview <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                  {isUnlocked ? (
                    <Button asChild size="sm">
                      <Link href="/dashboard/requests">
                        Download <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  ) : (
                    <Button asChild size="sm">
                      <Link href={`/dashboard/reports/${r.slug}/request`}>
                        Request <ReceiptText className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Card className="border-dashed p-5">
        <div className="flex flex-wrap items-center gap-3">
          <ReceiptText className="h-5 w-5 text-brand" />
          <div className="flex-1 min-w-[200px]">
            <p className="text-sm font-semibold text-ink">Need something specific?</p>
            <p className="text-xs text-ink-muted">
              Tell us what sector or question and we&apos;ll scope a custom brief.
            </p>
          </div>
          <Button asChild size="sm" variant="ghost">
            <Link href="/consult">
              Request custom research <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  )
}
