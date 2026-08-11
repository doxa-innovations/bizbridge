import Link from 'next/link'
import { LayoutDashboard, Send } from 'lucide-react'
import { CommandPaletteProvider } from '@/components/command-palette/command-palette'
import { CommandTrigger } from '@/components/command-palette/command-trigger'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { SupportWidget } from '@/components/support-widget'
import { MobileNav } from '@/components/marketing/mobile-nav'
import { NavDropdown } from '@/components/marketing/nav-dropdown'
import { CONSULT_EMAIL, CONSULT_TELEGRAM } from '@/lib/flags'
import { optionalUser } from '@/lib/require-user'

const TOOLS_ITEMS = [
  { href: '/suggest', label: 'Suggest by capital', description: 'Got money, need an idea?' },
  { href: '/wizard', label: 'Sector wizard', description: '5 questions → 3 sector picks' },
  { href: '/calculator', label: 'Cost calculator', description: 'Fees + capital, real ETB & USD' },
  { href: '/checklist', label: 'Setup checklist', description: 'Every step from TIN to trade license' },
  { href: '/compare', label: 'Compare sectors', description: 'Up to 3 side by side' },
  { href: '/lookup', label: 'MOR code lookup', description: 'Find the exact 5-digit code' },
]

const LEARN_ITEMS = [
  { href: '/resources', label: 'Legal resources', description: 'Amharic explainers + official portals' },
  { href: '/bishoftu', label: 'Bishoftu Pulse', description: 'Live city indicators & research' },
  { href: '/reports', label: 'Reports catalog', description: 'Free downloadable market briefs' },
  { href: '/about', label: 'About', description: 'Who runs this' },
]

const HELP_ITEMS = [
  { href: '/consult', label: 'Book a consult', description: '30-min call, one-off, no subscription' },
  { href: '/lawyer', label: 'Talk to a lawyer', description: 'Verified Ethiopian business lawyer' },
  { href: '/partners', label: 'Local partners', description: '6 vetted Bishoftu / Oromia operators' },
  { href: '/services', label: 'eTrade services', description: 'What we can walk you through' },
]

