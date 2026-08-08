import { NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/payload'
import { getCurrentUser } from '@/lib/auth-server'

export const dynamic = 'force-dynamic'

interface Row {
  id: number | string
  createdAt: string
  status: string
  payment_method: string
  payment_reference: string | null
  amount_etb: number | null
  amount_usd: number | null
  admin_note: string | null
  verified_at: string | null
  download_expires_at: string | null
  download_count: number | null
  report: { title?: string } | null
}

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return ''
  const s = String(v)
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const payload = await getPayloadClient()
  const res = await payload.find({
    collection: 'report-requests',
    where: { user_id: { equals: user.id } },
    sort: '-createdAt',
    limit: 500,
    depth: 1,
    overrideAccess: true,
  })

  const rows = res.docs as unknown as Row[]
  const header = [
    'Submitted',
    'Report',
    'Status',
    'Method',
    'Reference',
    'Amount (ETB)',
    'Amount (USD)',
    'Verified at',
    'Download expires',
    'Downloads',
    'Admin note',
  ]
  const lines = [header.join(',')]
  for (const row of rows) {
    lines.push(
      [
        csvEscape(row.createdAt),
        csvEscape(row.report?.title ?? ''),
        csvEscape(row.status),
        csvEscape(row.payment_method),
        csvEscape(row.payment_reference),
        csvEscape(row.amount_etb),
        csvEscape(row.amount_usd),
        csvEscape(row.verified_at),
        csvEscape(row.download_expires_at),
        csvEscape(row.download_count),
        csvEscape(row.admin_note),
      ].join(','),
    )
  }
  const body = lines.join('\r\n')
  const filename = `bizbridge-report-requests-${new Date().toISOString().slice(0, 10)}.csv`

  return new NextResponse(body, {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="${filename}"`,
      'cache-control': 'private, no-store',
    },
  })
}
