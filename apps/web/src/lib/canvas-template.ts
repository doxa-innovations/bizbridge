import { getPayloadClient } from './payload'
import type { CurrentUser } from './auth-server'

/** All node types supported by the canvas editor. Adding a new node type
 *  means bumping this list AND the client-side `NODE_TYPES` registry. */
export type CanvasNodeType =
  | 'sector'
  | 'idea'
  | 'task'
  | 'question'
  | 'contact'
  | 'doc'
  | 'milestone'
  | 'note'

export interface CanvasNode {
  id: string
  type: CanvasNodeType
  position: { x: number; y: number }
  data: Record<string, unknown>
  /** User-set explicit dimensions (via the NodeResizer). Optional — a
   *  node that has never been resized just uses its component's default
   *  intrinsic size. */
  width?: number | null
  height?: number | null
}

export interface CanvasEdge {
  id: string
  source: string
  target: string
  label?: string
}

export interface CanvasSeed {
  nodes: CanvasNode[]
  edges: CanvasEdge[]
}

/**
 * A named starter template. Users pick one from the canvas list page and
 * we mint a fresh canvas seeded from the returned nodes + edges. Some
 * templates hit the DB to resolve a real sector doc (so its slug + human
 * name are pinned correctly) — hence async.
 */
export interface TemplateDefinition {
  key: string
  title: string
  description: string
  /** Short tag used in the list card — "Sales flow", "Setup path", etc. */
  vibe: string
  /** Called at mint time with the current user (for onboarding-aware
   *  templates). Must return a valid seed even when the DB is unreachable. */
  build: (user: CurrentUser) => Promise<CanvasSeed>
}

// ---- helpers -----------------------------------------------------------

/** Look up sector docs by MOR code, tolerantly. Returns whatever the DB
 *  gave us — templates should still emit a usable canvas even when a code
 *  is missing so the seed never crashes. */
async function resolveSectors(codes: string[]) {
  if (codes.length === 0) return [] as Array<{ mor_code: string; name_en: string; slug: string }>
  try {
    const payload = await getPayloadClient()
    const res = await payload.find({
      collection: 'business-sectors',
      where: { or: codes.map((c) => ({ mor_code: { equals: c } })) },
      limit: codes.length,
      depth: 0,
    })
    return res.docs.map((d) => ({
      mor_code: d.mor_code as string,
      name_en: d.name_en as string,
      slug: d.slug as string,
    }))
  } catch {
    return []
  }
}

/** Pin a sector node into a seed, filling data from a DB match when
 *  available, or falling back to just the MOR code when not. */
function sectorNode(
  id: string,
  position: { x: number; y: number },
  match: { mor_code: string; name_en: string; slug: string } | null,
  fallbackCode: string,
  fallbackTitle: string,
): CanvasNode {
  return {
    id,
    type: 'sector',
    position,
    data: match
      ? { morCode: match.mor_code, title: match.name_en, slug: match.slug }
      : { morCode: fallbackCode, title: fallbackTitle, slug: null },
  }
}

// ---- templates ---------------------------------------------------------

/** Empty seed for the "Blank" template. */
export function buildBlankTemplate(): CanvasSeed {
  return { nodes: [], edges: [] }
}

/**
 * Onboarding auto-seed. Uses up to 3 of the user's interest sectors +
 * generic starter Question/Task/Milestone so a new user sees something
 * personal rather than an empty page. Existing behaviour, extracted here
 * so it slots into the template registry.
 */
export async function buildOnboardingTemplate(user: CurrentUser): Promise<CanvasSeed> {
  const nodes: CanvasNode[] = []
  const edges: CanvasEdge[] = []
  const interestCodes = (user.interestSectors ?? []).slice(0, 3)
  const sectorDocs = await resolveSectors(interestCodes)

  sectorDocs.forEach((doc, i) => {
    nodes.push(sectorNode(`sector-${doc.mor_code}`, { x: 80 + i * 280, y: 80 }, doc, doc.mor_code, doc.name_en))
  })

  nodes.push({
    id: 'question-capital',
    type: 'question',
    position: { x: 80, y: 320 },
    data: { text: 'What is the minimum capital I actually need for this sector?' },
  })
  nodes.push({
    id: 'task-name',
    type: 'task',
    position: { x: 360, y: 320 },
    data: { text: 'Reserve a business name on eTrade', done: false },
  })
  nodes.push({
    id: 'milestone-open',
    type: 'milestone',
    position: { x: 640, y: 320 },
    data: { text: 'Business registered and open', target: null as string | null },
  })

  if (sectorDocs[0]) {
    const sectorId = `sector-${sectorDocs[0].mor_code}`
    edges.push({ id: `e-${sectorId}-question`, source: sectorId, target: 'question-capital' })
    edges.push({ id: `e-${sectorId}-task`, source: sectorId, target: 'task-name' })
  }
  edges.push({ id: `e-task-milestone`, source: 'task-name', target: 'milestone-open' })

  return { nodes, edges }
}

