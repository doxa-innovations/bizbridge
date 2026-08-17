import { NextResponse } from 'next/server'
import { getAggregatedNews } from '@/lib/news-feeds'

export const runtime = 'nodejs'
export const revalidate = 3600

export async function GET() {
  const data = await getAggregatedNews(40)
  return NextResponse.json(data, {
    headers: {
      'cache-control': 'public, s-maxage=3600, stale-while-revalidate=21600',
    },
  })
}
