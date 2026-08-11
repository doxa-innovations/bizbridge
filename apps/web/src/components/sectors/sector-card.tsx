import Link from 'next/link'

export interface SectorCardData {
  id: string | number
  slug: string
  mor_code: string
  name_en: string
  name_am: string | null
  description_short: string | null
  is_featured: boolean
}

/** `basePath` controls where the card links to — `/sectors` on the
 *  marketing site, `/dashboard/sectors` inside the dashboard shell.
 *  Without this the dashboard sector grid bounced users back out to
 *  the marketing site when they clicked a card. */
export function SectorCard({
  sector,
  basePath = '/sectors',
}: {
  sector: SectorCardData
  basePath?: string
}) {
  return (
    <Link
      href={`${basePath}/${sector.slug}`}
      className="group block rounded-xl border border-slate-200 bg-white p-5 transition hover:border-brand-500 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-xs text-slate-500">MOR {sector.mor_code}</p>
          <h3 className="mt-1 text-base font-semibold text-slate-900 group-hover:text-brand-700">
            {sector.name_en}
          </h3>
          {sector.name_am ? (
            <p className="mt-0.5 truncate font-amharic text-sm text-slate-500">{sector.name_am}</p>
          ) : null}
        </div>
        {sector.is_featured ? (
          <span className="shrink-0 rounded-full bg-ethiopia-yellow/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-800">
            Featured
          </span>
        ) : null}
      </div>
      {sector.description_short ? (
        <p className="mt-3 line-clamp-3 text-sm text-slate-600">{sector.description_short}</p>
      ) : null}
    </Link>
  )
}
