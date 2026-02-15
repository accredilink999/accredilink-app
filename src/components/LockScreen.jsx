import React, { useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { isBiometricEnabled, authenticateBiometric, getStoredCredential } from '@/utils/biometric';
import { Fingerprint, Lock, Eye } from 'lucide-react';

/**
 * Full-screen lock overlay shown after inactivity timeout.
 * The Supabase session remains valid — this just gates UI access.
 * User can unlock with biometrics or by re-entering their password.
 */
export default function LockScreen({ onUnlock, userName }) {
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const biometricAvailable = isBiometricEnabled();
  const stored = getStoredCredential();

  const handleBiometric = async () => {
    setError('');
    setStatus('Verifying...');
    try {
      await authenticateBiometric();
      onUnlock();
    } catch (err) {
      setError('Biometric failed — try again or use password');
      setStatus('');
    }
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    if (!password) return;
    setError('');
    setStatus('Checking...');

    try {
      // Re-authenticate with email + password to verify identity
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        // Session expired — need full login
        setError('Session expired — please sign in again');
        setStatus('');
        window.location.replace('/login');
        return;
      }

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password,
      });

      if (authError) {
        setError('Incorrect password');
        setStatus('');
        return;
      }

      onUnlock();
    } catch (err) {
      setError('Failed to verify — ' + (err.message || 'try again'));
      setStatus('');
    }
  };

  const inputStyle = {
    width: '100%', padding: '12px 14px', borderRadius: 8,
    border: '1px solid #cbd5e1', fontSize: 16, outline: 'none',
    boxSizing: 'border-box', background: '#fff',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: 16,
    }}>
      <div style={{
        width: '100%', maxWidth: 360, textAlign: 'center',
      }}>
        {/* Lock icon */}
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 20,
        }}>
          <Lock style={{ width: 32, height: 32, color: '#94a3b8' }} />
        </div>

        <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 700, margin: '0 0 6px' }}>
          Session Locked
        </h2>
        <p style={{ color: '#94a3b8', fontSize: 14, margin: '0 0 28px' }}>
          {userName ? `Welcome back, ${userName.split(' ')[0]}` : 'Locked due to inactivity'}
        </p>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 8, padding: '10px 14px', marginBottom: 16,
            color: '#fca5a5', fontSize: 13,
          }}>
            {error}
          </div>
        )}

        {/* Biometric button */}
        {biometricAvailable && !showPassword && (
          <>
            <button
              onClick={handleBiometric}
              disabled={!!status}
              style={{
                width: '100%', padding: '14px 0', borderRadius: 12,
                background: 'linear-gradient(135deg, #0d9488, #14b8a6)',
                color: '#fff', fontSize: 16, fontWeight: 600,
                border: 'none', cursor: status ? 'wait' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                marginBottom: 12,
              }}
            >
              <Fingerprint style={{ width: 22, height: 22 }} />
              {status || 'Unlock with Biometrics'}
            </button>
            <button
              onClick={() => setShowPassword(true)}
              style={{
                background: 'none', border: 'none', color: '#94a3b8',
                fontSize: 13, cursor: 'pointer', padding: '8px 0',
              }}
            >
              Use password instead
            </button>
          </>
        )}

        {/* Password form (shown if no biometric or user chose password) */}
        {(!biometricAvailable || showPassword) && (
          <form onSubmit={handlePassword}>
            <div style={{ marginBottom: 14 }}>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                autoFocus
                style={inputStyle}
              />
            </div>
            <button
              type="submit"
              disabled={!!status}
              style={{
                width: '100%', padding: '14px 0', borderRadius: 12,
                background: status ? '#475569' : 'linear-gradient(135deg, #0d9488, #14b8a6)',
                color: '#fff', fontSize: 16, fontWeight: 600,
                border: 'none', cursor: status ? 'wait' : 'pointer',
                marginBottom: 12,
              }}
            >
              {status || 'Unlock'}
            </button>
            {biometricAvailable && (
              <button
                type="button"
                onClick={() => { setShowPassword(false); setError(''); }}
                style={{
                  background: 'none', border: 'none', color: '#94a3b8',
                  fontSize: 13, cursor: 'pointer', padding: '8px 0',
                }}
              >
                Use biometrics instead
              </button>
            )}
          </form>
        )}

        <p style={{ color: '#475569', fontSize: 11, marginTop: 24 }}>
          Locked after 2 hours of inactivity for security
        </p>
      </div>
    </div>
  );
}
