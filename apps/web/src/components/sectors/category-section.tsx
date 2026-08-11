import { SectorCard, type SectorCardData } from './sector-card'

interface CategorySectionProps {
  category: {
    id: string | number
    slug: string
    name_en: string
    name_am: string | null
    icon: string | null
  }
  sectors: SectorCardData[]
  /** Threaded down to SectorCard so each card links to the correct
   *  shell (marketing vs dashboard). */
  basePath?: string
}

export function CategorySection({ category, sectors, basePath }: CategorySectionProps) {
  if (sectors.length === 0) return null
  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between gap-3 border-b border-slate-200 pb-2">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{category.name_en}</h2>
          {category.name_am ? (
            <p className="mt-0.5 font-amharic text-sm text-slate-500">{category.name_am}</p>
          ) : null}
        </div>
        <span className="text-xs font-medium text-slate-500">{sectors.length} sectors</span>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sectors.map((s) => (
          <SectorCard key={String(s.id)} sector={s} basePath={basePath} />
        ))}
      </div>
    </section>
  )
}
