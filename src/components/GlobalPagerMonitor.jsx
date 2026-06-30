import { useEffect, useRef } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';

const getOrgId = () =>
  localStorage.getItem('organizationId') || sessionStorage.getItem('organizationId') || '';

export default function GlobalPagerMonitor() {
  const { user, isAuthenticated } = useAuth();
  const audioRef    = useRef(null);
  const seenRef     = useRef(new Set());
  const wakeLockRef = useRef(null);

  // ── Realtime: new INSERT while app is open ───────────────────────────
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    const orgId = getOrgId();
    const channel = supabase
      .channel('global-pager-monitor')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'pager_messages' },
        (payload) => {
          const msg = payload.new;
          if (msg.organization_id !== orgId) return;
          if (seenRef.current.has(msg.id)) return;
          seenRef.current.add(msg.id);

          const userAreaId = user.rota_area_id || user.area_id;
          const addressed =
            msg.recipient_mode === 'global' ||
            (msg.recipient_mode === 'area' && msg.recipient_area_id === userAreaId) ||
            (msg.recipient_mode === 'individual' && msg.recipient_id === user.id);

          if (!addressed) return;
          if (msg.sent_by === user.id && msg.recipient_mode !== 'individual') return;

          if (navigator.vibrate) navigator.vibrate([300, 100, 300, 100, 300]);

          if ('wakeLock' in navigator) {
            navigator.wakeLock.request('screen')
              .then(lock => { wakeLockRef.current = lock; })
              .catch(() => {});
          }

          if (window.AndroidApp?.wakeForCall) window.AndroidApp.wakeForCall();

          if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(() => {});
          }

          window.dispatchEvent(new CustomEvent('alerter:incoming', { detail: msg }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      wakeLockRef.current?.release().catch(() => {});
    };
  }, [isAuthenticated, user?.id]);

  // ── Silence handler ──────────────────────────────────────────────────
  useEffect(() => {
    const silence = () => {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
      wakeLockRef.current?.release().catch(() => {});
    };
    window.addEventListener('alerter:silence', silence);
    return () => window.removeEventListener('alerter:silence', silence);
  }, []);

  return <audio ref={audioRef} src="/pager.mp3" preload="auto" loop />;
}
