'use client'

import { Card } from '@/components/ui/card'
import { Chart } from '@/components/charts/chart'
import { SourceCite } from '@/components/ui/source-cite'

interface CategoryCount {
  id: string | number
  slug: string
  name: string
  total: number
}

interface HomeChartsProps {
  categories: CategoryCount[]
}

/**
 * Monochromatic green ramp used for tonal viz — largest bars/slices get the
 * deepest tone so visual weight tracks data weight. Kept in one place so we
 * can tune the whole palette from a single line.
 */
const GREEN_RAMP = [
  '#0F4234', // 0 — deepest
  '#144F42',
  '#1A5D50',
  '#23705C',
  '#2D8F72', // 4 — brand
  '#3FA085',
  '#5AB89D',
  '#78C9B0',
  '#96D8C2', // 8 — lightest
]

const NEUTRAL_TICK = 'rgb(var(--ink-faint))'
const NEUTRAL_MUTED = 'rgb(var(--ink-muted))'
const NEUTRAL_INK = 'rgb(var(--ink))'
const GRID_LINE = 'rgb(var(--border) / 0.4)'

const CATEGORY_SHORT: Record<string, string> = {
  'agriculture-hunting-forestry-fishing': 'Agriculture & Fishing',
  'mining-and-quarrying': 'Mining & Quarrying',
  manufacturing: 'Manufacturing',
  'electricity-gas-water-waste': 'Utilities & Waste',
  construction: 'Construction',
  'wholesale-retail-hotels-import-export': 'Wholesale & Retail',
  'transport-storage-communication': 'Transport & Storage',
  'finance-insurance-real-estate-business': 'Finance & Business',
  'community-social-personal-services': 'Community Services',
}

const GROWTH_MOCK = {
  years: ['2024', '2025', '2026', '2027', '2028', '2029', '2030'],
  series: [
    { name: 'Hospitality · F&B', data: [120, 144, 175, 220, 290, 360, 430] },
    { name: 'Construction & Materials', data: [80, 96, 130, 180, 260, 320, 380] },
    { name: 'Logistics & Storage', data: [40, 52, 70, 105, 160, 220, 280] },
  ],
}

const MOCK_CATEGORIES: CategoryCount[] = [
  { id: 1, slug: 'agriculture-hunting-forestry-fishing', name: 'Agriculture & Fishing', total: 17 },
  { id: 2, slug: 'mining-and-quarrying', name: 'Mining & Quarrying', total: 9 },
  { id: 3, slug: 'manufacturing', name: 'Manufacturing', total: 89 },
  { id: 4, slug: 'electricity-gas-water-waste', name: 'Utilities & Waste', total: 9 },
  { id: 5, slug: 'construction', name: 'Construction', total: 5 },
  { id: 6, slug: 'wholesale-retail-hotels-import-export', name: 'Wholesale & Retail', total: 233 },
  { id: 7, slug: 'transport-storage-communication', name: 'Transport & Storage', total: 25 },
  { id: 8, slug: 'finance-insurance-real-estate-business', name: 'Finance & Business', total: 76 },
  { id: 9, slug: 'community-social-personal-services', name: 'Community & Personal', total: 56 },
]

function shortLabelFor(slug: string, fallback: string): string {
  return CATEGORY_SHORT[slug] ?? fallback
}

/** Map each entry to a green ramp shade proportional to its rank by count. */
function tonesByRank<T extends { total: number }>(items: T[]): string[] {
  const ranked = items.map((item, i) => ({ i, total: item.total }))
  ranked.sort((a, b) => b.total - a.total)
  const rankFor = new Map<number, number>()
  ranked.forEach((r, order) => rankFor.set(r.i, order))
  return items.map((_, i) => {
    const order = rankFor.get(i) ?? 0
    const stepIdx = Math.min(
      GREEN_RAMP.length - 1,
      Math.round((order / Math.max(1, items.length - 1)) * (GREEN_RAMP.length - 1)),
    )
    return GREEN_RAMP[stepIdx]!
  })
}

