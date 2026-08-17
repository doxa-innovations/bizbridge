/**
 * News aggregation — pulls RSS from a curated list of Ethiopian business
 * publications, normalises to a common shape, sorts by date. Runs on the
 * server with Next fetch cache (1h). No RSS-parser dependency; RSS 2.0
 * is regular enough for a targeted regex parser as long as we only feed
 * it well-behaved WordPress-generated feeds.
 *
 * Feeds have been probed for reachability + Cloudflare-tolerance under
 * a real UA string. The Reporter Ethiopia is behind Cloudflare bot
 * protection (403); Addis Standard, Shega, Addis Insight either 5xx or
 * have no valid RSS. If you add a new source, probe it first with the
 * same UA below and confirm it returns `<rss>` root with `<item>`s.
 */

export interface NewsSource {
  id: string
  name: string
  url: string
  siteUrl: string
}

export interface NewsItem {
  sourceId: string
  sourceName: string
  title: string
  link: string
  isoDate: string
  excerpt: string
}

export const NEWS_SOURCES: NewsSource[] = [
  {
    id: 'addis-fortune',
    name: 'Addis Fortune',
    url: 'https://addisfortune.news/feed',
    siteUrl: 'https://addisfortune.news',
  },
  {
    id: 'capital-ethiopia',
    name: 'Capital Ethiopia',
    url: 'https://capitalethiopia.com/feed',
    siteUrl: 'https://capitalethiopia.com',
  },
  {
    id: 'ebr',
    name: 'Ethiopian Business Review',
    url: 'https://ethiopianbusinessreview.net/feed/',
    siteUrl: 'https://ethiopianbusinessreview.net',
  },
]

const UA = 'Mozilla/5.0 (compatible; BizBridgeBot/1.0; +https://biz.doxaplc.com)'
const REVALIDATE_SECONDS = 60 * 60

function extract(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i'))
  if (!m) return ''
  return unwrapCdata(m[1]!).trim()
}

function unwrapCdata(s: string): string {
  const m = s.match(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/)
  return m ? m[1]! : s
}

function stripHtml(s: string): string {
  return s
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#8217;/g, '’')
    .replace(/&#8216;/g, '‘')
    .replace(/&#8220;/g, '“')
    .replace(/&#8221;/g, '”')
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&#038;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseFeed(xml: string, source: NewsSource): NewsItem[] {
  const items: NewsItem[] = []
  const itemRe = /<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi
  let m: RegExpExecArray | null
  while ((m = itemRe.exec(xml))) {
    const body = m[1]!
    const title = stripHtml(extract(body, 'title'))
    const link = extract(body, 'link') || extract(body, 'guid')
    const pubDate = extract(body, 'pubDate') || extract(body, 'dc:date')
    const description = stripHtml(
      extract(body, 'description') || extract(body, 'content:encoded'),
    ).slice(0, 240)
    if (!title || !link) continue
    const iso = pubDate ? new Date(pubDate).toISOString() : new Date().toISOString()
    items.push({
      sourceId: source.id,
      sourceName: source.name,
      title,
      link,
      isoDate: iso,
      excerpt: description,
    })
  }
  return items
}

async function fetchFeed(source: NewsSource): Promise<NewsItem[]> {
  try {
    const res = await fetch(source.url, {
      headers: { 'user-agent': UA, accept: 'application/rss+xml, application/xml, text/xml' },
      next: { revalidate: REVALIDATE_SECONDS, tags: ['news', `news:${source.id}`] },
    })
    if (!res.ok) return []
    const xml = await res.text()
    return parseFeed(xml, source)
  } catch {
    return []
  }
}

/**
 * Fetch and merge all configured feeds. Sorted newest-first, capped at `limit`.
 * Individual feed failures don't sink the batch — a dead source just contributes
 * zero items.
 */
export async function getAggregatedNews(limit = 40): Promise<{
  items: NewsItem[]
  bySource: Record<string, number>
}> {
  const results = await Promise.all(NEWS_SOURCES.map(fetchFeed))
  const all = results.flat()
  all.sort((a, b) => (a.isoDate < b.isoDate ? 1 : -1))
  const bySource: Record<string, number> = {}
  for (const item of all) bySource[item.sourceId] = (bySource[item.sourceId] ?? 0) + 1
  return { items: all.slice(0, limit), bySource }
}
