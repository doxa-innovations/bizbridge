import { ImageResponse } from 'next/og'

export const size = { width: 64, height: 64 }
export const contentType = 'image/png'

export default function Icon() {
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
          fontSize: 44,
          fontWeight: 700,
          fontFamily: 'system-ui, sans-serif',
          letterSpacing: '-0.04em',
          borderRadius: 12,
        }}
      >
        B
      </div>
    ),
    { ...size },
  )
}
