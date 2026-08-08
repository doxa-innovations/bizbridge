import 'server-only'
import * as cheerio from 'cheerio'
import { unstable_cache } from 'next/cache'

export interface TelegramPost {
  id: string
  text: string
  html: string
  publishedAt: string | null
  imageUrl: string | null
  linkUrl: string
}

export interface TelegramPreview {
  handle: string
  posts: TelegramPost[]
  scrapedAt: string
  optedOut: boolean
}

const USER_AGENT =
  'Mozilla/5.0 (compatible; BizBridgePulseBot/1.0; +https://biz.doxaplc.com/dashboard/pulse)'
const CACHE_TTL_SECONDS = 60 * 30 // 30 min per handle
const MAX_POSTS = 5

async function scrapeUncached(handle: string): Promise<TelegramPreview> {
  const scrapedAt = new Date().toISOString()
  const cleanHandle = handle.replace(/^@/, '').trim()
  if (!cleanHandle) {
    return { handle: cleanHandle, posts: [], scrapedAt, optedOut: true }
  }

  const url = `https://t.me/s/${cleanHandle}`
  let html: string
  try {
    const res = await fetch(url, {
      headers: {
        'user-agent': USER_AGENT,
        'accept-language': 'en,am',
      },
      // Server-side fetch; Next dedupes per request but we cache above via
      // unstable_cache so this shouldn't be hit more than 2x/hour per handle.
      cache: 'no-store',
    })
    if (!res.ok) {
      return { handle: cleanHandle, posts: [], scrapedAt, optedOut: true }
    }
    html = await res.text()
  } catch {
    return { handle: cleanHandle, posts: [], scrapedAt, optedOut: true }
  }

  const $ = cheerio.load(html)
  const messages = $('.tgme_widget_message').toArray()

  if (messages.length === 0) {
    return { handle: cleanHandle, posts: [], scrapedAt, optedOut: true }
  }

  const posts: TelegramPost[] = []
  for (const el of messages.slice(-MAX_POSTS).reverse()) {
    const $el = $(el)
    const dataPost = $el.attr('data-post')
    if (!dataPost) continue
    const textEl = $el.find('.tgme_widget_message_text').first()
    const text = textEl.text().trim()
    const htmlContent = textEl.html() ?? ''
    const time = $el.find('time[datetime]').first().attr('datetime') ?? null
    // Photo/image previews use `background-image: url(…)` on `.tgme_widget_message_photo_wrap`
    const photoStyle = $el.find('.tgme_widget_message_photo_wrap').first().attr('style') ?? ''
    const imgMatch = photoStyle.match(/background-image:\s*url\(['"]?([^'"()]+)['"]?\)/)
    const imageUrl = imgMatch?.[1] ?? null

    posts.push({
      id: dataPost,
      text,
      html: htmlContent,
      publishedAt: time,
      imageUrl,
      linkUrl: `https://t.me/${dataPost}`,
    })
  }

  return { handle: cleanHandle, posts, scrapedAt, optedOut: posts.length === 0 }
}

/**
 * Fetch a Telegram channel's recent post previews. Cached for 30 minutes per
 * handle via Next's unstable_cache — Telegram rate-limits aggressive scrapes
 * and their HTML is deceptively expensive to parse.
 *
 * Returns `optedOut: true` when the channel doesn't expose t.me/s/<handle>
 * (channels can disable web preview) or when scraping fails for any reason.
 * Callers should render the source card with just the metadata in that case.
 */
export async function fetchTelegramPreview(handle: string): Promise<TelegramPreview> {
  const cached = unstable_cache(
    (h: string) => scrapeUncached(h),
    ['telegram-preview', handle],
    { revalidate: CACHE_TTL_SECONDS, tags: ['telegram-preview', `telegram:${handle}`] },
  )
  return cached(handle)
}

/**
 * Fetch previews for many handles in parallel with a concurrency cap so we
 * don't hammer Telegram from a single request handler. Returns a map keyed
 * by handle for O(1) lookup at render time.
 */
export async function fetchTelegramPreviewsBatch(
  handles: string[],
  concurrency = 6,
): Promise<Map<string, TelegramPreview>> {
  const { default: pLimit } = await import('p-limit')
  const limit = pLimit(concurrency)
  const out = new Map<string, TelegramPreview>()
  await Promise.all(
    handles.map((h) =>
      limit(async () => {
        try {
          const preview = await fetchTelegramPreview(h)
          out.set(h, preview)
        } catch {
          out.set(h, {
            handle: h,
            posts: [],
            scrapedAt: new Date().toISOString(),
            optedOut: true,
          })
        }
      }),
    ),
  )
  return out
}
