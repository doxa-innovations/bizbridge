'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  ArrowUpRight,
  BookOpen,
  Building2,
  Calculator,
  ClipboardList,
  Home,
  Layers,
  MessageCircle,
  Menu,
  PiggyBank,
  Rows3,
  Scale,
  SearchCheck,
  TrendingUp,
  UserRound,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/cn'

interface NavItem {
  href: string
  label: string
  description?: string
}

interface MobileNavProps {
  nav: NavItem[]
  className?: string
}

/** Icon per href — keeps the component data-driven (parent passes
 *  plain hrefs, we resolve visuals here). Falls back to Wrench for
 *  anything unclassified so a new nav item never renders naked. */
const ICONS: Record<string, LucideIcon> = {
  '/': Home,
  '/sectors': Layers,
  '/suggest': PiggyBank,
  '/wizard': ClipboardList,
  '/calculator': Calculator,
  '/checklist': ClipboardList,
  '/compare': Rows3,
  '/lookup': SearchCheck,
  '/resources': BookOpen,
  '/bishoftu': TrendingUp,
  '/reports': BookOpen,
  '/about': UserRound,
  '/companies': Building2,
  '/consult': MessageCircle,
  '/lawyer': Scale,
  '/partners': Users,
  '/services': Wrench,
}

/** Groups the flat nav into semantic sections for a scannable
 *  mobile menu (Primary → Tools → Learn → Help). */
function groupItems(nav: NavItem[]) {
  const primary: NavItem[] = []
  const tools: NavItem[] = []
  const learn: NavItem[] = []
  const help: NavItem[] = []
  const seen = new Set<string>()

  for (const item of nav) {
    if (seen.has(item.href)) continue
    seen.add(item.href)
    if (item.href === '/' || item.href === '/sectors') primary.push(item)
    else if (
      ['/suggest', '/wizard', '/calculator', '/checklist', '/compare', '/lookup'].includes(
        item.href,
      )
    )
      tools.push(item)
    else if (
      ['/resources', '/bishoftu', '/reports', '/about', '/companies'].includes(item.href)
    )
      learn.push(item)
    else help.push(item)
  }

  return [
    { title: null as string | null, items: primary },
    { title: 'Tools', items: tools },
    { title: 'Learn', items: learn },
    { title: 'Help', items: help },
  ].filter((section) => section.items.length > 0)
}

export function MobileNav({ nav, className }: MobileNavProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const sections = groupItems(nav)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className={cn(
            'inline-flex h-10 w-10 items-center justify-center rounded-md text-ink transition-colors hover:bg-surface-2',
            className,
          )}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </SheetTrigger>
      {/* Glass panel: translucent surface + backdrop-blur so the
          site behind fades through it. Wider than the default sheet
          so touch targets breathe. */}
      <SheetContent
        side="right"
        className="flex w-[86%] max-w-sm flex-col border-l border-border/60 bg-surface/70 p-0 backdrop-blur-2xl"
      >
        {/* Header — logo + close X (close is rendered by SheetContent). */}
        <div className="flex shrink-0 items-center gap-3 border-b border-border/60 px-5 py-5">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="inline-flex items-center gap-2.5 font-semibold tracking-tightish"
          >
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand to-brand-strong text-sm text-brand-foreground shadow-sm">
              B
            </span>
            <span className="text-base">BizBridge</span>
          </Link>
        </div>

        {/* Scrollable body */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {sections.map((section, i) => (
            <div key={section.title ?? `_${i}`} className={cn(i > 0 && 'mt-5')}>
              {section.title ? (
                <p className="mb-1 px-3 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                  {section.title}
                </p>
              ) : null}
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = ICONS[item.href] ?? Wrench
                  const active =
                    item.href === '/'
                      ? pathname === '/'
                      : pathname === item.href || pathname.startsWith(item.href + '/')
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          'group flex items-start gap-3 rounded-lg px-3 py-3 transition-all',
                          active
                            ? 'bg-brand/10 text-ink shadow-[inset_0_0_0_1px_rgb(var(--brand)_/_0.25)]'
                            : 'text-ink-muted hover:bg-surface-2/80 hover:text-ink active:bg-surface-2',
                        )}
                        aria-current={active ? 'page' : undefined}
                      >
                        <Icon
                          className={cn(
                            'mt-0.5 h-4 w-4 shrink-0',
                            active
                              ? 'text-brand'
                              : 'text-ink-faint group-hover:text-ink-muted',
                          )}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium leading-tight">
                            {item.label}
                          </span>
                          {item.description ? (
                            <span className="mt-0.5 block text-[11px] leading-snug text-ink-faint">
                              {item.description}
                            </span>
                          ) : null}
                        </span>
                        {!active ? (
                          <ArrowUpRight className="mt-1 h-3 w-3 shrink-0 text-ink-faint opacity-0 transition-opacity group-hover:opacity-100" />
                        ) : null}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Fade + CTA footer */}
        <div className="relative shrink-0 border-t border-border/60 bg-surface/60 px-4 pb-5 pt-4 backdrop-blur-2xl">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -top-6 h-6 bg-gradient-to-b from-transparent to-surface/60"
          />
          <div className="grid grid-cols-2 gap-2">
            <Button asChild variant="secondary" size="lg" onClick={() => setOpen(false)}>
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild size="lg" onClick={() => setOpen(false)}>
              <Link href="/signup">Get started</Link>
            </Button>
          </div>
          <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
            Bishoftu · Oromia · Ethiopia
          </p>
        </div>
      </SheetContent>
    </Sheet>
  )
}
