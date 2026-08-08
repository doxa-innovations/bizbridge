import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import {
  ArrowRight,
  Calculator,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  Landmark,
  ListChecks,
  ScrollText,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { tryPayload, getPayloadClient } from '@/lib/payload'
import { humanizeSectorName } from '@/lib/humanize-sector-name'
import { getCurrentUser } from '@/lib/auth-server'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { GeometricIcon } from '@/components/marketing/geometric-icon'
import { StatCard } from '@/components/marketing/stat-card'
import { Skeleton } from '@/components/ui/skeleton'
import { BookmarkButton } from '@/components/sectors/bookmark-button'

export const revalidate = 3600
export const dynamicParams = true

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const data = await tryPayload(async (payload) => {
    const res = await payload.find({
      collection: 'business-sectors',
      where: { is_active: { equals: true } },
      limit: 1000,
      depth: 0,
    })
    return res.docs.map((s) => ({ slug: s.slug }))
  })
  return data ?? []
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const sector = await tryPayload(async (payload) => {
    const res = await payload.find({
      collection: 'business-sectors',
      where: { slug: { equals: slug } },
      limit: 1,
    })
    return res.docs[0] ?? null
  })
  if (!sector) return { title: 'Sector not found' }
  const cleanName = humanizeSectorName(sector.mor_code, sector.name_en)
  return {
    title: `${cleanName} · MOR ${sector.mor_code}`,
    description:
      sector.description_short ??
      `Complete setup guide for ${cleanName} in Ethiopia. MOR code ${sector.mor_code}.`,
  }
}

async function fetchSectorHead(slug: string) {
  return tryPayload(async (payload) => {
    const res = await payload.find({
      collection: 'business-sectors',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 1,
    })
    return res.docs[0] ?? null
  })
}

export default async function SectorDetailPage({ params }: PageProps) {
  const { slug } = await params

  const [sector, currentUser] = await Promise.all([fetchSectorHead(slug), getCurrentUser()])

  if (!sector) {
    try {
      const payload = await getPayloadClient()
      const res = await payload.find({
        collection: 'business-sectors',
        where: { slug: { equals: slug } },
        limit: 1,
      })
      if (res.docs.length === 0) notFound()
    } catch {
      return (
        <div className="container-page py-20">
          <h1 className="text-3xl font-semibold tracking-tightish">{slug}</h1>
          <p className="mt-3 text-ink-muted">Configure the database to view this sector.</p>
        </div>
      )
    }
    notFound()
  }

  const category = typeof sector.category === 'object' && sector.category ? sector.category : null
  const categoryId =
    typeof sector.category === 'object' && sector.category ? sector.category.id : sector.category

  // Check whether this signed-in user has already bookmarked the sector.
  let alreadySaved = false
  if (currentUser) {
    try {
      const payload = await getPayloadClient()
      const res = await payload.find({
        collection: 'saved-sectors',
        where: {
          and: [
            { user_id: { equals: currentUser.id } },
            { sector: { equals: sector.id } },
          ],
        },
        limit: 1,
        overrideAccess: true,
      })
      alreadySaved = res.docs.length > 0
    } catch {
      // Non-fatal — button just defaults to unsaved.
    }
  }

  return (
    <article>
      {/* HERO — renders instantly from the sector doc alone */}
      <section className="border-b border-border bg-surface">
        <div className="container-page py-10">
          <nav
            className="flex items-center gap-1.5 text-xs text-ink-faint"
            aria-label="Breadcrumb"
          >
            <Link href="/sectors" className="hover:text-ink">
              Sectors
            </Link>
            <ChevronRight className="h-3 w-3" />
            {category ? (
              <Link
                href={`/sectors?category=${category.slug}`}
                className="hover:text-ink"
              >
                {category.name_en}
              </Link>
            ) : null}
            <ChevronRight className="h-3 w-3" />
            <span className="font-mono text-ink-muted">{sector.mor_code}</span>
          </nav>

          <div className="mt-6 flex items-start gap-5">
            {category ? <GeometricIcon slug={category.slug} className="h-14 w-14" /> : null}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="mono">MOR {sector.mor_code}</Badge>
                {category ? <Badge variant="default">{category.name_en}</Badge> : null}
                {sector.is_featured ? <Badge variant="accent">Featured</Badge> : null}
              </div>
              <h1 className="mt-3 text-balance text-3xl font-semibold tracking-crisp leading-tight text-ink sm:text-4xl">
                {humanizeSectorName(sector.mor_code, sector.name_en)}
              </h1>
              {sector.name_am ? (
                <p className="mt-1 font-amharic text-base text-ink-muted">{sector.name_am}</p>
              ) : null}
              {sector.description_short ? (
                <p className="mt-4 max-w-3xl text-pretty text-ink-muted">
                  {sector.description_short}
                </p>
              ) : null}

              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <a href={`https://etrade.gov.et`} target="_blank" rel="noreferrer">
                    <Landmark className="h-4 w-4" /> Reserve name on eTrade{' '}
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
                <Button asChild variant="secondary">
                  <Link href={`/checklist?sector=${sector.slug}`}>
                    Setup checklist <ListChecks className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="ghost">
                  <Link href={`/calculator?sector=${sector.slug}`}>
                    Estimate costs <Calculator className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="ghost">
                  <Link href={`/compare?add=${sector.slug}`}>Compare</Link>
                </Button>
                <BookmarkButton
                  sectorId={sector.id}
                  initialSaved={alreadySaved}
                  guest={!currentUser}
                  returnTo={`/sectors/${sector.slug}`}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PERMITTED OPERATIONS — also renders instantly (data is on the sector doc) */}
      {Array.isArray(sector.permitted_operations_am) &&
      sector.permitted_operations_am.length > 0 ? (
        <section className="container-page pt-10">
          <PermittedOperations
            operationsAm={sector.permitted_operations_am}
            operationsEn={
              Array.isArray(sector.permitted_operations_en)
                ? sector.permitted_operations_en
                : []
            }
            legacyCodes={
              Array.isArray(sector.legacy_codes) ? sector.legacy_codes : []
            }
          />
        </section>
      ) : null}

      {/* EVERYTHING ELSE — streams in via Suspense so the shell above renders fast */}
      <Suspense fallback={<SectorSectionsSkeleton />}>
        <SectorSections
          sectorId={sector.id}
          sectorSlug={sector.slug}
          categoryId={categoryId as string | number | null}
          hasPermittedOps={
            Array.isArray(sector.permitted_operations_am) &&
            sector.permitted_operations_am.length > 0
          }
        />
      </Suspense>
    </article>
  )
}

