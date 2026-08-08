import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, ArrowUpRight, Building, ExternalLink, LineChart, Newspaper, Radio, RadioTower, Send, Tv, Users } from 'lucide-react'
import { requireUser } from '@/lib/require-user'
import { tryPayload } from '@/lib/payload'
import { fetchTelegramPreviewsBatch, type TelegramPreview } from '@/lib/telegram-scraper'
import { getDashboardConfig } from '@/lib/dashboard-tailoring'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = { title: 'Pulse' }
export const revalidate = 300 // 5 min at the page level; scraper has its own 30-min cache per handle

type SourceType =
  | 'news_site'
  | 'newspaper'
  | 'tv'
  | 'youtube'
  | 'telegram'
  | 'gov_portal'
  | 'economic_data'

interface Source {
  id: number | string
  name: string
  type: SourceType
  url: string
  handle: string | null
  category: string | null
  description_en: string | null
  description_am: string | null
  priority: number | null
  allow_scrape: boolean | null
  subscribers: number | null
}

const TYPE_LABEL: Record<SourceType, string> = {
  news_site: 'News',
  newspaper: 'Newspaper',
  tv: 'TV',
  youtube: 'YouTube',
  telegram: 'Telegram',
  gov_portal: 'Government',
  economic_data: 'Economic data',
}

const TYPE_ICON: Record<SourceType, React.ComponentType<{ className?: string }>> = {
  news_site: Newspaper,
  newspaper: Newspaper,
  tv: Tv,
  youtube: Radio,
  telegram: Send,
  gov_portal: Building,
  economic_data: LineChart,
}

