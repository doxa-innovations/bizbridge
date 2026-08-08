import { NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/payload'
import { getCurrentUser } from '@/lib/auth-server'

/**
 * Export the caller's saved sectors as CSV — useful for a founder who wants
 * to hand a shortlist to a lawyer / accountant / partner without needing us
 * to build a share-link feature yet.
 *
 *   GET /api/export/saved-sectors.csv → text/csv attachment
 */
export const dynamic = 'force-dynamic'

interface Row {
  id: number | string
  saved_at: string | null
  note: string | null
  sector: {
    mor_code: string
    name_en: string
    name_am: string | null
    slug: string
  } | null
}

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return ''
  const s = String(value)
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const payload = await getPayloadClient()
  const res = await payload.find({
    collection: 'saved-sectors',
    where: { user_id: { equals: user.id } },
    limit: 500,
    depth: 1,
    sort: '-saved_at',
    overrideAccess: true,
  })

  const rows = res.docs as unknown as Row[]
  const header = ['MOR code', 'English name', 'Amharic name', 'URL', 'Saved at', 'Note']
  const lines = [header.join(',')]
  for (const row of rows) {
    if (!row.sector) continue
    lines.push(
      [
        csvEscape(row.sector.mor_code),
        csvEscape(row.sector.name_en),
        csvEscape(row.sector.name_am),
        csvEscape(`/sectors/${row.sector.slug}`),
        csvEscape(row.saved_at),
        csvEscape(row.note),
      ].join(','),
    )
  }
  const body = lines.join('\r\n')
  const filename = `bizbridge-saved-sectors-${new Date().toISOString().slice(0, 10)}.csv`

  return new NextResponse(body, {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="${filename}"`,
      'cache-control': 'private, no-store',
    },
  })
}
