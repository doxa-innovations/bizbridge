import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Everything private / auth-adjacent is blocked from crawl.
        // /canvas/[token] is a shared plan URL — private by opt-in but
        // shouldn't be indexed either (each page already ships
        // robots: noindex meta so this is belt + braces).
        disallow: [
          '/admin/',
          '/api/',
          '/dashboard/',
          '/canvas/',
          '/login',
          '/signup',
          '/forgot-password',
          '/reset-password',
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  }
}
