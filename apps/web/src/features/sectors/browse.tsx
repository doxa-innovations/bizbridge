import type { Where } from 'payload'
import Link from 'next/link'
import { ArrowUpRight, Search } from 'lucide-react'
import { tryPayload } from '@/lib/payload'
import { humanizeSectorName } from '@/lib/humanize-sector-name'
import { SectorSearch } from '@/components/sectors/sector-search'
import { GeometricIcon } from '@/components/marketing/geometric-icon'
import { GridBackdrop } from '@/components/marketing/grid-backdrop'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

export interface SectorsBrowseSearchParams {
  q?: string
  category?: string
}

interface Props {
  /** Where the tool is mounted. Marketing = '/sectors', dashboard = '/dashboard/sectors'. */
  basePath?: string
  searchParams: SectorsBrowseSearchParams
  /** Optional: preselect this category slug when the user hasn't picked one
   *  (used to prefill the personalized dashboard variant from onboarding). */
  defaultCategory?: string | null
  /** Optional: filter sectors down to these MOR codes (personalized view). */
  restrictToMorCodes?: string[]
}

/**
 * Shared /sectors browser. Rendered by both the public marketing route
 * (`/sectors`) and the personalized dashboard route (`/dashboard/sectors`).
 * All links respect `basePath` so a sector card in the dashboard variant
 * routes to the dashboard sector detail, not the public one.
 */
export async function SectorsBrowseFeature({
  basePath = '/sectors',
  searchParams,
  defaultCategory = null,
  restrictToMorCodes,
}: Props) {
  const { q } = searchParams
  const categorySlug = searchParams.category ?? defaultCategory ?? undefined

  const data = await tryPayload(async (payload) => {
    const categories = await payload.find({
      collection: 'sector-categories',
      sort: 'sort_order',
      limit: 50,
    })

    const sectorWhere: Where = { is_active: { equals: true } }
    if (q && q.trim().length > 0) {
      const term = q.trim()
      sectorWhere.or = [
        { name_en: { like: term } },
        { name_am: { like: term } },
        { mor_code: { like: term } },
      ]
    }
    if (categorySlug) {
      const cat = categories.docs.find((c) => c.slug === categorySlug)
      if (cat) sectorWhere.category = { equals: cat.id }
    }
    if (restrictToMorCodes && restrictToMorCodes.length > 0) {
      sectorWhere.mor_code = { in: restrictToMorCodes }
    }

    const sectors = await payload.find({
      collection: 'business-sectors',
      where: sectorWhere,
      sort: 'mor_code',
      limit: 1000,
      depth: 0,
    })

    return { categories: categories.docs, sectors: sectors.docs, total: sectors.totalDocs }
  })

  if (!data) {
    return (
      <div className="container-page py-20">
        <h1 className="text-3xl font-semibold tracking-tightish">Business sectors</h1>
        <p className="mt-3 text-ink-muted">
          519 sectors from MOR Directive 17/2011. Configure your database to view them.
        </p>
      </div>
    )
  }

  type Sector = (typeof data.sectors)[number]
  const byCategoryId = new Map<string | number, Sector[]>()
  for (const s of data.sectors) {
    const catId = typeof s.category === 'object' && s.category ? s.category.id : s.category
    if (catId === undefined || catId === null) continue
    const list = byCategoryId.get(catId) ?? []
    list.push(s)
    byCategoryId.set(catId, list)
  }

  return (
    <div>
      <section className="relative overflow-hidden border-b border-border">
        <GridBackdrop />
        <div className="container-page py-16">
          <div className="mb-4 flex flex-wrap gap-2">
            <Badge variant="brand" className="inline-flex">
              MOR Directive 17/2011
            </Badge>
            <Badge variant="outline" className="inline-flex text-ink-muted">
              Always free · no signup required
            </Badge>
          </div>
          <h1 className="text-balance text-4xl font-semibold tracking-crisp sm:text-5xl">
            {data.total} business sectors,{' '}
            <span className="text-ink-muted">one searchable directory.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-ink-muted">
            Each entry maps to an official MOR code, the issuing authority, and the upstream
            ministry approvals you need before applying for a trade license.
          </p>

          <div className="mt-8 max-w-2xl">
            <SectorSearch basePath={basePath} />
          </div>

          <nav className="mt-6 flex flex-wrap gap-2">
            <CategoryChip href={basePath} label="All" active={!categorySlug} />
            {data.categories.map((c) => (
              <CategoryChip
                key={c.id}
                href={`${basePath}?category=${c.slug}`}
                label={c.name_en}
                active={categorySlug === c.slug}
              />
            ))}
          </nav>
        </div>
      </section>

      <section className="container-page py-12">
        {data.sectors.length === 0 ? (
          <Card className="p-12 text-center">
            <Search className="mx-auto h-8 w-8 text-ink-faint" />
            <p className="mt-3 text-sm font-medium text-ink">No sectors match your filter</p>
            <p className="mt-1 text-sm text-ink-muted">
              {q ? `Try a different search than "${q}".` : 'Clear the filters or try a different category.'}
            </p>
          </Card>
        ) : null}

        <div className="space-y-12">
          {data.categories.map((cat) => {
            const sectors = byCategoryId.get(cat.id) ?? []
            if (sectors.length === 0) return null
            return (
              <section key={cat.id} className="space-y-4">
                <header className="flex items-end justify-between gap-3 border-b border-border pb-3">
                  <div className="flex items-center gap-3">
                    <GeometricIcon slug={cat.slug} className="h-9 w-9" />
                    <div>
                      <h2 className="text-xl font-semibold tracking-tightish text-ink">
                        {cat.name_en}
                      </h2>
                      {cat.name_am ? (
                        <p className="font-amharic text-xs text-ink-faint">{cat.name_am}</p>
                      ) : null}
                    </div>
                  </div>
                  <span className="font-mono text-xs text-ink-faint">
                    {sectors.length} sector{sectors.length === 1 ? '' : 's'}
                  </span>
                </header>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {sectors.map((s) => (
                    <Link
                      key={s.id}
                      href={`${basePath}/${s.slug}`}
                      className="group flex items-start justify-between gap-3 rounded-lg border border-border bg-surface p-4 transition-all hover:border-brand/40 hover:bg-surface-2"
                    >
                      <div className="min-w-0 flex-1">
                        <Badge variant="mono" className="mb-2">
                          {s.mor_code}
                        </Badge>
                        <p className="line-clamp-2 text-sm font-medium leading-snug text-ink group-hover:text-brand">
                          {humanizeSectorName(s.mor_code, s.name_en)}
                        </p>
                        {s.name_am ? (
                          <p className="mt-0.5 truncate font-amharic text-xs text-ink-faint">
                            {s.name_am}
                          </p>
                        ) : null}
                      </div>
                      <ArrowUpRight className="h-4 w-4 shrink-0 text-ink-faint transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand" />
                    </Link>
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      </section>
    </div>
  )
}

function CategoryChip({
  href,
  label,
  active,
}: {
  href: string
  label: string
  active: boolean
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? 'inline-flex h-8 items-center rounded-full border border-brand/50 bg-brand/10 px-3 text-xs font-medium text-brand'
          : 'inline-flex h-8 items-center rounded-full border border-border bg-surface px-3 text-xs font-medium text-ink-muted hover:border-brand/40 hover:text-ink'
      }
    >
      {label}
    </Link>
  )
}
