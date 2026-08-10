import Image from 'next/image'
import { ArrowUpRight, MapPin } from 'lucide-react'
import type { Partner } from '@/lib/partners'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/cn'

const TINT_CLASSES: Record<NonNullable<Partner['tint']>, string> = {
  brand: 'from-brand/30 to-brand-strong/20 text-brand',
  warm: 'from-warn/25 to-brand/15 text-warn',
  cool: 'from-chart-2/25 to-chart-3/20 text-chart-2',
  sand: 'from-surface-3 to-surface-2 text-ink',
}

interface PartnerCardProps {
  partner: Partner
  category: string
  size?: 'sm' | 'md'
}

export function PartnerCard({ partner, category, size = 'md' }: PartnerCardProps) {
  const href = partner.url || partner.telegram || partner.instagram || '#'
  const hasLink = Boolean(partner.url || partner.telegram || partner.instagram)
  return (
    <a
      href={href}
      target={hasLink ? '_blank' : undefined}
      rel={hasLink ? 'noopener external' : undefined}
      className="group flex flex-col gap-4 rounded-lg border border-border bg-surface p-5 transition-all hover:border-brand/40 hover:shadow-glow"
    >
      <div className="flex items-start justify-between gap-3">
        <BrandMark partner={partner} size={size} />
        <ArrowUpRight className="h-4 w-4 shrink-0 text-ink-faint transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand" />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold tracking-tightish text-ink group-hover:text-brand">
            {partner.name}
          </h3>
          {partner.featured ? <Badge variant="brand">Featured</Badge> : null}
        </div>
        <p className="mt-1 text-xs text-ink-faint">{partner.tagline}</p>
      </div>
      {size === 'md' ? (
        <p className="line-clamp-3 text-sm leading-relaxed text-ink-muted">
          {partner.description}
        </p>
      ) : null}
      <div className="mt-auto flex items-center gap-3 pt-2 text-2xs uppercase tracking-wider text-ink-faint">
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-3 w-3" /> {partner.city}
        </span>
        <span aria-hidden>·</span>
        <span>{category}</span>
      </div>
    </a>
  )
}

export function BrandMark({ partner, size = 'md' }: { partner: Partner; size?: 'sm' | 'md' }) {
  const tint = partner.tint ?? 'brand'
  const dim = size === 'sm' ? 'h-10 w-10' : 'h-12 w-12'
  const px = size === 'sm' ? 40 : 48

  // Real logo asset — render as an image inside a light-tinted tile so a
  // dark or transparent logo doesn't disappear against the dark surface.
  if (partner.logoUrl) {
    return (
      <span
        className={cn(
          'grid place-items-center overflow-hidden rounded-md bg-white/95 ring-1 ring-inset ring-border',
          dim,
        )}
      >
        <Image
          src={partner.logoUrl}
          alt={`${partner.name} logo`}
          width={px}
          height={px}
          className="h-full w-full object-contain p-1"
          unoptimized
        />
      </span>
    )
  }

  // Fallback — initials on a tinted gradient.
  return (
    <span
      className={cn(
        'grid place-items-center rounded-md bg-gradient-to-br font-semibold ring-1 ring-inset ring-border',
        dim,
        size === 'sm' ? 'text-sm' : 'text-base',
        TINT_CLASSES[tint],
      )}
      aria-hidden
    >
      {partner.initials}
    </span>
  )
}
