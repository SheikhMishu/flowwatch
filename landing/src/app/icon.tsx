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
        <svg
          width="22"
          height="22"
          viewBox="0 0 32 32"
          fill="none"
        >
          {/* Connector lines */}
          <line x1="9" y1="16" x2="11.5" y2="16" stroke="white" strokeWidth="2.2" strokeOpacity="0.75" />
          <line x1="20.5" y1="16" x2="23" y2="16" stroke="white" strokeWidth="2.2" strokeOpacity="0.75" />
          {/* Left node */}
          <circle cx="5.5" cy="16" r="3.5" fill="white" />
          {/* Center hub — ring + dot */}
          <circle cx="16" cy="16" r="4.8" fill="none" stroke="white" strokeWidth="2.4" />
          <circle cx="16" cy="16" r="2.1" fill="white" />
          {/* Right node */}
          <circle cx="26.5" cy="16" r="3.5" fill="white" />
        </svg>
      </div>
    ),
    { ...size }
  )
}
