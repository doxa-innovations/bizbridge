import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowUpRight, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { GridBackdrop } from '@/components/marketing/grid-backdrop'
import { VerifyClient } from './verify-client'

export const metadata: Metadata = {
  title: 'Verify an Ethiopian business — TIN + trade license',
  description:
    'Before you sign a contract or wire a deposit, verify the other side. Paste a TIN or trade license number and jump straight to the Ministry of Trade eTrade portal and other official checkers.',
}

export const revalidate = 3600

const OFFICIAL_PORTALS = [
  {
    name: 'MoTRI eTrade — Online Trade Registration & License',
    url: 'https://etrade.gov.et',
    what: 'The canonical registry for every commercial trade license issued in Ethiopia. Requires a free eTrade account to run a search.',
    covers: 'Trade license, commercial registration, principal registration number, license status (active/suspended/revoked).',
  },
  {
    name: 'Ethiopian Investment Commission',
    url: 'https://investethiopia.gov.et',
    what: 'For foreign-owned businesses and joint ventures — verifies EIC investment permits and paid-up capital compliance.',
    covers: 'Investment permit, sector eligibility, minimum capital threshold, tax-holiday standing.',
  },
  {
    name: 'MoR / ERCA — Taxpayer status',
    url: 'https://mor.gov.et',
    what: 'Ministry of Revenue. TIN validity and taxpayer compliance status. Some checks are branch-only; call 8199 (MoR contact center) for phone verification.',
    covers: 'TIN validity, VAT registration status, category A/B/C classification.',
  },
  {
    name: 'Addis Chamber member directory',
    url: 'https://tradedirectory.addischamber.com',
    what: 'Member-directory search for Addis Ababa Chamber of Commerce & Sectoral Associations. Not a compliance check — useful for confirming a business claims real membership.',
    covers: 'AACCSA membership, sector, contact details.',
  },
] as const

export default function VerifyPage() {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-border">
        <GridBackdrop />
        <div className="container-page py-20">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="brand" className="mb-4 inline-flex">
              <ShieldCheck className="h-3 w-3" /> Free utility
            </Badge>
            <h1 className="text-balance text-5xl font-semibold tracking-crisp sm:text-6xl">
              Verify before you sign.
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-pretty text-ink-muted">
              Paste an Ethiopian TIN or trade license number to jump straight into the
              official Ministry of Trade portal — plus a checklist of what a real
              certificate should show.
            </p>
          </div>
          <div className="mx-auto mt-12 max-w-2xl">
            <VerifyClient />
          </div>
        </div>
      </section>

      <section className="container-page py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-xl font-semibold tracking-tightish">
            Where to actually check
          </h2>
          <p className="mt-2 text-sm text-ink-muted">
            BizBridge does not verify companies itself. These are the official Ethiopian
            portals that do — bookmark them.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {OFFICIAL_PORTALS.map((p) => (
              <Card key={p.url} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold tracking-tightish text-ink">
                      {p.name}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-muted">{p.what}</p>
                    <p className="mt-3 text-xs leading-relaxed text-ink-faint">
                      <span className="font-medium text-ink-muted">Confirms:</span>{' '}
                      {p.covers}
                    </p>
                  </div>
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 rounded-md border border-border p-2 text-ink-muted hover:border-brand/40 hover:text-ink"
                    aria-label={`Open ${p.name}`}
                  >
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page pb-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-xl font-semibold tracking-tightish">
            What a legitimate trade license shows
          </h2>
          <div className="mt-6 grid gap-3 text-sm md:grid-cols-2">
            <Fact
              k="Principal registration number"
              v="8-digit unique ID assigned at commercial registration. Independent of the trade license number."
            />
            <Fact
              k="Trade license number"
              v="Issued per licensed activity. One legal entity can hold multiple trade licenses for different MOR sectors."
            />
            <Fact
              k="TIN"
              v="10-digit Taxpayer Identification Number from MoR. Must appear on all invoices and VAT receipts."
            />
            <Fact
              k="Business name"
              v="Trade name in Amharic and (usually) English. Must match the commercial registration exactly."
            />
            <Fact
              k="Licensed activity"
              v="Text of the MOR 5-digit sector code the business is permitted to operate under. Activity outside this scope is not covered."
            />
            <Fact
              k="Issuing authority"
              v="MoTRI (federal), regional trade bureau, or city administration. Check the seal matches the issuer named on the license."
            />
            <Fact
              k="Issue + renewal dates"
              v="Trade licenses require annual renewal — an expired license means the business is trading illegally."
            />
            <Fact
              k="Paid-up capital"
              v="For foreign-invested companies, the EIC-registered minimum. Must be visibly stamped and matches wire-transfer records at the bank."
            />
          </div>
          <p className="mt-6 rounded-lg border border-dashed border-border bg-surface/60 p-4 text-xs leading-relaxed text-ink-muted">
            If any of these fields are missing, blurred, or don&apos;t match across the
            trade license, the commercial registration certificate, and the TIN
            certificate — treat it as a red flag and verify via eTrade or a lawyer
            before you sign or send money.{' '}
            <Link href="/consult" className="text-brand hover:underline">
              Book a consult
            </Link>{' '}
            if you need help reading a certificate.
          </p>
        </div>
      </section>
    </div>
  )
}

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">{k}</p>
      <p className="mt-1.5 text-sm leading-snug text-ink-muted">{v}</p>
    </div>
  )
}