/**
 * Coffee export template — walks a typical Ethiopian smallholder-collector
 * → export flow. Anchored on the "Export of Processed Coffee" MOR code
 * with revenue-side milestones (first LC, first container FOB Djibouti).
 */
async function buildCoffeeExport(_user: CurrentUser): Promise<CanvasSeed> {
  // 66141 = Processed coffee export (confirmed in seed CAPITAL_TIERS).
  const [sector] = await resolveSectors(['66141'])
  return {
    nodes: [
      sectorNode('sector', { x: 60, y: 40 }, sector ?? null, '66141', 'Coffee exporter'),
      { id: 'task-license', type: 'task', position: { x: 380, y: 40 }, data: { text: 'Get Coffee Exporter licence (Coffee & Tea Authority)', done: false } },
      { id: 'task-eic', type: 'task', position: { x: 380, y: 160 }, data: { text: 'Register with ECX + bond a member trader (or use a broker)', done: false } },
      { id: 'contact-buyer', type: 'contact', position: { x: 380, y: 280 }, data: { name: 'Green-coffee buyer', role: 'Roaster / importer abroad', contact: 'Direct or via GCA lead list' } },
      { id: 'doc-lc', type: 'doc', position: { x: 720, y: 40 }, data: { title: 'Letter of Credit template', source: 'Buyer\'s bank issues; NBE circular 2021/38 governs FX' } },
      { id: 'doc-quality', type: 'doc', position: { x: 720, y: 160 }, data: { title: 'ECX quality grading certificate', source: 'Issued at Adama / Hawassa warehouse' } },
      { id: 'task-forwarder', type: 'task', position: { x: 720, y: 280 }, data: { text: 'Book forwarder Adama → Djibouti (FOB terms)', done: false } },
      { id: 'question-fx', type: 'question', position: { x: 1060, y: 40 }, data: { text: 'When does NBE require 40% forced retention on export FX?' } },
      { id: 'milestone-lc', type: 'milestone', position: { x: 1060, y: 180 }, data: { text: 'First LC opened by buyer', target: null } },
      { id: 'milestone-ship', type: 'milestone', position: { x: 1060, y: 300 }, data: { text: 'First container FOB Djibouti — revenue in USD', target: null } },
    ],
    edges: [
      { id: 'e-1', source: 'sector', target: 'task-license' },
      { id: 'e-2', source: 'sector', target: 'task-eic' },
      { id: 'e-3', source: 'sector', target: 'contact-buyer' },
      { id: 'e-4', source: 'task-license', target: 'doc-lc' },
      { id: 'e-5', source: 'task-eic', target: 'doc-quality' },
      { id: 'e-6', source: 'contact-buyer', target: 'doc-lc', label: 'buyer issues' },
      { id: 'e-7', source: 'doc-quality', target: 'task-forwarder' },
      { id: 'e-8', source: 'doc-lc', target: 'milestone-lc' },
      { id: 'e-9', source: 'task-forwarder', target: 'milestone-ship' },
      { id: 'e-10', source: 'milestone-lc', target: 'milestone-ship' },
      { id: 'e-11', source: 'milestone-ship', target: 'question-fx', label: 'FX retention?' },
    ],
  }
}

/**
 * Small restaurant template — 40-seat casual dining in Bishoftu. Runs
 * from lease → licence → hire → soft-open → break-even.
 */
