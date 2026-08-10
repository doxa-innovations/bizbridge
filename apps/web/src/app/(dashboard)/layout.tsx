import Link from 'next/link'
import { Home } from 'lucide-react'
import { CommandPaletteProvider } from '@/components/command-palette/command-palette'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { requireUser } from '@/lib/require-user'
import { AccountMenu } from './account-menu'
import { SidebarNav } from './sidebar-nav'
import { MobileBottomNav } from './mobile-bottom-nav'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Onboarding gate is enforced inside each page via requireUser() with the
  // right skipOnboardingGate flag — the layout only checks that a user is
  // authenticated so /dashboard/onboarding can render for pre-onboarded
  // users without a redirect loop.
  const user = await requireUser({ skipOnboardingGate: true })

  return (
    <CommandPaletteProvider>
      <div className="flex min-h-screen bg-bg">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-surface lg:flex">
          <div className="flex items-center gap-2 border-b border-border px-4 py-4">
            <Link
              href="/"
              className="group flex items-center gap-2.5 text-sm font-semibold tracking-tightish text-ink"
            >
              <span className="grid h-7 w-7 place-items-center rounded-md bg-gradient-to-br from-brand to-brand-strong text-brand-foreground text-[11px] font-bold shadow-sm">
                B
              </span>
              <span>BizBridge</span>
            </Link>
          </div>

          <SidebarNav />

          <div className="border-t border-border p-3">
            <AccountMenu
              user={{
                id: user.id,
                email: user.email,
                name: user.name ?? user.fullName ?? null,
              }}
            />
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-bg/80 px-6 backdrop-blur-md">
            <Link href="/" className="flex items-center gap-2 text-sm font-semibold lg:hidden">
              <span className="grid h-6 w-6 place-items-center rounded bg-gradient-to-br from-brand to-brand-strong text-[10px] font-bold text-brand-foreground">
                B
              </span>
              BizBridge
            </Link>
            <div className="ml-auto flex items-center gap-2">
              <ThemeToggle />
              <Link
                href="/"
                className="hidden md:inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-surface px-3 py-1.5 text-xs text-ink-muted transition-colors hover:border-brand/40 hover:text-ink"
              >
                <Home className="h-3.5 w-3.5" /> Marketing site
              </Link>
            </div>
          </header>
          <div className="px-6 py-8 lg:px-10">{children}</div>

          <MobileBottomNav />
          {/* Spacer so content isn't hidden behind the bottom nav on mobile */}
          <div className="h-14 lg:hidden" />
        </main>
      </div>
    </CommandPaletteProvider>
  )
}
