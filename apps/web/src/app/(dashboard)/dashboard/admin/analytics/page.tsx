import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Pool } from 'pg'
import { ArrowUpRight, Download, Users, MousePointerClick, Search, TrendingUp } from 'lucide-react'
import { requireUser } from '@/lib/require-user'
import { isSuperAdmin } from '@/lib/is-admin'
import { normalizeDatabaseUrl } from '@/lib/db-url'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Analytics · admin',
  robots: { index: false, follow: false },
}
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Superadmin-only dashboard: signups over time, top viewed sectors,
 * top search queries, active users. Reads directly from
 * page_events + public.user because Payload's typed find() adds
 * unnecessary overhead for aggregation queries.
 *
 * Gated by ADMIN_EMAILS env — anyone else gets a notFound() so we
 * don't advertise the route.
 */

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

interface TopRow {
  key: string
  count: number
  extra?: string | null
}

export default async function AdminAnalyticsPage() {
  const user = await requireUser()
  if (!isSuperAdmin(user)) notFound()

  const client = getPool()

  // Aggregate a handful of dashboards in parallel. Each query is
  // small enough that a single Neon spin-up covers them all.
  const [
    totalsRes,
    signupsByDayRes,
    topSectorsRes,
    topSearchesRes,
    topToolsRes,
    topPathsRes,
    recentSignupsRes,
    activeUsersRes,
  ] = await Promise.all([
    client.query<{
      total_users: string
      total_events: string
      total_signups: string
      total_onboarded: string
      total_reset_requests: string
    }>(`
      SELECT
        (SELECT COUNT(*) FROM "user")::text AS total_users,
        (SELECT COUNT(*) FROM "payload".page_events)::text AS total_events,
        (SELECT COUNT(*) FROM "payload".page_events WHERE event_type = 'signup')::text AS total_signups,
        (SELECT COUNT(*) FROM "user" WHERE onboarded_at IS NOT NULL)::text AS total_onboarded,
        (SELECT COUNT(*) FROM "payload".page_events WHERE event_type = 'suggestion_submit')::text AS total_reset_requests
    `),
    client.query<{ day: string; n: string }>(`
      SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day,
             COUNT(*)::text AS n
      FROM "user"
      WHERE created_at > now() - interval '30 days'
      GROUP BY 1
      ORDER BY 1
    `),
    client.query<TopRow>(`
      SELECT
        COALESCE(meta->>'mor_code', path) AS key,
        COUNT(*)::int AS count,
        MAX(meta->>'name_en') AS extra
      FROM "payload".page_events
      WHERE event_type = 'sector_view' OR (event_type = 'page_view' AND path LIKE '%/sectors/%')
      GROUP BY 1
      ORDER BY count DESC
      LIMIT 15
    `),
    client.query<TopRow>(`
      SELECT
        LOWER(meta->>'q') AS key,
        COUNT(*)::int AS count,
        NULL::text AS extra
      FROM "payload".page_events
      WHERE event_type = 'search' AND meta ? 'q'
      GROUP BY 1
      ORDER BY count DESC
      LIMIT 15
    `),
    client.query<TopRow>(`
      SELECT
        COALESCE(meta->>'tool', path) AS key,
        COUNT(*)::int AS count,
        NULL::text AS extra
      FROM "payload".page_events
      WHERE event_type = 'tool_use'
         OR path LIKE '/calculator%'
         OR path LIKE '/checklist%'
         OR path LIKE '/wizard%'
         OR path LIKE '/suggest%'
         OR path LIKE '/compare%'
         OR path LIKE '/dashboard/canvas%'
      GROUP BY 1
      ORDER BY count DESC
      LIMIT 15
    `),
    client.query<TopRow>(`
      SELECT path AS key, COUNT(*)::int AS count, NULL::text AS extra
      FROM "payload".page_events
      WHERE event_type = 'page_view' AND path IS NOT NULL
      GROUP BY 1
      ORDER BY count DESC
      LIMIT 15
    `),
    client.query<{
      email: string
      name: string | null
      country: string | null
      user_type: string | null
      onboarded_at: string | null
      created_at: string
    }>(`
      SELECT email, name, country, user_type, onboarded_at, created_at AS created_at
      FROM "user"
      ORDER BY created_at DESC
      LIMIT 20
    `),
    client.query<{ n: string }>(`
      SELECT COUNT(DISTINCT COALESCE(user_id, session_id))::text AS n
      FROM "payload".page_events
      WHERE created_at > now() - interval '7 days'
        AND COALESCE(user_id, session_id) IS NOT NULL
    `),
  ])

  const totals = totalsRes.rows[0]
  const activeUsers = Number(activeUsersRes.rows[0]?.n ?? 0)
  const signupsByDay = signupsByDayRes.rows

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header>
        <Badge variant="brand" className="mb-2">
          Super-admin
        </Badge>
        <h1 className="text-2xl font-semibold tracking-tightish text-ink sm:text-3xl">
          Analytics
        </h1>
        <p className="mt-1.5 text-sm text-ink-muted">
          What&apos;s being read, searched, and used. Data straight from Neon — no third-party
          analytics service.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild size="sm" variant="secondary">
            <a href="/api/admin/users-export" download>
              <Download className="h-3.5 w-3.5" /> Export all users CSV
            </a>
          </Button>
          <Button asChild size="sm" variant="ghost">
            <a href="/api/admin/users-export?scope=marketing" download>
              <Download className="h-3.5 w-3.5" /> Marketing opt-ins only
            </a>
          </Button>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Kpi icon={<Users className="h-3.5 w-3.5" />} label="Total users" value={totals?.total_users ?? '0'} />
        <Kpi icon={<Users className="h-3.5 w-3.5" />} label="Onboarded" value={totals?.total_onboarded ?? '0'} />
        <Kpi icon={<TrendingUp className="h-3.5 w-3.5" />} label="Active users (7d)" value={String(activeUsers)} />
        <Kpi icon={<MousePointerClick className="h-3.5 w-3.5" />} label="Total events" value={totals?.total_events ?? '0'} />
        <Kpi icon={<MousePointerClick className="h-3.5 w-3.5" />} label="Signup events" value={totals?.total_signups ?? '0'} />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <TopTable
          icon={<TrendingUp className="h-3.5 w-3.5" />}
          title="Top sectors viewed"
          rows={topSectorsRes.rows}
          empty="No sector views recorded yet. As users visit sector detail pages this will fill in."
        />
        <TopTable
          icon={<Search className="h-3.5 w-3.5" />}
          title="Top searches"
          rows={topSearchesRes.rows}
          empty="No searches yet. Every /sectors query and every deep-picker search will land here."
        />
        <TopTable
          icon={<MousePointerClick className="h-3.5 w-3.5" />}
          title="Top tools used"
          rows={topToolsRes.rows}
          empty="No tool events yet. Calculator / wizard / checklist / canvas activity will show up here."
        />
        <TopTable
          icon={<MousePointerClick className="h-3.5 w-3.5" />}
          title="Top page paths"
          rows={topPathsRes.rows}
          empty="No page views yet."
        />
      </div>

      <section>
        <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
          Signups — last 30 days
        </h2>
        {signupsByDay.length === 0 ? (
          <Card className="border-dashed p-6 text-center text-sm text-ink-muted">
            No signups in the last 30 days.
          </Card>
        ) : (
          <Card className="p-4">
            <SignupBarChart data={signupsByDay} />
          </Card>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
          Newest signups
        </h2>
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-2 text-xs uppercase tracking-wider text-ink-faint">
              <tr>
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Country</th>
                <th className="px-4 py-2 font-medium">Type</th>
                <th className="px-4 py-2 font-medium">Onboarded</th>
                <th className="px-4 py-2 font-medium">Signed up</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentSignupsRes.rows.map((r) => (
                <tr key={r.email}>
                  <td className="px-4 py-2 text-ink">{r.email}</td>
                  <td className="px-4 py-2 text-ink-muted">{r.name ?? '—'}</td>
                  <td className="px-4 py-2 font-mono text-xs text-ink-muted">{r.country ?? '—'}</td>
                  <td className="px-4 py-2 text-xs text-ink-muted">{r.user_type ?? '—'}</td>
                  <td className="px-4 py-2 text-xs text-ink-muted">{r.onboarded_at ? 'yes' : '—'}</td>
                  <td className="px-4 py-2 font-mono text-xs text-ink-faint">
                    {new Date(r.created_at).toISOString().slice(0, 10)}
                  </td>
                </tr>
              ))}
              {recentSignupsRes.rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm text-ink-muted">
                    No signups yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </Card>
      </section>
    </div>
  )
}

function Kpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card className="p-4">
      <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
        {icon}
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tabular-nums tracking-crisp text-ink">
        {Number(value).toLocaleString()}
      </p>
    </Card>
  )
}

