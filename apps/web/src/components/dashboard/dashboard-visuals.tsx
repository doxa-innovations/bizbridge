'use client'

import { Chart } from '@/components/charts/chart'

/**
 * Small, dashboard-native visualisations. Kept in one file so we can tune the
 * palette in one place. All colors resolve from the CSS token ramp defined in
 * globals.css so light/dark themes and the monochromatic green refresh flow
 * through automatically.
 */

const CHART_INK = 'rgb(var(--ink))'
const CHART_MUTED = 'rgb(var(--ink-muted))'
const CHART_FAINT = 'rgb(var(--ink-faint))'
const CHART_GRID = 'rgb(var(--border) / 0.4)'
const BRAND = 'rgb(var(--brand))'
const BRAND_STRONG = 'rgb(var(--brand-strong))'
const CHART_1 = 'rgb(var(--chart-1))'
const CHART_2 = 'rgb(var(--chart-2))'
const CHART_3 = 'rgb(var(--chart-3))'

interface RingProps {
  value: number // 0-100
  label: string
  sublabel?: string
  height?: number
}

/**
 * Simple radial-progress ring. Matches the NeuroSphere reference's Goal
 * Tracker treatment but tuned to the green ramp instead of amber.
 */
export function ProgressRing({ value, label, sublabel, height = 200 }: RingProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)))
  return (
    <Chart
      type="radialBar"
      height={height}
      series={[clamped]}
      options={{
        chart: { sparkline: { enabled: true } },
        plotOptions: {
          radialBar: {
            startAngle: -135,
            endAngle: 135,
            hollow: { size: '62%' },
            track: {
              background: CHART_GRID,
              strokeWidth: '100%',
              margin: 4,
            },
            dataLabels: {
              show: true,
              name: {
                show: true,
                offsetY: 22,
                color: CHART_MUTED,
                fontSize: '11px',
                fontWeight: 500,
              },
              value: {
                show: true,
                offsetY: -12,
                color: CHART_INK,
                fontSize: '28px',
                fontWeight: 700,
                formatter: (v) => `${v}%`,
              },
            },
          },
        },
        fill: {
          type: 'gradient',
          gradient: {
            shade: 'dark',
            type: 'horizontal',
            gradientToColors: [BRAND_STRONG],
            stops: [0, 100],
          },
        },
        stroke: { lineCap: 'round' },
        colors: [BRAND],
        labels: [sublabel ?? label],
      }}
    />
  )
}

interface HorizontalBarsProps {
  data: Array<{ label: string; value: number }>
  height?: number
  valueSuffix?: string
}

/**
 * Small horizontal bars for interest-sector / capital-tier breakdowns.
 * Tonal green (mono) — no rainbow.
 */
export function TonalBars({ data, height = 220, valueSuffix }: HorizontalBarsProps) {
  const values = data.map((d) => d.value)
  const labels = data.map((d) => d.label)
  return (
    <Chart
      type="bar"
      height={height}
      series={[{ name: 'Value', data: values }]}
      options={{
        chart: { toolbar: { show: false }, animations: { enabled: true, speed: 400 } },
        plotOptions: {
          bar: {
            horizontal: true,
            borderRadius: 4,
            borderRadiusApplication: 'end',
            barHeight: '58%',
          },
        },
        dataLabels: {
          enabled: true,
          offsetX: 24,
          style: { fontSize: '11px', fontWeight: 700, colors: [CHART_INK] },
          formatter: (v) => (valueSuffix ? `${v}${valueSuffix}` : `${v}`),
        },
        xaxis: {
          categories: labels,
          labels: { show: false },
          axisBorder: { show: false },
          axisTicks: { show: false },
        },
        yaxis: {
          labels: {
            style: { colors: CHART_INK, fontSize: '12px', fontWeight: 500 },
            maxWidth: 180,
          },
        },
        grid: {
          show: false,
          padding: { left: 4, right: 32 },
        },
        legend: { show: false },
        colors: [BRAND],
        fill: {
          type: 'gradient',
          gradient: {
            shade: 'dark',
            type: 'horizontal',
            gradientToColors: [BRAND_STRONG],
            opacityFrom: 0.9,
            opacityTo: 1,
            stops: [0, 100],
          },
        },
        tooltip: {
          y: { formatter: (v) => (valueSuffix ? `${v}${valueSuffix}` : `${v}`) },
          theme: 'dark',
          style: { fontSize: '12px' },
        },
      }}
    />
  )
}

interface SparkProps {
  data: number[]
  height?: number
}

