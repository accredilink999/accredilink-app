import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'CareCallAI — Care Management Software UK';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f172a 0%, #134e4a 50%, #0f172a 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Logo circle */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 80,
            height: 80,
            borderRadius: 20,
            background: 'linear-gradient(135deg, #14b8a6, #0d9488)',
            marginBottom: 24,
            boxShadow: '0 8px 32px rgba(20,184,166,0.4)',
          }}
        >
          <span style={{ fontSize: 40, color: 'white', fontWeight: 900 }}>C</span>
        </div>

        {/* Title */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span
            style={{
              fontSize: 56,
              fontWeight: 800,
              color: 'white',
              letterSpacing: '-0.02em',
            }}
          >
            CareCallAI
          </span>
          <span
            style={{
              fontSize: 28,
              fontWeight: 500,
              background: 'linear-gradient(90deg, #5eead4, #14b8a6)',
              backgroundClip: 'text',
              color: '#5eead4',
              marginTop: 4,
            }}
          >
            Care Management Made Simple
          </span>
        </div>

        {/* Feature pills */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            marginTop: 32,
          }}
        >
          {['Scheduling', 'MAR Charts', 'GPS Tracking', 'Compliance', 'Clinical Suite'].map((f) => (
            <span
              key={f}
              style={{
                fontSize: 16,
                color: '#94a3b8',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                padding: '8px 16px',
                borderRadius: 100,
                fontWeight: 500,
              }}
            >
              {f}
            </span>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            marginTop: 40,
            color: '#64748b',
            fontSize: 18,
          }}
        >
          <span>From £99/mo</span>
          <span style={{ color: '#334155' }}>|</span>
          <span>CIW &amp; CQC Compliant</span>
          <span style={{ color: '#334155' }}>|</span>
          <span>7-Day Free Trial</span>
        </div>

        {/* URL */}
        <span
          style={{
            position: 'absolute',
            bottom: 24,
            fontSize: 16,
            color: '#475569',
            fontWeight: 500,
          }}
        >
          carecallai.co.uk
        </span>
      </div>
    ),
    { ...size }
  );
}
