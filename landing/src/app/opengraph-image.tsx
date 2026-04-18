import { ImageResponse } from 'next/og'

export const dynamic = 'force-static'
export const alt = 'FlowMonix — n8n Workflow Monitoring'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: '#0a0a0f',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background glow */}
        <div
          style={{
            position: 'absolute',
            top: -120,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 800,
            height: 500,
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(99,102,241,0.18) 0%, transparent 70%)',
          }}
        />

        {/* Logo mark */}
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 28,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: 'rgba(255,255,255,0.92)',
            }}
          />
        </div>

        {/* Wordmark */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: 36,
          }}
        >
          <span style={{ color: '#ffffff', fontSize: 40, fontWeight: 700, letterSpacing: -1 }}>
            Flow
          </span>
          <span
            style={{
              fontSize: 40,
              fontWeight: 700,
              letterSpacing: -1,
              background: 'linear-gradient(90deg, #818CF8, #A78BFA)',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            monix
          </span>
        </div>

        {/* Headline */}
        <div
          style={{
            color: '#f8fafc',
            fontSize: 52,
            fontWeight: 800,
            textAlign: 'center',
            lineHeight: 1.15,
            maxWidth: 860,
            letterSpacing: -1.5,
            marginBottom: 24,
          }}
        >
          Know exactly what broke in your automations
        </div>

        {/* Sub */}
        <div
          style={{
            color: '#94a3b8',
            fontSize: 26,
            textAlign: 'center',
            maxWidth: 640,
            lineHeight: 1.4,
          }}
        >
          Incident detection, AI debugging, and smart alerts for n8n workflows.
        </div>

        {/* Bottom badge */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(99,102,241,0.15)',
            border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: 999,
            padding: '8px 20px',
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#6366f1',
            }}
          />
          <span style={{ color: '#818cf8', fontSize: 18, fontWeight: 500 }}>
            flowmonix.com
          </span>
        </div>
      </div>
    ),
    { ...size }
  )
}
