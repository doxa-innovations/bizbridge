'use client'

import { useEffect } from 'react'

/**
 * Fallback used only when the root layout itself throws (e.g. providers
 * crash). Kept minimal — no design tokens, no components — so this can
 * render even when everything upstream is broken.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('[global] fatal:', error)
  }, [error])

  return (
    <html lang="en">
      <body
        style={{
          background: '#141210',
          color: '#f0eee9',
          fontFamily: 'system-ui, sans-serif',
          margin: 0,
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          padding: 32,
        }}
      >
        <div style={{ maxWidth: 480 }}>
          <p style={{ fontSize: 12, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8e8e88' }}>
            Fatal error
          </p>
          <h1 style={{ fontSize: 28, marginTop: 8, letterSpacing: '-0.02em' }}>
            Something went badly wrong.
          </h1>
          <p style={{ marginTop: 12, color: '#b0aca4' }}>
            The whole page failed to render. Try refreshing — if it keeps failing, please
            let us know at cheridemeke777@gmail.com.
          </p>
          {error.digest ? (
            <p style={{ marginTop: 8, fontFamily: 'ui-monospace, monospace', fontSize: 11, color: '#8e8e88' }}>
              Error id: {error.digest}
            </p>
          ) : null}
          <button
            onClick={() => reset()}
            style={{
              marginTop: 20,
              padding: '10px 16px',
              background: '#C89B4E',
              color: '#141210',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
