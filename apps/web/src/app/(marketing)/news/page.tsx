import type { Metadata } from 'next'
import { Newspaper } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { GridBackdrop } from '@/components/marketing/grid-backdrop'
import { getAggregatedNews, NEWS_SOURCES, type NewsItem } from '@/lib/news-feeds'

export const metadata: Metadata = {
  title: 'Ethiopian business news — daily feed',
  description:
    'A rolling aggregate of the freshest business, policy, and macro headlines from Ethiopia’s longest-running English-language newsrooms — Addis Fortune, Capital Ethiopia, and Ethiopian Business Review — refreshed hourly.',
}

export const revalidate = 3600

function formatDate(iso: string): string {
  const d = new Date(iso)
  const now = Date.now()
  const hours = Math.round((now - d.getTime()) / 3_600_000)
  if (hours < 1) return 'just now'
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default async function NewsPage() {
  const { items, bySource } = await getAggregatedNews(50)

  return (
    <div>
      <section className="relative overflow-hidden border-b border-border">
        <GridBackdrop />
        <div className="container-page py-16">
          <div className="max-w-3xl">
            <Badge variant="brand" className="mb-4 inline-flex">
              <Newspaper className="h-3 w-3" /> News feed
            </Badge>
            <h1 className="text-balance text-4xl font-semibold tracking-crisp sm:text-5xl">
              Ethiopian business, in one feed.
            </h1>
            <p className="mt-4 max-w-2xl text-pretty text-ink-muted">
              Every hour we pull the latest headlines from Addis Fortune, Capital Ethiopia,
              and Ethiopian Business Review — the three most consistent English-language
              business newsrooms in the country. Straight through to the publisher — we
              don&apos;t republish, we just index.
            </p>
          </div>
        </div>
      </section>

      <section className="container-page py-10">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex flex-wrap items-center gap-2">
            {NEWS_SOURCES.map((s) => {
              const n = bySource[s.id] ?? 0
              return (
                <a
                  key={s.id}
                  href={s.siteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 font-mono text-[11px] text-ink-muted hover:border-brand/40 hover:text-ink"
                >
                  <span
                    aria-hidden
                    className={`h-1.5 w-1.5 rounded-full ${n > 0 ? 'bg-brand' : 'bg-ink-faint/40'}`}
                  />
                  {s.name}
                  <span className="text-ink-faint">· {n}</span>
                </a>
              )
            })}
          </div>

          {items.length === 0 ? (
            <Card className="p-10 text-center">
              <p className="text-sm text-ink-muted">
                No headlines are reachable right now. This usually means every upstream feed
                is temporarily blocked or offline — try again in a few minutes.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <NewsRow key={`${item.sourceId}:${item.link}`} item={item} />
              ))}
            </div>
          )}

          <p className="mt-10 rounded-lg border border-dashed border-border bg-surface/50 p-4 font-mono text-[11px] leading-relaxed text-ink-faint">
            Headlines are the publishers&apos; own — links go straight to their site.
            BizBridge does not host, edit, or reorder article bodies. Feed is cached
            server-side for 1 hour to stay polite to upstream servers.
          </p>
        </div>
      </section>
    </div>
  )
}

function NewsRow({ item }: { item: NewsItem }) {
  return (
    <a
      href={item.link}
      target="_blank"
      rel="noreferrer"
      className="group block rounded-lg border border-border bg-surface p-5 transition-colors hover:border-brand/40"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-ink-faint">
            <span className="rounded bg-surface-2 px-2 py-0.5 text-ink-muted">
              {item.sourceName}
            </span>
            <span>·</span>
            <span>{formatDate(item.isoDate)}</span>
          </div>
          <h3 className="mt-2 text-base font-semibold leading-snug tracking-tightish text-ink group-hover:text-brand">
            {item.title}
          </h3>
          {item.excerpt ? (
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-muted">
              {item.excerpt}
            </p>
          ) : null}
        </div>
      </div>
    </a>
  )
}
