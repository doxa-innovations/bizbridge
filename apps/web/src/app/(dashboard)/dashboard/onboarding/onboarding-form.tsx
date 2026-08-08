'use client'

import { useState, useTransition } from 'react'
import { ArrowRight, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { GeometricIcon } from '@/components/marketing/geometric-icon'
import { cn } from '@/lib/cn'
import { submitOnboarding } from './actions'

interface CategoryOption {
  id: string | number
  slug: string
  name_en: string
  name_am: string | null
}

interface TierOption {
  key: string
  label: string
  range: string
  vibe: string
  headline: string
}

interface Props {
  categories: CategoryOption[]
  tiers: TierOption[]
  initialLocale: 'en' | 'am'
}

const MAX_INTERESTS = 5

export function OnboardingForm({ categories, tiers, initialLocale }: Props) {
  const [step, setStep] = useState<1 | 2>(1)
  const [selectedCats, setSelectedCats] = useState<string[]>([])
  const [selectedTier, setSelectedTier] = useState<string | null>(null)
  const [locale, setLocale] = useState<'en' | 'am'>(initialLocale)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function toggleCategory(slug: string) {
    setSelectedCats((prev) => {
      if (prev.includes(slug)) return prev.filter((s) => s !== slug)
      if (prev.length >= MAX_INTERESTS) return prev
      return [...prev, slug]
    })
  }

  function handleSubmit(payload: Parameters<typeof submitOnboarding>[0]) {
    setError(null)
    startTransition(async () => {
      try {
        await submitOnboarding(payload)
      } catch (err) {
        setError((err as Error).message ?? 'Something went wrong.')
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* STEP INDICATOR */}
      <div className="flex items-center gap-2 text-xs text-ink-faint">
        <span className={cn('font-mono', step >= 1 && 'text-ink')}>1. Interests</span>
        <span>·</span>
        <span className={cn('font-mono', step >= 2 && 'text-ink')}>2. Budget</span>
      </div>

      {/* STEP 1 — INTERESTS */}
      {step === 1 ? (
        <Card className="p-6 sm:p-8">
          <h2 className="text-xl font-semibold tracking-tightish">
            What areas are you interested in?
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            Pick 1–5. We&apos;ll surface sectors, news and reports in these areas first.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {categories.map((cat) => {
              const active = selectedCats.includes(cat.slug)
              return (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() => toggleCategory(cat.slug)}
                  aria-pressed={active}
                  className={cn(
                    'group flex items-start gap-3 rounded-lg border p-3 text-left transition-all',
                    active
                      ? 'border-brand bg-brand/10 text-ink'
                      : 'border-border/70 bg-surface text-ink-muted hover:border-brand/40 hover:text-ink',
                  )}
                >
                  <GeometricIcon slug={cat.slug} className="h-8 w-8 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-snug">{cat.name_en}</p>
                    {cat.name_am ? (
                      <p className="mt-0.5 truncate font-amharic text-[11px] text-ink-faint">
                        {cat.name_am}
                      </p>
                    ) : null}
                  </div>
                  {active ? <Check className="ml-auto h-4 w-4 shrink-0 text-brand" /> : null}
                </button>
              )
            })}
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
              {selectedCats.length}/{MAX_INTERESTS} selected
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  handleSubmit({
                    interestCategories: [],
                    interestSectors: [],
                    capitalTier: null,
                    skip: true,
                  })
                }
                disabled={isPending}
              >
                Skip for now
              </Button>
              <Button
                onClick={() => setStep(2)}
                disabled={selectedCats.length === 0 || isPending}
              >
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      ) : null}

      {/* STEP 2 — BUDGET */}
      {step === 2 ? (
        <Card className="p-6 sm:p-8">
          <h2 className="text-xl font-semibold tracking-tightish">
            How much can you put in?
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            Pick the range you&apos;re realistically working with. Not a commitment.
          </p>

          <div className="mt-6 grid gap-3">
            {tiers.map((tier) => {
              const active = selectedTier === tier.key
              return (
                <button
                  key={tier.key}
                  type="button"
                  onClick={() => setSelectedTier(tier.key)}
                  aria-pressed={active}
                  className={cn(
                    'flex w-full items-start gap-4 rounded-lg border p-4 text-left transition-all',
                    active
                      ? 'border-brand bg-brand/10'
                      : 'border-border/70 bg-surface hover:border-brand/40',
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-ink">{tier.label}</p>
                      <Badge variant="mono">{tier.range}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-ink-muted">{tier.vibe}</p>
                  </div>
                  {active ? (
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand text-brand-foreground">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  ) : null}
                </button>
              )
            })}

            <button
              type="button"
              onClick={() => setSelectedTier(null)}
              className={cn(
                'w-full rounded-lg border border-dashed p-3 text-sm text-ink-muted transition-colors',
                selectedTier === null
                  ? 'border-brand/60 bg-brand/5 text-ink'
                  : 'border-border/70 hover:text-ink',
              )}
            >
              Not sure yet — take me to the sector suggester.
            </button>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <label className="mr-auto flex items-center gap-2 text-xs text-ink-muted">
              <span>Language:</span>
              <select
                value={locale}
                onChange={(e) => setLocale(e.target.value as 'en' | 'am')}
                className="rounded-md border border-border bg-surface px-2 py-1 text-xs text-ink focus:border-brand focus:outline-none"
              >
                <option value="en">English</option>
                <option value="am">አማርኛ</option>
              </select>
            </label>
            <Button variant="ghost" size="sm" onClick={() => setStep(1)} disabled={isPending}>
              Back
            </Button>
            <Button
              onClick={() =>
                handleSubmit({
                  interestCategories: selectedCats,
                  interestSectors: [],
                  capitalTier: selectedTier,
                  locale,
                })
              }
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                </>
              ) : (
                <>
                  Finish <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </Card>
      ) : null}

      {error ? (
        <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  )
}
