import type { Metadata } from 'next'
import { tryPayload } from '@/lib/payload'
import { requireUser } from '@/lib/require-user'
import { CAPITAL_TIERS } from '@/seed/data/capital-suggestions'
import { OnboardingForm } from './onboarding-form'

export const metadata: Metadata = {
  title: 'Set up your dashboard',
  description:
    'Two quick picks: what areas interest you, and roughly how much you have to invest. We tailor everything from here.',
}

export const dynamic = 'force-dynamic'

export default async function OnboardingPage() {
  const user = await requireUser({ skipOnboardingGate: true })

  const categories = await tryPayload(async (payload) => {
    const res = await payload.find({
      collection: 'sector-categories',
      sort: 'sort_order',
      limit: 20,
    })
    return res.docs.map((c) => ({
      id: c.id,
      slug: c.slug,
      name_en: c.name_en,
      name_am: c.name_am ?? null,
    }))
  })

  const tiers = CAPITAL_TIERS.map((t) => ({
    key: t.key,
    label: t.label,
    range: `ETB ${(t.min_etb / 1000).toLocaleString()}k – ${
      t.max_etb >= 1_000_000 ? `${(t.max_etb / 1_000_000).toFixed(0)}M` : `${(t.max_etb / 1000).toFixed(0)}k`
    }`,
    vibe: t.vibe,
    headline: t.headline,
  }))

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
          Welcome{user.fullName ? `, ${user.fullName.split(' ')[0]}` : ''}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-crisp text-ink sm:text-4xl">
          Set up your dashboard.
        </h1>
        <p className="mt-2 max-w-lg text-sm text-ink-muted">
          Two quick picks. We&apos;ll tune the feed, tools and shortlists to what you actually
          care about. You can change these any time.
        </p>
      </div>

      <OnboardingForm
        categories={categories ?? []}
        tiers={tiers}
        initialLocale={user.locale ?? 'en'}
      />
    </div>
  )
}