export default async function PulsePage() {
  const user = await requireUser()
  const config = getDashboardConfig(user)

  const sources = await tryPayload(async (payload) => {
    const res = await payload.find({
      collection: 'news-sources',
      where: { is_active: { equals: true } },
      sort: '-priority',
      limit: 200,
      depth: 0,
    })
    return res.docs as unknown as Source[]
  })

  const all = sources ?? []

  // Empty state: DB unreachable OR admin hasn't seeded any news sources.
  if (all.length === 0) {
    return (
      <div className="mx-auto max-w-2xl py-16">
        <Card className="p-8">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand/15 text-brand">
              <RadioTower className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
                Pulse
              </p>
              <h1 className="mt-1 text-xl font-semibold tracking-tightish text-ink">
                No sources published yet.
              </h1>
              <p className="mt-2 text-sm text-ink-muted">
                Cheri hasn&apos;t added any Ethiopian business feeds yet, or we&apos;re
                temporarily unable to reach the CMS. Try again in a minute.
              </p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button asChild size="sm">
              <Link href="/resources">
                Browse official portals <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
            <Button asChild size="sm" variant="ghost">
              <Link href="/dashboard">Back to dashboard</Link>
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // Fetch Telegram previews (opt-in per source via allow_scrape flag).
  const scrapeHandles = all
    .filter((s) => s.type === 'telegram' && s.allow_scrape && s.handle)
    .map((s) => s.handle!) as string[]

  const previews =
    scrapeHandles.length > 0
      ? await fetchTelegramPreviewsBatch(scrapeHandles)
      : new Map<string, TelegramPreview>()

  const grouped = groupByType(all)
  const orderedTypes: SourceType[] = config.pulseDefaultFilters.length
    ? [
        ...config.pulseDefaultFilters,
        ...(Object.keys(TYPE_LABEL) as SourceType[]).filter(
          (t) => !config.pulseDefaultFilters.includes(t),
        ),
      ]
    : ['telegram', 'news_site', 'youtube', 'tv', 'gov_portal', 'economic_data', 'newspaper']

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">Pulse</p>
        <h1 className="mt-1.5 text-3xl font-semibold tracking-crisp text-ink sm:text-4xl">
          Ethiopian business, live.
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-muted">
          Curated feed of Ethiopian business news, operator channels on Telegram + YouTube,
          government portals and economic data. Telegram channels marked with{' '}
          <Badge variant="mono">live</Badge> pull recent post previews every 30 minutes.
        </p>
      </header>

      {orderedTypes.map((type) => {
        const list = grouped.get(type) ?? []
        if (list.length === 0) return null
        return (
          <section key={type}>
            <div className="mb-3 flex items-center gap-2">
              <h2 className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
                {TYPE_LABEL[type]}
              </h2>
              <span className="text-xs text-ink-faint">({list.length})</span>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {list.map((source) =>
                source.type === 'telegram' ? (
                  <TelegramCard
                    key={source.id}
                    source={source}
                    preview={source.handle ? previews.get(source.handle) : undefined}
                  />
                ) : (
                  <SourceCard key={source.id} source={source} />
                ),
              )}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function groupByType(sources: Source[]): Map<SourceType, Source[]> {
  const map = new Map<SourceType, Source[]>()
  for (const s of sources) {
    const arr = map.get(s.type) ?? []
    arr.push(s)
    map.set(s.type, arr)
  }
  // Sort each group by priority desc
  for (const [k, arr] of map.entries()) {
    arr.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
    map.set(k, arr)
  }
  return map
}

function SourceCard({ source }: { source: Source }) {
  const Icon = TYPE_ICON[source.type]
  return (
    <Card className="flex flex-col p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-brand/15 text-brand">
            <Icon className="h-4 w-4" />
          </span>
          <p className="text-sm font-semibold text-ink">{source.name}</p>
        </div>
        <a
          href={source.url}
          target="_blank"
          rel="noreferrer"
          className="text-ink-faint hover:text-brand"
          aria-label={`Open ${source.name}`}
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
      {source.description_en ? (
        <p className="mt-2 line-clamp-3 flex-1 text-xs text-ink-muted">{source.description_en}</p>
      ) : null}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {source.category ? <Badge variant="mono">{source.category}</Badge> : null}
        {source.subscribers ? (
          <span className="inline-flex items-center gap-1 font-mono text-[10px] text-ink-faint">
            <Users className="h-3 w-3" />
            {formatCount(source.subscribers)}
          </span>
        ) : null}
      </div>
    </Card>
  )
}

function TelegramCard({
  source,
  preview,
}: {
  source: Source
  preview?: TelegramPreview
}) {
  const showPreviews = preview && !preview.optedOut && preview.posts.length > 0
  return (
    <Card className="flex flex-col p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-brand/15 text-brand">
            <Send className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">{source.name}</p>
            {source.handle ? (
              <p className="font-mono text-[10px] text-ink-faint">@{source.handle}</p>
            ) : null}
          </div>
        </div>
        <a
          href={source.url}
          target="_blank"
          rel="noreferrer"
          className="text-ink-faint hover:text-brand"
        >
          <ArrowUpRight className="h-4 w-4" />
        </a>
      </div>

      {source.description_en ? (
        <p className="mt-2 line-clamp-2 text-xs text-ink-muted">{source.description_en}</p>
      ) : null}

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {source.category ? <Badge variant="mono">{source.category}</Badge> : null}
        {source.subscribers ? (
          <span className="inline-flex items-center gap-1 font-mono text-[10px] text-ink-faint">
            <Users className="h-3 w-3" /> {formatCount(source.subscribers)}
          </span>
        ) : null}
        {source.allow_scrape ? <Badge variant="brand">live</Badge> : null}
      </div>

      {showPreviews ? (
        <ul className="mt-3 space-y-2 border-t border-border/60 pt-3">
          {preview!.posts.slice(0, 3).map((post) => (
            <li key={post.id}>
              <a
                href={post.linkUrl}
                target="_blank"
                rel="noreferrer"
                className="group block text-xs text-ink hover:text-brand"
              >
                <p className="line-clamp-2">{post.text || 'View post'}</p>
                {post.publishedAt ? (
                  <p className="mt-0.5 font-mono text-[10px] text-ink-faint">
                    {formatPostTime(post.publishedAt)}
                  </p>
                ) : null}
              </a>
            </li>
          ))}
        </ul>
      ) : source.allow_scrape ? (
        <p className="mt-3 border-t border-border/60 pt-3 font-mono text-[10px] text-ink-faint">
          Preview not available (channel opted out or scrape failed).
        </p>
      ) : (
        <div className="mt-3">
          <Link
            href={source.url}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-[11px] text-ink-faint hover:text-brand"
          >
            Open on Telegram →
          </Link>
        </div>
      )}
    </Card>
  )
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`
  return n.toString()
}

function formatPostTime(iso: string): string {
  try {
    const d = new Date(iso)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)
    if (diffHours < 24) return `${Math.max(1, Math.round(diffHours))}h ago`
    const diffDays = diffHours / 24
    if (diffDays < 30) return `${Math.round(diffDays)}d ago`
    return d.toLocaleDateString()
  } catch {
    return ''
  }
}
