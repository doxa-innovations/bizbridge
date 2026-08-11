import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowUpRight, BadgeCheck, MapPin, Phone } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Bishoftu companies in good standing',
  description:
    'Bishoftu-area businesses BizBridge has personally verified as active. Descriptions and contact details are pulled directly from each company\'s own site — nothing invented.',
}

interface Company {
  name: string
  legal_name?: string
  category: string
  city: string
  /** Copy pulled verbatim from the source page (meta description or
   *  on-page tagline). Kept short. */
  what_they_do: string
  services?: string[]
  hours?: string
  phone?: string
  email?: string
  url?: string
  telegram?: string
  instagram?: string
  tiktok?: string
  facebook?: string
  status: 'verified' | 'upcoming'
  /** URL(s) we pulled the facts on this row from. Rendered as a small
   *  "source" chip so readers can verify. */
  sources: string[]
}

/**
 * Small, hand-curated list — NOT a directory. Every fact on every row
 * is sourced from the company's own site (see `sources` per row). We do
 * not invent ratings, revenue claims, or historical dates.
 *
 * Inclusion is unpaid and by personal verification only. If someone
 * offers to pay for a listing, refer them elsewhere.
 */
const COMPANIES: Company[] = [
  {
    name: 'Fida Delivery',
    legal_name: 'Fida Delivery PLC',
    category: 'Logistics & delivery',
    city: 'Bishoftu, Oromia',
    what_they_do:
      'Order from restaurants, shops, groceries, and pharmacies across Bishoftu, Ethiopia. Fida delivers from every local partner in one app.',
    services: ['Food delivery', 'Parcel delivery', 'Grocery delivery', 'Pharmacy delivery'],
    hours: 'Daily 08:00–22:00',
    phone: '+251 94 355 8899',
    email: 'info@fidadelivery.et',
    url: 'https://fidadelivery.com',
    telegram: 'https://t.me/fidadelivery',
    instagram: 'https://instagram.com/fida__delivery',
    tiktok: 'https://tiktok.com/@fida_delivery',
    facebook: 'https://facebook.com/fidadelivery',
    status: 'verified',
    sources: ['https://fidadelivery.com'],
  },
  {
    name: 'Doxa Innovations',
    legal_name: 'Doxa Innovative Software Development PLC',
    category: 'Creative agency · design & software',
    city: 'Ethiopia',
    what_they_do:
      'An online creative hub dedicated to helping businesses establish a strong and professional brand identity at an affordable price. Provides branding, design and web / software development.',
    services: ['Branding & design', 'Web development', 'Software development', 'UI/UX'],
    url: 'https://doxaplc.com',
    status: 'verified',
    sources: ['https://doxaplc.com'],
  },
  {
    name: 'Classic Noodle',
    category: 'Restaurant · breakfast, burger, noodle, pizza, dinner',
    city: 'Bishoftu',
    what_they_do:
      'On-menu today: Classic Burger (ETB 670), Pepperoni Pizza Large (ETB 860), Vegetable Pizza Large (ETB 570), Vegetable Fasting Fried Rice (ETB 630), Chicken Salad Full (ETB 555), Omelet breakfast (ETB 205).',
    url: 'https://classicnoodle.com',
    status: 'verified',
    sources: ['https://classicnoodle.com'],
  },
]

const UPCOMING: Company[] = [
  {
    name: 'More coming',
    category: '—',
    city: 'Bishoftu',
    what_they_do:
      'We add businesses only after we\'ve personally verified them. If you run a Bishoftu-area operation and want a look, DM us on Telegram.',
    status: 'upcoming',
    sources: [],
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
            A small, hand-picked list. Everything on each card is pulled from the company&apos;s
            own website — descriptions, prices, hours, and contact details. We don&apos;t
            invent ratings or performance claims, and inclusion is unpaid.
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
          . We&apos;ll ask for your licence, tax status, and 2–3 customer references. No
          paywall — the bar is credibility.
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
          {c.legal_name && c.legal_name !== c.name ? (
            <p className="mt-0.5 font-mono text-[10px] text-ink-faint">{c.legal_name}</p>
          ) : null}
          <p className="mt-1 text-[11px] text-ink-faint">{c.category}</p>
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

      {c.services && c.services.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1">
          {c.services.map((s) => (
            <span
              key={s}
              className="rounded-full border border-border/70 bg-surface px-2 py-0.5 text-[10px] text-ink-muted"
            >
              {s}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-faint">
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-3 w-3" /> {c.city}
        </span>
        {c.hours ? <span>· {c.hours}</span> : null}
        {c.phone ? (
          <span className="inline-flex items-center gap-1">
            <Phone className="h-3 w-3" /> {c.phone}
          </span>
        ) : null}
        {c.email ? (
          <a href={`mailto:${c.email}`} className="hover:text-brand">
            {c.email}
          </a>
        ) : null}
      </div>

      {c.url || c.telegram || c.instagram || c.tiktok || c.facebook ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {c.url ? <SocialChip href={c.url} label="Website" /> : null}
          {c.telegram ? <SocialChip href={c.telegram} label="Telegram" /> : null}
          {c.instagram ? <SocialChip href={c.instagram} label="Instagram" /> : null}
          {c.tiktok ? <SocialChip href={c.tiktok} label="TikTok" /> : null}
          {c.facebook ? <SocialChip href={c.facebook} label="Facebook" /> : null}
        </div>
      ) : null}

      {c.sources.length > 0 ? (
        <p className="mt-3 border-t border-border/50 pt-2 font-mono text-[10px] text-ink-faint">
          Source:{' '}
          {c.sources.map((s, i) => (
            <span key={s}>
              <a
                href={s}
                target="_blank"
                rel="noreferrer"
                className="text-ink-muted hover:text-brand"
              >
                {s.replace(/^https?:\/\//, '')}
              </a>
              {i < c.sources.length - 1 ? ' · ' : ''}
            </span>
          ))}
        </p>
      ) : null}
    </Card>
  )
}

function SocialChip({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 rounded border border-border bg-surface px-2 py-1 text-[11px] text-ink hover:border-brand/40 hover:text-brand"
    >
      {label} <ArrowUpRight className="h-3 w-3" />
    </Link>
  )
}
