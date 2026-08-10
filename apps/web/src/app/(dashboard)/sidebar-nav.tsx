'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { LucideIcon } from 'lucide-react'
import {
  Calculator,
  FileBarChart,
  FilePlus2,
  Home,
  Inbox,
  Layers,
  Layers3,
  Library,
  Lightbulb,
  ListTodo,
  Newspaper,
  Search,
} from 'lucide-react'
import { cn } from '@/lib/cn'

/** Fire the same shortcut the CommandPaletteProvider listens for. Simpler
 *  than plumbing a context provider for a single trigger. */
function openCommandPalette() {
  const isMac = typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform)
  window.dispatchEvent(
    new KeyboardEvent('keydown', {
      key: 'k',
      metaKey: isMac,
      ctrlKey: !isMac,
      bubbles: true,
    }),
  )
}

export interface SidebarSection {
  title: string
  items: Array<{ href: string; label: string; icon: LucideIcon; badge?: number }>
}

const HOME_ITEM = { href: '/dashboard', label: 'Home', icon: Home }

const EXPLORE: SidebarSection = {
  title: 'Explore',
  items: [
    { href: '/dashboard/brainstorm', label: 'Brainstorm', icon: Lightbulb },
    { href: '/dashboard/research', label: 'Research', icon: Library },
    { href: '/dashboard/pulse', label: 'Pulse', icon: Newspaper },
    { href: '/dashboard/sectors', label: 'Sectors', icon: Layers },
    { href: '/dashboard/calculator', label: 'Calculator', icon: Calculator },
  ],
}

const WORKSPACE: SidebarSection = {
  title: 'My workspace',
  items: [
    { href: '/dashboard/canvas', label: 'Canvas', icon: Layers3 },
    { href: '/dashboard/checklist', label: 'Checklists', icon: ListTodo },
    { href: '/dashboard/reports', label: 'Reports', icon: FileBarChart },
    { href: '/dashboard/request-data', label: 'Request a doc', icon: FilePlus2 },
    { href: '/dashboard/requests', label: 'My requests', icon: Inbox },
  ],
}

/**
 * Dashboard sidebar. Client component so we can highlight the active route
 * via usePathname and open the command palette from the search input.
 */
export function SidebarNav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-1 flex-col gap-5 overflow-y-auto p-3 pb-6">
      {/* Search — opens command palette. Trigger, not a real input, so the
          keyboard shortcut UX is consistent with the rest of the app. */}
      <button
        type="button"
        onClick={openCommandPalette}
        className="flex w-full items-center gap-2 rounded-md border border-border/60 bg-bg/50 px-3 py-2 text-left text-xs text-ink-faint transition-colors hover:border-brand/40 hover:text-ink"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="flex-1">Search sectors, tools…</span>
        <kbd className="hidden rounded border border-border/70 bg-surface px-1.5 py-0.5 font-mono text-[10px] text-ink-faint md:inline-block">
          ⌘ K
        </kbd>
      </button>

      <div className="space-y-0.5">
        <SidebarItem href={HOME_ITEM.href} label={HOME_ITEM.label} icon={HOME_ITEM.icon} active={isActive(pathname, HOME_ITEM.href)} />
      </div>

      <Section section={EXPLORE} pathname={pathname} />
      <Section section={WORKSPACE} pathname={pathname} />
    </nav>
  )
}

function Section({ section, pathname }: { section: SidebarSection; pathname: string }) {
  return (
    <div>
      <p className="mb-1 px-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
        {section.title}
      </p>
      <div className="space-y-0.5">
        {section.items.map((item) => (
          <SidebarItem
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            active={isActive(pathname, item.href)}
            badge={item.badge}
          />
        ))}
      </div>
    </div>
  )
}

function SidebarItem({
  href,
  label,
  icon: Icon,
  active,
  badge,
}: {
  href: string
  label: string
  icon: LucideIcon
  active: boolean
  badge?: number
}) {
  return (
    <Link
      href={href}
      className={cn(
        'group flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors',
        active
          ? 'bg-surface-2 text-ink shadow-[inset_0_0_0_1px_rgb(var(--border-strong))]'
          : 'text-ink-muted hover:bg-surface-2/70 hover:text-ink',
      )}
      aria-current={active ? 'page' : undefined}
    >
      <Icon
        className={cn(
          'h-4 w-4 shrink-0',
          active ? 'text-brand' : 'text-ink-faint group-hover:text-ink-muted',
        )}
      />
      <span className="flex-1 truncate">{label}</span>
      {badge && badge > 0 ? (
        <span className="rounded-full bg-brand/15 px-1.5 py-0.5 font-mono text-[10px] text-brand">
          {badge}
        </span>
      ) : null}
    </Link>
  )
}

/**
 * A path is "active" when it exactly matches or is a subpath (except for the
 * root /dashboard which should only match its own exact path, otherwise it
 * would light up on every sub-route).
 */
function isActive(pathname: string, href: string): boolean {
  if (href === '/dashboard') return pathname === '/dashboard'
  return pathname === href || pathname.startsWith(href + '/')
}
