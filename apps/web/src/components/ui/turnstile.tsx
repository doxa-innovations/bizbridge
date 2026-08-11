'use client'

import Script from 'next/script'
import { useEffect, useRef } from 'react'

/**
 * Cloudflare Turnstile widget. Renders only if
 * NEXT_PUBLIC_TURNSTILE_SITE_KEY is set — otherwise this component
 * is a no-op so local dev without a key works normally.
 *
 * Emits the token via onVerify. Parent forms should refuse to submit
 * until a token is captured, and the API route (/api/verify-turnstile)
 * re-verifies the token server-side against Cloudflare's siteverify
 * endpoint. The `action` prop is bound so a token minted for signup
 * can't be replayed against a different surface.
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
          action?: string
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
  /** Semantic surface tag — Cloudflare recommends binding one per
   *  form so a token minted here can't be replayed on another surface. */
  action?: string
}

export function Turnstile({ onVerify, onExpire, className, action = 'default' }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const widgetIdRef = useRef<string | null>(null)
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

  useEffect(() => {
    if (!siteKey || !containerRef.current) return
    let cancelled = false

    function tryRender() {
      if (cancelled || !window.turnstile || !containerRef.current) return
      containerRef.current.innerHTML = ''
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey!,
        theme: 'auto',
        action,
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
  }, [siteKey, onVerify, onExpire, action])

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
