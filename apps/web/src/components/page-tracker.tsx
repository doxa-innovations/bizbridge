'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

const SESSION_KEY = 'bb_session_id'

function ensureSessionId(): string {
  if (typeof window === 'undefined') return ''
  try {
    let id = window.localStorage.getItem(SESSION_KEY)
    if (!id) {
      id = `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
      window.localStorage.setItem(SESSION_KEY, id)
    }
    return id
  } catch {
    return ''
  }
}

/**
 * Client-side pageview beacon. Sits in the root layout and pings
 * /api/track on every route change (including client-side transitions
 * via next/navigation). Uses navigator.sendBeacon when available so
 * the request survives tab-close.
 *
 * Zero UI. Failing silently is by design — analytics loss beats
 * blocking the page.
 */
export function PageTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (typeof window === 'undefined') return
    const path =
      pathname +
      (searchParams && searchParams.toString() ? `?${searchParams.toString()}` : '')

    const payload = JSON.stringify({
      type: 'page_view',
      path,
      referrer: typeof document !== 'undefined' ? document.referrer || null : null,
      session_id: ensureSessionId(),
    })

    // sendBeacon lets the request outlive an about-to-unload page,
    // which matters for tracking exit-page views. Fallback to fetch
    // (with keepalive) when the API is unavailable.
    try {
      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: 'application/json' })
        navigator.sendBeacon('/api/track', blob)
        return
      }
    } catch {
      // Some browsers throw when the payload isn't a plain string —
      // fall through to fetch below.
    }

    void fetch('/api/track', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => {})
  }, [pathname, searchParams])

  return null
}
