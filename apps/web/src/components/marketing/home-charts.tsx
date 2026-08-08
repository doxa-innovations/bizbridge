'use client'

import { Card } from '@/components/ui/card'
import { Chart } from '@/components/charts/chart'

interface CategoryCount {
  id: string | number
  slug: string
  name: string
  total: number
}

interface HomeChartsProps {
  categories: CategoryCount[]
}

// A distinct palette per category — sits well against the deep-forest theme
// in both light and dark modes. Ordered to align with the MOR category order
// but the map below re-keys by slug so the same category always gets the
// same swatch regardless of arrival order.
const CATEGORY_COLORS: Record<string, string> = {
  'agriculture-hunting-forestry-fishing': '#3f6b52',
  'mining-and-quarrying': '#8a6a3d',
  'manufacturing': '#c66a3a',
  'electricity-gas-water-waste': '#3a8f9c',
  'construction': '#a05c50',
  'wholesale-retail-hotels-import-export': '#2E8B76',
  'transport-storage-communication': '#4c6ea8',
  'finance-insurance-real-estate-business': '#a48242',
  'community-social-personal-services': '#7d5e88',
}

const FALLBACK_PALETTE = [
  '#C89B4E', '#c66a3a', '#4c6ea8', '#2E8B76', '#7d5e88',
  '#3a8f9c', '#a05c50', '#3f6b52', '#8a6a3d',
]

// Short display labels for the bar chart so long names don't get truncated.
const CATEGORY_SHORT: Record<string, string> = {
  'agriculture-hunting-forestry-fishing': 'Agriculture & Fishing',
  'mining-and-quarrying': 'Mining & Quarrying',
  'manufacturing': 'Manufacturing',
  'electricity-gas-water-waste': 'Utilities & Waste',
  'construction': 'Construction',
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

function colorFor(slug: string, i: number): string {
  return CATEGORY_COLORS[slug] ?? FALLBACK_PALETTE[i % FALLBACK_PALETTE.length]!
}

function shortLabelFor(slug: string, fallback: string): string {
  return CATEGORY_SHORT[slug] ?? fallback
}

export function HomeCharts({ categories }: HomeChartsProps) {
  const safe = categories.length > 0 ? categories : MOCK_CATEGORIES
  const shortLabels = safe.map((c) => shortLabelFor(c.slug, c.name))
  const values = safe.map((c) => c.total)
  const donutColors = safe.map((c, i) => colorFor(c.slug, i))
  const totalSectors = values.reduce((a, b) => a + b, 0)
  const top5 = [...safe].sort((a, b) => b.total - a.total).slice(0, 5)
  const barColors = top5.map((c, i) => colorFor(c.slug, i))

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* DONUT */}
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
                    size: '68%',
                    labels: {
                      show: true,
                      name: {
                        show: true,
                        fontSize: '13px',
                        fontWeight: 500,
                        color: 'rgb(var(--ink-muted))',
                        offsetY: -4,
                      },
                      value: {
                        show: true,
                        fontSize: '32px',
                        fontWeight: 700,
                        color: 'rgb(var(--ink))',
                        offsetY: 6,
                        formatter: (v) => `${v}`,
                      },
                      total: {
                        show: true,
                        label: 'Total sectors',
                        fontSize: '12px',
                        fontWeight: 500,
                        color: 'rgb(var(--ink-muted))',
                        formatter: () => totalSectors.toLocaleString(),
                      },
                    },
                  },
                  expandOnClick: true,
                },
              },
              legend: {
                position: 'bottom',
                fontSize: '13px',
                fontWeight: 500,
                labels: { colors: 'rgb(var(--ink))' },
                itemMargin: { horizontal: 10, vertical: 4 },
                markers: { size: 6, offsetX: -4 },
              },
              stroke: { width: 3, colors: ['rgb(var(--bg))'] },
              colors: donutColors,
              dataLabels: { enabled: false },
              tooltip: {
                y: { formatter: (v) => `${v} sectors` },
                style: { fontSize: '13px' },
              },
              responsive: [
                { breakpoint: 640, options: { chart: { height: 360 } } },
              ],
            }}
          />
        </Card>

        {/* BAR — Top 5 concentration */}
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
                  barHeight: '68%',
                  distributed: true,
                  dataLabels: { position: 'top' },
                },
              },
              dataLabels: {
                enabled: true,
                offsetX: 32,
                style: {
                  fontSize: '13px',
                  fontWeight: 700,
                  colors: ['rgb(var(--ink))'],
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
                    colors: 'rgb(var(--ink))',
                    fontSize: '13px',
                    fontWeight: 500,
                  },
                  maxWidth: 220,
                },
              },
              grid: { show: false, padding: { left: 8, right: 32 } },
              legend: { show: false },
              tooltip: {
                y: { formatter: (v) => `${v} sectors` },
                style: { fontSize: '13px' },
              },
              colors: barColors,
              responsive: [
                { breakpoint: 640, options: { chart: { height: 360 }, dataLabels: { offsetX: 20 } } },
              ],
            }}
          />
        </Card>
      </div>

      {/* GROWTH — full width */}
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
              labels: { style: { colors: 'rgb(var(--ink-muted))', fontSize: '12px' } },
              axisBorder: { show: false },
              axisTicks: { show: false },
            },
            stroke: { curve: 'smooth', width: 3 },
            fill: {
              type: 'gradient',
              gradient: { opacityFrom: 0.4, opacityTo: 0.05, stops: [0, 100] },
            },
            colors: ['#C89B4E', '#4c6ea8', '#2E8B76'],
            legend: {
              position: 'top',
              horizontalAlign: 'left',
              fontSize: '13px',
              fontWeight: 500,
              labels: { colors: 'rgb(var(--ink))' },
              markers: { size: 6 },
              itemMargin: { horizontal: 12 },
            },
            yaxis: {
              labels: {
                formatter: (v) => `${v}`,
                style: { colors: 'rgb(var(--ink-muted))', fontSize: '12px' },
              },
              title: {
                text: 'New registrations / yr',
                style: { color: 'rgb(var(--ink-faint))', fontSize: '11px', fontWeight: 500 },
              },
            },
            grid: {
              borderColor: 'rgb(var(--border) / 0.4)',
              strokeDashArray: 4,
              padding: { left: 4, right: 4 },
            },
            tooltip: {
              shared: true,
              y: { formatter: (v) => `${v} new businesses` },
              style: { fontSize: '13px' },
            },
            markers: { size: 0, hover: { size: 5 } },
          }}
        />
      </Card>
    </div>
  )
}
