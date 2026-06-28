'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

function useSystemSetting(key) {
  const [info, setInfo] = useState(null);
  useEffect(() => {
    supabase
      .from('system_settings')
      .select('setting_value')
      .eq('setting_key', key)
      .single()
      .then(({ data }) => {
        if (!data?.setting_value) return;
        try {
          const val = typeof data.setting_value === 'string'
            ? JSON.parse(data.setting_value)
            : data.setting_value;
          setInfo(val);
        } catch {}
      });
  }, [key]);
  return info;
}

function formatBytes(bytes) {
  if (!bytes) return '';
  return ` · ${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DownloadPage() {
  const apk = useSystemSetting('app_download_android');
  const radioApk = useSystemSetting('app_download_android_radio');
  const [iosSteps, setIosSteps] = useState(false);
  const [desktopSteps, setDesktopSteps] = useState(false);

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(160deg, #0f172a 0%, #1e293b 60%, #0c4a3a 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '60px 16px 80px',
      fontFamily: 'system-ui, sans-serif',
      color: '#f1f5f9',
    }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, margin: '0 0 8px', textAlign: 'center' }}>
        Download CareCall AI
      </h1>
      <p style={{ fontSize: 15, color: '#94a3b8', margin: '0 0 40px', textAlign: 'center', maxWidth: 380 }}>
        All platforms share the same account — install on any device and log straight in.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', maxWidth: 440 }}>

        {/* Android APK */}
        <div style={card('#16a34a22', '#16a34a')}>
          <div style={header}>
            <span style={{ fontSize: 22 }}>📱</span>
            <span style={{ fontWeight: 700, fontSize: 17 }}>Android</span>
            {apk?.version && <span style={{ marginLeft: 'auto', fontSize: 12, color: '#86efac', background: '#14532d', padding: '2px 8px', borderRadius: 99 }}>v{apk.version}</span>}
          </div>
          <p style={desc}>Direct APK — no Play Store required.</p>
          {apk?.file_url ? (
            <a href={apk.file_url} download={apk.filename || 'CareCallAI.apk'} style={btn('#16a34a', '#fff')}>
              ⬇ Download APK{formatBytes(apk.filesize)}
            </a>
          ) : (
            <div style={{ ...btn('#334155', '#64748b'), cursor: 'default' }}>Loading download link…</div>
          )}
          <p style={hint}>Open the downloaded file and tap <strong>Install</strong>. Enable installs from unknown sources in Settings → Security if prompted.</p>
        </div>

        {/* Radio Handset APK */}
        <div style={card('#7c3aed22', '#7c3aed')}>
          <div style={header}>
            <span style={{ fontSize: 22 }}>📻</span>
            <span style={{ fontWeight: 700, fontSize: 17 }}>Radio Handset (T320)</span>
            <span style={{ marginLeft: 'auto', fontSize: 12, color: '#c4b5fd', background: '#2e1065', padding: '2px 8px', borderRadius: 99 }}>APK</span>
          </div>
          <p style={desc}>Dedicated radio build for T320 handsets. Auto-launches on boot.</p>
          {radioApk?.file_url ? (
            <a href={radioApk.file_url} download="CareCallAI-Radio.apk" style={btn('#7c3aed', '#fff')}>
              ⬇ Download Radio APK{formatBytes(radioApk.filesize)}
            </a>
          ) : (
            <div style={{ ...btn('#334155', '#64748b'), cursor: 'default' }}>Loading download link…</div>
          )}
          <p style={hint}>Install on dedicated T320 radio handsets only — not the main app.</p>
        </div>

        {/* Desktop PWA */}
        <div style={card('#1d4ed822', '#3b82f6')}>
          <div style={header}>
            <span style={{ fontSize: 22 }}>🖥️</span>
            <span style={{ fontWeight: 700, fontSize: 17 }}>Desktop</span>
            <span style={{ marginLeft: 'auto', fontSize: 12, color: '#93c5fd', background: '#1e3a5f', padding: '2px 8px', borderRadius: 99 }}>PWA</span>
          </div>
          <p style={desc}>Install as a desktop app via Chrome or Edge.</p>
          <a href="https://www.carecallai.co.uk/login" style={btn('#1d4ed8', '#fff')}>Open in Browser</a>
          <button onClick={() => setDesktopSteps(v => !v)} style={{ ...btn('transparent', '#60a5fa'), border: '1px solid #1d4ed844', marginTop: 8 }}>
            {desktopSteps ? 'Hide steps' : 'How to install as an app'}
          </button>
          {desktopSteps && (
            <ol style={steps}>
              <li>Open <strong>carecallai.co.uk</strong> in Chrome or Edge</li>
              <li>Click the <strong>install icon</strong> in the address bar</li>
              <li>Click <strong>Install</strong> in the prompt</li>
              <li>The app opens in its own window and appears in your taskbar</li>
            </ol>
          )}
        </div>

        {/* iOS PWA */}
        <div style={card('#71717a22', '#a1a1aa')}>
          <div style={header}>
            <span style={{ fontSize: 22 }}>🍎</span>
            <span style={{ fontWeight: 700, fontSize: 17 }}>iPhone / iPad</span>
            <span style={{ marginLeft: 'auto', fontSize: 12, color: '#d4d4d8', background: '#27272a', padding: '2px 8px', borderRadius: 99 }}>PWA</span>
          </div>
          <p style={desc}>Add to your home screen via Safari.</p>
          <a href="https://www.carecallai.co.uk/login" style={btn('#3f3f46', '#fff')}>Open in Safari</a>
          <button onClick={() => setIosSteps(v => !v)} style={{ ...btn('transparent', '#a1a1aa'), border: '1px solid #71717a44', marginTop: 8 }}>
            {iosSteps ? 'Hide steps' : 'How to add to Home Screen'}
          </button>
          {iosSteps && (
            <ol style={steps}>
              <li>Open <strong>carecallai.co.uk</strong> in <strong>Safari</strong></li>
              <li>Tap the <strong>Share</strong> button (box with ↑ arrow)</li>
              <li>Tap <strong>Add to Home Screen</strong></li>
              <li>Tap <strong>Add</strong> — icon appears on your home screen</li>
            </ol>
          )}
        </div>
      </div>

      <div style={{ marginTop: 48, textAlign: 'center' }}>
        <p style={{ fontSize: 14, color: '#64748b' }}>
          Already have the app?{' '}
          <a href="/login" style={{ color: '#34d399', textDecoration: 'none', fontWeight: 600 }}>Sign in →</a>
        </p>
      </div>
    </div>
  );
}

const card = (bg, border) => ({ background: bg, border: `1px solid ${border}44`, borderRadius: 14, padding: '20px 20px 16px' });
const header = { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 };
const desc = { fontSize: 13, color: '#94a3b8', margin: '0 0 14px' };
const hint = { fontSize: 12, color: '#64748b', margin: '10px 0 0', lineHeight: 1.5 };
const steps = { margin: '12px 0 0', paddingLeft: 18, fontSize: 13, color: '#cbd5e1', lineHeight: 1.7 };
const btn = (bg, color) => ({
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  width: '100%', padding: '11px 0', borderRadius: 8,
  background: bg, color, fontWeight: 600, fontSize: 14,
  border: 'none', cursor: 'pointer', textDecoration: 'none', boxSizing: 'border-box',
});
