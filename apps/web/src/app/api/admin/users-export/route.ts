import { NextResponse } from 'next/server'
import { Pool } from 'pg'
import { getCurrentUser } from '@/lib/auth-server'
import { normalizeDatabaseUrl } from '@/lib/db-url'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Admin-only CSV export of every signup — for marketing follow-up and
 * onboarding outreach. Gated by an ADMIN_EMAILS env var (comma-separated
 * list of Better Auth user emails permitted to access). Set this in
 * Dokploy so only your address unlocks the export.
 *
 * Reads directly from `public.user` (Better Auth's table) rather than
 * through Payload because Better Auth's schema lives in `public` while
 * Payload lives in `payload` — no cross-schema Payload query.
 */
function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const allow = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  return allow.includes(email.toLowerCase())
}

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return ''
  const s = String(v)
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

let pool: Pool | null = null
function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: normalizeDatabaseUrl(process.env.DATABASE_URL),
      max: 2,
    })
  }
  return pool
}

interface UserRow {
  id: string
  email: string
  name: string | null
  country: string | null
  user_type: string | null
  capital_tier: string | null
  onboarded_at: string | null
  created_at: string
}

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (!isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  try {
    const res = await getPool().query<UserRow>(
      `SELECT id, email, name, country, "userType" AS user_type,
              "capitalTier" AS capital_tier, "onboardedAt" AS onboarded_at,
              "createdAt" AS created_at
         FROM "user"
        ORDER BY "createdAt" DESC`,
    )

    const header = [
      'email',
      'name',
      'country',
      'user_type',
      'capital_tier',
      'onboarded',
      'signed_up_at',
    ]
    const lines = [header.join(',')]
    for (const r of res.rows) {
      lines.push(
        [
          csvEscape(r.email),
          csvEscape(r.name ?? ''),
          csvEscape(r.country ?? ''),
          csvEscape(r.user_type ?? ''),
          csvEscape(r.capital_tier ?? ''),
          r.onboarded_at ? 'yes' : 'no',
          csvEscape(r.created_at),
        ].join(','),
      )
    }

    return new NextResponse(lines.join('\n'), {
      status: 200,
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': `attachment; filename="bizbridge-users-${new Date().toISOString().slice(0, 10)}.csv"`,
        'cache-control': 'private, no-store',
      },
    })
  } catch (err) {
    console.error('[admin/users-export] failed', err)
    return NextResponse.json({ error: 'export_failed' }, { status: 500 })
  }
}
