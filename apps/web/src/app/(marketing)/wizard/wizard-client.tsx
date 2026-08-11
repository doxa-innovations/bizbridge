'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, RotateCcw, Target } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

type City = 'bishoftu' | 'addis' | 'other-oromia' | 'other-ethiopia'
type Capital = 'under_50k' | '50_500k' | '500k_5m' | 'over_5m'
type Audience = 'local' | 'tourism' | 'export' | 'b2b'
type Intensity = 'service' | 'mixed' | 'manufacturing' | 'agri'

interface Answers {
  city?: City
  capital?: Capital
  audience?: Audience
  intensity?: Intensity
}

// Suggested sectors per intensity × audience combination — uses real MOR codes.
const SUGGESTIONS: Record<
  string,
  Array<{ mor: string; name: string; why: string }>
> = {
  'service-tourism': [
    { mor: '64116', name: 'Lodge service', why: 'Bishoftu lakes + airport build = lodging demand surge' },
    { mor: '64114', name: 'Restaurant service', why: 'Lowest capital intensity in F&B' },
    { mor: '72111', name: 'Tour operation services', why: 'Domestic + inbound tourism both expanding' },
  ],
  'service-local': [
    { mor: '94111', name: 'Hairdressing — men', why: 'Recurring revenue, low capital, fits any neighborhood' },
    { mor: '95111', name: 'Funeral execution & related', why: 'Stable demand, regulated, underrated margins' },
    { mor: '95114', name: 'Tailoring service', why: 'Mobile-friendly, low overhead, strong word-of-mouth' },
  ],
  'service-b2b': [
    { mor: '86811', name: 'Advertising consultancy', why: 'SME demand is growing across Oromia' },
    { mor: '85211', name: 'Authorized accountant', why: 'High barrier, recurring revenue, audit cycle' },
    { mor: '86114', name: 'Economic / business consultancy', why: 'SME advisory demand rising in Bishoftu + Addis' },
  ],
  'mixed-tourism': [
    { mor: '64111', name: 'Star hotel service', why: 'Capital-heavy but airport-anchored long-term' },
    { mor: '64113', name: 'Star restaurant service', why: 'Premium positioning, higher AOV' },
    { mor: '93211', name: 'Sports & recreation activities', why: 'Lake activities, paddleboard, e-bike rental' },
  ],
  'mixed-local': [
    { mor: '62113', name: 'Supermarket', why: 'Higher capital but defensible, sticky customers' },
    { mor: '64115', name: 'Motel service', why: 'Bishoftu transit traffic, lower capital than star hotel' },
    { mor: '64118', name: 'Cafe & breakfast service', why: 'Day-part flexibility, low burn' },
  ],
  'mixed-export': [
    { mor: '66141', name: 'Export of processed coffee', why: 'Coffee belt accessibility from Bishoftu' },
    { mor: '66322', name: 'Export of leather products', why: 'Modjo leather city is next door' },
    { mor: '66215', name: 'Export of animal feeds', why: 'Underdeveloped export line, growing demand' },
  ],
  'manufacturing-export': [
    { mor: '33214', name: 'Footwear manufacturing', why: 'Leather city adjacency, export incentives' },
    { mor: '31121', name: 'Bakery products', why: 'Domestic + airport catering demand' },
    { mor: '36412', name: 'Structural metal products', why: 'Airport build + construction supply pipeline' },
  ],
  'manufacturing-local': [
    { mor: '31115', name: 'Manufacture of dairy products', why: 'Bishoftu dairy basin, urban consumer demand' },
    { mor: '31121', name: 'Manufacture of bakery products', why: 'Lowest barrier to F&B manufacturing' },
    { mor: '36213', name: 'Concrete / cement articles', why: 'Local construction supply' },
  ],
  'agri-local': [
    { mor: '11121', name: 'Cattle & pack animal husbandry', why: 'Bishoftu dairy basin proven model' },
    { mor: '11122', name: 'Poultry farming', why: 'Fast capital recovery, urban demand' },
    { mor: '11118', name: 'Vegetable & fruit production', why: 'Greenhouse + airport export proximity' },
  ],
  'agri-export': [
    { mor: '11117', name: 'Floriculture', why: 'Established Ethiopian export, near-airport advantage' },
    { mor: '66141', name: 'Coffee export', why: 'Premium Bishoftu-roast positioning' },
    { mor: '11123', name: 'Beekeeping', why: 'Honey export rising, low capital' },
  ],
}

