import type { ReactNode } from 'react'
import Link from 'next/link'
import { Info } from 'lucide-react'
import { cn } from '@/lib/cn'

interface Source {
  label: string
  href?: string
  /** Optional freshness marker — e.g. 'Updated 2026-08-09' or 'Live'. */
  updated?: string
}

interface Props {
  /** One or more source citations. First one gets the most emphasis. */
  sources: Source[]
  /** Extra context shown only on hover (title tooltip). */
  methodology?: string
  className?: string
  /** Layout: 'inline' for a single subtle line, 'stacked' for multi-line block. */
  layout?: 'inline' | 'stacked'
  children?: ReactNode
}

/**
 * Subtle source-attribution strip used on charts + stat blocks. Says
 * "Source: X · Y" at low opacity so it doesn't compete with the data
 * but is always available for anyone verifying reliability.
 *
 * Long methodology or explanation goes into the native `title` tooltip
 * (hover to reveal) so we don't clutter the visible surface.
 */
export function SourceCite({ sources, methodology, className, layout = 'inline', children }: Props) {
  const tooltip = methodology ? `Methodology: ${methodology}` : undefined
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 font-mono text-[10px] leading-tight text-ink-faint/70',
        layout === 'stacked' && 'flex-col items-start gap-1',
        className,
      )}
      title={tooltip}
    >
      <span className="uppercase tracking-[0.14em]">Source</span>
      <div
        className={cn(
          'flex flex-wrap items-center gap-x-1.5',
          layout === 'stacked' && 'gap-y-0.5',
        )}
      >
        {sources.map((src, i) => (
          <span key={`${src.label}-${i}`} className="inline-flex items-center gap-1">
            {i > 0 ? <span aria-hidden>·</span> : null}
            {src.href ? (
              <Link
                href={src.href}
                target={src.href.startsWith('http') ? '_blank' : undefined}
                rel={src.href.startsWith('http') ? 'noreferrer' : undefined}
                className="text-ink-faint hover:text-brand hover:underline"
              >
                {src.label}
              </Link>
            ) : (
              <span className="text-ink-faint">{src.label}</span>
            )}
            {src.updated ? (
              <span className="text-ink-faint/60">({src.updated})</span>
            ) : null}
          </span>
        ))}
      </div>
      {methodology ? (
        <Info className="h-2.5 w-2.5 shrink-0 text-ink-faint/60" aria-hidden />
      ) : null}
      {children}
    </div>
  )
}
