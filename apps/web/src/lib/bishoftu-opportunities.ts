/**
 * Curated shortlist of business opportunities in Bishoftu (Debrezeit),
 * ranked by "readiness" — a subjective 0-100 score composed of market
 * timing × capital intensity × airport-boom leverage. Numbers reflect
 * mid-2026 field observation, not survey data.
 *
 * Shared between the marketing /bishoftu Pulse page and the dashboard
 * home so both surfaces stay in lockstep — bump this array to update
 * both places at once.
 *
 * `sector_mor` is a real MOR code from our seeded catalogue; the
 * dashboard link resolves it to /dashboard/sectors/<slug> at render.
 */
export interface BishoftuOpportunity {
  rank: number
  name: string
  sector_mor: string
  readiness: number
  /** Short "why now" that shows on the dashboard row — the marketing
   *  page doesn't render this yet but it slots in cleanly there too. */
  why: string
}

export const BISHOFTU_OPPORTUNITIES: BishoftuOpportunity[] = [
  {
    rank: 1,
    name: 'Boutique tourism / agritourism',
    sector_mor: '64116',
    readiness: 92,
    why: 'Five crater lakes + Addis-day-trip demand; airport project doubles inbound traffic 2028+.',
  },
  {
    rank: 2,
    name: 'F&B (cafe / restaurant / cloud kitchen)',
    sector_mor: '64114',
    readiness: 88,
    why: 'Air-Force + federal employee base drives lunch spend; weekend visitors from Addis top it up.',
  },
  {
    rank: 3,
    name: 'Event coordination',
    sector_mor: '72121',
    readiness: 82,
    why: 'Bishoftu is Oromia\'s de-facto conference / retreat city — Ellilta, Kuriftu, Dreamland run at ~80% occupancy on weekends.',
  },
  {
    rank: 4,
    name: 'Adventure / lake tourism',
    sector_mor: '72111',
    readiness: 78,
    why: 'Kayaking, birding, horse-riding are under-supplied vs. demand from Addis-based expats + diaspora returnees.',
  },
  {
    rank: 5,
    name: 'Guesthouse / pension',
    sector_mor: '64117',
    readiness: 76,
    why: 'Mid-tier lodging gap between hotels (Kuriftu, Dreamland) and homestays. 8-12 rooms = sweet spot.',
  },
  {
    rank: 6,
    name: 'Digital marketing & content',
    sector_mor: '86811',
    readiness: 74,
    why: 'Local hotels + tour operators still buy paid Facebook without measurement. Room for retainer work.',
  },
  {
    rank: 7,
    name: 'Cold storage & logistics',
    sector_mor: '74112',
    readiness: 70,
    why: 'Airport project will need cold-chain for perishables + pharma; first mover locks in EIC-adjacent land now.',
  },
  {
    rank: 8,
    name: 'Agribusiness / dairy processing',
    sector_mor: '31115',
    readiness: 68,
    why: 'Oromia dairy belt terminates near Bishoftu; smallholder milk aggregation + chilled processing is under-capacity.',
  },
  {
    rank: 9,
    name: 'Vocational training centers',
    sector_mor: '91115',
    readiness: 64,
    why: 'Hospitality, culinary, aviation-ground-services training all lag the expected 2028 headcount ramp.',
  },
  {
    rank: 10,
    name: 'Construction supply (post-airport boom)',
    sector_mor: '61831',
    readiness: 60,
    why: 'Cement, aggregate, rebar demand ramps ~2027 with the terminal-construction phase.',
  },
]

/** Sources cited on the dashboard card. Kept together with the data so
 *  the citation stays honest when the data changes. */
export const BISHOFTU_OPPORTUNITY_SOURCES: Array<{ label: string; href?: string; updated?: string }> = [
  {
    label: 'Ethiopian Airports Enterprise — Bishoftu 4th intl. airport plan',
    href: 'https://www.eae.gov.et',
    updated: '2026 Q1 EIA phase',
  },
  { label: 'Oromia Investment Commission — Bishoftu zone stats', updated: '2026' },
  { label: 'BizBridge field observation + operator interviews', updated: '2026-08' },
]
