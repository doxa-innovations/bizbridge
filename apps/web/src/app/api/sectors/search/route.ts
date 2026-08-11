import { NextResponse } from 'next/server'
import { normalizeDatabaseUrl } from '@/lib/db-url'
import { Pool } from 'pg'
import { getPayloadClient } from '@/lib/payload'
import { getCurrentUser } from '@/lib/auth-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Deep sector search. Users don't know MOR codes; they know what the
 * business DOES ("delivery service", "food truck", "car wash"). Payload's
 * REST endpoint only searches `name_en` / `mor_code`, which misses those
 * queries entirely — the courier services sector never surfaces for
 * "delivery service" because the word "delivery" isn't in its title.
 *
 * This route runs one SQL query that ILIKEs the query token across:
 *   - sectors.name_en           (English name)
 *   - sectors.name_am           (Amharic name — for Amharic queries)
 *   - sectors.mor_code          (in case they DO know the code)
 *   - sectors.description_short (short human blurb)
 *   - permitted_operations_en   (the goldmine — what the licence allows)
 *   - permitted_operations_am
 *
 * Matches on operations get a snippet returned so the UI can show why we
 * matched ("… the licensee may transport goods within Ethiopia …" ← for
 * a "delivery" query).
 *
 * Ranking: exact code match first, then title matches, then description,
 * then operation-text matches. Distinct on sector id so a sector with
 * many matching operations still appears once.
 */

// Reuse a module-level pool so we don't open a fresh Neon connection per
// request. Neon's serverless driver would be cleaner but pg pool is what
// the rest of the app already uses.
let pool: Pool | null = null
function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: normalizeDatabaseUrl(process.env.DATABASE_URL),
      max: 3,
    })
  }
  return pool
}

interface SearchHit {
  id: number
  mor_code: string
  name_en: string
  name_am: string | null
  slug: string
  description_short: string | null
  match_reason: 'code' | 'title' | 'description' | 'operation'
  match_snippet: string | null
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const q = (url.searchParams.get('q') ?? '').trim()
  const limit = Math.min(20, Math.max(1, Number(url.searchParams.get('limit') ?? '10')))

  if (q.length < 2) {
    return NextResponse.json({ hits: [] as SearchHit[] })
  }

  const pattern = `%${q.replace(/[%_]/g, (m) => `\\${m}`)}%`
  const client = getPool()

  try {
    // Two SELECTs unioned so we can carry a match_reason without
    // triggering "different number of columns" issues on window functions.
    // Ranking: code > exact title > partial title > description > op text.
    // Distinct on sector id, keep the highest-ranked match per sector.
    const res = await client.query<SearchHit>(
      `
      WITH matches AS (
        -- Code / title / description matches from the sector row itself.
        SELECT
          s.id,
          s.mor_code,
          s.name_en,
          s.name_am,
          s.slug,
          s.description_short,
          CASE
            WHEN s.mor_code ILIKE $1 THEN 'code'
            WHEN s.name_en ILIKE $1 OR s.name_am ILIKE $1 THEN 'title'
            ELSE 'description'
          END AS match_reason,
          NULL::text AS match_snippet,
          CASE
            WHEN s.mor_code = $2 THEN 100
            WHEN s.mor_code ILIKE $1 THEN 90
            WHEN s.name_en ILIKE $2 OR s.name_am ILIKE $2 THEN 80
            WHEN s.name_en ILIKE $1 OR s.name_am ILIKE $1 THEN 70
            WHEN s.description_short ILIKE $1 THEN 50
            ELSE 0
          END AS rank
        FROM payload.business_sectors s
        WHERE s.is_active = true
          AND (
            s.mor_code ILIKE $1
            OR s.name_en ILIKE $1
            OR s.name_am ILIKE $1
            OR s.description_short ILIKE $1
          )

        UNION ALL

        -- Permitted-operation matches (English) — the goldmine field.
        SELECT
          s.id,
          s.mor_code,
          s.name_en,
          s.name_am,
          s.slug,
          s.description_short,
          'operation' AS match_reason,
          substring(op.text FROM 1 FOR 160) AS match_snippet,
          40 AS rank
        FROM payload.business_sectors s
        JOIN payload.business_sectors_permitted_operations_en op
          ON op._parent_id = s.id
        WHERE s.is_active = true
          AND op.text ILIKE $1

        UNION ALL

        -- Permitted-operation matches (Amharic).
        SELECT
          s.id,
          s.mor_code,
          s.name_en,
          s.name_am,
          s.slug,
          s.description_short,
          'operation' AS match_reason,
          substring(op.text FROM 1 FOR 160) AS match_snippet,
          40 AS rank
        FROM payload.business_sectors s
        JOIN payload.business_sectors_permitted_operations_am op
          ON op._parent_id = s.id
        WHERE s.is_active = true
          AND op.text ILIKE $1
      ),
      ranked AS (
        SELECT
          m.*,
          ROW_NUMBER() OVER (PARTITION BY m.id ORDER BY m.rank DESC) AS rn
        FROM matches m
      )
      SELECT id, mor_code, name_en, name_am, slug, description_short, match_reason, match_snippet
      FROM ranked
      WHERE rn = 1
      ORDER BY
        CASE match_reason
          WHEN 'code' THEN 1
          WHEN 'title' THEN 2
          WHEN 'description' THEN 3
          WHEN 'operation' THEN 4
        END,
        name_en
      LIMIT $3
      `,
      [pattern, q, limit],
    )

    // Fire-and-forget analytics event so the super-admin dashboard
    // can rank top search queries. Wrapped in try/catch — a write
    // failure here must never affect the response.
    ;(async () => {
      try {
        const user = await getCurrentUser().catch(() => null)
        const payload = await getPayloadClient()
        await payload.create({
          collection: 'page-events',
          data: {
            event_type: 'search',
            path: '/api/sectors/search',
            user_id: user?.id ?? null,
            meta: { q, hits: res.rows.length },
          },
          overrideAccess: true,
        })
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('[sectors/search] event log failed', (err as Error).message)
      }
    })()

    return NextResponse.json({ hits: res.rows })
  } catch (err) {
    // Don't leak DB errors to the client — log and return an empty result
    // so the UI degrades gracefully instead of showing a red toast.
    console.error('[sectors/search] query failed', (err as Error).message)
    return NextResponse.json({ hits: [], error: 'search_failed' }, { status: 500 })
  }
}