/** Zero-chrome sparkline for KPI cards — no axes, just the shape. */
export function KpiSpark({ data, height = 48 }: SparkProps) {
  return (
    <Chart
      type="area"
      height={height}
      series={[{ name: '', data }]}
      options={{
        chart: {
          sparkline: { enabled: true },
          animations: { enabled: true, speed: 400 },
        },
        stroke: { curve: 'smooth', width: 2 },
        fill: {
          type: 'gradient',
          gradient: { opacityFrom: 0.35, opacityTo: 0.02, stops: [0, 100] },
        },
        colors: [BRAND],
        tooltip: { enabled: false },
      }}
    />
  )
}

interface CapitalRadarProps {
  tierLabel: string
  tierIndex: number // 0..4 (solo, micro, small, medium, investment)
  height?: number
}

/**
 * Segmented capital-tier meter: 5 bars, the user's tier is filled, others muted.
 * Reads as a positional "you are here" indicator.
 */
export function CapitalTierMeter({ tierLabel, tierIndex, height = 100 }: CapitalRadarProps) {
  const bars = [
    { label: 'Solo', v: tierIndex >= 0 ? 100 : 12 },
    { label: 'Micro', v: tierIndex >= 1 ? 100 : 12 },
    { label: 'Small', v: tierIndex >= 2 ? 100 : 12 },
    { label: 'Medium', v: tierIndex >= 3 ? 100 : 12 },
    { label: 'Invest', v: tierIndex >= 4 ? 100 : 12 },
  ]
  return (
    <div>
      <Chart
        type="bar"
        height={height}
        series={[{ name: 'Tier', data: bars.map((b) => b.v) }]}
        options={{
          chart: { toolbar: { show: false }, sparkline: { enabled: false } },
          plotOptions: {
            bar: {
              borderRadius: 3,
              borderRadiusApplication: 'end',
              columnWidth: '55%',
              distributed: true,
              colors: {
                ranges: [
                  { from: 0, to: 20, color: 'rgb(var(--border-strong))' },
                  { from: 21, to: 101, color: BRAND },
                ],
              },
            },
          },
          dataLabels: { enabled: false },
          xaxis: {
            categories: bars.map((b) => b.label),
            labels: {
              style: { colors: CHART_MUTED, fontSize: '10px', fontWeight: 500 },
            },
            axisBorder: { show: false },
            axisTicks: { show: false },
          },
          yaxis: { show: false },
          grid: { show: false, padding: { top: 0, bottom: 0, left: -8, right: -8 } },
          legend: { show: false },
          tooltip: { enabled: false },
        }}
      />
      <p className="mt-1 text-center font-mono text-[11px] text-ink-faint">
        Your tier: <span className="text-ink">{tierLabel}</span>
      </p>
    </div>
  )
}

interface CategoryDensityProps {
  categoriesInInterest: number // how many of user's interests hit each MOR category
  totalCategories: number
  totalSectors: number
  matchedSectors: number
  height?: number
}

/** "How much of the market your interests cover" — twin donuts. */
export function InterestCoverage({
  categoriesInInterest,
  totalCategories,
  totalSectors,
  matchedSectors,
  height = 180,
}: CategoryDensityProps) {
  const catPct = Math.round((categoriesInInterest / Math.max(1, totalCategories)) * 100)
  const sectorPct = Math.round((matchedSectors / Math.max(1, totalSectors)) * 100)
  return (
    <Chart
      type="radialBar"
      height={height}
      series={[catPct, sectorPct]}
      options={{
        chart: { sparkline: { enabled: false } },
        plotOptions: {
          radialBar: {
            hollow: { size: '32%' },
            track: { background: CHART_GRID, margin: 4 },
            dataLabels: {
              name: { fontSize: '11px', color: CHART_MUTED, offsetY: 6 },
              value: { fontSize: '18px', color: CHART_INK, fontWeight: 700, formatter: (v) => `${v}%` },
              total: {
                show: true,
                label: 'Coverage',
                color: CHART_FAINT,
                fontSize: '10px',
                formatter: () => `${matchedSectors}/${totalSectors}`,
              },
            },
          },
        },
        stroke: { lineCap: 'round' },
        colors: [CHART_1, CHART_2],
        labels: ['Categories', 'Sectors'],
        legend: {
          show: true,
          position: 'bottom',
          fontSize: '10px',
          labels: { colors: CHART_MUTED },
          markers: { size: 4 },
        },
      }}
    />
  )
}

// (previously re-exported the CHART_* + BRAND constants; a client-boundary
// module can only export components/functions cleanly — string constants
// alongside components triggered a Next 15 webpack ref-generation bug that
// made every named import come back undefined at render time.)
