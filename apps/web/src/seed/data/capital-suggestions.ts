/**
 * Curated capital-tier → sector-suggestion mapping. Used by /suggest to give
 * founders an idea of what business they can realistically open at their
 * budget in Ethiopia. Numbers are indicative starting capital in ETB (birr),
 * reflecting post-float 2026 costs. USD equivalents in the UI are derived
 * client-side from an approximate FX rate.
 *
 * These are opinions, not official minimums. Actual capital requirements
 * depend on Ethiopian Investment Commission tiers (higher for foreigners,
 * see EIC guidelines) and sector-specific licences.
 */

export type CapitalTier = {
  key: string
  min_etb: number
  max_etb: number
  label: string
  headline: string
  vibe: string
  sector_codes: string[]
}

export const CAPITAL_TIERS: CapitalTier[] = [
  {
    key: 'solo',
    min_etb: 30_000,
    max_etb: 300_000,
    label: 'Solo',
    headline: 'ETB 30k–300k — freelance and home-based only',
    vibe: 'You already own the tools (laptop, sewing machine, a few beehives). No rented shop, no employees, invoicing from home. Fits a side hustle you can register properly.',
    sector_codes: [
      '39141', // Software dev (freelance from own laptop)
      '86114', // Business consultancy (solo)
      '85211', // Authorized accountant (solo practice)
      '11123', // Beekeeping (a handful of hives)
    ],
  },
  {
    key: 'micro',
    min_etb: 300_000,
    max_etb: 2_000_000,
    label: 'Micro',
    headline: 'ETB 300k–2M — a kiosk, a suq, a small crew',
    vibe: 'Enough for a rented shopfront in Bishoftu/Adama, first stock, a helper or two. Rent + license + inventory eats most of it.',
    sector_codes: [
      '62114', // Minimarket / suq
      '64118', // Cafe & breakfast
      '73147', // Internet cafe
      '11122', // Poultry (small commercial)
      '33112', // Apparel manufacture (small)
      '62513', // Retail computer equipment (small stock)
    ],
  },
  {
    key: 'small',
    min_etb: 2_000_000,
    max_etb: 15_000_000,
    label: 'Small',
    headline: 'ETB 2M–15M — a real shop or a small team',
    vibe: 'Full restaurant kitchen, supermarket stock, small guest-house, or a proper workshop with 5–15 staff and 6 months of runway.',
    sector_codes: [
      '64114', // Restaurant
      '62113', // Supermarket
      '11117', // Floriculture (small greenhouse)
      '31111', // Meat processing (small)
      '61216', // Coffee/tea wholesale
      '86211', // Hotel/tourism consultancy
      '86311', // Health consultancy
      '72112', // Travel agency
    ],
  },
  {
    key: 'medium',
    min_etb: 15_000_000,
    max_etb: 150_000_000,
    label: 'Medium',
    headline: 'ETB 15M–150M — hotels, factories, exporters',
    vibe: '25–75 staff, real machines, regulated sector. You need audited books, a finance person, and patience with the licence queue.',
    sector_codes: [
      '64112', // Hotel (standard)
      '64113', // Star restaurant
      '85124', // Data center (small hosting)
      '35311', // Pharmaceuticals manufacture (mid)
      '51112', // Building contractor
      '66111', // Cereals export
      '66141', // Processed coffee export
      '66117', // Cut flowers export
      '62111', // Department store / small mall
      '21123', // Quarrying of minerals
    ],
  },
  {
    key: 'investment',
    min_etb: 150_000_000,
    max_etb: 5_000_000_000,
    label: 'Investment-tier',
    headline: 'ETB 150M+ — EIC-registered operations',
    vibe: 'Star hotel, industrial-scale ag, formal mining, colocation data centre. Meets Ethiopian Investment Commission foreign-capital thresholds; expect ministry-level oversight.',
    sector_codes: [
      '64111', // Star hotel
      '11117', // Floriculture (industrial)
      '66141', // Coffee export at scale
      '35311', // Pharma manufacture (large)
      '39141', // Software house (team of 20+)
      '85124', // Data center (colocation)
      '21123', // Mining (formal)
      '86114', // Investment consultancy (retainer-scale)
    ],
  },
]

export function tierForEtb(amountEtb: number): CapitalTier {
  for (const t of CAPITAL_TIERS) {
    if (amountEtb >= t.min_etb && amountEtb < t.max_etb) return t
  }
  return CAPITAL_TIERS[CAPITAL_TIERS.length - 1]!
}
