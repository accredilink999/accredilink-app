import { useState } from 'react';
import { savePin, markPinPromptShown, setPinSessionUnlocked } from '@/utils/pinUtils';
import { PinPad } from './PinLockScreen';

// ── PIN dots display ──────────────────────────────────────────────────────────
function PinDots({ length, isDark, error }) {
  return (
    <div style={{ display: 'flex', gap: 18, justifyContent: 'center' }}>
      {[0,1,2,3].map(i => (
        <div key={i} style={{
          width: 14, height: 14, borderRadius: '50%',
          background: i < length
            ? (error ? '#dc2626' : '#0d9488')
            : 'transparent',
          border: `2.5px solid ${
            i < length
              ? (error ? '#dc2626' : '#0d9488')
              : (isDark ? '#475569' : '#cbd5e1')
          }`,
          transition: 'all 0.12s',
          transform: i < length ? 'scale(1.1)' : 'scale(1)',
        }} />
      ))}
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────
export default function PinSetupModal({ userId, userName, onDone }) {
  const [step, setStep] = useState('ask'); // 'ask' | 'enter' | 'confirm' | 'done'
  const [firstPin, setFirstPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const isDark = document.documentElement.classList.contains('dark');
  const firstName = userName ? userName.split(' ')[0] : null;

  const overlay = {
    position: 'fixed', inset: 0, zIndex: 99998,
    background: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(15,23,42,0.5)',
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  };

  const sheet = {
    width: '100%', maxWidth: 440,
    background: isDark ? '#1e293b' : '#fff',
    borderRadius: '24px 24px 0 0',
    padding: '28px 24px 40px',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    boxShadow: '0 -8px 32px rgba(0,0,0,0.18)',
    gap: 0,
  };

  const dismiss = () => {
    markPinPromptShown(userId);
    setPinSessionUnlocked(); // treat as unlocked for this session
    onDone();
  };

  // ── Step: ask ──
  if (step === 'ask') {
    return (
      <div style={overlay} onClick={dismiss}>
        <div style={sheet} onClick={e => e.stopPropagation()}>
          {/* Handle bar */}
          <div style={{ width: 40, height: 4, borderRadius: 2, background: isDark ? '#334155' : '#e2e8f0', marginBottom: 24 }} />

          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'linear-gradient(135deg, #0d9488, #14b8a6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 16, fontSize: 26,
          }}>
            🔐
          </div>

          <h2 style={{ fontSize: 20, fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a', margin: '0 0 8px', textAlign: 'center' }}>
            Set a PIN{firstName ? `, ${firstName}` : ''}?
          </h2>
          <p style={{ fontSize: 14, color: isDark ? '#94a3b8' : '#64748b', textAlign: 'center', margin: '0 0 28px', lineHeight: 1.5 }}>
            Use a quick 4-digit PIN to unlock the app instead of typing your password each time.
          </p>

          <button
            onClick={() => setStep('enter')}
            style={{
              width: '100%', padding: '14px 0', borderRadius: 12,
              background: '#0d9488', color: '#fff',
              fontSize: 16, fontWeight: 600, border: 'none', cursor: 'pointer',
              marginBottom: 12,
            }}
          >
            Yes, set a PIN
          </button>
          <button
            onClick={dismiss}
            style={{
              width: '100%', padding: '12px 0', borderRadius: 12,
              background: isDark ? '#334155' : '#f1f5f9',
              color: isDark ? '#94a3b8' : '#64748b',
              fontSize: 15, fontWeight: 500, border: 'none', cursor: 'pointer',
            }}
          >
            Not now
          </button>
        </div>
      </div>
    );
  }

  // ── Step: enter PIN ──
  if (step === 'enter') {
    const handleDigit = (d) => {
      if (firstPin.length >= 4) return;
      const next = firstPin + d;
      setFirstPin(next);
      setError('');
      if (next.length === 4) {
        setTimeout(() => setStep('confirm'), 200);
      }
    };
    const handleDelete = () => { setFirstPin(p => p.slice(0, -1)); setError(''); };

    return (
      <div style={overlay}>
        <div style={sheet}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: isDark ? '#334155' : '#e2e8f0', marginBottom: 24 }} />

          <p style={{ fontSize: 13, color: isDark ? '#94a3b8' : '#64748b', marginBottom: 4 }}>Step 1 of 2</p>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a', margin: '0 0 24px' }}>
            Create a PIN
          </h2>

          <PinDots length={firstPin.length} isDark={isDark} />

          <div style={{ height: 32 }} />

          <PinPad onDigit={handleDigit} onDelete={handleDelete} isDark={isDark} />

          <button
            onClick={dismiss}
            style={{
              marginTop: 24, background: 'none', border: 'none',
              color: isDark ? '#64748b' : '#94a3b8',
              fontSize: 13, cursor: 'pointer', padding: 4,
            }}
          >
            Skip
          </button>
        </div>
      </div>
    );
  }

  // ── Step: confirm PIN ──
  if (step === 'confirm') {
    const handleDigit = async (d) => {
      if (confirmPin.length >= 4 || saving) return;
      const next = confirmPin + d;
      setConfirmPin(next);
      setError('');
      if (next.length === 4) {
        if (next !== firstPin) {
          setError("PINs don't match — try again");
          setTimeout(() => { setConfirmPin(''); setFirstPin(''); setStep('enter'); }, 900);
          return;
        }
        setSaving(true);
        await savePin(userId, next);
        setPinSessionUnlocked();
        markPinPromptShown(userId);
        setSaving(false);
        setStep('done');
        setTimeout(onDone, 1400);
      }
    };
    const handleDelete = () => { setConfirmPin(p => p.slice(0, -1)); setError(''); };

    return (
      <div style={overlay}>
        <div style={sheet}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: isDark ? '#334155' : '#e2e8f0', marginBottom: 24 }} />

          <p style={{ fontSize: 13, color: isDark ? '#94a3b8' : '#64748b', marginBottom: 4 }}>Step 2 of 2</p>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a', margin: '0 0 24px' }}>
            Confirm your PIN
          </h2>

          <PinDots length={confirmPin.length} isDark={isDark} error={!!error} />

          {error ? (
            <p style={{ color: '#dc2626', fontSize: 13, marginTop: 12 }}>{error}</p>
          ) : (
            <div style={{ height: 33 }} />
          )}

          <div style={{ height: error ? 8 : 20 }} />

          <PinPad onDigit={handleDigit} onDelete={handleDelete} disabled={saving} isDark={isDark} />

          <button
            onClick={dismiss}
            style={{
              marginTop: 24, background: 'none', border: 'none',
              color: isDark ? '#64748b' : '#94a3b8',
              fontSize: 13, cursor: 'pointer', padding: 4,
            }}
          >
            Skip
          </button>
        </div>
      </div>
    );
  }

  // ── Step: done ──
  return (
    <div style={overlay}>
      <div style={{ ...sheet, gap: 12 }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: isDark ? '#334155' : '#e2e8f0', marginBottom: 24 }} />
        <div style={{ fontSize: 48, marginBottom: 8 }}>✅</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a', margin: 0 }}>PIN set!</h2>
        <p style={{ fontSize: 14, color: isDark ? '#94a3b8' : '#64748b', textAlign: 'center', margin: '4px 0 0', lineHeight: 1.5 }}>
          You can now use your PIN to unlock the app quickly.
        </p>
      </div>
    </div>
  );
}