async function buildRestaurant(_user: CurrentUser): Promise<CanvasSeed> {
  // 64114 = Restaurant (confirmed in seed CAPITAL_TIERS).
  const [sector] = await resolveSectors(['64114'])
  return {
    nodes: [
      sectorNode('sector', { x: 60, y: 40 }, sector ?? null, '64114', 'Restaurant'),
      { id: 'task-lease', type: 'task', position: { x: 380, y: 40 }, data: { text: 'Sign 3-year lease (main-road frontage, 80–120 m²)', done: false } },
      { id: 'task-kitchen', type: 'task', position: { x: 380, y: 160 }, data: { text: 'Kitchen fit-out (hood, three-comp sink, cold storage)', done: false } },
      { id: 'task-licence', type: 'task', position: { x: 720, y: 40 }, data: { text: 'Food licence — Bishoftu City Trade Office', done: false } },
      { id: 'task-health', type: 'task', position: { x: 720, y: 160 }, data: { text: 'Food-handler health cert for every kitchen staff', done: false } },
      { id: 'contact-supplier', type: 'contact', position: { x: 720, y: 280 }, data: { name: 'Meat + veg supplier', role: 'Weekly delivery contract', contact: 'Piassa market wholesalers' } },
      { id: 'task-hire', type: 'task', position: { x: 1060, y: 40 }, data: { text: 'Hire chef + 2 waiters + 1 dishwasher', done: false } },
      { id: 'doc-menu', type: 'doc', position: { x: 1060, y: 180 }, data: { title: 'Menu + pricing', source: 'Draft in Google Docs, print 20 laminated' } },
      { id: 'milestone-soft', type: 'milestone', position: { x: 1400, y: 60 }, data: { text: 'Soft-open (friends + family)', target: null } },
      { id: 'milestone-open', type: 'milestone', position: { x: 1400, y: 180 }, data: { text: 'Public open — first revenue', target: null } },
      { id: 'question-break', type: 'question', position: { x: 1400, y: 300 }, data: { text: 'What daily cover count clears rent + payroll + food cost?' } },
    ],
    edges: [
      { id: 'e-1', source: 'sector', target: 'task-lease' },
      { id: 'e-2', source: 'task-lease', target: 'task-kitchen' },
      { id: 'e-3', source: 'task-kitchen', target: 'task-licence' },
      { id: 'e-4', source: 'task-licence', target: 'task-health' },
      { id: 'e-5', source: 'task-health', target: 'contact-supplier' },
      { id: 'e-6', source: 'task-licence', target: 'task-hire' },
      { id: 'e-7', source: 'task-hire', target: 'doc-menu' },
      { id: 'e-8', source: 'doc-menu', target: 'milestone-soft' },
      { id: 'e-9', source: 'milestone-soft', target: 'milestone-open' },
      { id: 'e-10', source: 'milestone-open', target: 'question-break' },
    ],
  }
}

/**
 * Software startup template — 2-founder PLC, remote-first, contract
 * revenue first then product later. Anchored on "Software Development".
 */
async function buildSoftwareStartup(_user: CurrentUser): Promise<CanvasSeed> {
  // 39141 = Software development (confirmed in seed CAPITAL_TIERS).
  const [sector] = await resolveSectors(['39141'])
  return {
    nodes: [
      sectorNode('sector', { x: 60, y: 40 }, sector ?? null, '39141', 'Software developer'),
      { id: 'task-plc', type: 'task', position: { x: 380, y: 40 }, data: { text: 'Register PLC — 2 founders, min ETB 15k paid-up (or 50k for local BPO)', done: false } },
      { id: 'task-tin', type: 'task', position: { x: 380, y: 160 }, data: { text: 'Get TIN + VAT registration', done: false } },
      { id: 'task-bank', type: 'task', position: { x: 380, y: 280 }, data: { text: 'Open CBE / Awash business account + FX account (for USD invoices)', done: false } },
      { id: 'contact-client-1', type: 'contact', position: { x: 720, y: 40 }, data: { name: 'Anchor client', role: 'First paying contract', contact: 'LinkedIn cold-outbound → intro call' } },
      { id: 'doc-msa', type: 'doc', position: { x: 720, y: 180 }, data: { title: 'Master Services Agreement template', source: 'Bonnamlaw / CommonAccord — adapt for ET jurisdiction' } },
      { id: 'task-nbe', type: 'task', position: { x: 720, y: 300 }, data: { text: 'Register the FX-inflow with NBE (services export)', done: false } },
      { id: 'milestone-mrr-1', type: 'milestone', position: { x: 1060, y: 60 }, data: { text: 'First invoice paid — MRR $1', target: null } },
      { id: 'idea-product', type: 'idea', position: { x: 1060, y: 200 }, data: { text: 'Turn recurring contract work into a productized SaaS' } },
      { id: 'milestone-mrr-10k', type: 'milestone', position: { x: 1400, y: 60 }, data: { text: '$10k MRR — hire a third engineer', target: null } },
      { id: 'question-tax', type: 'question', position: { x: 1400, y: 200 }, data: { text: 'Do we qualify for the export-services tax holiday (5 years)?' } },
    ],
    edges: [
      { id: 'e-1', source: 'sector', target: 'task-plc' },
      { id: 'e-2', source: 'task-plc', target: 'task-tin' },
      { id: 'e-3', source: 'task-tin', target: 'task-bank' },
      { id: 'e-4', source: 'task-bank', target: 'contact-client-1' },
      { id: 'e-5', source: 'contact-client-1', target: 'doc-msa', label: 'sign' },
      { id: 'e-6', source: 'doc-msa', target: 'task-nbe' },
      { id: 'e-7', source: 'task-nbe', target: 'milestone-mrr-1' },
      { id: 'e-8', source: 'milestone-mrr-1', target: 'idea-product' },
      { id: 'e-9', source: 'idea-product', target: 'milestone-mrr-10k' },
      { id: 'e-10', source: 'milestone-mrr-10k', target: 'question-tax' },
    ],
  }
}