const MOBILE_NAV = [
  { href: '/', label: 'Home' },
  { href: '/sectors', label: 'Sectors' },
  ...TOOLS_ITEMS,
  ...LEARN_ITEMS,
  ...HELP_ITEMS,
]

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const signedInUser = await optionalUser()

  return (
    <CommandPaletteProvider>
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-30 border-b border-border/70 bg-bg/85 backdrop-blur-xl">
          <div className="container-page flex h-14 items-center gap-3">
            <Link
              href={signedInUser ? '/dashboard' : '/'}
              className="group flex items-center gap-2.5 font-mono text-[13px] tracking-tight text-ink"
            >
              <span
                aria-hidden
                className="logo-checker h-4 w-4 rounded-[3px] opacity-90 transition-opacity group-hover:opacity-100"
              />
              <span className="hidden sm:inline">bizbridge.et</span>
            </Link>

            <nav className="ml-6 hidden flex-1 items-center gap-0.5 lg:flex">
              <Link
                href="/sectors"
                className="rounded-md px-2.5 py-1.5 font-mono text-[12px] tracking-tight text-ink-muted transition-colors hover:bg-surface hover:text-ink"
              >
                sectors
              </Link>
              <NavDropdown label="tools" items={TOOLS_ITEMS} />
              <NavDropdown label="learn" items={LEARN_ITEMS} />
              <NavDropdown label="help" items={HELP_ITEMS} />
            </nav>

            <div className="ml-auto flex items-center gap-1.5">
              <CommandTrigger />
              <ThemeToggle />
              {signedInUser ? (
                <>
                  <Link
                    href="/dashboard"
                    className="hidden md:inline-flex items-center gap-1.5 rounded-md bg-brand px-3.5 py-1.5 font-mono text-[12px] text-brand-foreground transition-opacity hover:opacity-90"
                  >
                    <LayoutDashboard className="h-3 w-3" /> dashboard
                  </Link>
                  <Link
                    href="/dashboard/settings"
                    className="hidden font-mono text-[12px] text-ink-muted transition-colors hover:text-ink md:inline-flex px-2"
                    title={signedInUser.email}
                  >
                    {signedInUser.name?.split(' ')[0] ?? signedInUser.email.split('@')[0]}
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="hidden font-mono text-[12px] text-ink-muted transition-colors hover:text-ink md:inline-flex px-2"
                  >
                    log in
                  </Link>
                  <Link
                    href="/signup"
                    className="hidden md:inline-flex items-center gap-1 rounded-md bg-brand px-3.5 py-1.5 font-mono text-[12px] text-brand-foreground transition-opacity hover:opacity-90"
                  >
                    get started
                  </Link>
                </>
              )}
              <MobileNav nav={MOBILE_NAV} className="lg:hidden" />
            </div>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-border/70 bg-bg">
          <div className="container-page py-14">
            <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
              <div className="lg:col-span-2">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2.5 font-mono text-[13px] tracking-tight text-ink"
                >
                  <span aria-hidden className="logo-checker h-4 w-4 rounded-[3px]" />
                  bizbridge.et
                </Link>
                <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-muted">
                  Regulatory intelligence for Ethiopian entrepreneurs — every MOR sector,
                  every fee, every ministry approval. Bilingual (አማርኛ · EN), always free.
                </p>
                <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
                  Bishoftu · Oromia · Ethiopia
                </p>
              </div>

              <FooterColumn
                title="Product"
                links={[
                  { href: '/sectors', label: 'All 519 sectors' },
                  { href: '/services', label: 'eTrade services' },
                  { href: '/lookup', label: 'MOR code lookup' },
                  { href: '/compare', label: 'Compare sectors' },
                  { href: '/calculator', label: 'Cost calculator' },
                  { href: '/checklist', label: 'Setup checklist' },
                  { href: '/wizard', label: 'Sector wizard' },
                  { href: '/reports', label: 'Reports catalog' },
                ]}
              />
              <FooterColumn
                title="Research"
                links={[
                  { href: '/resources', label: 'Legal resources' },
                  { href: '/bishoftu', label: 'Bishoftu Pulse' },
                  { href: '/companies', label: 'Companies in good standing' },
                  { href: '/about', label: 'About' },
                ]}
              />
              <FooterColumn
                title="Help"
                links={[
                  { href: '/consult', label: 'Book a consult' },
                  { href: '/lawyer', label: 'Talk to a lawyer' },
                  { href: CONSULT_TELEGRAM, label: 'Telegram @cherireal7' },
                  { href: `mailto:${CONSULT_EMAIL}`, label: 'cheridemeke777@gmail.com' },
                ]}
              />
            </div>

            <div className="mt-14 border-t border-border/70 pt-6 space-y-4 text-xs text-ink-faint">
              <p className="rounded-lg border border-border/70 bg-surface/60 p-4 font-mono text-[11px] leading-relaxed text-ink-muted">
                <span className="text-ink">Independent civic-tech project.</span> Not affiliated
                with the Government of Ethiopia, MoTRI, MOR, or any official body. Data is
                compiled from public documents and lived experience —{' '}
                <a
                  href="https://etrade.gov.et"
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand hover:underline"
                >
                  verify on eTrade
                </a>{' '}
                or with a licensed lawyer before filing.
              </p>
              <div className="flex flex-col items-start justify-between gap-3 font-mono text-[11px] uppercase tracking-[0.12em] sm:flex-row sm:items-center">
                <p>© {new Date().getFullYear()} · bizbridge.et</p>
                <p className="flex flex-wrap items-center gap-x-4 gap-y-1 normal-case tracking-normal">
                  <a
                    href={CONSULT_TELEGRAM}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 hover:text-ink"
                  >
                    <Send className="h-3 w-3" /> @cherireal7
                  </a>
                  <a
                    href={`mailto:${CONSULT_EMAIL}`}
                    className="hover:text-ink"
                  >
                    {CONSULT_EMAIL}
                  </a>
                </p>
              </div>
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-faint">
                <span>
                  Source: <span className="text-ink-muted">MOR Directive 17/2011</span> · 519 sectors
                </span>
                <span aria-hidden>·</span>
                <span className="normal-case tracking-normal">
                  Built by Cheri at{' '}
                  <a
                    href="https://doxaplc.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-ink-muted hover:text-brand"
                  >
                    Doxa Innovations
                  </a>
                </span>
              </p>
            </div>
          </div>
        </footer>

        <SupportWidget />
      </div>
    </CommandPaletteProvider>
  )
}

function FooterColumn({
  title,
  links,
}: {
  title: string
  links: { href: string; label: string }[]
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">{title}</p>
      <ul className="mt-3 space-y-2 text-sm">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-ink-muted hover:text-ink">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
