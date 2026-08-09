import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #2D8F72 0%, #14624C 100%)',
          color: '#F0F4F0',
          fontSize: 120,
          fontWeight: 700,
          fontFamily: 'system-ui, sans-serif',
          letterSpacing: '-0.04em',
        }}
      >
        B
      </div>
    ),
    { ...size },
  )
}
