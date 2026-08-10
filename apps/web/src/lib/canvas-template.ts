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

export interface CanvasNode {
  id: string
  type: CanvasNodeType
  position: { x: number; y: number }
  data: Record<string, unknown>
}

export interface CanvasEdge {
  id: string
  source: string
  target: string
  label?: string
}

interface AutoTemplate {
  nodes: CanvasNode[]
  edges: CanvasEdge[]
}

/**
 * Seed a fresh canvas from what we already know about the user via
 * onboarding — up to 3 sector nodes for their interest sectors (falling
 * back to interest categories), plus a couple of scaffolding nodes.
 *
 * The template is intentionally loose — 4-6 starter nodes so the user has
 * something to react to rather than an empty white canvas, but not so many
 * that it feels prescriptive.
 */
export async function buildOnboardingTemplate(user: CurrentUser): Promise<AutoTemplate> {
  const nodes: CanvasNode[] = []
  const edges: CanvasEdge[] = []

  // Resolve interest sectors → real sector docs so we can pin real titles +
  // slugs on the node data. Interest sectors are stored as MOR codes; we
  // only need up to 3 to avoid crowding the canvas.
  const interestCodes = (user.interestSectors ?? []).slice(0, 3)
  let sectorDocs: Array<{ id: string | number; mor_code: string; name_en: string; slug: string }> = []
  if (interestCodes.length > 0) {
    try {
      const payload = await getPayloadClient()
      const res = await payload.find({
        collection: 'business-sectors',
        where: { or: interestCodes.map((c) => ({ mor_code: { equals: c } })) },
        limit: interestCodes.length,
        depth: 0,
      })
      sectorDocs = res.docs as typeof sectorDocs
    } catch {
      sectorDocs = []
    }
  }

  // Pin the sector nodes across the top row.
  sectorDocs.forEach((doc, i) => {
    nodes.push({
      id: `sector-${doc.mor_code}`,
      type: 'sector',
      position: { x: 80 + i * 280, y: 80 },
      data: {
        morCode: doc.mor_code,
        title: doc.name_en,
        slug: doc.slug,
      },
    })
  })

  // A canonical starter question + task + milestone so the user has
  // something to connect to.
  nodes.push({
    id: 'question-capital',
    type: 'question',
    position: { x: 80, y: 320 },
    data: {
      text: 'What is the minimum capital I actually need for this sector?',
    },
  })
  nodes.push({
    id: 'task-name',
    type: 'task',
    position: { x: 360, y: 320 },
    data: {
      text: 'Reserve a business name on eTrade',
      done: false,
    },
  })
  nodes.push({
    id: 'milestone-open',
    type: 'milestone',
    position: { x: 640, y: 320 },
    data: {
      text: 'Business registered and open',
      // Rough 90-day target from today — user can edit.
      target: null as string | null,
    },
  })

  // If we managed to pin at least one sector, connect it to the scaffolding
  // to give a visual anchor.
  if (sectorDocs[0]) {
    const sectorId = `sector-${sectorDocs[0].mor_code}`
    edges.push({ id: `e-${sectorId}-question`, source: sectorId, target: 'question-capital' })
    edges.push({ id: `e-${sectorId}-task`, source: sectorId, target: 'task-name' })
    edges.push({ id: `e-task-milestone`, source: 'task-name', target: 'milestone-open' })
  } else {
    // No pinned sector — just connect the scaffolding so it doesn't look random.
    edges.push({ id: `e-task-milestone`, source: 'task-name', target: 'milestone-open' })
  }

  return { nodes, edges }
}

/** Empty seed for the "Blank" template. */
export function buildBlankTemplate(): AutoTemplate {
  return { nodes: [], edges: [] }
}
