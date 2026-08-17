import type { Metadata } from 'next'
import { Badge } from '@/components/ui/badge'
import { GridBackdrop } from '@/components/marketing/grid-backdrop'
import { FxWidget } from '@/components/fx/fx-widget'
import { CalculatorClient } from './calculator-client'

export const metadata: Metadata = {
  title: 'Business setup cost calculator',
  description:
    'Estimate total cost to open a business in Bishoftu or anywhere in Ethiopia — sector, business type, employees, capital, currency.',
}

interface PageProps {
  searchParams: Promise<{ sector?: string }>
}

export default async function CalculatorPage({ searchParams }: PageProps) {
  const { sector } = await searchParams
  return (
    <div>
      <section className="relative overflow-hidden border-b border-border">
        <GridBackdrop />
        <div className="container-page py-16">
          <Badge variant="brand" className="mb-4 inline-flex">
            Cost calculator
          </Badge>
          <h1 className="text-balance text-4xl font-semibold tracking-crisp sm:text-5xl">
            What will it actually cost?{' '}
            <span className="text-ink-muted">Down to the birr.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-pretty text-ink-muted">
            Move the sliders. See your end-to-end setup cost — government fees, professional
            services, capital requirement floor, and contingency — recompute in real time.
          </p>
          <div className="mt-8 max-w-2xl">
            <FxWidget />
          </div>
        </div>
      </section>
      <section className="container-page py-10">
        <CalculatorClient initialSectorSlug={sector ?? null} />
      </section>
    </div>
  )
}
