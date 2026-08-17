import { NextResponse } from 'next/server'
import { getFxRates } from '@/lib/fx'

export const runtime = 'nodejs'
// Route-level revalidation — the underlying fetch also caches for 6h.
export const revalidate = 21600

export async function GET() {
  const rates = await getFxRates()
  return NextResponse.json(rates, {
    headers: {
      'cache-control': 'public, s-maxage=21600, stale-while-revalidate=86400',
    },
  })
}
