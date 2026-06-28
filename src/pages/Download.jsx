import { useEffect, useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { Smartphone, Monitor, Apple, Download, CheckCircle, Radio } from 'lucide-react';

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
  const mb = bytes / (1024 * 1024);
  return ` · ${mb.toFixed(1)} MB`;
}

export default function Download() {
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
      padding: '40px 16px 60px',
      fontFamily: 'system-ui, sans-serif',
      color: '#f1f5f9',
    }}>
      {/* Logo + heading */}
      <img
        src="/logo.png"
        alt="CareCall AI"
        style={{ height: 72, marginBottom: 16, objectFit: 'contain' }}
        onError={e => { e.target.style.display = 'none'; }}
      />
      <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 6px', textAlign: 'center' }}>
        Download CareCall AI
      </h1>
      <p style={{ fontSize: 15, color: '#94a3b8', margin: '0 0 36px', textAlign: 'center', maxWidth: 360 }}>
        Choose the right version for your device. All platforms share the same account.
      </p>

      {/* Cards */}
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 16,
        width: '100%', maxWidth: 420,
      }}>

        {/* Android APK */}
        <div style={cardStyle('#16a34a22', '#16a34a')}>
          <div style={cardHeader}>
            <Smartphone size={22} color="#4ade80" />
            <span style={{ fontWeight: 700, fontSize: 17 }}>Android</span>
            {apk?.version && (
              <span style={{ marginLeft: 'auto', fontSize: 12, color: '#86efac', background: '#14532d', padding: '2px 8px', borderRadius: 99 }}>
                v{apk.version}
              </span>
            )}
          </div>
          <p style={cardDesc}>Direct APK install — no Play Store required.</p>
          {apk?.file_url ? (
            <a
              href={apk.file_url}
              download={apk.filename || 'CareCallAI.apk'}
              style={btnStyle('#16a34a', '#fff')}
            >
              <Download size={16} />
              Download APK{formatBytes(apk.filesize)}
            </a>
          ) : (
            <div style={{ ...btnStyle('#334155', '#64748b'), cursor: 'default' }}>
              Loading download link…
            </div>
          )}
          <p style={hintText}>
            After downloading, open the file and tap <strong>Install</strong>. You may need to allow
            installs from unknown sources in Settings → Security.
          </p>
        </div>

        {/* Radio Handset APK */}
        <div style={cardStyle('#7c3aed22', '#7c3aed')}>
          <div style={cardHeader}>
            <Radio size={22} color="#a78bfa" />
            <span style={{ fontWeight: 700, fontSize: 17 }}>Radio Handset (T320)</span>
            <span style={{ marginLeft: 'auto', fontSize: 12, color: '#c4b5fd', background: '#2e1065', padding: '2px 8px', borderRadius: 99 }}>
              APK
            </span>
          </div>
          <p style={cardDesc}>Dedicated radio-mode build for the T320 handset. Auto-launches on boot and stays on the radio screen.</p>
          {radioApk?.file_url ? (
            <a
              href={radioApk.file_url}
              download="CareCallAI-Radio.apk"
              style={btnStyle('#7c3aed', '#fff')}
            >
              <Download size={16} />
              Download Radio APK{formatBytes(radioApk.filesize)}
            </a>
          ) : (
            <div style={{ ...btnStyle('#334155', '#64748b'), cursor: 'default' }}>
              Loading download link…
            </div>
          )}
          <p style={hintText}>
            Install this instead of the standard APK on dedicated T320 radio handsets only.
          </p>
        </div>

        {/* Desktop PWA */}
        <div style={cardStyle('#1d4ed822', '#3b82f6')}>
          <div style={cardHeader}>
            <Monitor size={22} color="#60a5fa" />
            <span style={{ fontWeight: 700, fontSize: 17 }}>Desktop</span>
            <span style={{ marginLeft: 'auto', fontSize: 12, color: '#93c5fd', background: '#1e3a5f', padding: '2px 8px', borderRadius: 99 }}>
              PWA
            </span>
          </div>
          <p style={cardDesc}>Install as a desktop app via Chrome or Edge.</p>
          <a
            href="https://app.carecallai.co.uk"
            target="_blank"
            rel="noopener noreferrer"
            style={btnStyle('#1d4ed8', '#fff')}
          >
            <Monitor size={16} />
            Open in Browser
          </a>
          <button
            onClick={() => setDesktopSteps(v => !v)}
            style={{ ...btnStyle('transparent', '#60a5fa'), border: '1px solid #1d4ed844', marginTop: 8 }}
          >
            {desktopSteps ? 'Hide install steps' : 'How to install as an app'}
          </button>
          {desktopSteps && (
            <ol style={stepsList}>
              <li>Open <strong>app.carecallai.co.uk</strong> in Chrome or Edge</li>
              <li>Click the <strong>install icon</strong> in the address bar (looks like a screen with a ↓)</li>
              <li>Click <strong>Install</strong> in the prompt</li>
              <li>The app will open in its own window and appear in your taskbar</li>
            </ol>
          )}
        </div>

        {/* iOS PWA */}
        <div style={cardStyle('#71717a22', '#a1a1aa')}>
          <div style={cardHeader}>
            <Apple size={22} color="#a1a1aa" />
            <span style={{ fontWeight: 700, fontSize: 17 }}>iPhone / iPad</span>
            <span style={{ marginLeft: 'auto', fontSize: 12, color: '#d4d4d8', background: '#27272a', padding: '2px 8px', borderRadius: 99 }}>
              PWA
            </span>
          </div>
          <p style={cardDesc}>Add to your home screen via Safari.</p>
          <a
            href="https://app.carecallai.co.uk"
            target="_blank"
            rel="noopener noreferrer"
            style={btnStyle('#3f3f46', '#fff')}
          >
            <Apple size={16} />
            Open in Safari
          </a>
          <button
            onClick={() => setIosSteps(v => !v)}
            style={{ ...btnStyle('transparent', '#a1a1aa'), border: '1px solid #71717a44', marginTop: 8 }}
          >
            {iosSteps ? 'Hide install steps' : 'How to add to Home Screen'}
          </button>
          {iosSteps && (
            <ol style={stepsList}>
              <li>Open <strong>app.carecallai.co.uk</strong> in <strong>Safari</strong> (must be Safari)</li>
              <li>Tap the <strong>Share</strong> button (box with ↑ arrow) at the bottom</li>
              <li>Scroll down and tap <strong>Add to Home Screen</strong></li>
              <li>Tap <strong>Add</strong> — the app icon will appear on your home screen</li>
            </ol>
          )}
        </div>
      </div>

      {/* Sign in link */}
      <div style={{ marginTop: 40, textAlign: 'center' }}>
        <p style={{ fontSize: 14, color: '#64748b' }}>
          Already have the app?{' '}
          <a href="/login" style={{ color: '#34d399', textDecoration: 'none', fontWeight: 600 }}>
            Sign in →
          </a>
        </p>
      </div>
    </div>
  );
}

const cardStyle = (bg, border) => ({
  background: bg,
  border: `1px solid ${border}44`,
  borderRadius: 14,
  padding: '20px 20px 16px',
});

const cardHeader = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  marginBottom: 8,
};

const cardDesc = {
  fontSize: 13,
  color: '#94a3b8',
  margin: '0 0 14px',
};

const hintText = {
  fontSize: 12,
  color: '#64748b',
  margin: '10px 0 0',
  lineHeight: 1.5,
};

const stepsList = {
  margin: '12px 0 0',
  paddingLeft: 18,
  fontSize: 13,
  color: '#cbd5e1',
  lineHeight: 1.7,
};

const btnStyle = (bg, color) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  width: '100%',
  padding: '11px 0',
  borderRadius: 8,
  background: bg,
  color,
  fontWeight: 600,
  fontSize: 14,
  border: 'none',
  cursor: 'pointer',
  textDecoration: 'none',
  boxSizing: 'border-box',
});
