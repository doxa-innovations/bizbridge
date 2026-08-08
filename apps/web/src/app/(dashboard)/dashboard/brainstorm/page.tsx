import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, ArrowUpRight, GitCompareArrows, PiggyBank, Sparkles, Wand2 } from 'lucide-react'
import { requireUser } from '@/lib/require-user'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getDashboardConfig } from '@/lib/dashboard-tailoring'

export const metadata: Metadata = { title: 'Brainstorm' }
export const dynamic = 'force-dynamic'

export default async function BrainstormPage() {
  const user = await requireUser()
  const config = getDashboardConfig(user)

  const suggestHref = `/suggest${config.suggestQuery}`

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
          Brainstorm
        </p>
        <h1 className="mt-1.5 text-3xl font-semibold tracking-crisp text-ink sm:text-4xl">
          Not sure what to open? Start here.
        </h1>
        <p className="mt-3 max-w-xl text-sm text-ink-muted">
          Two shortcuts to a sector shortlist: pick by budget, or answer five questions
          about how you want to work. Both take a minute.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="flex flex-col p-6">
          <div className="mb-3 flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-brand/15 text-brand">
              <PiggyBank className="h-4 w-4" />
            </span>
            <p className="text-sm font-semibold text-ink">Start with your budget</p>
          </div>
          <p className="flex-1 text-sm text-ink-muted">
            Slide to how much you can invest — we&apos;ll narrow the 519 MOR sectors to a
            realistic shortlist for that budget in Ethiopia today. ETB-native, from 30k to
            500M.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge variant="mono">ETB 30k → 500M</Badge>
            {user.capitalTier ? <Badge variant="brand">Preset: {user.capitalTier}</Badge> : null}
          </div>
          <div className="mt-4">
            <Button asChild>
              <Link href={suggestHref}>
                Open Suggest <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Card>

        <Card className="flex flex-col p-6">
          <div className="mb-3 flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-brand/15 text-brand">
              <Wand2 className="h-4 w-4" />
            </span>
            <p className="text-sm font-semibold text-ink">Answer 5 questions</p>
          </div>
          <p className="flex-1 text-sm text-ink-muted">
            The wizard asks about your capital, city, time commitment, risk appetite and
            experience. It outputs three sector picks with why each fits.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge variant="mono">~60 seconds</Badge>
            <Badge variant="outline">3 picks</Badge>
          </div>
          <div className="mt-4">
            <Button asChild>
              <Link href="/wizard">
                Open Wizard <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-accent/15 text-accent">
              <GitCompareArrows className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">Compare three sectors side-by-side</p>
              <p className="text-xs text-ink-muted">
                Once you have a shortlist, run them through Compare — fees, approvals,
                certificates, setup steps stacked in one view.
              </p>
            </div>
          </div>
          <Button asChild size="sm" variant="secondary">
            <Link href="/compare">
              Open Compare <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </Card>

      <Card className="border-dashed p-6">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-brand/15 text-brand">
            <Sparkles className="h-4 w-4" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-ink">Stuck between two ideas?</p>
            <p className="mt-1 text-xs text-ink-muted">
              Book a 30-minute consult and we&apos;ll pressure-test both against the current
              regulatory + capital reality in Ethiopia.
            </p>
          </div>
          <Button asChild size="sm" variant="ghost">
            <Link href="/consult">
              Book a consult <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  )
}
