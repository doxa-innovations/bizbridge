import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, ArrowUpRight, Bookmark, FileText } from 'lucide-react'
import { requireUser } from '@/lib/require-user'
import { tryPayload } from '@/lib/payload'
import { humanizeSectorName } from '@/lib/humanize-sector-name'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = { title: 'Research' }
export const dynamic = 'force-dynamic'

interface SectorRef {
  id: number | string
  mor_code: string
  name_en: string
  slug: string
  name_am: string | null
  description_short?: string | null
}
interface ReportRef {
  id: number | string
  title: string
  slug: string
  description: string | null
  price_birr: number | null
}

export default async function ResearchPage() {
  const user = await requireUser()

  const data = await tryPayload(async (payload) => {
    const [saved, savedReports, relatedReports] = await Promise.all([
      payload.find({
        collection: 'saved-sectors',
        where: { user_id: { equals: user.id } },
        limit: 30,
        depth: 1,
        sort: '-saved_at',
      }),
      payload.find({
        collection: 'saved-reports',
        where: { user_id: { equals: user.id } },
        limit: 30,
        depth: 1,
        sort: '-saved_at',
      }),
      payload.find({
        collection: 'reports',
        limit: 6,
        depth: 0,
        sort: '-updatedAt',
      }),
    ])
    return {
      savedSectors: saved.docs
        .map((d) => {
          const row = d as { id: number | string; note?: string | null; sector?: SectorRef | null }
          if (!row.sector) return null
          return { id: row.id, note: row.note ?? null, sector: row.sector }
        })
        .filter((x): x is { id: number | string; note: string | null; sector: SectorRef } => x !== null),
      savedReports: savedReports.docs
        .map((d) => (d as { report?: ReportRef | null }).report)
        .filter((r): r is ReportRef => Boolean(r)),
      relatedReports: relatedReports.docs as unknown as ReportRef[],
    }
  })

  const savedSectors = data?.savedSectors ?? []
  const savedReports = data?.savedReports ?? []
  const relatedReports = data?.relatedReports ?? []

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
          Research
        </p>
        <h1 className="mt-1.5 text-3xl font-semibold tracking-crisp text-ink sm:text-4xl">
          Everything you&apos;ve saved.
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          Sector bookmarks, report bookmarks, and related reports we surfaced from your
          interest areas.
        </p>
      </header>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
            Saved sectors ({savedSectors.length})
          </h2>
          <Link href="/sectors" className="text-xs text-ink-muted hover:text-ink">
            Browse all →
          </Link>
        </div>
        {savedSectors.length === 0 ? (
          <Card className="flex flex-col items-start gap-3 border-dashed p-6 sm:flex-row sm:items-center">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand/15 text-brand">
              <Bookmark className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-ink">Nothing bookmarked yet</p>
              <p className="text-xs text-ink-muted">
                Bookmark a sector from its detail page to keep it here.
              </p>
            </div>
            <Button asChild size="sm">
              <Link href="/sectors">
                Browse sectors <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {savedSectors.map((s) => (
              <Card key={s.id} className="flex flex-col p-4">
                <Badge variant="mono">{s.sector.mor_code}</Badge>
                <Link
                  href={`/sectors/${s.sector.slug}`}
                  className="mt-2 line-clamp-2 text-sm font-medium text-ink hover:text-brand"
                >
                  {humanizeSectorName(s.sector.mor_code, s.sector.name_en)}
                </Link>
                {s.sector.name_am ? (
                  <p className="mt-0.5 truncate font-amharic text-xs text-ink-faint">
                    {s.sector.name_am}
                  </p>
                ) : null}
                {s.note ? (
                  <p className="mt-2 rounded border border-border/50 bg-bg/60 p-2 text-xs text-ink-muted">
                    {s.note}
                  </p>
                ) : null}
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
            Saved reports ({savedReports.length})
          </h2>
          <Link href="/dashboard/reports" className="text-xs text-ink-muted hover:text-ink">
            Browse catalog →
          </Link>
        </div>
        {savedReports.length === 0 ? (
          <Card className="border-dashed p-6 text-sm text-ink-muted">
            No reports saved yet. Save from the catalog and they&apos;ll appear here.
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {savedReports.map((r) => (
              <Card key={r.id} className="p-4">
                <p className="text-sm font-semibold text-ink">{r.title}</p>
                {r.description ? (
                  <p className="mt-1 line-clamp-2 text-xs text-ink-muted">{r.description}</p>
                ) : null}
                {r.price_birr ? (
                  <p className="mt-2 font-mono text-[11px] text-brand">
                    ETB {r.price_birr.toLocaleString()}
                  </p>
                ) : null}
              </Card>
            ))}
          </div>
        )}
      </section>

      {relatedReports.length > 0 ? (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
              Related reports
            </h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {relatedReports.map((r) => (
              <Link
                key={r.id}
                href={`/reports/${r.slug}`}
                className="group rounded-lg border border-border/70 bg-surface p-4 transition-all hover:border-brand/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <FileText className="h-4 w-4 text-brand" />
                  <ArrowUpRight className="h-3.5 w-3.5 text-ink-faint group-hover:text-brand" />
                </div>
                <p className="mt-3 line-clamp-2 text-sm font-medium leading-snug text-ink group-hover:text-brand">
                  {r.title}
                </p>
                {r.price_birr ? (
                  <p className="mt-2 font-mono text-[11px] text-ink-faint">
                    ETB {r.price_birr.toLocaleString()}
                  </p>
                ) : null}
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