function TopTable({
  icon,
  title,
  rows,
  empty,
}: {
  icon: React.ReactNode
  title: string
  rows: TopRow[]
  empty: string
}) {
  const max = rows.reduce((acc, r) => Math.max(acc, r.count), 1)
  return (
    <Card className="p-5">
      <h3 className="mb-3 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
        {icon} {title}
      </h3>
      {rows.length === 0 ? (
        <p className="rounded-md border border-dashed border-border/70 p-4 text-xs text-ink-muted">
          {empty}
        </p>
      ) : (
        <ol className="space-y-1.5">
          {rows.map((r) => (
            <li key={r.key} className="grid grid-cols-[1fr_auto] items-center gap-3">
              <div className="min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="truncate text-sm text-ink">{r.key || '(unknown)'}</span>
                  {r.extra ? (
                    <span className="truncate text-[11px] text-ink-faint">{r.extra}</span>
                  ) : null}
                </div>
                <div className="mt-1 h-1 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full bg-brand"
                    style={{ width: `${Math.round((r.count / max) * 100)}%` }}
                  />
                </div>
              </div>
              <span className="font-mono text-xs text-ink-muted">{r.count.toLocaleString()}</span>
            </li>
          ))}
        </ol>
      )}
    </Card>
  )
}

function SignupBarChart({ data }: { data: Array<{ day: string; n: string }> }) {
  const max = data.reduce((acc, d) => Math.max(acc, Number(d.n)), 1)
  return (
    <div className="flex items-end gap-1 overflow-x-auto py-4">
      {data.map((d) => {
        const n = Number(d.n)
        const heightPct = Math.max(6, Math.round((n / max) * 100))
        return (
          <div key={d.day} className="flex min-w-[24px] flex-col items-center gap-1">
            <div className="flex h-24 w-full items-end">
              <div
                className="w-full rounded-t bg-brand"
                style={{ height: `${heightPct}%` }}
                title={`${d.day}: ${n} signup${n === 1 ? '' : 's'}`}
              />
            </div>
            <span className="font-mono text-[9px] text-ink-faint">
              {d.day.slice(5)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
