import { useState, useCallback, useEffect } from 'react';
import { Smartphone, Monitor, Tablet, X } from 'lucide-react';

const DEVICES = [
  { key: 'desktop', label: 'Desktop', icon: Monitor, width: null, height: null },
  { key: 'iphone-se', label: 'iPhone SE', icon: Smartphone, width: 375, height: 667 },
  { key: 'iphone-14', label: 'iPhone 14', icon: Smartphone, width: 390, height: 844 },
  { key: 'iphone-14-pro-max', label: 'iPhone Pro Max', icon: Smartphone, width: 430, height: 932 },
  { key: 'pixel-7', label: 'Pixel 7', icon: Smartphone, width: 412, height: 915 },
  { key: 'ipad-mini', label: 'iPad Mini', icon: Tablet, width: 744, height: 1133 },
];

export default function DevicePreview({ children }) {
  const [activeDevice, setActiveDevice] = useState('desktop');
  const [isOpen, setIsOpen] = useState(false);
  const [rotated, setRotated] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  // Only show the toggle on desktop-sized screens
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const handler = (e) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const device = DEVICES.find(d => d.key === activeDevice);
  const isMobile = activeDevice !== 'desktop';

  const frameWidth = device?.width ? (rotated ? device.height : device.width) : null;
  const frameHeight = device?.height ? (rotated ? device.width : device.height) : null;

  const getScale = useCallback(() => {
    if (!frameHeight || !frameWidth) return 1;
    const maxH = window.innerHeight - 60;
    const maxW = window.innerWidth - 40;
    const scaleH = maxH / frameHeight;
    const scaleW = maxW / frameWidth;
    return Math.min(scaleH, scaleW, 1);
  }, [frameHeight, frameWidth]);

  // Hide on actual mobile/tablet devices — only show on desktop browsers
  if (!isDesktop) return children;

  return (
    <>
      {isMobile ? (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9998,
            background: '#1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px',
          }}
        >
          <div
            style={{
              width: frameWidth,
              height: frameHeight,
              transform: `scale(${getScale()})`,
              transformOrigin: 'center center',
              borderRadius: 40,
              border: '6px solid #334155',
              boxShadow: '0 0 0 2px #1e293b, 0 25px 60px rgba(0,0,0,0.5)',
              overflow: 'hidden',
              background: '#fff',
              position: 'relative',
            }}
          >
            {/* Notch */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 120,
                height: 28,
                background: '#334155',
                borderRadius: '0 0 16px 16px',
                zIndex: 10,
              }}
            />
            <div style={{ width: '100%', height: '100%', overflow: 'auto' }}>
              {children}
            </div>
          </div>
        </div>
      ) : (
        children
      )}

      {/* Floating toolbar — top-right so it doesn't block bottom nav */}
      <div
        style={{
          position: 'fixed',
          top: 110,
          right: 12,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
        }}
      >
        {isOpen && (
          <div
            style={{
              background: '#0f172a',
              borderRadius: 12,
              padding: '6px',
              display: 'flex',
              gap: 3,
              alignItems: 'center',
              boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
            }}
          >
            {DEVICES.map((d) => {
              const Icon = d.icon;
              const isActive = activeDevice === d.key;
              return (
                <button
                  key={d.key}
                  onClick={() => {
                    setActiveDevice(d.key);
                    setRotated(false);
                  }}
                  title={d.label + (d.width ? ` (${d.width}x${d.height})` : '')}
                  style={{
                    padding: '5px 8px',
                    borderRadius: 8,
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2,
                    background: isActive ? '#0d9488' : 'transparent',
                    color: isActive ? '#fff' : '#94a3b8',
                    fontSize: 9,
                    fontFamily: 'system-ui, sans-serif',
                    transition: 'all 0.15s',
                  }}
                >
                  <Icon size={14} />
                  <span style={{ whiteSpace: 'nowrap' }}>{d.label}</span>
                </button>
              );
            })}
            {isMobile && (
              <button
                onClick={() => setRotated(r => !r)}
                title="Rotate"
                style={{
                  padding: '5px 8px',
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  background: rotated ? '#7c3aed' : 'transparent',
                  color: rotated ? '#fff' : '#94a3b8',
                  fontSize: 9,
                  fontFamily: 'system-ui, sans-serif',
                  transition: 'all 0.15s',
                }}
              >
                <span style={{ fontSize: 13 }}>↻</span>
                <span>Rotate</span>
              </button>
            )}
          </div>
        )}

        <button
          onClick={() => setIsOpen(o => !o)}
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            border: 'none',
            cursor: 'pointer',
            background: isMobile ? '#0d9488' : '#0f172a',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
            transition: 'all 0.15s',
          }}
          title="Device Preview"
        >
          {isOpen ? <X size={16} /> : <Smartphone size={16} />}
        </button>
      </div>
    </>
  );
}
