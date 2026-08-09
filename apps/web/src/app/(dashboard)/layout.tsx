import Link from 'next/link'
import {
  Calculator,
  CheckSquare,
  Compass,
  FileSearch,
  FileText,
  Home,
  LayoutDashboard,
  ListChecks,
  Newspaper,
  Package,
  ReceiptText,
  Sparkles,
  Squircle,
} from 'lucide-react'
import { CommandPaletteProvider } from '@/components/command-palette/command-palette'
import { CommandTrigger } from '@/components/command-palette/command-trigger'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { requireUser } from '@/lib/require-user'
import { AccountMenu } from './account-menu'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const EXPLORE_NAV: NavItem[] = [
  { href: '/dashboard/brainstorm', label: 'Brainstorm', icon: Sparkles },
  { href: '/dashboard/research', label: 'Research', icon: Compass },
  { href: '/dashboard/pulse', label: 'Pulse', icon: Newspaper },
  { href: '/sectors', label: 'Sectors', icon: ListChecks },
  { href: '/calculator', label: 'Calculator', icon: Calculator },
]

const WORKSPACE_NAV: NavItem[] = [
  { href: '/checklist', label: 'Checklists', icon: CheckSquare },
  { href: '/dashboard/reports', label: 'Reports', icon: FileText },
  { href: '/dashboard/request-data', label: 'Request a doc', icon: FileSearch },
  { href: '/dashboard/requests', label: 'Requests', icon: ReceiptText },
]

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Onboarding gate is enforced inside each page via requireUser() with the
  // right skipOnboardingGate flag — the layout only checks that a user is
  // authenticated so /dashboard/onboarding can render for pre-onboarded
  // users without a redirect loop.
  const user = await requireUser({ skipOnboardingGate: true })

  return (
    <CommandPaletteProvider>
      <div className="flex min-h-screen bg-bg">
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-surface lg:flex">
          <div className="border-b border-border p-5">
            <Link
              href="/"
              className="flex items-center gap-2 font-semibold tracking-tightish"
            >
              <span className="grid h-7 w-7 place-items-center rounded-md bg-gradient-to-br from-brand to-brand-strong text-brand-foreground text-sm">
                B
              </span>
              BizBridge
            </Link>
          </div>

          <nav className="flex-1 space-y-4 overflow-y-auto p-3 text-sm">
            <SidebarItem href="/dashboard" label="Home" icon={LayoutDashboard} />

            <SidebarGroup title="Explore" items={EXPLORE_NAV} />
            <SidebarGroup title="My workspace" items={WORKSPACE_NAV} />
          </nav>

          <div className="border-t border-border p-3">
            <AccountMenu user={{ id: user.id, email: user.email, name: user.name ?? user.fullName ?? null }} />
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-bg/80 px-6 backdrop-blur-md">
            <Link href="/" className="lg:hidden flex items-center gap-2 text-sm font-semibold">
              <Squircle className="h-4 w-4" /> BizBridge
            </Link>
            <CommandTrigger className="hidden md:inline-flex" />
            <div className="ml-auto flex items-center gap-2">
              <ThemeToggle />
              <Link
                href="/"
                className="hidden md:inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-surface px-3 py-1.5 text-xs text-ink-muted hover:text-ink"
              >
                <Home className="h-3.5 w-3.5" /> Site
              </Link>
            </div>
          </header>
          <div className="px-6 py-8 lg:px-10">{children}</div>

          {/* Mobile bottom nav — Home, Brainstorm, Research, Pulse, Reports */}
          <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 grid grid-cols-5 border-t border-border bg-surface/95 backdrop-blur-md">
            <BottomNavItem href="/dashboard" label="Home" icon={LayoutDashboard} />
            <BottomNavItem href="/dashboard/brainstorm" label="Brainstorm" icon={Sparkles} />
            <BottomNavItem href="/dashboard/research" label="Research" icon={Compass} />
            <BottomNavItem href="/dashboard/pulse" label="Pulse" icon={Newspaper} />
            <BottomNavItem href="/dashboard/reports" label="Reports" icon={Package} />
          </nav>
          {/* Spacer so content isn't hidden behind the bottom nav on mobile */}
          <div className="h-14 lg:hidden" />
        </main>
      </div>
    </CommandPaletteProvider>
  )
}

function SidebarGroup({ title, items }: { title: string; items: NavItem[] }) {
  return (
    <div>
      <p className="mb-1 px-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
        {title}
      </p>
      <div className="space-y-0.5">
        {items.map((item) => (
          <SidebarItem key={item.href} {...item} />
        ))}
      </div>
    </div>
  )
}

function SidebarItem({ href, label, icon: Icon }: NavItem) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  )
}

function BottomNavItem({ href, label, icon: Icon }: NavItem) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] text-ink-muted hover:text-ink"
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  )
}