const QUESTIONS = [
  {
    key: 'city' as const,
    prompt: 'Where are you opening?',
    options: [
      { value: 'bishoftu' as City, label: 'Bishoftu / Debrezeit' },
      { value: 'other-oromia' as City, label: 'Other Oromia city' },
      { value: 'addis' as City, label: 'Addis Ababa' },
      { value: 'other-ethiopia' as City, label: 'Other Ethiopia' },
    ],
  },
  {
    key: 'capital' as const,
    prompt: 'How much capital do you have to start with?',
    options: [
      { value: 'under_50k' as Capital, label: 'Under ETB 50k (~$900)' },
      { value: '50_500k' as Capital, label: 'ETB 50k – 500k' },
      { value: '500k_5m' as Capital, label: 'ETB 500k – 5M' },
      { value: 'over_5m' as Capital, label: 'Over ETB 5M' },
    ],
  },
  {
    key: 'audience' as const,
    prompt: 'Who are you selling to?',
    options: [
      { value: 'local' as Audience, label: 'Local community in your city' },
      { value: 'tourism' as Audience, label: 'Visitors & tourism' },
      { value: 'b2b' as Audience, label: 'Other businesses' },
      { value: 'export' as Audience, label: 'Export / outside Ethiopia' },
    ],
  },
  {
    key: 'intensity' as const,
    prompt: 'What type of work appeals most?',
    options: [
      { value: 'service' as Intensity, label: 'Service business (low overhead)' },
      { value: 'mixed' as Intensity, label: 'Mixed — physical space + service' },
      { value: 'manufacturing' as Intensity, label: 'Manufacturing / production' },
      { value: 'agri' as Intensity, label: 'Agriculture / agribusiness' },
    ],
  },
]

export function WizardClient() {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Answers>({})

  const total = QUESTIONS.length
  const progress = Math.round((Math.min(step, total) / total) * 100)
  const isComplete = step >= total

  const suggestions = useMemo(() => {
    if (!isComplete) return null
    const key = `${answers.intensity}-${answers.audience}`
    return SUGGESTIONS[key] ?? SUGGESTIONS['service-local']!
  }, [answers, isComplete])

  const current = QUESTIONS[step]
  const reset = () => {
    setStep(0)
    setAnswers({})
  }

  if (isComplete) {
    return (
      <Card className="p-6 sm:p-10">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-brand">
          <Target className="h-4 w-4" /> Your matches
        </div>
        <h2 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tightish">
          Three sectors worth investigating.
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          Based on your answers — these are the highest-fit licensable sectors. Open any one to
          see the full process, fees, and ministry approvals.
        </p>

        <div className="mt-8 grid gap-3 lg:grid-cols-3">
          {(suggestions ?? []).map((s, i) => (
            <Link
              key={s.mor}
              href={`/sectors?q=${s.mor}`}
              className="group flex flex-col gap-3 rounded-lg border border-border bg-bg p-5 transition-all hover:border-brand/40"
            >
              <div className="flex items-center justify-between">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-brand/15 font-mono text-xs text-brand">
                  {i + 1}
                </span>
                <Badge variant="mono">{s.mor}</Badge>
              </div>
              <h3 className="text-lg font-semibold tracking-tightish text-ink group-hover:text-brand">
                {s.name}
              </h3>
              <p className="text-sm text-ink-muted">{s.why}</p>
              <span className="mt-auto inline-flex items-center gap-1 text-xs font-medium text-brand">
                Open sector <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-ink-muted">
            Not sure which of these fits best? Book a consult — one call, no subscription.
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/consult">
                Book a consult <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="ghost" onClick={reset}>
              <RotateCcw className="h-4 w-4" /> Run again
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6 sm:p-10">
      <div className="flex items-center justify-between text-xs text-ink-faint">
        <span>
          Question {step + 1} of {total}
        </span>
        <span>{progress}%</span>
      </div>
      <Progress value={progress} className="mt-2" />

      <h2 className="mt-8 text-2xl sm:text-3xl font-semibold tracking-tightish">
        {current?.prompt}
      </h2>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {current?.options.map((opt) => (
          <button
            key={String(opt.value)}
            onClick={() => {
              setAnswers((prev) => ({ ...prev, [current.key]: opt.value }))
              setStep((s) => s + 1)
            }}
            className="group flex items-center justify-between gap-3 rounded-lg border border-border bg-bg p-5 text-left transition-all hover:border-brand/40 hover:bg-surface-2"
          >
            <span className="text-ink">{opt.label}</span>
            <ArrowRight className="h-4 w-4 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-brand" />
          </button>
        ))}
      </div>

      {step > 0 ? (
        <div className="mt-8 border-t border-border pt-4">
          <Button variant="ghost" size="sm" onClick={() => setStep((s) => Math.max(0, s - 1))}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </div>
      ) : null}
    </Card>
  )
}
