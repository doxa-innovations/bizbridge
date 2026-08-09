import { ImageResponse } from 'next/og'

export const alt = 'BizBridge Ethiopia — a free guide to opening a business'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '80px',
          background: 'linear-gradient(135deg, #0E100E 0%, #0F2A20 60%, #2D8F72 100%)',
          color: '#F0F4F0',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #2D8F72 0%, #14624C 100%)',
              color: '#F0F4F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 44,
              fontWeight: 700,
              letterSpacing: '-0.04em',
            }}
          >
            B
          </div>
          <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.02em' }}>
            BizBridge Ethiopia
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div
            style={{
              fontSize: 78,
              fontWeight: 700,
              letterSpacing: '-0.03em',
              lineHeight: 1.05,
              maxWidth: 1000,
            }}
          >
            Build a business without friction.
          </div>
          <div
            style={{
              fontSize: 30,
              fontWeight: 400,
              opacity: 0.75,
              maxWidth: 900,
              lineHeight: 1.3,
            }}
          >
            Every MOR sector · every fee · every ministry approval — free.
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 20,
            opacity: 0.6,
          }}
        >
          <span>519 sectors · Bishoftu · Addis · Oromia</span>
          <span>Independent civic-tech project</span>
        </div>
      </div>
    ),
    { ...size },
  )
}
