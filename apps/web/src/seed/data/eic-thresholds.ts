/**
 * Foreign investment capital thresholds under Ethiopia's Investment
 * Proclamation No. 1180/2020 and the successor 2022/2026 amendments.
 * Figures are USD, as EIC still denominates thresholds in USD (not ETB)
 * for foreign-owned entities.
 *
 * These are BROAD indicative rules, keyed by MOR category slug (the
 * first digit of the sector code). Real EIC decisions are made
 * per-application; sector-specific incentives can also reduce or
 * waive thresholds under performance-based regimes introduced in
 * 2026. **Every sector detail card that renders this data must link
 * out to the EIC for the current, definitive number.**
 *
 * Sources cross-checked 2026-08-17:
 * - Mondaq, "Foreign Investment in Ethiopia: The Complete Legal
 *   Guide 2026" (Aug 2026).
 * - Ethiopia Investment Commission, invest-ethiopia.com.
 *
 * DO NOT quietly change these numbers without updating the sourcedAt
 * field — Cheri needs to know when the memory is stale.
 */

export interface EicThreshold {
  categorySlug: string
  /** 100% foreign-owned minimum, in USD. */
  foreignSoloUsd: number
  /** JV with an Ethiopian national, in USD. */
  jvUsd: number
  /**
   * True when this category benefits from the reduced $100k / $50k
   * "ICT, engineering, publishing" tier under Proclamation 1180/2020.
   */
  reduced: boolean
  /** Sectors within this category CLOSED to foreign investment (partial). */
  restrictions: string[]
  /** Human-readable summary rendered under the numbers. */
  note: string
}

export const EIC_DEFAULT_THRESHOLDS = {
  foreignSoloUsd: 200_000,
  jvUsd: 150_000,
  reducedForeignSoloUsd: 100_000,
  reducedJvUsd: 50_000,
  reinvestmentExempt: true,
} as const

export const EIC_THRESHOLDS: EicThreshold[] = [
  {
    categorySlug: 'agriculture-hunting-forestry-fishing',
    foreignSoloUsd: 200_000,
    jvUsd: 150_000,
    reduced: false,
    restrictions: [],
    note: 'Foreign investors welcome across most agri sub-sectors. Export-oriented floriculture, horticulture, and coffee processing benefit from performance-based tax incentives introduced in 2026.',
  },
  {
    categorySlug: 'mining-and-quarrying',
    foreignSoloUsd: 200_000,
    jvUsd: 150_000,
    reduced: false,
    restrictions: ['Artisanal small-scale mining is reserved for Ethiopian nationals.'],
    note: 'Large-scale mining requires a separate mining licence from the Ministry of Mines in addition to the EIC investment permit.',
  },
  {
    categorySlug: 'manufacturing',
    foreignSoloUsd: 200_000,
    jvUsd: 150_000,
    reduced: false,
    restrictions: [],
    note: 'Manufacturing is a priority sector — reduced-threshold status can apply where the activity qualifies as engineering-intensive. Export-oriented factories in industrial parks get further incentives.',
  },
  {
    categorySlug: 'electricity-gas-water-waste',
    foreignSoloUsd: 200_000,
    jvUsd: 150_000,
    reduced: false,
    restrictions: [
      'Electricity transmission and distribution are reserved for the government.',
    ],
    note: 'Independent power producers (IPPs) in renewable generation are open to foreign investment under PPAs with EEP.',
  },
  {
    categorySlug: 'construction',
    foreignSoloUsd: 100_000,
    jvUsd: 50_000,
    reduced: true,
    restrictions: [],
    note: 'Architectural and engineering consultancy qualifies for the reduced $100k / $50k threshold. General building contracting outside of that scope may fall under the standard tier — confirm with EIC.',
  },
  {
    categorySlug: 'wholesale-retail-hotels-import-export',
    foreignSoloUsd: 200_000,
    jvUsd: 150_000,
    reduced: false,
    restrictions: [
      'Small-scale retail trade is reserved for Ethiopian nationals.',
      'Import and export of goods (with limited exceptions) is reserved for Ethiopian nationals.',
      'Wholesale trade was partially liberalised in 2024 — verify current status per product line.',
    ],
    note: 'Hotels, restaurants, and tour operations are fully open. Star-rated hospitality has its own reduced-threshold regime under the Ministry of Tourism.',
  },
  {
    categorySlug: 'transport-storage-communication',
    foreignSoloUsd: 200_000,
    jvUsd: 150_000,
    reduced: false,
    restrictions: [
      'Domestic freight and passenger transport by road are reserved for Ethiopian nationals.',
      'Telecommunications is open only to licensed operators under NBE and ECA rules.',
    ],
    note: 'International logistics, shipping, and freight forwarding are open. Warehousing and cold chain are priority sectors.',
  },
  {
    categorySlug: 'finance-insurance-real-estate-business',
    foreignSoloUsd: 100_000,
    jvUsd: 50_000,
    reduced: true,
    restrictions: [
      'Banking, insurance, and micro-finance were opened to foreign investors in 2024 under separate NBE licences with their own capital regimes (not the EIC tier).',
    ],
    note: 'ICT services, management consultancy, and other business services qualify for the reduced $100k / $50k threshold. Real estate development uses the standard tier and requires proof of land access.',
  },
  {
    categorySlug: 'community-social-personal-services',
    foreignSoloUsd: 100_000,
    jvUsd: 50_000,
    reduced: true,
    restrictions: [
      'Primary and private security services (guard services) are reserved for Ethiopian nationals.',
      'Certain media activities remain restricted — broadcasting requires an Ethiopian Media Authority licence in addition to the EIC permit.',
      'Legal services and accounting/audit are reserved for professionals licensed in Ethiopia (not automatically closed to foreign ownership, but requires local professionals).',
    ],
    note: 'Publishing and advertising qualify for the reduced $100k / $50k threshold. Education and health services are open with a sector-specific licence from the relevant ministry.',
  },
]

export function eicThresholdForCategory(slug: string | null | undefined): EicThreshold | null {
  if (!slug) return null
  return EIC_THRESHOLDS.find((t) => t.categorySlug === slug) ?? null
}

export const EIC_SOURCED_AT = '2026-08-17'
