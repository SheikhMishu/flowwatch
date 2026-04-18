import { ImageResponse } from 'next/og'

export const dynamic = 'force-static'
export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.92)',
          }}
        />
      </div>
    ),
    { ...size }
  )
}