/**
 * Retail shop template — a 30-60 m² neighbourhood shop (electronics,
 * apparel, groceries — flexible). Runs from lease → inventory → open.
 */
async function buildRetailShop(_user: CurrentUser): Promise<CanvasSeed> {
  // 62114 = Minimarket / suq (confirmed in seed CAPITAL_TIERS).
  const [sector] = await resolveSectors(['62114'])
  return {
    nodes: [
      sectorNode('sector', { x: 60, y: 40 }, sector ?? null, '62114', 'Retail shop'),
      { id: 'task-lease', type: 'task', position: { x: 380, y: 40 }, data: { text: 'Sign shop lease — 30–60 m² on a foot-traffic street', done: false } },
      { id: 'task-fit', type: 'task', position: { x: 380, y: 160 }, data: { text: 'Shelving + POS + signage', done: false } },
      { id: 'task-licence', type: 'task', position: { x: 380, y: 280 }, data: { text: 'Trade licence — City Trade Office (renewable yearly)', done: false } },
      { id: 'task-inventory', type: 'task', position: { x: 720, y: 40 }, data: { text: 'Buy opening inventory (roughly 2× monthly sales target)', done: false } },
      { id: 'contact-supplier', type: 'contact', position: { x: 720, y: 160 }, data: { name: 'Wholesale supplier', role: '30-day terms after 3 orders', contact: 'Merkato / Piassa / import agents' } },
      { id: 'doc-permits', type: 'doc', position: { x: 720, y: 280 }, data: { title: 'Weights & measures cert (if selling by kg)', source: 'Ethiopian Conformity Assessment Enterprise' } },
      { id: 'milestone-open', type: 'milestone', position: { x: 1060, y: 60 }, data: { text: 'Open — first sale', target: null } },
      { id: 'question-margin', type: 'question', position: { x: 1060, y: 200 }, data: { text: 'What gross margin do we need to survive the current birr FX volatility?' } },
      { id: 'milestone-payback', type: 'milestone', position: { x: 1400, y: 60 }, data: { text: 'Break-even on setup cost', target: null } },
    ],
    edges: [
      { id: 'e-1', source: 'sector', target: 'task-lease' },
      { id: 'e-2', source: 'task-lease', target: 'task-fit' },
      { id: 'e-3', source: 'task-fit', target: 'task-licence' },
      { id: 'e-4', source: 'task-licence', target: 'task-inventory' },
      { id: 'e-5', source: 'task-inventory', target: 'contact-supplier' },
      { id: 'e-6', source: 'task-licence', target: 'doc-permits' },
      { id: 'e-7', source: 'contact-supplier', target: 'milestone-open' },
      { id: 'e-8', source: 'milestone-open', target: 'question-margin' },
      { id: 'e-9', source: 'question-margin', target: 'milestone-payback' },
    ],
  }
}

/**
 * Consulting service template — solo or 2-person consultancy selling
 * expertise (management, tax, legal, IT). Low capex, revenue = billable
 * hours × rate.
 */