/** Renders the permitted-operations card block. Pure server component, no data fetch. */
function PermittedOperations({
  operationsAm,
  operationsEn,
  legacyCodes,
}: {
  operationsAm: Array<{ id?: string | number | null; text?: string | null }>
  operationsEn: Array<{ id?: string | number | null; text?: string | null }>
  legacyCodes: Array<{ code?: string | null }>
}) {
  const hasEn = operationsEn.some((o) => o?.text && o.text.length > 0)
  return (
    <SectorSection
      id="operations"
      icon={<ShieldCheck />}
      title="Permitted operations under this license"
    >
      <p className="mb-4 text-sm text-ink-muted">
        What a licence holder in this sector is allowed to do — source:{' '}
        <span className="font-mono text-[12px]">MoR Directive 17/2011 Explanation Manual</span>.
        Amharic is the primary source of truth.
      </p>
      {!hasEn ? (
        <p className="mb-4 rounded-lg border border-dashed border-border/70 bg-surface/40 p-3 font-mono text-[11px] text-ink-muted">
          English translation pending for this sector.{' '}
          <Link href="/consult" className="text-brand hover:underline">
            Contribute a translation →
          </Link>
        </p>
      ) : null}
      <div className="grid gap-3">
        {operationsAm.map((op, i) => {
          const enOp = operationsEn[i]
          return (
            <Card key={op.id ?? i} className="p-5">
              <div className="flex items-start gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-brand/40 bg-brand/10 font-mono text-[10px] text-brand">
                  {i + 1}
                </span>
                <div className="flex-1 space-y-3">
                  <p className="font-amharic text-[15px] leading-relaxed text-ink">{op.text}</p>
                  {enOp?.text ? (
                    <p className="border-t border-border pt-3 text-sm leading-relaxed text-ink-muted">
                      {enOp.text}
                    </p>
                  ) : null}
                </div>
              </div>
            </Card>
          )
        })}
      </div>
      {legacyCodes.length > 0 ? (
        <p className="mt-4 font-mono text-[11px] text-ink-faint">
          <span className="uppercase tracking-[0.14em]">Legacy codes:</span>{' '}
          <span>{legacyCodes.map((c) => c.code).join(', ')}</span>
        </p>
      ) : null}
    </SectorSection>
  )
}

