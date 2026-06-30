import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';

const getOrgId = () =>
  localStorage.getItem('organizationId') || sessionStorage.getItem('organizationId') || '';

export default function GlobalPagerMonitor() {
  const { user, isAuthenticated } = useAuth();
  const audioRef      = useRef(null);
  const seenRef       = useRef(new Set());
  const wakeLockRef   = useRef(null);
  const lastCheckRef  = useRef(0); // timestamp of last unread check
  // Snapshot of pager_last_seen taken at mount — BEFORE any panel-open effect can
  // update localStorage. This prevents the panel opening via ?alerter=open from
  // immediately marking all alerts as "seen" and blocking the on-load check.
  const mountSeenAtRef = useRef(null);

  useEffect(() => {
    if (!user?.id || mountSeenAtRef.current !== null) return;
    mountSeenAtRef.current = localStorage.getItem('pager_last_seen_' + user.id) || '1970-01-01T00:00:00Z';
  }, [user?.id]);

  // ── Unread check (runs on load + on foreground) ──────────────────────
  const checkUnread = useCallback(async () => {
    if (!isAuthenticated || !user?.id) return;
    const orgId = getOrgId();
    if (!orgId) return;

    // Throttle: don't re-check more than once every 10 seconds
    const now = Date.now();
    if (now - lastCheckRef.current < 10_000) return;
    lastCheckRef.current = now;

    // Use the mount-time snapshot so the panel opening via ?alerter=open cannot
    // advance seenAt before this check runs and hide the incoming alert.
    const seenAt = mountSeenAtRef.current || localStorage.getItem('pager_last_seen_' + user.id) || '1970-01-01T00:00:00Z';
    const dismissed  = (() => {
      try { return JSON.parse(localStorage.getItem('pager_dismissed_' + user.id) || '[]'); }
      catch (e) { return []; }
    })();
    const dismissedSet = new Set(dismissed);

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data } = await supabase
      .from('pager_messages')
      .select('*')
      .eq('organization_id', orgId)
      .gt('created_at', since)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!data || data.length === 0) return;

    const userAreaId = user.rota_area_id || user.area_id;
    const unread = data.filter((msg) => {
      if (dismissedSet.has(msg.id)) return false;
      if (msg.created_at <= seenAt) return false;
      if (seenRef.current.has(msg.id)) return false;
      const directlyAddressed = msg.recipient_mode === 'individual' && msg.recipient_id === user.id;
      if (msg.sent_by === user.id && !directlyAddressed) return false;
      return (
        msg.recipient_mode === 'global' ||
        (msg.recipient_mode === 'area' && msg.recipient_area_id === userAreaId) ||
        directlyAddressed
      );
    });

    if (unread.length === 0) return;

    unread.forEach((m) => seenRef.current.add(m.id));
    window.dispatchEvent(new CustomEvent('alerter:incoming', { detail: unread[0] }));
  }, [isAuthenticated, user?.id]);

  // Run on load (1.5 s delay so UI settles first)
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    const timer = setTimeout(checkUnread, 1500);
    return () => clearTimeout(timer);
  }, [isAuthenticated, user?.id, checkUnread]);

  // Re-run when app comes back to foreground (handles backgrounded PWA case)
  useEffect(() => {
    const onVisible = () => { if (!document.hidden) checkUnread(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [checkUnread]);

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
      .subscribe((status) => {
        console.log('[GlobalPagerMonitor] channel status:', status);
      });

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