async function buildConsulting(_user: CurrentUser): Promise<CanvasSeed> {
  // 86114 = Business / management consultancy (confirmed in seed CAPITAL_TIERS).
  const [sector] = await resolveSectors(['86114'])
  return {
    nodes: [
      sectorNode('sector', { x: 60, y: 40 }, sector ?? null, '86114', 'Business consultant'),
      { id: 'task-register', type: 'task', position: { x: 380, y: 40 }, data: { text: 'Sole prop or PLC? Register accordingly (PLC for shielding personal assets)', done: false } },
      { id: 'task-tin', type: 'task', position: { x: 380, y: 160 }, data: { text: 'TIN + VAT (if projected turnover > ETB 1M/yr)', done: false } },
      { id: 'task-credentials', type: 'task', position: { x: 380, y: 280 }, data: { text: 'Publish 2–3 case-studies on LinkedIn + a simple site', done: false } },
      { id: 'contact-first', type: 'contact', position: { x: 720, y: 40 }, data: { name: 'First paying client', role: 'Warm intro > cold outreach', contact: 'Ex-colleagues, alumni network' } },
      { id: 'doc-proposal', type: 'doc', position: { x: 720, y: 180 }, data: { title: 'Proposal + scope-of-work template', source: 'Reusable Notion doc — fixed-fee vs. day-rate variants' } },
      { id: 'doc-invoice', type: 'doc', position: { x: 720, y: 300 }, data: { title: 'Invoice template (VAT-compliant)', source: 'MOR-issued fiscal receipt required over ETB 20' } },
      { id: 'milestone-1st-fee', type: 'milestone', position: { x: 1060, y: 40 }, data: { text: 'First invoice paid', target: null } },
      { id: 'idea-productize', type: 'idea', position: { x: 1060, y: 180 }, data: { text: 'Turn best-selling engagement into a fixed-price 4-week package' } },
      { id: 'milestone-retainer', type: 'milestone', position: { x: 1400, y: 60 }, data: { text: 'First monthly retainer client', target: null } },
      { id: 'question-scale', type: 'question', position: { x: 1400, y: 200 }, data: { text: 'When do we hire a junior — at 60% utilisation or 80%?' } },
    ],
    edges: [
      { id: 'e-1', source: 'sector', target: 'task-register' },
      { id: 'e-2', source: 'task-register', target: 'task-tin' },
      { id: 'e-3', source: 'task-tin', target: 'task-credentials' },
      { id: 'e-4', source: 'task-credentials', target: 'contact-first' },
      { id: 'e-5', source: 'contact-first', target: 'doc-proposal' },
      { id: 'e-6', source: 'doc-proposal', target: 'doc-invoice' },
      { id: 'e-7', source: 'doc-invoice', target: 'milestone-1st-fee' },
      { id: 'e-8', source: 'milestone-1st-fee', target: 'idea-productize' },
      { id: 'e-9', source: 'idea-productize', target: 'milestone-retainer' },
      { id: 'e-10', source: 'milestone-retainer', target: 'question-scale' },
    ],
  }
}

// ---- registry -----------------------------------------------------------

export const CANVAS_TEMPLATES: TemplateDefinition[] = [
  {
    key: 'blank',
    title: 'Blank canvas',
    description: 'Start from an empty page.',
    vibe: 'Start empty',
    build: async () => buildBlankTemplate(),
  },
  {
    key: 'onboarding',
    title: 'Personal auto-seed',
    description: 'Pins your onboarding sectors + a starter question, task and milestone.',
    vibe: 'From your profile',
    build: buildOnboardingTemplate,
  },
  {
    key: 'coffee-export',
    title: 'Coffee exporter',
    description: 'ECX registration → LC → forwarding → first container FOB Djibouti.',
    vibe: 'Sales flow',
    build: buildCoffeeExport,
  },
  {
    key: 'restaurant',
    title: 'Small restaurant',
    description: '40-seat casual dining — lease, licence, kitchen, soft-open, break-even.',
    vibe: 'Setup path',
    build: buildRestaurant,
  },
  {
    key: 'software-startup',
    title: 'Software startup (services → product)',
    description: 'PLC → first contract → $1 MRR → productize → $10k MRR.',
    vibe: 'Revenue ladder',
    build: buildSoftwareStartup,
  },
  {
    key: 'retail-shop',
    title: 'Retail shop',
    description: 'Neighbourhood shop — lease, inventory, supplier terms, break-even.',
    vibe: 'Setup path',
    build: buildRetailShop,
  },
  {
    key: 'consulting',
    title: 'Consulting service',
    description: 'Solo expertise → first invoice → productized package → retainer.',
    vibe: 'Revenue ladder',
    build: buildConsulting,
  },
]

export function findTemplate(key: string): TemplateDefinition {
  return CANVAS_TEMPLATES.find((t) => t.key === key) ?? CANVAS_TEMPLATES[0]!
}
