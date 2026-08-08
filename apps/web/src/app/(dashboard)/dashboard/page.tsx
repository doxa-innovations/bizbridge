import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  Compass,
  FileText,
  Landmark,
  Newspaper,
  Sparkles,
} from 'lucide-react'
import { requireUser } from '@/lib/require-user'
import { tryPayload } from '@/lib/payload'
import { getDashboardConfig, CAPITAL_TIER_META } from '@/lib/dashboard-tailoring'
import { humanizeSectorName } from '@/lib/humanize-sector-name'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GeometricIcon } from '@/components/marketing/geometric-icon'

export const metadata: Metadata = { title: 'Dashboard' }
export const dynamic = 'force-dynamic'

interface SavedSector {
  id: number | string
  savedAt: string | null
  sector: {
    id: number | string
    mor_code: string
    name_en: string
    slug: string
    name_am: string | null
  }
}

interface SavedReport {
  id: number | string
  savedAt: string | null
  report: {
    id: number | string
    title: string
    slug: string
    description: string | null
    price_birr: number | null
  }
}

interface RecommendedReport {
  id: number | string
  title: string
  slug: string
  description: string | null
  price_birr: number | null
}

export default async function DashboardPage() {
  const user = await requireUser()
  const config = getDashboardConfig(user)

  const data = await tryPayload(async (payload) => {
    const [saved, savedReports, reports] = await Promise.all([
      payload.find({
        collection: 'saved-sectors',
        where: { user_id: { equals: user.id } },
        limit: 6,
        depth: 1,
        sort: '-saved_at',
      }),
      payload.find({
        collection: 'saved-reports',
        where: { user_id: { equals: user.id } },
        limit: 4,
        depth: 1,
        sort: '-saved_at',
      }),
      payload.find({
        collection: 'reports',
        limit: 3,
        depth: 0,
        sort: '-updatedAt',
      }),
    ])

    return {
      savedSectors: (saved.docs as unknown as SavedSector[]).filter((s) => s.sector),
      savedReports: (savedReports.docs as unknown as SavedReport[]).filter((s) => s.report),
      recommendedReports: reports.docs as unknown as RecommendedReport[],
    }
  })

  const savedSectors = data?.savedSectors ?? []
  const savedReports = data?.savedReports ?? []
  const recommendedReports = data?.recommendedReports ?? []

  const tierMeta = user.capitalTier ? CAPITAL_TIER_META[user.capitalTier] : null

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* ONBOARDING NUDGE — persistent thin banner when user skipped */}
      {!user.onboardedAt && user.onboardingSkippedAt ? (
        <Card className="flex flex-wrap items-center gap-4 p-4">
          <div className="flex-1 min-w-[200px]">
            <p className="text-sm font-semibold text-ink">Finish setting up your feed</p>
            <p className="text-xs text-ink-muted">
              30 seconds. Pick a couple of areas + your budget, and we&apos;ll tailor everything.
            </p>
          </div>
          <Button asChild size="sm">
            <Link href="/dashboard/onboarding">
              Do it now <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </Card>
      ) : null}

      {/* GREETING */}
      <header>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
              Dashboard
            </p>
            <h1 className="mt-1.5 text-3xl font-semibold tracking-crisp text-ink sm:text-4xl">
              {config.greeting}.
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {user.userType ? (
              <Badge variant="mono" className="capitalize">
                {user.userType.replace('_', ' ')}
              </Badge>
            ) : null}
            {tierMeta ? <Badge variant="brand">{tierMeta.label}</Badge> : null}
            {user.country ? (
              <Badge variant="outline">{user.country.toUpperCase()}</Badge>
            ) : null}
          </div>
        </div>

        {user.interestCategories && user.interestCategories.length > 0 ? (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
              Interests
            </span>
            {user.interestCategories.map((slug) => (
              <Link
                key={slug}
                href={`/sectors?category=${slug}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-surface px-2.5 py-1 font-mono text-[11px] text-ink-muted hover:border-brand/40 hover:text-ink"
              >
                <GeometricIcon slug={slug} className="h-3.5 w-3.5" />
                {slug.split('-')[0]}
              </Link>
            ))}
            <Link
              href="/dashboard/onboarding"
              className="font-mono text-[11px] text-ink-faint hover:text-brand"
            >
              edit
            </Link>
          </div>
        ) : null}
      </header>

      {/* TAILORED TRIO */}
      <div className="grid gap-4 lg:grid-cols-3">
        <TrioCard
          title={config.copy.trioBudgetTitle}
          icon={<Landmark className="h-4 w-4" />}
          body={tierMeta ? tierMeta.vibe : 'Pick a budget to see sector shortlists tuned to that range.'}
          cta={{
            label: tierMeta ? 'Explore picks' : 'Pick a budget',
            href: `/suggest${config.suggestQuery}`,
          }}
        />
        <TrioCard
          title={config.copy.trioReportsTitle}
          icon={<FileText className="h-4 w-4" />}
          body={
            recommendedReports.length > 0
              ? `${recommendedReports.length} report${recommendedReports.length === 1 ? '' : 's'} available. ${recommendedReports.slice(0, 2).map((r) => r.title).join(' · ')}`
              : 'Reports catalog is being seeded — check back soon or request a custom one.'
          }
          cta={{ label: 'Browse reports', href: '/dashboard/reports' }}
        />
        <TrioCard
          title={config.copy.trioPulseTitle}
          icon={<Newspaper className="h-4 w-4" />}
          body="Ethiopian business news, Telegram operators, and gov portals in one feed."
          cta={{ label: 'Open Pulse', href: '/dashboard/pulse' }}
        />
      </div>

      {/* RECOMMENDATIONS — tailored */}
      {config.recommendations.length > 0 ? (
        <section>
          <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
            Recommended for you
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {config.recommendations.map((rec) => (
              <Link
                key={rec.href}
                href={rec.href}
                className="group flex items-start gap-3 rounded-lg border border-border/70 bg-surface p-4 transition-all hover:border-brand/40"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-brand/15 text-brand">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink group-hover:text-brand">
                    {rec.label}
                  </p>
                  <p className="text-xs text-ink-muted">{rec.hint}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* SAVED SECTORS */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
            Saved sectors
          </h2>
          {savedSectors.length > 0 ? (
            <Link href="/dashboard/research" className="text-xs text-ink-muted hover:text-ink">
              View all →
            </Link>
          ) : null}
        </div>
        {savedSectors.length === 0 ? (
          <EmptyState
            icon={<Bookmark className="h-5 w-5" />}
            title="You haven't bookmarked a sector yet"
            body="Run the 5-question wizard to get 3 picks in under a minute — or browse the 519-sector catalog."
            primary={{ label: 'Run the wizard', href: '/wizard' }}
            secondary={{ label: 'Browse sectors', href: '/sectors' }}
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {savedSectors.map((s) => (
              <Link
                key={s.id}
                href={`/sectors/${s.sector.slug}`}
                className="group flex items-start justify-between gap-3 rounded-lg border border-border bg-surface p-4 transition-all hover:border-brand/40"
              >
                <div className="min-w-0 flex-1">
                  <Badge variant="mono" className="mb-2">
                    {s.sector.mor_code}
                  </Badge>
                  <p className="line-clamp-2 text-sm font-medium leading-snug text-ink group-hover:text-brand">
                    {humanizeSectorName(s.sector.mor_code, s.sector.name_en)}
                  </p>
                  {s.sector.name_am ? (
                    <p className="mt-0.5 truncate font-amharic text-xs text-ink-faint">
                      {s.sector.name_am}
                    </p>
                  ) : null}
                </div>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-ink-faint" />
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* SAVED REPORTS */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
            Saved reports
          </h2>
          {savedReports.length > 0 ? (
            <Link href="/dashboard/research" className="text-xs text-ink-muted hover:text-ink">
              View all →
            </Link>
          ) : null}
        </div>
        {savedReports.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-5 w-5" />}
            title="No reports saved yet"
            body={
              recommendedReports.length > 0
                ? `Browse the catalog or request one — ${recommendedReports[0]?.title ?? 'reports'} might be a fit.`
                : 'Browse the catalog or tell us what to research.'
            }
            primary={{ label: 'Browse reports', href: '/dashboard/reports' }}
            secondary={{ label: 'Request a custom report', href: '/consult' }}
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {savedReports.map((s) => (
              <Card key={s.id} className="p-4">
                <p className="text-sm font-semibold text-ink">{s.report.title}</p>
                {s.report.description ? (
                  <p className="mt-1 line-clamp-2 text-xs text-ink-muted">{s.report.description}</p>
                ) : null}
                {s.report.price_birr ? (
                  <p className="mt-2 font-mono text-[11px] text-brand">
                    ETB {s.report.price_birr.toLocaleString()}
                  </p>
                ) : null}
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function TrioCard({
  title,
  icon,
  body,
  cta,
}: {
  title: string
  icon: React.ReactNode
  body: string
  cta: { label: string; href: string }
}) {
  return (
    <Card className="flex flex-col p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-md bg-brand/15 text-brand">
          {icon}
        </span>
        <p className="text-sm font-semibold text-ink">{title}</p>
      </div>
      <p className="flex-1 text-sm text-ink-muted">{body}</p>
      <div className="mt-4">
        <Button asChild size="sm" variant="secondary">
          <Link href={cta.href}>
            {cta.label} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </Card>
  )
}

function EmptyState({
  icon,
  title,
  body,
  primary,
  secondary,
}: {
  icon: React.ReactNode
  title: string
  body: string
  primary: { label: string; href: string }
  secondary?: { label: string; href: string }
}) {
  return (
    <Card className="flex flex-col items-start gap-3 border-dashed p-6 sm:flex-row sm:items-center">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand/15 text-brand">
        {icon}
      </span>
      <div className="flex-1">
        <p className="text-sm font-semibold text-ink">{title}</p>
        <p className="text-xs text-ink-muted">{body}</p>
      </div>
      <div className="flex flex-wrap gap-2 sm:ml-auto">
        {secondary ? (
          <Button asChild size="sm" variant="ghost">
            <Link href={secondary.href}>{secondary.label}</Link>
          </Button>
        ) : null}
        <Button asChild size="sm">
          <Link href={primary.href}>
            {primary.label} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </Card>
  )
}
