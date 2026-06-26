import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import {
  buildAlerts, startPagerLoop, stopPagerLoop,
  isAlerterSilenced, unsilenceAlerter, setupPagerAudio,
} from '@/pages/radio/AlerterTab';

const getOrgId = () =>
  localStorage.getItem('organizationId') || sessionStorage.getItem('organizationId') || '';

export default function GlobalAlerterMonitor() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [now, setNow] = useState(() => new Date());
  const firedRef = useRef(new Set()); // alert IDs already triggered this session
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const isRadioMode = localStorage.getItem('carecall_radio_mode') === 'true';

  // Tick every 30s to re-evaluate alerts
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  // Pre-unlock audio as soon as alerter is enabled — getUserMedia with already-granted
  // mic permission resolves without a gesture, unlocking AudioContext for pager tones
  useEffect(() => {
    if (alerterEnabled) setupPagerAudio();
  }, [alerterEnabled]);

  // User flags — shared cache key with TwoWayRadio
  const { data: userFlags } = useQuery({
    queryKey: ['userFlags', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('users')
        .select('is_control_device, alerter_enabled, alerter_area_ids')
        .eq('id', user.id)
        .single();
      return data;
    },
    enabled: !!user?.id && isAuthenticated,
    staleTime: 300000,
  });

  const urlPreview = new URLSearchParams(window.location.search).get('preview') || '';
  const isControlDevice = !!userFlags?.is_control_device || urlPreview === 'control';
  const alerterEnabled = isControlDevice || !!userFlags?.alerter_enabled;

  // Shifts
  const { data: rawShifts = [] } = useQuery({
    queryKey: ['gam_shifts', todayStr, getOrgId()],
    queryFn: async () => {
      const orgId = getOrgId();
      let q = supabase.from('shifts').select(
        'id, staff_id, staff_name, area, date, start_time, end_time, status, clock_in_time, clock_out_time, paired_shift_id'
      ).eq('date', todayStr);
      if (orgId) q = q.eq('organization_id', orgId);
      const { data } = await q;
      return data || [];
    },
    enabled: alerterEnabled,
    refetchInterval: 30000,
  });

  // Shift calls
  const { data: rawCalls = [] } = useQuery({
    queryKey: ['gam_calls', todayStr, getOrgId()],
    queryFn: async () => {
      const orgId = getOrgId();
      let q = supabase.from('shift_calls').select(
        'id, shift_id, scheduled_time, actual_time, status, clock_in_time, service_user_name, shifts(id, staff_id, staff_name, paired_shift_id, area)'
      ).eq('scheduled_date', todayStr);
      if (orgId) q = q.eq('organization_id', orgId);
      const { data } = await q;
      return data || [];
    },
    enabled: alerterEnabled,
    refetchInterval: 30000,
  });

  // Staff
  const { data: staff = [] } = useQuery({
    queryKey: ['gam_staff', getOrgId()],
    queryFn: async () => {
      const orgId = getOrgId();
      let q = supabase.from('users').select('id, full_name');
      if (orgId) q = q.eq('organization_id', orgId);
      const { data } = await q;
      return data || [];
    },
    enabled: alerterEnabled,
    staleTime: 300000,
  });

  // Test triggers — same cache key as AlerterTab
  const { data: testTriggers = [] } = useQuery({
    queryKey: ['alerter_test_triggers'],
    queryFn: async () => {
      const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const orgId = getOrgId();
      let q = supabase.from('alerter_test_triggers').select('*').gte('triggered_at', since).order('triggered_at', { ascending: false });
      if (orgId) q = q.eq('organization_id', orgId);
      const { data } = await q;
      return data || [];
    },
    enabled: alerterEnabled,
    refetchInterval: 15000,
  });

  // Main alerter logic — runs whenever data or time changes
  useEffect(() => {
    if (!alerterEnabled) { stopPagerLoop(); return; }
    setupPagerAudio(); // unlock AudioContext via getUserMedia + decode pager buffer

    const areaIds = userFlags?.alerter_area_ids;
    const todayShifts = areaIds?.length ? rawShifts.filter(s => areaIds.includes(s.area)) : rawShifts;
    const todayShiftCalls = areaIds?.length ? rawCalls.filter(c => areaIds.includes(c.shifts?.area)) : rawCalls;

    const testAlerts = testTriggers.map(t => ({
      id: `test_${t.id}`, type: 'TEST', priority: 'HIGH', title: 'Test Alert', refId: t.id, fields: [],
    }));

    const allAlerts = [
      ...buildAlerts(todayShifts, todayShiftCalls, staff, todayStr, now),
      ...testAlerts,
    ];

    // Filter to unacked, undeleted
    let acked  = new Set(); try { acked  = new Set(JSON.parse(localStorage.getItem('alerter_acked')   || '[]')); } catch {}
    let deleted = new Set(); try { deleted = new Set(JSON.parse(localStorage.getItem('alerter_deleted') || '[]')); } catch {}
    const newAlerts = allAlerts.filter(a => !acked.has(a.id) && !deleted.has(a.id));

    if (newAlerts.length === 0) {
      stopPagerLoop();
      return;
    }

    // New alert IDs that haven't been fired this session
    const unfired = newAlerts.filter(a => !firedRef.current.has(a.id));

    if (unfired.length > 0) {
      // Brand new alert — clear silence and fire
      unfired.forEach(a => firedRef.current.add(a.id));
      unsilenceAlerter();
      startPagerLoop();

      // Wake lock
      if ('wakeLock' in navigator) {
        navigator.wakeLock.request('screen').catch(() => {});
      }

      // SW notification to wake APK from background
      if ('Notification' in window) {
        navigator.serviceWorker?.ready.then(reg =>
          reg.showNotification('⚠️ CareCall Alerter', {
            body: `${newAlerts.length} new alert${newAlerts.length > 1 ? 's' : ''}`,
            tag: 'alerter', renotify: true, requireInteraction: true,
          })
        ).catch(() => {});
      }

      // Switch to alerter tab via event (works when TwoWayRadio already mounted)
      window.dispatchEvent(new CustomEvent('alerter:new-alert'));

      // Navigate to radio/alerter page (PWA only — APK is always on TwoWayRadio)
      if (!isRadioMode) {
        navigate('/TwoWayRadio?tab=alerter');
      }
    } else if (!isAlerterSilenced() && !_pagerActiveCheck()) {
      // Existing unacked alerts, not silenced, tone stopped — restart
      startPagerLoop();
    }
  }, [now, rawShifts, rawCalls, staff, testTriggers, alerterEnabled, userFlags?.alerter_area_ids]);

  return null;
}

// Check pager active without exporting the private variable
function _pagerActiveCheck() {
  // startPagerLoop has internal guard — calling it is safe, but we want to avoid
  // restarting when user just silenced. isAlerterSilenced() covers that.
  return false; // always let the isAlerterSilenced check be the gate
}
