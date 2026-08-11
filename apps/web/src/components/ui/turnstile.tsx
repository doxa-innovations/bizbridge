'use client'

import Script from 'next/script'
import { useEffect, useRef } from 'react'

/**
 * Cloudflare Turnstile widget (free CAPTCHA alternative). Renders
 * only if NEXT_PUBLIC_TURNSTILE_SITE_KEY is set — otherwise this
 * component is a no-op so local dev / previews work without a key.
 *
 * Emits the token via onVerify; parent forms should refuse to submit
 * until a token is captured, and the API route should re-verify the
 * token against Cloudflare's siteverify endpoint (/api/verify-turnstile).
 */

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string
          callback: (token: string) => void
          'expired-callback'?: () => void
          'error-callback'?: () => void
          theme?: 'auto' | 'light' | 'dark'
        },
      ) => string
      reset: (widgetId?: string) => void
    }
  }
}

interface Props {
  onVerify: (token: string) => void
  onExpire?: () => void
  className?: string
}

export function Turnstile({ onVerify, onExpire, className }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const widgetIdRef = useRef<string | null>(null)
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

  useEffect(() => {
    if (!siteKey || !containerRef.current) return
    let cancelled = false

    function tryRender() {
      if (cancelled || !window.turnstile || !containerRef.current) return
      // Wipe any previous instance so hot-reload / re-render doesn't
      // stack widgets.
      containerRef.current.innerHTML = ''
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey!,
        theme: 'auto',
        callback: (token) => onVerify(token),
        'expired-callback': () => onExpire?.(),
      })
    }

    if (window.turnstile) {
      tryRender()
    } else {
      const t = setInterval(() => {
        if (window.turnstile) {
          clearInterval(t)
          tryRender()
        }
      }, 150)
      return () => {
        cancelled = true
        clearInterval(t)
      }
    }
    return () => {
      cancelled = true
    }
  }, [siteKey, onVerify, onExpire])

  if (!siteKey) return null

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
      />
      <div ref={containerRef} className={className} />
    </>
  )
}
