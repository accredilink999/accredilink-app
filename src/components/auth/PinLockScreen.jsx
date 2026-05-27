import { useState } from 'react';
import { verifyPin, setPinSessionUnlocked } from '@/utils/pinUtils';
import { supabase } from '@/api/supabaseClient';

// ── Shared number-pad component ───────────────────────────────────────────────
export function PinPad({ onDigit, onDelete, disabled, isDark }) {
  const keys = ['1','2','3','4','5','6','7','8','9',null,'0','del'];

  const btnBase = {
    width: 76, height: 76, borderRadius: '50%',
    fontSize: 26, fontWeight: 500,
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: 'none', outline: 'none',
    transition: 'background 0.1s',
    WebkitTapHighlightColor: 'transparent',
    userSelect: 'none',
    opacity: disabled ? 0.5 : 1,
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 76px)', gap: 14 }}>
      {keys.map((key, i) => {
        if (key === null) return <div key={i} />;
        if (key === 'del') return (
          <button
            key={i}
            onPointerDown={(e) => { e.preventDefault(); if (!disabled) onDelete(); }}
            style={{ ...btnBase, background: 'transparent', color: isDark ? '#94a3b8' : '#64748b', fontSize: 24 }}
          >
            ⌫
          </button>
        );
        return (
          <button
            key={i}
            onPointerDown={(e) => { e.preventDefault(); if (!disabled) onDigit(key); }}
            style={{
              ...btnBase,
              background: isDark ? '#1e293b' : '#fff',
              color: isDark ? '#f1f5f9' : '#0f172a',
              boxShadow: isDark ? 'none' : '0 1px 4px rgba(0,0,0,0.08)',
            }}
          >
            {key}
          </button>
        );
      })}
    </div>
  );
}

// ── Lock screen ───────────────────────────────────────────────────────────────
export default function PinLockScreen({ userId, userName, onUnlock }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const isDark = document.documentElement.classList.contains('dark');

  const handleDigit = (d) => {
    if (pin.length >= 4 || checking) return;
    const next = pin + d;
    setPin(next);
    setError('');
    if (next.length === 4) doVerify(next);
  };

  const handleDelete = () => {
    if (checking) return;
    setPin(p => p.slice(0, -1));
    setError('');
  };

  const doVerify = async (p) => {
    setChecking(true);
    try {
      const ok = await verifyPin(userId, p);
      if (ok) {
        setPinSessionUnlocked();
        onUnlock();
      } else {
        const next = attempts + 1;
        setAttempts(next);
        setError(next >= 5 ? 'Too many attempts — use your password' : 'Incorrect PIN — try again');
        setTimeout(() => { setPin(''); setChecking(false); }, 400);
      }
    } catch {
      setError('Something went wrong — try again');
      setTimeout(() => { setPin(''); setChecking(false); }, 400);
    }
  };

  const handleUsePassword = async () => {
    // Sign out locally and go to login — forces full password re-entry
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch {}
    window.location.href = '/login';
  };

  const firstName = userName ? userName.split(' ')[0] : null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: isDark ? '#0f172a' : '#f8fafc',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px 16px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      {/* Logo */}
      <img
        src="/logo.png"
        alt="Care Call AI"
        style={{ width: 64, height: 'auto', borderRadius: 14, marginBottom: 16,
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}
      />

      {/* Greeting */}
      {firstName && (
        <p style={{ fontSize: 14, color: isDark ? '#94a3b8' : '#64748b', marginBottom: 4 }}>
          Welcome back, {firstName}
        </p>
      )}
      <h1 style={{
        fontSize: 22, fontWeight: 700,
        color: isDark ? '#f1f5f9' : '#0f172a',
        marginBottom: 32, margin: '0 0 32px',
      }}>
        Enter your PIN
      </h1>

      {/* PIN dots */}
      <div style={{ display: 'flex', gap: 20, marginBottom: error ? 12 : 36 }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{
            width: 16, height: 16, borderRadius: '50%',
            background: i < pin.length ? '#0d9488' : 'transparent',
            border: `2.5px solid ${i < pin.length ? '#0d9488' : (isDark ? '#475569' : '#cbd5e1')}`,
            transition: 'all 0.12s',
            transform: i < pin.length ? 'scale(1.1)' : 'scale(1)',
          }} />
        ))}
      </div>

      {/* Error */}
      {error ? (
        <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 24, minHeight: 20 }}>{error}</p>
      ) : (
        <div style={{ height: 40 }} />
      )}

      {/* Number pad */}
      <PinPad
        onDigit={handleDigit}
        onDelete={handleDelete}
        disabled={checking || attempts >= 5}
        isDark={isDark}
      />

      {/* Footer */}
      <button
        onClick={handleUsePassword}
        style={{
          marginTop: 40, background: 'none', border: 'none',
          color: isDark ? '#64748b' : '#94a3b8',
          fontSize: 13, cursor: 'pointer', padding: 4,
        }}
      >
        Use password instead
      </button>
    </div>
  );
}