/** Streamed block: stats + sections + sidebar + related. */
async function SectorSections({
  sectorId,
  sectorSlug,
  categoryId,
  hasPermittedOps,
}: {
  sectorId: string | number
  sectorSlug: string
  categoryId: string | number | null
  hasPermittedOps: boolean
}) {
  const data = await tryPayload(async (payload) => {
    const [licenses, approvals, costs, steps, documents, certificates, related] = await Promise.all([
      payload.find({
        collection: 'sector-license-requirements',
        where: { sector: { equals: sectorId } },
        limit: 50,
      }),
      payload.find({
        collection: 'sector-approvals',
        where: { sector: { equals: sectorId } },
        sort: 'sequence_order',
        limit: 50,
      }),
      payload.find({
        collection: 'sector-costs',
        where: { sector: { equals: sectorId } },
        limit: 50,
      }),
      payload.find({
        collection: 'sector-steps',
        where: { sector: { equals: sectorId } },
        sort: 'step_number',
        limit: 100,
      }),
      payload.find({
        collection: 'sector-documents',
        where: { sector: { equals: sectorId } },
        limit: 50,
      }),
      payload.find({
        collection: 'sector-competency-certificates',
        where: { sector: { equals: sectorId } },
        limit: 50,
      }),
      categoryId
        ? payload.find({
            collection: 'business-sectors',
            where: {
              category: { equals: categoryId },
              id: { not_equals: sectorId },
              is_active: { equals: true },
            },
            limit: 4,
            depth: 0,
          })
        : Promise.resolve({ docs: [] as never[] }),
    ])
    return {
      licenses: licenses.docs,
      approvals: approvals.docs,
      costs: costs.docs,
      steps: steps.docs,
      documents: documents.docs,
      certificates: certificates.docs,
      related: related.docs,
    }
  })

  if (!data) return null

  const { licenses, approvals, costs, steps, documents, certificates, related } = data
  const totalEstimatedDays = approvals.reduce(
    (acc, a) => acc + ((a.processing_days_max as number) ?? 0),
    0,
  )
  const officialFeeCount = costs.filter((c) => Boolean(c.is_official_fee)).length

  return (
    <>
      <section className="container-page py-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Licenses required"
            value={licenses.length}
            hint={licenses[0]?.issuing_authority ?? '—'}
          />
          <StatCard
            label="Ministry approvals"
            value={approvals.length}
            hint={approvals.length > 0 ? 'Sequential approvals' : 'No upstream approval needed'}
          />
          <StatCard
            label="Est. processing"
            value={totalEstimatedDays > 0 ? `${totalEstimatedDays}d` : '—'}
            hint="Sum of approval windows"
          />
          <StatCard
            label="Documented fees"
            value={officialFeeCount > 0 ? officialFeeCount : '—'}
            hint={officialFeeCount > 0 ? 'Official + estimates' : 'Fee schedule pending'}
          />
        </div>
      </section>

      <section className="container-page pb-20">
        <div className="grid gap-10 lg:grid-cols-[1fr_240px]">
          <main className="space-y-12 min-w-0">
            <SectorSection id="licenses" icon={<ScrollText />} title="Licenses required">
              {licenses.length > 0 ? (
                <div className="grid gap-3">
                  {licenses.map((l) => (
                    <Card key={l.id} className="p-5">
                      <p className="text-sm font-semibold text-ink">{l.license_type}</p>
                      <p className="mt-1 text-sm text-ink-muted">
                        Issued by{' '}
                        <span className="font-medium text-ink">{l.issuing_authority}</span>
                      </p>
                      {l.notes ? (
                        <p className="mt-3 border-t border-border pt-3 text-xs text-ink-faint">
                          {l.notes}
                        </p>
                      ) : null}
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-ink-muted">
                  No formal license requirement recorded yet.
                </p>
              )}
            </SectorSection>

            <SectorSection id="approvals" icon={<Landmark />} title="Ministry approvals">
              {approvals.length === 0 ? (
                <p className="text-sm text-ink-muted">
                  No upstream ministry approval — apply directly for the trade license.
                </p>
              ) : (
                <>
                  <ApprovalRow approval={approvals[0]!} index={0} />
                  {approvals.length > 1 ? (
                    <div className="mt-3 space-y-3">
                      {approvals.slice(1).map((a, i) => (
                        <ApprovalRow key={a.id} approval={a} index={i + 1} />
                      ))}
                    </div>
                  ) : null}
                </>
              )}
            </SectorSection>

            <SectorSection id="costs" icon={<Calculator />} title="Cost breakdown">
              {costs.length > 0 ? (
                <Card className="overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-surface-2 text-xs uppercase tracking-wider text-ink-faint">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">Item</th>
                        <th className="px-4 py-3 text-right font-medium">ETB</th>
                        <th className="px-4 py-3 text-right font-medium">USD</th>
                        <th className="px-4 py-3 text-right font-medium">Source</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {costs.map((c) => (
                        <tr key={c.id}>
                          <td className="px-4 py-3 text-ink">{c.cost_item}</td>
                          <td className="px-4 py-3 text-right font-mono text-ink-muted">
                            {formatRange(c.amount_birr_min, c.amount_birr_max)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-ink-muted">
                            {formatRange(c.amount_usd_min, c.amount_usd_max)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Badge variant={c.is_official_fee ? 'brand' : 'outline'}>
                              {c.is_official_fee ? 'Official' : 'Estimate'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              ) : (
                <p className="text-sm text-ink-muted">Fee schedule pending data collection.</p>
              )}
            </SectorSection>

            <SectorSection id="steps" icon={<ListChecks />} title="Setup process">
              {steps.length > 0 ? (
                <>
                  <StepRow step={steps[0]!} />
                  {steps.length > 1 ? (
                    <div className="mt-4 space-y-3">
                      {steps.slice(1).map((s) => (
                        <StepRow key={s.id} step={s} />
                      ))}
                    </div>
                  ) : null}
                </>
              ) : (
                <p className="text-sm text-ink-muted">
                  Step-by-step process being authored. Most sectors share the template:
                  TIN → Investment licence → Bank → Trade licence → Tax → sector approvals.
                </p>
              )}
            </SectorSection>

            {certificates.length > 0 ? (
              <SectorSection
                id="certificates"
                icon={<CheckCircle2 />}
                title="Certificates of competency"
              >
                <div className="grid gap-3">
                  {certificates.map((c) => (
                    <Card key={c.id} className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-semibold text-ink">{c.certificate_name}</p>
                        <Badge variant={c.is_mandatory ? 'warn' : 'default'}>
                          {c.is_mandatory ? 'Mandatory' : 'Optional'}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-ink-muted">
                        From <span className="font-medium text-ink">{c.issuing_body}</span>
                      </p>
                      {c.description ? (
                        <p className="mt-2 text-sm text-ink-muted">{c.description}</p>
                      ) : null}
                    </Card>
                  ))}
                </div>
              </SectorSection>
            ) : null}

            {documents.length > 0 ? (
              <SectorSection id="documents" icon={<FileText />} title="Document templates">
                <div className="grid gap-2">
                  {documents.map((d) => (
                    <Card key={d.id} className="flex items-center justify-between gap-3 p-4">
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 place-items-center rounded-md bg-surface-2 text-ink-muted">
                          <FileText className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="text-sm font-medium text-ink">{d.title}</p>
                          <p className="text-xs text-ink-faint">{d.file_type?.toUpperCase()}</p>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost">
                        Download
                      </Button>
                    </Card>
                  ))}
                </div>
              </SectorSection>
            ) : null}

            <Card className="overflow-hidden">
              <div className="grid gap-6 p-8 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <p className="text-xs uppercase tracking-wider text-accent">Talk to a human</p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tightish">
                    Book a Bishoftu expert for this sector.
                  </h3>
                  <p className="mt-2 text-sm text-ink-muted">
                    1-on-1 with a verified local agent who&apos;s opened businesses in this
                    category before. They handle the queue, you stay home.
                  </p>
                </div>
                <Button asChild size="lg">
                  <Link href="/experts">
                    Browse experts <Users className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </Card>
          </main>

          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-1 border-l border-border pl-4 text-sm">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-faint">
                On this page
              </p>
              {hasPermittedOps ? (
                <TocLink href="#operations">Permitted operations</TocLink>
              ) : null}
              <TocLink href="#licenses">Licenses</TocLink>
              <TocLink href="#approvals">Approvals ({approvals.length})</TocLink>
              <TocLink href="#costs">Costs</TocLink>
              <TocLink href="#steps">Steps</TocLink>
              {certificates.length > 0 ? (
                <TocLink href="#certificates">Certificates</TocLink>
              ) : null}
              {documents.length > 0 ? <TocLink href="#documents">Documents</TocLink> : null}
            </div>
          </aside>
        </div>

        {related.length > 0 ? (
          <div className="mt-20 border-t border-border pt-12">
            <h3 className="text-lg font-semibold tracking-tightish">Related sectors</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {related.map((r) => (
                <Link
                  key={r.id}
                  href={`/sectors/${r.slug}`}
                  className="group rounded-lg border border-border bg-surface p-4 transition-all hover:border-brand/40"
                >
                  <Badge variant="mono">{r.mor_code}</Badge>
                  <p className="mt-2 line-clamp-2 text-sm font-medium leading-snug text-ink group-hover:text-brand">
                    {humanizeSectorName(r.mor_code, r.name_en)}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </section>
    </>
  )
}

function SectorSectionsSkeleton() {
  return (
    <>
      <section className="container-page py-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-surface p-5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-3 h-7 w-20" />
              <Skeleton className="mt-2 h-3 w-32" />
            </div>
          ))}
        </div>
      </section>
      <section className="container-page pb-20">
        <div className="grid gap-10 lg:grid-cols-[1fr_240px]">
          <main className="space-y-12 min-w-0">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="h-4 w-32" />
                <Skeleton className="mt-2 h-8 w-2/3" />
                <div className="mt-6 space-y-3">
                  <Skeleton className="h-16 w-full rounded-lg" />
                  <Skeleton className="h-16 w-full rounded-lg" />
                  <Skeleton className="h-16 w-full rounded-lg" />
                </div>
              </div>
            ))}
          </main>
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-2 border-l border-border pl-4">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-20" />
            </div>
          </aside>
        </div>
      </section>
    </>
  )
}

function SectorSection({
  id,
  icon,
  title,
  children,
}: {
  id: string
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold tracking-tightish">
        <span className="grid h-7 w-7 place-items-center rounded-md bg-brand/15 text-brand [&_svg]:h-4 [&_svg]:w-4">
          {icon}
        </span>
        {title}
      </h2>
      {children}
    </section>
  )
}

function TocLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="block rounded px-2 py-1 text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
    >
      {children}
    </a>
  )
}

function ApprovalRow({
  approval,
  index,
}: {
  approval: { approval_name?: unknown; approving_ministry?: unknown; notes?: unknown }
  index: number
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start gap-3">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-brand/40 bg-brand/10 font-mono text-xs text-brand">
          {index + 1}
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-ink">{String(approval.approval_name)}</p>
          <p className="mt-0.5 text-sm text-ink-muted">
            From <span className="font-medium text-ink">{String(approval.approving_ministry)}</span>
          </p>
          {approval.notes ? (
            <p className="mt-3 border-t border-border pt-3 text-xs text-ink-faint">
              {String(approval.notes)}
            </p>
          ) : null}
        </div>
      </div>
    </Card>
  )
}

function StepRow({
  step,
}: {
  step: { step_number?: unknown; title?: unknown; where_to_go?: unknown; estimated_days?: unknown }
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start gap-3">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-accent/40 bg-accent/10 font-mono text-xs text-accent">
          {String(step.step_number)}
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-ink">{String(step.title)}</p>
          {step.where_to_go ? (
            <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-ink-muted">
              <Landmark className="h-3 w-3" /> {String(step.where_to_go)}
            </p>
          ) : null}
          {step.estimated_days ? (
            <p className="mt-1 inline-flex items-center gap-1 text-xs text-ink-faint">
              <Clock className="h-3 w-3" /> ~{String(step.estimated_days)} days
            </p>
          ) : null}
        </div>
      </div>
    </Card>
  )
}

function formatRange(min: unknown, max: unknown): string {
  const n = (v: unknown) => (typeof v === 'number' ? v : v ? Number(v) : null)
  const a = n(min)
  const b = n(max)
  if (a === null && b === null) return '—'
  if (a !== null && b !== null && a !== b) return `${a.toLocaleString()}–${b.toLocaleString()}`
  return (a ?? b)!.toLocaleString()
}
