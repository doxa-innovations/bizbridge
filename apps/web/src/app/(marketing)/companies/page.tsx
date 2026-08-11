import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowUpRight, BadgeCheck, MapPin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Bishoftu companies in good standing',
  description:
    'Bishoftu-area businesses BizBridge has personally verified as active, well-run, and worth introducing. Curated, not paid — inclusion is by observation.',
}

interface Company {
  name: string
  category: string
  city: string
  what_they_do: string
  since?: string
  url?: string
  telegram?: string
  logo_url?: string
  status: 'verified' | 'upcoming'
}

/**
 * Small, hand-curated list — NOT a directory. BizBridge adds companies
 * we've personally worked with, visited, or verified through a partner
 * we trust. "Good standing" means: active licence, consistent
 * operations, no red flags from our operator interviews.
 *
 * Never accept a paid listing here. If someone offers, refer them to
 * the /partners page (which is also unpaid but broader).
 */
const COMPANIES: Company[] = [
  {
    name: 'Fida Delivery',
    category: 'Logistics · Last-mile delivery',
    city: 'Bishoftu',
    what_they_do:
      'On-demand food + parcel delivery across Bishoftu. First proper delivery platform in the city; ~30 riders on-shift as of Aug 2026.',
    since: '2026',
    url: 'https://fidadelivery.com',
    telegram: 'https://t.me/fidadelivery',
    status: 'verified',
  },
  {
    name: 'Doxa Innovations',
    category: 'Software · Booking + hotel-tech',
    city: 'Bishoftu',
    what_they_do:
      'Multi-tenant hotel booking platform, POS integrations, and custom software for Ethiopian hospitality operators.',
    since: '2025',
    url: 'https://doxaplc.com',
    status: 'verified',
  },
  {
    name: 'Classic Noodle',
    category: 'F&B · Asian-fusion casual dining',
    city: 'Bishoftu',
    what_they_do:
      'The go-to noodle house on the main strip. Consistent quality, sensible pricing, honest hours.',
    url: 'https://classicnoodle.com',
    status: 'verified',
  },
]

const UPCOMING: Company[] = [
  {
    name: 'More coming soon',
    category: '—',
    city: 'Bishoftu',
    what_they_do:
      'We add businesses to this list as we personally verify them. If you\'re running a Bishoftu-area operation and want a look, DM us on Telegram.',
    status: 'upcoming',
  },
]

export default function CompaniesPage() {
  return (
    <div>
      <section className="border-b border-border/70">
        <div className="container-page py-16 sm:py-20">
          <Badge variant="brand" className="mb-4 inline-flex">
            <BadgeCheck className="h-3 w-3" /> Curated · not paid
          </Badge>
          <h1 className="text-balance text-4xl font-semibold tracking-crisp sm:text-5xl">
            Bishoftu companies in good standing.
          </h1>
          <p className="mt-4 max-w-2xl text-pretty text-ink-muted">
            A small, hand-picked list of Bishoftu-area businesses we&apos;ve personally verified
            as active and well-run. Not a directory, not a paid-for listing, not exhaustive —
            just companies we&apos;d comfortably introduce a friend or a diaspora investor to.
          </p>
        </div>
      </section>

      <section className="container-page py-14">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {COMPANIES.map((c) => (
            <CompanyCard key={c.name} c={c} />
          ))}
        </div>
      </section>

      <section className="container-page pb-20">
        <h2 className="mb-4 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
          Upcoming
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {UPCOMING.map((c) => (
            <CompanyCard key={c.name} c={c} />
          ))}
        </div>
        <p className="mt-8 text-center text-xs text-ink-faint">
          Want to be considered?{' '}
          <a
            href="https://t.me/cherireal7"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-brand hover:underline"
          >
            DM @cherireal7 on Telegram
          </a>
          . We&apos;ll ask for your licence, tax status, and 2-3 customer references. No
          paywall — the bar is just credibility.
        </p>
      </section>
    </div>
  )
}

function CompanyCard({ c }: { c: Company }) {
  return (
    <Card className="flex h-full flex-col p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">{c.name}</p>
          <p className="mt-0.5 text-[11px] text-ink-faint">{c.category}</p>
        </div>
        {c.status === 'verified' ? (
          <Badge variant="brand" className="shrink-0 gap-1">
            <BadgeCheck className="h-3 w-3" /> Verified
          </Badge>
        ) : (
          <Badge variant="outline" className="shrink-0">
            Upcoming
          </Badge>
        )}
      </div>
      <p className="mt-3 flex-1 text-xs leading-relaxed text-ink-muted">{c.what_they_do}</p>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-ink-faint">
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-3 w-3" /> {c.city}
        </span>
        {c.since ? <span>· since {c.since}</span> : null}
      </div>
      {c.url || c.telegram ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {c.url ? (
            <Link
              href={c.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded border border-border bg-surface px-2 py-1 text-[11px] text-ink hover:border-brand/40 hover:text-brand"
            >
              Website <ArrowUpRight className="h-3 w-3" />
            </Link>
          ) : null}
          {c.telegram ? (
            <Link
              href={c.telegram}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded border border-border bg-surface px-2 py-1 text-[11px] text-ink hover:border-brand/40 hover:text-brand"
            >
              Telegram <ArrowUpRight className="h-3 w-3" />
            </Link>
          ) : null}
        </div>
      ) : null}
    </Card>
  )
}