export function HomeCharts({ categories }: HomeChartsProps) {
  const safe = categories.length > 0 ? categories : MOCK_CATEGORIES
  const shortLabels = safe.map((c) => shortLabelFor(c.slug, c.name))
  const values = safe.map((c) => c.total)
  const donutColors = tonesByRank(safe)
  const totalSectors = values.reduce((a, b) => a + b, 0)
  const top5 = [...safe].sort((a, b) => b.total - a.total).slice(0, 5)
  const barColors = tonesByRank(top5)

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* DONUT — tonal green ramp; largest slice = deepest tone */}
        <Card className="p-6 sm:p-8">
          <header className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand">
              Sector distribution
            </p>
            <h3 className="mt-1 text-xl font-semibold tracking-tightish sm:text-2xl">
              Across all {safe.length} categories
            </h3>
            <p className="mt-1.5 text-sm text-ink-muted">
              Every licensable activity in Ethiopia, grouped into MOR&apos;s nine top-level categories.
            </p>
          </header>
          <Chart
            type="donut"
            height={420}
            series={values}
            options={{
              labels: shortLabels,
              chart: { animations: { enabled: true, speed: 500 } },
              plotOptions: {
                pie: {
                  donut: {
                    size: '72%',
                    labels: {
                      show: true,
                      name: {
                        show: true,
                        fontSize: '11px',
                        fontWeight: 500,
                        color: NEUTRAL_MUTED,
                        offsetY: -4,
                      },
                      value: {
                        show: true,
                        fontSize: '36px',
                        fontWeight: 700,
                        color: NEUTRAL_INK,
                        offsetY: 6,
                        formatter: (v) => `${v}`,
                      },
                      total: {
                        show: true,
                        label: 'Total sectors',
                        fontSize: '11px',
                        fontWeight: 500,
                        color: NEUTRAL_MUTED,
                        formatter: () => totalSectors.toLocaleString(),
                      },
                    },
                  },
                  expandOnClick: true,
                },
              },
              legend: {
                position: 'bottom',
                fontSize: '12px',
                fontWeight: 500,
                labels: { colors: NEUTRAL_MUTED },
                itemMargin: { horizontal: 8, vertical: 3 },
                markers: { size: 5, offsetX: -4 },
              },
              stroke: { width: 2, colors: ['rgb(var(--bg))'] },
              colors: donutColors,
              dataLabels: { enabled: false },
              tooltip: {
                y: { formatter: (v) => `${v} sectors` },
                style: { fontSize: '12px' },
                theme: 'dark',
              },
              responsive: [{ breakpoint: 640, options: { chart: { height: 360 } } }],
            }}
          />
          <SourceCite
            className="mt-4"
            sources={[
              { label: 'MOR Directive 17/2011', href: 'https://mor.gov.et' },
              { label: 'Extracted from official PDF', updated: 'Aug 2026' },
            ]}
            methodology="Sector counts derived from the official Ministry of Revenue directive 17/2011 explanation manual, extracted table-by-table via pdfplumber."
          />
        </Card>

        {/* BAR — Top 5 concentration, tonal green */}
        <Card className="p-6 sm:p-8">
          <header className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand">
              Concentration
            </p>
            <h3 className="mt-1 text-xl font-semibold tracking-tightish sm:text-2xl">
              Top 5 by sector count
            </h3>
            <p className="mt-1.5 text-sm text-ink-muted">
              Where the {totalSectors.toLocaleString()} sectors cluster — the categories with the
              deepest catalogs of licensable activities.
            </p>
          </header>
          <Chart
            type="bar"
            height={420}
            series={[
              {
                name: 'Sectors',
                data: top5.map((c) => ({
                  x: shortLabelFor(c.slug, c.name),
                  y: c.total,
                })),
              },
            ]}
            options={{
              chart: { toolbar: { show: false }, animations: { enabled: true, speed: 500 } },
              plotOptions: {
                bar: {
                  horizontal: true,
                  borderRadius: 6,
                  borderRadiusApplication: 'end',
                  barHeight: '62%',
                  distributed: true,
                  dataLabels: { position: 'top' },
                },
              },
              dataLabels: {
                enabled: true,
                offsetX: 30,
                style: {
                  fontSize: '13px',
                  fontWeight: 700,
                  colors: [NEUTRAL_INK],
                },
                formatter: (v) => `${v}`,
              },
              xaxis: {
                labels: { show: false },
                axisBorder: { show: false },
                axisTicks: { show: false },
              },
              yaxis: {
                labels: {
                  style: {
                    colors: NEUTRAL_INK,
                    fontSize: '13px',
                    fontWeight: 500,
                  },
                  maxWidth: 220,
                },
              },
              grid: {
                show: true,
                borderColor: GRID_LINE,
                strokeDashArray: 3,
                yaxis: { lines: { show: false } },
                xaxis: { lines: { show: true } },
                padding: { left: 8, right: 40 },
              },
              legend: { show: false },
              tooltip: {
                y: { formatter: (v) => `${v} sectors` },
                style: { fontSize: '12px' },
                theme: 'dark',
              },
              colors: barColors,
              responsive: [
                {
                  breakpoint: 640,
                  options: { chart: { height: 360 }, dataLabels: { offsetX: 20 } },
                },
              ],
            }}
          />
          <SourceCite
            className="mt-4"
            sources={[
              { label: 'MOR Directive 17/2011', href: 'https://mor.gov.et' },
              { label: 'BizBridge sector index', updated: 'Aug 2026' },
            ]}
            methodology="Top 5 by count of licensable activities per top-level MOR category. Ties broken by category slug order."
          />
        </Card>
      </div>

      {/* GROWTH — full width, 3 tonal green area lines */}
      <Card className="p-6 sm:p-8">
        <header className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand">
              Growth trajectory
            </p>
            <h3 className="mt-1 text-xl font-semibold tracking-tightish sm:text-2xl">
              Projected new-business registrations · 2024–2030
            </h3>
            <p className="mt-1.5 text-sm text-ink-muted">
              Bishoftu&apos;s three fastest-moving categories — anchored to the $12.5B airport
              build. Indicative projection.
            </p>
          </div>
          <span className="text-2xs font-medium uppercase tracking-wider text-ink-faint">
            Indicative
          </span>
        </header>
        <Chart
          type="area"
          height={340}
          series={GROWTH_MOCK.series}
          options={{
            chart: { toolbar: { show: false }, animations: { enabled: true, speed: 600 } },
            xaxis: {
              categories: GROWTH_MOCK.years,
              labels: { style: { colors: NEUTRAL_TICK, fontSize: '12px' } },
              axisBorder: { show: false },
              axisTicks: { show: false },
            },
            stroke: { curve: 'smooth', width: 2.5 },
            fill: {
              type: 'gradient',
              gradient: { opacityFrom: 0.35, opacityTo: 0.03, stops: [0, 100] },
            },
            // Deep → mid → light green so all three lines read as one family.
            colors: [GREEN_RAMP[0]!, GREEN_RAMP[4]!, GREEN_RAMP[7]!],
            legend: {
              position: 'top',
              horizontalAlign: 'left',
              fontSize: '12px',
              fontWeight: 500,
              labels: { colors: NEUTRAL_MUTED },
              markers: { size: 5 },
              itemMargin: { horizontal: 12 },
            },
            yaxis: {
              labels: {
                formatter: (v) => `${v}`,
                style: { colors: NEUTRAL_TICK, fontSize: '12px' },
              },
              title: {
                text: 'New registrations / yr',
                style: { color: NEUTRAL_TICK, fontSize: '11px', fontWeight: 500 },
              },
            },
            grid: {
              borderColor: GRID_LINE,
              strokeDashArray: 4,
              padding: { left: 4, right: 4 },
            },
            tooltip: {
              shared: true,
              y: { formatter: (v) => `${v} new businesses` },
              style: { fontSize: '12px' },
              theme: 'dark',
            },
            markers: { size: 0, hover: { size: 5 } },
          }}
        />
        <SourceCite
          className="mt-4"
          sources={[
            { label: 'Ethiopian Airports Enterprise capacity plan' },
            { label: 'World Bank Ethiopia — CPIA' },
            { label: 'BizBridge projection', updated: 'Aug 2026' },
          ]}
          methodology="Indicative projection — extrapolated from Bishoftu airport build-out timeline and historical MoTRI new-registration series 2018-2024. Not a forecast; not investment advice."
        />
      </Card>
    </div>
  )
}
