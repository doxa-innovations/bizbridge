'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { LucideIcon } from 'lucide-react'
import { FileBarChart, Home, Library, Lightbulb, Newspaper } from 'lucide-react'
import { cn } from '@/lib/cn'

interface Tab {
  href: string
  label: string
  icon: LucideIcon
}

// Tabs live in this client file — icon components are React refs and can't
// be passed as props across a server→client boundary without triggering
// "Only plain objects can be passed to Client Components…". Keeping the
// list here also means the layout doesn't need to import the icons at all.
const TABS: Tab[] = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/dashboard/brainstorm', label: 'Brainstorm', icon: Lightbulb },
  { href: '/dashboard/research', label: 'Research', icon: Library },
  { href: '/dashboard/pulse', label: 'Pulse', icon: Newspaper },
  { href: '/dashboard/reports', label: 'Reports', icon: FileBarChart },
]

export function MobileBottomNav() {
  const pathname = usePathname()
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-5 border-t border-border bg-surface/95 backdrop-blur-md lg:hidden">
      {TABS.map((item) => {
        const active = isActive(pathname, item.href)
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] transition-colors',
              active ? 'text-brand' : 'text-ink-muted hover:text-ink',
            )}
            aria-current={active ? 'page' : undefined}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

function isActive(pathname: string, href: string): boolean {
  if (href === '/dashboard') return pathname === '/dashboard'
  return pathname === href || pathname.startsWith(href + '/')
}
