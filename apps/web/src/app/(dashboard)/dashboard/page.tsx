import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  FileSearch,
  FileText,
  Landmark,
  MapPin,
  Newspaper,
  TrendingUp,
} from 'lucide-react'
import { requireUser } from '@/lib/require-user'
import { tryPayload } from '@/lib/payload'
import { getDashboardConfig, CAPITAL_TIER_META } from '@/lib/dashboard-tailoring'
import { humanizeSectorName } from '@/lib/humanize-sector-name'
import {
  BISHOFTU_OPPORTUNITIES,
  BISHOFTU_OPPORTUNITY_SOURCES,
} from '@/lib/bishoftu-opportunities'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GeometricIcon } from '@/components/marketing/geometric-icon'
import { SourceCite } from '@/components/ui/source-cite'
import {
  ProgressRing,
  CapitalTierMeter,
  InterestCoverage,
} from '@/components/dashboard/dashboard-visuals'
import { DoxaPromoModal } from '@/components/dashboard/doxa-promo'

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
    const [saved, savedReports, reports, totalSectors, activeRequests, categories, bishoftuSectors] = await Promise.all([
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
      payload.find({
        collection: 'business-sectors',
        limit: 0,
        depth: 0,
      }),
      payload.find({
        collection: 'report-requests',
        where: { user_id: { equals: user.id } },
        limit: 20,
        depth: 0,
        sort: '-createdAt',
      }),
      payload.find({
        collection: 'sector-categories',
        limit: 20,
        depth: 0,
      }),
      // Resolve MOR codes for the Bishoftu opportunities so the row
      // links land on real seeded sector docs.
      payload.find({
        collection: 'business-sectors',
        where: {
          or: BISHOFTU_OPPORTUNITIES.map((o) => ({
            mor_code: { equals: o.sector_mor },
          })),
        },
        limit: BISHOFTU_OPPORTUNITIES.length,
        depth: 0,
      }),
    ])

    // Build a MOR-code → slug map so opportunity rows can link to
    // /dashboard/sectors/<slug>. Any code that isn't in the seed just
    // renders without a link (rare).
    const bishoftuSlugByCode = new Map<string, string>()
    for (const d of bishoftuSectors.docs) {
      const doc = d as { mor_code?: string; slug?: string }
      if (doc.mor_code && doc.slug) bishoftuSlugByCode.set(doc.mor_code, doc.slug)
    }

    return {
      savedSectors: (saved.docs as unknown as SavedSector[]).filter((s) => s.sector),
      savedReports: (savedReports.docs as unknown as SavedReport[]).filter((s) => s.report),
      recommendedReports: reports.docs as unknown as RecommendedReport[],
      totalSectorsCount: totalSectors.totalDocs,
      requestsCount: activeRequests.totalDocs,
      requestStatuses: activeRequests.docs.map((r) => (r as { status: string }).status),
      totalCategoriesCount: categories.totalDocs,
      bishoftuSlugByCode,
    }
  })

  const savedSectors = data?.savedSectors ?? []
  const savedReports = data?.savedReports ?? []
  const recommendedReports = data?.recommendedReports ?? []
  const totalSectorsCount = data?.totalSectorsCount ?? 518
  const totalCategoriesCount = data?.totalCategoriesCount ?? 9
  const requestsCount = data?.requestsCount ?? 0
  const requestStatuses = data?.requestStatuses ?? []
  const bishoftuSlugByCode = data?.bishoftuSlugByCode ?? new Map<string, string>()
  const verifiedRequests = requestStatuses.filter((s) => s === 'verified').length
  const pendingRequests = requestStatuses.filter((s) => s === 'pending').length

  // Onboarding + engagement completeness (weighted).
  const completedSignals = [
    Boolean(user.onboardedAt),
    Boolean((user.interestCategories ?? []).length >= 1),
    Boolean(user.capitalTier),
    Boolean(user.phone),
    savedSectors.length > 0,
    savedReports.length > 0 || requestsCount > 0,
  ]
  const setupPct = Math.round(
    (completedSignals.filter(Boolean).length / completedSignals.length) * 100,
  )

  const TIER_INDEX: Record<string, number> = {
    solo: 0,
    micro: 1,
    small: 2,
    medium: 3,
    investment: 4,
  }
  const tierIndex = user.capitalTier ? (TIER_INDEX[user.capitalTier] ?? -1) : -1

  const tierMeta = user.capitalTier ? CAPITAL_TIER_META[user.capitalTier] : null

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Marketing modal — auto-opens ~20s after landing, snoozeable 14 days. */}
      {/* Doxa pitch shows ONLY to onboarded diaspora / foreign_investor
          users — the group actually likely to need software built once
          the paperwork is behind them. Locals + not-yet-onboarded users
          don't see it. */}
      <DoxaPromoModal
        enabled={
          Boolean(user.onboardedAt) &&
          (user.userType === 'diaspora' || user.userType === 'foreign_investor')
        }
        userType={user.userType ?? null}
      />

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
                href={`/dashboard/sectors?category=${slug}`}
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

      {/* DATA STRIP — small visualisations tying together user progress + market shape */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
            Profile setup
          </p>
          <div className="mt-1">
            <ProgressRing value={setupPct} label="complete" height={160} />
          </div>
          <SourceCite
            className="mt-2"
            sources={[{ label: 'Your profile', updated: 'Live' }]}
            methodology="Onboarding + interests + capital tier + phone + first bookmark + first request"
          />
        </Card>

        <Card className="p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
            Capital tier
          </p>
          <div className="mt-3">
            <CapitalTierMeter
              tierLabel={tierMeta?.label ?? 'Not set'}
              tierIndex={tierIndex}
            />
          </div>
          <SourceCite
            className="mt-2"
            sources={[
              { label: 'MOR Directive 17/2011 + EIC capital thresholds', href: '/services' },
            ]}
            methodology="Tier bands from /suggest (Solo 30k–300k ETB, Micro 300k–2M, Small 2M–15M, Medium 15M–150M, Investment 150M+)"
          />
        </Card>

        <Card className="p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
            Interest coverage
          </p>
          <div className="mt-1">
            <InterestCoverage
              categoriesInInterest={(user.interestCategories ?? []).length}
              totalCategories={totalCategoriesCount}
              matchedSectors={(user.interestSectors ?? []).length}
              totalSectors={totalSectorsCount}
              height={160}
            />
          </div>
          <SourceCite
            className="mt-2"
            sources={[{ label: 'MOR Directive 17/2011', href: 'https://mor.gov.et' }]}
            methodology={`How much of Ethiopia's ${totalSectorsCount} licensable sectors your interests cover`}
          />
        </Card>

        <Card className="flex flex-col p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
            Your requests
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-crisp text-ink">
            {requestsCount}
            <span className="ml-1 font-mono text-xs text-ink-faint">total</span>
          </p>
          <p className="mt-2 flex-1 text-xs text-ink-muted">
            {verifiedRequests} verified · {pendingRequests} pending
          </p>
          <div className="mt-4">
            <Button asChild size="sm" variant="secondary" className="w-full">
              <Link href="/dashboard/requests">
                View history <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
          <SourceCite
            className="mt-3"
            sources={[{ label: 'Your submissions', updated: 'Live' }]}
          />
        </Card>
      </section>

      {/* REQUEST-A-DOC HERO CTA */}
      <Card className="relative overflow-hidden p-6 sm:p-8">
        <div
          aria-hidden
          className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-brand/20 via-brand/5 to-transparent"
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-xl">
            <div className="mb-2 inline-flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-md bg-brand/15 text-brand">
                <FileSearch className="h-4 w-4" />
              </span>
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                Data on demand
              </p>
            </div>
            <h2 className="text-xl font-semibold tracking-tightish text-ink sm:text-2xl">
              Need a specific doc from MOR, Trade Bureau, or another Ethiopian body?
            </h2>
            <p className="mt-2 text-sm text-ink-muted">
              We procure PDFs, fee schedules, licensing forms and circulars on request.
              Typical turnaround 2–5 business days · ETB 150–800 depending on source.
              Refund if we can&apos;t get it.
            </p>
          </div>
          <Button asChild size="lg" className="shrink-0">
            <Link href="/dashboard/request-data">
              Request a doc <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Card>

      {/* TAILORED TRIO */}
      <div className="grid gap-4 lg:grid-cols-3">
        <TrioCard
          title={config.copy.trioBudgetTitle}
          icon={<Landmark className="h-4 w-4" />}
          body={tierMeta ? tierMeta.vibe : 'Pick a budget to see sector shortlists tuned to that range.'}
          cta={{
            label: tierMeta ? 'Explore picks' : 'Pick a budget',
            href: `/dashboard/suggest${config.suggestQuery}`,
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

      {/* BISHOFTU OPPORTUNITIES — cited local intel */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
            <MapPin className="h-3.5 w-3.5" /> Bishoftu opportunities
          </h2>
          <Link
            href="/bishoftu"
            className="text-xs text-ink-muted hover:text-ink"
            target="_blank"
            rel="noreferrer"
          >
            Full Pulse →
          </Link>
        </div>
        <Card className="overflow-hidden">
          <div className="grid divide-y divide-border">
            {BISHOFTU_OPPORTUNITIES.slice(0, 6).map((o) => {
              const slug = bishoftuSlugByCode.get(o.sector_mor)
              const row = (
                <div className="grid grid-cols-[auto_1fr_auto] items-start gap-4 px-4 py-3 hover:bg-surface-2/40">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-surface-2 font-mono text-xs font-semibold text-ink">
                    {o.rank}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">{o.name}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-ink-muted">{o.why}</p>
                    <p className="mt-1 font-mono text-[10px] text-ink-faint">
                      MOR {o.sector_mor}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="h-3 w-3 text-brand" />
                      <span className="font-mono text-[11px] text-ink-muted">
                        {o.readiness}
                      </span>
                    </div>
                    {slug ? (
                      <ArrowRight className="h-3.5 w-3.5 text-ink-faint" />
                    ) : null}
                  </div>
                </div>
              )
              return slug ? (
                <Link key={o.rank} href={`/dashboard/sectors/${slug}`}>
                  {row}
                </Link>
              ) : (
                <div key={o.rank}>{row}</div>
              )
            })}
          </div>
        </Card>
        <SourceCite
          className="mt-2"
          sources={BISHOFTU_OPPORTUNITY_SOURCES}
          methodology="Readiness = subjective 0-100 score combining market timing × capital intensity × airport-boom leverage. Curated shortlist, not a directory."
        />
      </section>

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
            primary={{ label: 'Run the wizard', href: '/dashboard/wizard' }}
            secondary={{ label: 'Browse sectors', href: '/dashboard/sectors' }}
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {savedSectors.map((s) => (
              <Link
                key={s.id}
                href={`/dashboard/sectors/${s.sector.slug}`}
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
