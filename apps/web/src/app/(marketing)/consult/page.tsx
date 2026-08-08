import type { Metadata } from 'next'
import { Check, Mail, MessageCircle, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { GridBackdrop } from '@/components/marketing/grid-backdrop'
import { CONSULT_EMAIL, CONSULT_TELEGRAM } from '@/lib/flags'
import { ConsultForm } from './consult-form'

export const metadata: Metadata = {
  title: 'Book a consult',
  description:
    'Talk it through — sector selection, business model sanity check, warm intros. One-off consult, no subscription.',
}

export default function ConsultPage() {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-border">
        <GridBackdrop />
        <div className="container-page py-16 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="brand" className="mb-5 inline-flex">
              <Sparkles className="h-3 w-3" /> Book a consult
            </Badge>
            <h1 className="text-balance text-4xl font-semibold tracking-crisp sm:text-5xl lg:text-6xl">
              Have a business idea?{' '}
              <span className="text-ink-muted">Let&apos;s talk it through.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-pretty text-base sm:text-lg text-ink-muted">
              Sector selection, entity type, licensing route, warm intros to the right ministry or
              partner. One-off consult, no subscription — the guides on this site stay free either
              way.
            </p>
          </div>
        </div>
      </section>

      <section className="container-page py-14 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-5 lg:items-start">
          <div className="space-y-4 lg:col-span-2">
            <Card className="p-6">
              <p className="text-xs uppercase tracking-wider text-brand">Fastest reply</p>
              <h2 className="mt-2 text-lg font-semibold tracking-tightish">Message on Telegram</h2>
              <p className="mt-2 text-sm text-ink-muted">
                Usually the quickest way — voice notes, screenshots, and back-and-forth in the same
                thread.
              </p>
              <Button asChild className="mt-4 w-full">
                <a href={CONSULT_TELEGRAM} target="_blank" rel="noreferrer">
                  <MessageCircle className="h-4 w-4" /> Open Telegram
                </a>
              </Button>
            </Card>

            <Card className="p-6">
              <p className="text-xs uppercase tracking-wider text-brand">Prefer email</p>
              <h2 className="mt-2 text-lg font-semibold tracking-tightish">Write to us</h2>
              <p className="mt-2 text-sm text-ink-muted">
                Tell us the sector, the city, and where you&apos;re stuck. Replies in a day or two.
              </p>
              <Button asChild variant="secondary" className="mt-4 w-full">
                <a href={`mailto:${CONSULT_EMAIL}`}>
                  <Mail className="h-4 w-4" /> {CONSULT_EMAIL}
                </a>
              </Button>
            </Card>

            <Card className="p-6">
              <p className="text-xs uppercase tracking-wider text-brand">What we help with</p>
              <ul className="mt-3 space-y-2 text-sm text-ink-muted">
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                  Picking the right MOR sector code (design vs. software vs. consulting, etc.)
                </li>
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                  Entity type — sole prop, PLC, or branch of a foreign company
                </li>
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                  Which ministry approvals you actually need, in what order
                </li>
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                  Warm intros to legal, accounting, IT, and logistics partners in Bishoftu
                </li>
              </ul>
            </Card>
          </div>

          <Card className="p-6 sm:p-8 lg:col-span-3">
            <ConsultForm />
          </Card>
        </div>
      </section>
    </div>
  )
}
