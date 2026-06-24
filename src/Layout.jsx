import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { PAGES } from './pages.config';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AnnouncementAcknowledgementModal from '@/components/AnnouncementAcknowledgementModal';
import BottomNavigation from '@/components/ui/BottomNavigation';
import { cn } from "@/lib/utils";
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import OnboardingModal from '@/components/OnboardingModal';
import OwnerWelcomeModal from '@/components/OwnerWelcomeModal';
import { getCurrentOrgRole, getCurrentOrg } from '@/lib/orgContext';
import { useHelpMode } from '@/lib/HelpModeContext';
import AppDownloadPrompt from '@/components/AppDownloadPrompt';
import PWAInstallButton from '@/components/PWAInstallButton';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import Avatar from '@/components/ui/Avatar';
import AppUpdateBanner from '@/components/AppUpdateBanner';
import GpsWarningBanner from '@/components/GpsWarningBanner';
import OfflineManager from '@/components/OfflineManager';
import ActiveShiftAutoOpen from '@/components/ActiveShiftAutoOpen';
import HeaderIcons from '@/components/HeaderIcons';
import LockScreen from '@/components/LockScreen';
// OverdueCallAlert removed — screen lock caused app-wide issues; push notifications handle late call alerts
import SickBookingDialog from '@/components/leave/SickBookingDialog';
import { isBiometricEnabled, storeBiometricRefreshToken } from '@/utils/biometric';
import { supabase } from '@/api/supabaseClient';
import {
                                LayoutDashboard,
                                Calendar,
                                Clock,
                                Users,
                                Heart,
                                AlertTriangle,
                                MessageSquare,
                                Folder,
                                GraduationCap,
                                CalendarOff,
                                BarChart3,
                                Settings,
                                Menu,
                                X,
                                LogOut,
                                User,
                                Bot,
                                ChevronDown,
                                Bell,
                                Shield,
                                Home,
                                ArrowLeft,
                                Download,
                                HelpCircle,
                                FileText,
                                RefreshCw,
                                PoundSterling,
                                Phone,
                                PhoneOff,
                                Mic,
                              } from 'lucide-react';


const navigation = [
                    { name: 'Dashboard', icon: LayoutDashboard, page: 'Dashboard' },
                    { name: 'Incidents', icon: AlertTriangle, page: 'Incidents' },
                    { name: 'My Documents', icon: Folder, page: 'Documents' },
                    { name: 'Training', icon: GraduationCap, page: 'Training' },
                    { name: 'My Payslips', icon: PoundSterling, page: 'Payroll' },
                  ];

const ROOT_PAGES = ['Dashboard'];



export default function Layout({ children, currentPageName }) {
  const navigate = useNavigate();
  const visitedPagesRef = useRef(new Set());
  const [ownerWelcomeDismissed, setOwnerWelcomeDismissed] = useState(false);
  const [showAdminPointer, setShowAdminPointer] = useState(false);
  const [showNotifBanner, setShowNotifBanner] = useState(false);
  const { helpMode, setHelpMode } = useHelpMode();


  
  const { data: user, isLoading: userLoading, error: userError } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch (error) {
        // If user doesn't exist anymore, log them out
        if (error.message?.includes('not found') || error.status === 404) {
          base44.auth.logout();
          return null;
        }
        throw error;
      }
    },
  });

  // Control device — auto-redirect to Radio page and stay there
  React.useEffect(() => {
    if (user?.is_control_device && currentPageName !== 'TwoWayRadio') {
      navigate(createPageUrl('TwoWayRadio'));
    }
  }, [user?.is_control_device, currentPageName]);

  // If user is deleted, log them out
  React.useEffect(() => {
    if (userError || (user && !user.id)) {
      base44.auth.logout();
    }
  }, [userError, user]);

  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || user?.job_title === 'admin' || user?.job_title === 'manager' || user?.job_title === 'supervisor';
  const isSuperAdmin = user?.role === 'super_admin';

  // Auto-promote first admin to super_admin if none exists
  React.useEffect(() => {
    if (!user || user.role !== 'admin') return;
    (async () => {
      try {
        const { count } = await supabase
          .from('users')
          .select('id', { count: 'exact', head: true })
          .eq('role', 'super_admin');
        if (count === 0) {
          await Promise.all([
            supabase.from('users').update({ role: 'super_admin' }).eq('id', user.id),
            supabase.from('profiles').update({ role: 'super_admin' }).eq('id', user.id),
          ]);
          queryClient.invalidateQueries({ queryKey: ['currentUser'] });
          console.log('[Layout] Auto-promoted first admin to super_admin');
        }
      } catch (e) {
        console.warn('[Layout] Super admin check failed:', e);
      }
    })();
  }, [user?.id, user?.role]);

  const { data: pendingSwaps = [] } = useQuery({
    queryKey: ['pendingSwaps'],
    queryFn: () => base44.entities.ShiftSwapRequest.filter({ status: 'pending_admin' }),
    enabled: isAdmin,
  });

  const { data: pendingLeave = [] } = useQuery({
    queryKey: ['pendingLeaveAdmin'],
    queryFn: () => base44.entities.LeaveRequest.filter({ status: 'pending' }),
    enabled: isAdmin,
  });

  const { data: openIncidents = [] } = useQuery({
    queryKey: ['openIncidentsAdmin'],
    queryFn: () => base44.entities.Incident.filter({ status: ['open', 'investigating'] }),
    enabled: isAdmin,
  });

  const totalAdminTasks = pendingSwaps.length + pendingLeave.length + openIncidents.length;

  // Track unread chat count
  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: () => base44.entities.Conversation.list(),
    enabled: !!user?.id,
    staleTime: 30000, // 30 seconds
  });

  const unreadConversations = conversations.filter((conv) => {
    let unreadCount = 0;
    if (typeof conv.unread_count === 'object' && conv.unread_count) {
      unreadCount = conv.unread_count[user?.id] || 0;
    } else if (typeof conv.unread_count === 'number') {
      unreadCount = conv.unread_count;
    }
    return unreadCount > 0;
  });



  const { data: trackingSettings = [] } = useQuery({
    queryKey: ['trackingSettings'],
    queryFn: () => base44.entities.SystemSettings.filter({ setting_key: 'gps_tracking_enabled' }),
    enabled: !!user?.id,
  });

  // GPS tracking defaults to ON — admin can turn it off if needed
  const globalTrackingEnabled = trackingSettings.length === 0 || trackingSettings[0]?.setting_value !== 'false';

  const updateLocationMutation = useMutation({
   mutationFn: async (coords) => {
     // Delete existing + insert fresh → exactly one record per user
     await supabase.from('locations').delete().eq('staff_id', user.id);
     const { error } = await supabase.from('locations').insert({
       staff_id: user.id,
       staff_name: user.staff_full_name || user.full_name,
       latitude: coords.latitude,
       longitude: coords.longitude,
       accuracy: coords.accuracy,
       timestamp: new Date().toISOString()
     });
     if (error) throw error;
   },
  });


  // Show permissions banner after a delay (needs user gesture in modern browsers)
  React.useEffect(() => {
    if (localStorage.getItem('carecall_permissions_done')) return;
    const needsAny =
      ('Notification' in window && Notification.permission === 'default') ||
      (navigator.permissions && true); // camera/mic/location need gesture
    if (!needsAny) return;
    const timer = setTimeout(() => setShowNotifBanner(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  // Request all permissions early (GPS, camera)
  React.useEffect(() => {

    // GPS — request permission immediately so tracking can start
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {}, // success — permission granted, no action needed
        () => {}, // error — user denied or unavailable
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }

    // Camera — request once then immediately stop the stream
    if (navigator.mediaDevices?.getUserMedia) {
      navigator.permissions?.query?.({ name: 'camera' }).then((result) => {
        if (result.state === 'prompt') {
          navigator.mediaDevices.getUserMedia({ video: true })
            .then((stream) => stream.getTracks().forEach(t => t.stop()))
            .catch(() => {});
        }
      }).catch(() => {});
    }
  }, []);

  // Listen to system dark mode preference and set viewport for mobile
  React.useEffect(() => {
    // Set viewport meta to prevent zoom on input focus
    let viewportMeta = document.querySelector('meta[name="viewport"]');
    if (!viewportMeta) {
      viewportMeta = document.createElement('meta');
      viewportMeta.name = 'viewport';
      document.head.appendChild(viewportMeta);
    }
    viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';

    // Set theme-color meta for Android
    let themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (!themeColorMeta) {
      themeColorMeta = document.createElement('meta');
      themeColorMeta.name = 'theme-color';
      document.head.appendChild(themeColorMeta);
    }

    // Restore dark mode preference from localStorage or system
    const savedDark = localStorage.getItem('darkMode');
    const prefersDark = savedDark === 'true' ||
      (savedDark === null && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (prefersDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
      themeColorMeta.content = '#0f172a';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
      themeColorMeta.content = '#ffffff';
    }
  }, []);



  // Auto-start GPS tracking on app load (only if globally enabled)
  // - Keeps location record when app is backgrounded (so iPhone users stay visible)
  // - Only deletes on actual page close (beforeunload/pagehide)
  // - Resumes tracking when app returns to foreground
  // - Throttles DB writes to once per 30 seconds
  useEffect(() => {
    if (!user?.id || !globalTrackingEnabled) return;

    let currentToken = null;
    supabase.auth.getSession().then(({ data: { session } }) => {
      currentToken = session?.access_token;
    });

    let watchId = null;
    let lastUpdateTime = 0;
    const THROTTLE_MS = 30000;

    const startWatch = () => {
      if (watchId !== null) return;
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const now = Date.now();
          if (now - lastUpdateTime < THROTTLE_MS) return;
          lastUpdateTime = now;
          updateLocationMutation.mutate({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (error) => console.warn('Geolocation unavailable:', error?.message || error?.code || 'unknown'),
        { enableHighAccuracy: true, maximumAge: 30000, timeout: 10000 }
      );
    };

    const stopWatch = () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
      }
    };

    startWatch();

    // Only delete location on actual page close (not background)
    const removeLocation = () => {
      stopWatch();
      if (!currentToken) return;
      try {
        const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
        const supabaseKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();
        fetch(`${supabaseUrl}/rest/v1/locations?staff_id=eq.${user.id}`, {
          method: 'DELETE',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${currentToken}`,
          },
          keepalive: true,
        });
      } catch (e) { /* ignore errors on unload */ }
    };

    // Pause/resume tracking on visibility change — keep location record
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopWatch();
      } else {
        startWatch();
      }
    };

    window.addEventListener('beforeunload', removeLocation);
    window.addEventListener('pagehide', removeLocation);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopWatch();
      window.removeEventListener('beforeunload', removeLocation);
      window.removeEventListener('pagehide', removeLocation);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user?.id, globalTrackingEnabled]);

  // ─── Inactivity Lock Screen ────────────────────────────────────────
  // Staff log in once per day — lock only after 24h of total inactivity.
  // Returning to the app from background resets the timer so a normal
  // shift never triggers the lock screen.
  const [isLocked, setIsLocked] = useState(false);
  const [sickDialogOpen, setSickDialogOpen] = useState(false);
  const inactivityTimerRef = React.useRef(null);
  const INACTIVITY_MS = 24 * 60 * 60 * 1000; // 24 hours

  useEffect(() => {
    if (!user?.id) return;

    const resetTimer = () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = setTimeout(() => setIsLocked(true), INACTIVITY_MS);
    };

    // Reset when staff return to the app after using something else
    const handleVisibility = () => { if (!document.hidden) resetTimer(); };

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));
    document.addEventListener('visibilitychange', handleVisibility);
    resetTimer();

    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer));
      document.removeEventListener('visibilitychange', handleVisibility);
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, [user?.id]);

  // Keep biometric refresh token current so biometric login works after sign-out
  useEffect(() => {
    if (!user?.id || !isBiometricEnabled()) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.refresh_token) {
        storeBiometricRefreshToken(session.refresh_token);
      }
    });
    return () => subscription.unsubscribe();
  }, [user?.id]);

  // ─── Global incoming radio call ───────────────────────────────────
  const [globalIncomingCall, setGlobalIncomingCall] = useState(null);
  const globalRingStopRef = useRef(null);
  const globalStaffRef = useRef([]);
  const currentPageNameRef = useRef(currentPageName);
  useEffect(() => { currentPageNameRef.current = currentPageName; }, [currentPageName]);

  const { data: radioStaff = [] } = useQuery({
    queryKey: ['staff'],
    queryFn: () => base44.entities.User.list(),
    enabled: !!user?.id,
    staleTime: 60000,
  });
  useEffect(() => { globalStaffRef.current = radioStaff; }, [radioStaff]);

  // Missed / callback calls — shared cache key with TwoWayRadio
  const { data: missedRadioCalls = [] } = useQuery({
    queryKey: ['missedRadioCalls', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const since = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
      const [{ data: cbCalls }, { data: dcCalls }, { data: cancelledCalls }] = await Promise.all([
        supabase.from('radio_calls').select('id, caller_id, callee_id, status, created_at')
          .eq('callee_id', user.id).eq('status', 'callback').gt('created_at', since)
          .order('created_at', { ascending: false }),
        supabase.from('radio_calls').select('id, caller_id, callee_id, status, created_at')
          .eq('caller_id', user.id).eq('status', 'declined').gt('created_at', since)
          .order('created_at', { ascending: false }),
        supabase.from('radio_calls').select('id, caller_id, callee_id, status, created_at')
          .eq('callee_id', user.id).eq('status', 'cancelled').gt('created_at', since)
          .order('created_at', { ascending: false }),
      ]);
      return [...(cbCalls || []), ...(dcCalls || []), ...(cancelledCalls || [])]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 10);
    },
    enabled: !!user?.id,
    refetchInterval: 60000,
  });
  // Callback requests directed at this user (shared cache key with TwoWayRadio)
  const { data: callbackRequestCalls = [] } = useQuery({
    queryKey: ['callbackRequests', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const since = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from('radio_calls').select('id, caller_id, callee_id, status, created_at')
        .eq('callee_id', user.id).eq('status', 'callback_request').gt('created_at', since)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!user?.id,
    refetchInterval: 60000,
  });
  const [dismissedBannerIds, setDismissedBannerIds] = useState(() => {
    try {
      const raw = localStorage.getItem('dismissedMissedCalls');
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch { return new Set(); }
  });
  const [dismissedCbBannerIds, setDismissedCbBannerIds] = useState(() => {
    try {
      const raw = localStorage.getItem('dismissedCallbackRequests');
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch { return new Set(); }
  });
  const dismissBannerCalls = (...ids) => {
    setDismissedBannerIds(prev => {
      const next = new Set([...prev, ...ids]);
      try { localStorage.setItem('dismissedMissedCalls', JSON.stringify([...next])); } catch {}
      return next;
    });
  };
  const dismissCbBannerCalls = (...ids) => {
    setDismissedCbBannerIds(prev => {
      const next = new Set([...prev, ...ids]);
      try { localStorage.setItem('dismissedCallbackRequests', JSON.stringify([...next])); } catch {}
      return next;
    });
  };
  const visibleMissedCalls = currentPageName !== 'TwoWayRadio'
    ? missedRadioCalls.filter(c => !dismissedBannerIds.has(c.id))
    : [];
  const visibleCbRequests = currentPageName !== 'TwoWayRadio'
    ? callbackRequestCalls.filter(c => !dismissedCbBannerIds.has(c.id))
    : [];
  const anyRadioAlerts = visibleMissedCalls.length > 0 || visibleCbRequests.length > 0;

  // Auto-redirect to Radio on app open / return from background if missed calls or callback requests exist
  const autoRedirectedRef = useRef(false);
  const anyRadioAlertsRef = useRef(anyRadioAlerts);
  const currentPageRef = useRef(currentPageName);
  anyRadioAlertsRef.current = anyRadioAlerts;
  currentPageRef.current = currentPageName;

  useEffect(() => {
    if (autoRedirectedRef.current) return;
    if (!user?.id || !anyRadioAlerts || currentPageName === 'TwoWayRadio') return;
    autoRedirectedRef.current = true;
    navigate(createPageUrl('TwoWayRadio'));
  }, [user?.id, anyRadioAlerts, currentPageName, navigate]);

  useEffect(() => {
    const onVisible = () => {
      if (!document.hidden) {
        autoRedirectedRef.current = false;
        setTimeout(() => {
          if (autoRedirectedRef.current) return;
          if (!anyRadioAlertsRef.current || currentPageRef.current === 'TwoWayRadio') return;
          autoRedirectedRef.current = true;
          navigate(createPageUrl('TwoWayRadio'));
        }, 2000);
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [navigate]);

  const stopGlobalRing = useCallback(() => {
    if (globalRingStopRef.current) { globalRingStopRef.current(); globalRingStopRef.current = null; }
  }, []);

  const globalAudioCtxRef = useRef(null);
  const playGlobalRing = useCallback(() => {
    stopGlobalRing();
    let stopped = false;

    // Play Alert tone.aac in a loop (PWA with prior domain interaction)
    let alertAudio = null;
    try {
      alertAudio = new Audio('/radio-tones/Alert tone.aac');
      alertAudio.volume = 1.0;
      const step = () => {
        if (stopped || !alertAudio) return;
        alertAudio.currentTime = 0;
        alertAudio.play().catch(() => {});
      };
      alertAudio.addEventListener('ended', () => { if (!stopped) setTimeout(step, 300); });
      step();
    } catch {}

    // Oscillator ring runs in parallel as reinforcement
    try {
      if (!globalAudioCtxRef.current || globalAudioCtxRef.current.state === 'closed') {
        globalAudioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (globalAudioCtxRef.current.state === 'suspended') globalAudioCtxRef.current.resume().catch(() => {});
      const ctx = globalAudioCtxRef.current;
      const freqs = [880, 1100, 880, 1100, 660];
      let idx = 0;
      const next = () => {
        if (stopped) return;
        try {
          const osc = ctx.createOscillator(); const gain = ctx.createGain();
          osc.connect(gain); gain.connect(ctx.destination);
          osc.frequency.value = freqs[idx % freqs.length]; idx++;
          gain.gain.setValueAtTime(1.0, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
          osc.start(); osc.stop(ctx.currentTime + 0.18);
          osc.onended = next;
        } catch {}
      };
      next();
    } catch {}

    globalRingStopRef.current = () => {
      stopped = true;
      if (alertAudio) { try { alertAudio.pause(); alertAudio.currentTime = 0; } catch {} alertAudio = null; }
    };
  }, [stopGlobalRing]);

  useEffect(() => {
    if (!user?.id) return;
    const ch = supabase
      .channel(`layout-radio-calls-${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'radio_calls', filter: `callee_id=eq.${user.id}` }, payload => {
        const call = payload.new;
        if (call.status !== 'pending') return;
        if (Date.now() - new Date(call.created_at).getTime() > 90000) return;
        // TwoWayRadio page has its own overlay + ring — don't double up
        if (currentPageNameRef.current === 'TwoWayRadio') return;
        const caller = globalStaffRef.current.find(s => s.id === call.caller_id)
          || { full_name: 'Team Member', id: call.caller_id };
        setGlobalIncomingCall({ callId: call.id, caller, channelName: call.channel_name });
        playGlobalRing();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'radio_calls', filter: `callee_id=eq.${user.id}` }, payload => {
        const { status } = payload.new;
        // Clear the global incoming overlay if call resolved
        if (['accepted', 'ended', 'cancelled', 'declined'].includes(status)) {
          setGlobalIncomingCall(null);
          stopGlobalRing();
        }
        // Refresh missed calls when I said callback, call was declined, or caller gave up (cancelled = missed call for me)
        if (['callback', 'declined', 'cancelled'].includes(status)) {
          queryClient.invalidateQueries({ queryKey: ['missedRadioCalls', user.id] });
        }
      })
      .subscribe();

    // Watch for others declining MY outgoing calls
    const ch2 = supabase
      .channel(`layout-radio-caller-${user.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'radio_calls', filter: `caller_id=eq.${user.id}` }, payload => {
        if (['declined', 'callback'].includes(payload.new.status)) {
          queryClient.invalidateQueries({ queryKey: ['missedRadioCalls', user.id] });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(ch); supabase.removeChannel(ch2); };
  }, [user?.id, playGlobalRing, stopGlobalRing, queryClient]);

  const handleGlobalAnswer = async () => {
    if (!globalIncomingCall) return;
    stopGlobalRing();
    const { callId, channelName } = globalIncomingCall;
    setGlobalIncomingCall(null);
    await supabase.from('radio_calls').update({ status: 'accepted' }).eq('id', callId);
    navigate(createPageUrl('TwoWayRadio') + `?join=${channelName}`);
  };

  const handleGlobalDecline = async (status = 'declined') => {
    if (!globalIncomingCall) return;
    stopGlobalRing();
    const { callId } = globalIncomingCall;
    setGlobalIncomingCall(null);
    await supabase.from('radio_calls').update({ status }).eq('id', callId);
  };

  // ─── Pull-to-Refresh ─────────────────────────────────────────────
  const mainRef = useRef(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const isPulling = useRef(false);
  const PULL_THRESHOLD = 80;

  const handleTouchStart = useCallback((e) => {
    const main = mainRef.current;
    if (!main || isRefreshing) return;
    if (main.scrollTop <= 0) {
      touchStartY.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  }, [isRefreshing]);

  const handleTouchMove = useCallback((e) => {
    if (!isPulling.current || isRefreshing) return;
    const main = mainRef.current;
    if (!main || main.scrollTop > 0) {
      isPulling.current = false;
      setPullDistance(0);
      return;
    }
    const diff = e.touches[0].clientY - touchStartY.current;
    if (diff > 0) {
      // Dampen the pull distance for a natural feel
      setPullDistance(Math.min(diff * 0.4, 120));
    }
  }, [isRefreshing]);

  const handleTouchEnd = useCallback(() => {
    if (!isPulling.current) return;
    isPulling.current = false;
    if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(PULL_THRESHOLD);
      // Invalidate all React Query caches to refresh all data
      queryClient.invalidateQueries();
      // Minimum spinner display time
      setTimeout(() => {
        setIsRefreshing(false);
        setPullDistance(0);
      }, 1200);
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, isRefreshing, queryClient]);

    // Add styles for alternating flash animation and disable pull-to-refresh
    const flashStyles = `
      @keyframes bounce-slow {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(6px); }
      }
      .animate-bounce-slow { animation: bounce-slow 1.5s ease-in-out infinite; }
      @keyframes flash-red {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.2; }
      }
      @keyframes flash-blue {
        0%, 100% { opacity: 0.2; }
        50% { opacity: 1; }
      }
      .flash-red {
        animation: flash-red 1s infinite;
      }
      .flash-blue {
        animation: flash-blue 1s infinite;
      }
      html, body {
        overscroll-behavior: none;
        overscroll-behavior-y: none;
      }
      button, a, [role="button"], [role="menuitem"], .cursor-pointer {
        -webkit-user-select: none;
        -webkit-touch-callout: none;
        user-select: none;
        pointer-events: auto;
      }
      /* Prevent zoom on input focus (mobile) */
      input[type="text"],
      input[type="email"],
      input[type="password"],
      input[type="number"],
      input[type="tel"],
      input[type="url"],
      input[type="search"],
      input[type="date"],
      input[type="time"],
      textarea,
      select {
        font-size: 16px !important;
      }
      @media (max-width: 768px) {
        ::-webkit-scrollbar {
          display: none;
        }
        * {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      }
    `;



  const { data: messages = [] } = useQuery({
    queryKey: ['messages'],
    queryFn: () => base44.entities.Message.list(),
    enabled: !!user?.id,
  });

  const { data: unacknowledgedAnnouncements = [] } = useQuery({
    queryKey: ['unacknowledgedAnnouncements', user?.id],
    queryFn: async () => {
      const allAnnouncements = await base44.entities.Message.filter({ type: 'announcement' }, '-created_date', 100);
      const acknowledged = await base44.entities.AnnouncementAcknowledgement.filter({ staff_id: user?.id });
      const acknowledgedIds = acknowledged.map(a => a.announcement_id);
      return allAnnouncements.filter(a =>
        !acknowledgedIds.includes(a.id) &&
        // Also skip if user is already in read_by
        !(a.read_by && a.read_by.includes(user?.id))
      );
    },
    enabled: !!user?.id,
    staleTime: 60000,
  });

  React.useEffect(() => {
    if (!user?.id) return;
    
    const unsubscribeMessages = base44.entities.Message.subscribe((event) => {
      // Immediately refetch on delete to stop flashing
      if (event.type === 'delete') {
        queryClient.refetchQueries({ queryKey: ['messages'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['messages'] });
      }
      
      if (event.type === 'create' && event.data?.type === 'announcement') {
        queryClient.invalidateQueries({ queryKey: ['unacknowledgedAnnouncements', user.id] });
      }
    });

    const unsubscribeAcknowledgements = base44.entities.AnnouncementAcknowledgement.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['unacknowledgedAnnouncements', user.id] });
    });



    if (isAdmin) {
      const unsubscribeIncidents = base44.entities.Incident.subscribe(() => {
        queryClient.invalidateQueries({ queryKey: ['openIncidentsAdmin'] });
      });

      const unsubscribeLeave = base44.entities.LeaveRequest.subscribe(() => {
        queryClient.invalidateQueries({ queryKey: ['pendingLeaveAdmin'] });
      });

      const unsubscribeSwaps = base44.entities.ShiftSwapRequest.subscribe(() => {
        queryClient.invalidateQueries({ queryKey: ['pendingSwaps'] });
        queryClient.invalidateQueries({ queryKey: ['shiftSwapRequests'] });
        queryClient.invalidateQueries({ queryKey: ['incomingSwapRequests'] });
        queryClient.invalidateQueries({ queryKey: ['mySwapRequests'] });
      });

      return () => {
        unsubscribeMessages();
        unsubscribeAcknowledgements();
        unsubscribeIncidents();
        unsubscribeLeave();
        unsubscribeSwaps();
      };
    }

    return () => {
      unsubscribeMessages();
      unsubscribeAcknowledgements();
    };
  }, [user?.id, isAdmin, queryClient]);

  const { data: companySettings = {} } = useQuery({
    queryKey: ['companySettings'],
    queryFn: async () => {
      const settings = await base44.entities.SystemSettings.filter({ setting_key: ['company_name', 'company_logo'] });
      const result = {};
      settings.forEach(s => {
        result[s.setting_key] = s.setting_value;
      });
      return result;
    }
  });

  const isWeatherWarningExpired = (warning) => {
    if (!warning.warning_end) return false;
    const endTime = new Date(warning.warning_end).getTime();
    const now = new Date().getTime();
    return now > endTime;
  };

  // Auto-delete expired warnings
  React.useEffect(() => {
    const deleteExpiredWarnings = async () => {
      const expiredWarnings = messages.filter(msg =>
        msg.type === 'weather_warning' &&
        msg.warning_end &&
        isWeatherWarningExpired(msg)
      );

      for (const warning of expiredWarnings) {
        try {
          await base44.entities.Message.delete(warning.id);
        } catch (error) {
          console.error('Failed to delete expired warning:', error);
        }
      }
    };

    if (user?.id && messages.length > 0) {
      deleteExpiredWarnings();
    }
  }, [messages, user?.id]);

  const unreadNotificationCount = messages.filter(msg => {
    if (isWeatherWarningExpired(msg)) return false;
    // Weather warnings don't count here — staff can't clear them.
    // They show via hasWeatherWarning header instead.
    if (msg.type === 'weather_warning') return false;
    // Other urgent messages use read_by
    return msg.priority === 'urgent' && (!msg.read_by || !msg.read_by.includes(user?.id));
  }).length;

  const hasWeatherWarning = messages.some(msg =>
    msg.type === 'weather_warning' &&
    !msg.is_cancelled &&
    !isWeatherWarningExpired(msg)
  );

  const [loadingTimeout, setLoadingTimeout] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setLoadingTimeout(true), 10000);
    return () => clearTimeout(timeout);
  }, []);

  if (userLoading && !loadingTimeout) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show onboarding modal for new users
  // Also catch names that are just the email prefix (e.g. "info" from info@example.com)
  const looksLikeEmailPrefix = user?.email && user?.full_name &&
    user.email.toLowerCase().startsWith(user.full_name.toLowerCase() + '@');
  const needsOnboarding = user && (!user.full_name || user.full_name.includes('@') || looksLikeEmailPrefix || !user.onboarding_complete);
  if (needsOnboarding) {
    return <OnboardingModal user={user} open={true} />;
  }

  // Show owner welcome modal for new org owners who haven't completed setup
  const orgRole = getCurrentOrgRole();
  const currentOrg = getCurrentOrg();
  const showOwnerWelcome = orgRole === 'owner' && currentOrg && !currentOrg.owner_onboarded && !ownerWelcomeDismissed;
  if (showOwnerWelcome) {
    return <OwnerWelcomeModal onComplete={() => { setOwnerWelcomeDismissed(true); setShowAdminPointer(true); }} />;
  }

  // Show unacknowledged announcement modal (non-admin staff only — admins must not be locked out)
  if (unacknowledgedAnnouncements.length > 0 && !isAdmin) {
    return (
      <AnnouncementAcknowledgementModal
        announcements={unacknowledgedAnnouncements}
        user={user}
      />
    );
  }



  return (
    <div className="bg-blue-100" style={{ height: '100dvh', overflow: 'hidden', display: 'flex', flexDirection: 'column', overscrollBehavior: 'none' }}>
      <style>{flashStyles}</style>
      {/* Inactivity Lock Screen */}
      {isLocked && (
        <LockScreen
          onUnlock={() => setIsLocked(false)}
          userName={user?.staff_full_name || user?.full_name}
        />
      )}
      {/* Global incoming radio call overlay — shown on any page except TwoWayRadio (which has its own) */}
      {globalIncomingCall && currentPageName !== 'TwoWayRadio' && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/97 flex flex-col items-center justify-center gap-8 px-6">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping scale-150" />
            <div className="w-28 h-28 rounded-full bg-slate-800 border-4 border-green-500 flex items-center justify-center text-4xl font-bold text-white">
              {(globalIncomingCall.caller?.full_name || '?')[0].toUpperCase()}
            </div>
          </div>
          <div className="text-center">
            <p className="text-slate-400 text-sm uppercase tracking-widest mb-1">Incoming Radio Call</p>
            <p className="text-white text-3xl font-bold">{globalIncomingCall.caller?.full_name || 'Team Member'}</p>
          </div>
          <div className="flex gap-3 w-full max-w-sm">
            <button onClick={() => handleGlobalDecline('declined')}
              className="flex-1 py-5 rounded-2xl bg-red-600 text-white font-bold text-sm flex flex-col items-center gap-1 active:scale-95 transition-transform">
              <PhoneOff className="w-6 h-6" />DECLINE
            </button>
            <button onClick={() => handleGlobalDecline('callback')}
              className="flex-1 py-5 rounded-2xl bg-amber-500 text-white font-bold text-sm flex flex-col items-center gap-1 active:scale-95 transition-transform">
              <Phone className="w-6 h-6" />CALL<br />BACK
            </button>
            <button onClick={handleGlobalAnswer}
              className="flex-1 py-5 rounded-2xl bg-green-500 text-white font-bold text-sm flex flex-col items-center gap-1 active:scale-95 transition-transform">
              <Mic className="w-6 h-6" />ANSWER
            </button>
          </div>
        </div>
      )}
      {/* OverdueCallAlert removed — push notifications via edge function handle late call alerts */}
      {/* Unified Header — hidden on Radio page (Radio has its own top bar) */}
      {currentPageName !== 'TwoWayRadio' && <div className="z-50 bg-white border-b border-slate-200 shadow-sm flex-shrink-0" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="grid grid-cols-[auto_1fr_auto] items-center px-3 py-2 gap-1">
          {/* Left: Profile + Back */}
          <div className="flex items-center gap-1" style={{ position: 'relative', zIndex: 99999 }}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="touch-manipulation p-1 flex items-center justify-center cursor-pointer"
                  style={{ minWidth: 48, minHeight: 48, position: 'relative', zIndex: 99999 }}
                  aria-label="Profile menu"
                >
                  <img
                    src={user?.photo_url || ''}
                    alt={user?.staff_full_name || user?.full_name || 'Profile'}
                    draggable={false}
                    style={{ pointerEvents: 'none', userSelect: 'none', WebkitUserDrag: 'none', width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
                    onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                  />
                  <div
                    style={{ display: user?.photo_url ? 'none' : 'flex', pointerEvents: 'none', width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #2dd4bf, #0d9488)', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600, fontSize: 14 }}
                  >
                    {(user?.staff_full_name || user?.full_name || '?').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 z-[999999]" style={{ WebkitTransform: 'translateZ(0)' }}>
                <div className="px-3 py-2">
                  <p className="text-sm font-medium text-slate-900">{user?.staff_full_name || user?.full_name}</p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate(createPageUrl('Profile'))} className="cursor-pointer touch-manipulation min-h-[44px]">
                  <User className="w-4 h-4 mr-2" />
                  My Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate(createPageUrl('Payroll'))} className="cursor-pointer touch-manipulation min-h-[44px]">
                  <PoundSterling className="w-4 h-4 mr-2" />
                  My Payslips
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate(createPageUrl('Settings'))} className="cursor-pointer touch-manipulation min-h-[44px]">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSickDialogOpen(true)} className="cursor-pointer touch-manipulation min-h-[44px]">
                  <CalendarOff className="w-4 h-4 mr-2" />
                  Leave / Sick
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => { await base44.auth.logout(); }}
                  className="cursor-pointer touch-manipulation min-h-[44px] text-red-600 focus:text-red-600"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" size="icon" onClick={() => window.history.back()} className="text-slate-600 touch-manipulation">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </div>

          {/* Center: Logo / Weather Warning — overflow-hidden + min-w-0 prevent logo from spilling over icons */}
          <div className="flex items-center justify-center gap-1 overflow-hidden min-w-0">
            {unreadNotificationCount > 0 && (
              <span className="text-red-600 font-bold text-4xl flash-red flex-shrink-0">!</span>
            )}
            {!hasWeatherWarning && companySettings?.company_logo && (
              <img src={companySettings.company_logo} alt="Company logo" className="h-[83px] max-w-full w-auto object-contain" />
            )}
            {hasWeatherWarning && (
              <Link to={createPageUrl('Messages')} className="font-semibold truncate text-red-600 flash-red">
                ⚠ Weather Alert
              </Link>
            )}
            {unreadNotificationCount > 0 && (
              <span className="text-blue-600 font-bold text-5xl flash-blue flex-shrink-0">!</span>
            )}
          </div>

          {/* Right: Bell, Admin, Help */}
          <div className="flex items-center gap-1.5 relative z-10">
            <Link to={createPageUrl('Messages')} className="relative touch-manipulation p-1">
              <Bell className={cn("w-5 h-5 text-red-600 fill-red-600", unreadNotificationCount > 0 && "animate-pulse")} />
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {unreadNotificationCount}
                </span>
              )}
            </Link>
            {isAdmin && (
              <div className="relative">
                <Link to={createPageUrl('Admin')} className="relative touch-manipulation p-1" onClick={() => setShowAdminPointer(false)}>
                  <Shield className={`w-5 h-5 text-blue-600 fill-blue-600 ${showAdminPointer ? 'animate-pulse' : ''}`} />
                  {totalAdminTasks > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                      {totalAdminTasks}
                    </span>
                  )}
                </Link>
                {showAdminPointer && (
                  <div className="absolute top-full right-0 mt-2 z-[9999] animate-bounce-slow" style={{ width: 260 }}>
                    <div className="relative bg-teal-600 text-white rounded-lg shadow-xl p-3">
                      <div className="absolute -top-2 right-3 w-4 h-4 bg-teal-600 rotate-45" />
                      <p className="text-sm font-semibold mb-1">Admin Panel</p>
                      <p className="text-xs opacity-90">Tap here to manage your organisation, staff, billing & setup.</p>
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowAdminPointer(false); }}
                        className="mt-2 text-xs underline opacity-75 hover:opacity-100"
                      >
                        Got it
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            <button
              onClick={() => setHelpMode(!helpMode)}
              className={`touch-manipulation flex items-center gap-1 px-2 py-1 rounded-full transition-all text-xs font-medium ${
                helpMode
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
              title={helpMode ? 'Help tips ON — tap to turn off' : 'Turn on help tips'}
            >
              <HelpCircle className="w-4 h-4" />
              <span className="hidden sm:inline">{helpMode ? 'Help ON' : 'Help'}</span>
            </button>
          </div>
        </div>
      </div>}

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />

      {/* Permissions Banner — requests all permissions via user click */}
      {showNotifBanner && (
        <div className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="text-center mb-4">
              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Shield className="w-6 h-6 text-teal-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Enable Permissions</h3>
              <p className="text-xs text-slate-500 mt-1">CareCall needs these to work properly</p>
            </div>
            <div className="space-y-2 mb-5">
              {[
                { icon: '🔔', label: 'Notifications', desc: 'Shift alerts & messages' },
                { icon: '📍', label: 'Location', desc: 'GPS check-in & tracking' },
                { icon: '📷', label: 'Camera', desc: 'Photos & document scanning' },
                { icon: '🎙️', label: 'Microphone', desc: 'Voice notes & calls' },
              ].map(p => (
                <div key={p.label} className="flex items-center gap-3 p-2 rounded-lg bg-slate-50">
                  <span className="text-lg">{p.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{p.label}</p>
                    <p className="text-xs text-slate-400">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={async () => {
                // Request all permissions (each triggers browser prompt)
                try { if ('Notification' in window) await Notification.requestPermission(); } catch {}
                try { await navigator.mediaDevices.getUserMedia({ video: true, audio: true }); } catch {}
                try { navigator.geolocation.getCurrentPosition(() => {}, () => {}, { enableHighAccuracy: true }); } catch {}
                setShowNotifBanner(false);
                localStorage.setItem('carecall_permissions_done', 'true');
              }}
              className="w-full py-2.5 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors"
            >
              Allow All Permissions
            </button>
            <button
              onClick={() => {
                setShowNotifBanner(false);
                localStorage.setItem('carecall_permissions_done', 'true');
              }}
              className="w-full mt-2 py-2 text-slate-400 text-xs hover:text-slate-600"
            >
              Skip for now
            </button>
          </div>
        </div>
      )}

      {/* Main Content — scrolls internally to prevent browser chrome from appearing */}
                   <main
                     ref={mainRef}
                     className="flex-1 overflow-y-auto overflow-x-hidden lg:pb-0"
                     style={{ overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch', paddingBottom: currentPageName === 'TwoWayRadio' ? 'env(safe-area-inset-bottom)' : 'calc(5rem + env(safe-area-inset-bottom))' }}
                     onTouchStart={handleTouchStart}
                     onTouchMove={handleTouchMove}
                     onTouchEnd={handleTouchEnd}
                   >
                                     {/* Pull-to-Refresh Indicator */}
                                     {(pullDistance > 0 || isRefreshing) && (
                                       <div className="flex items-center justify-center transition-all duration-200" style={{ height: pullDistance, overflow: 'hidden' }}>
                                         <div className={`flex items-center gap-2 ${isRefreshing ? 'text-teal-600' : pullDistance >= PULL_THRESHOLD ? 'text-teal-600' : 'text-slate-400'}`}>
                                           <RefreshCw className={`w-5 h-5 transition-transform ${isRefreshing ? 'animate-spin' : ''}`} style={{ transform: isRefreshing ? undefined : `rotate(${pullDistance * 3}deg)` }} />
                                           <span className="text-xs font-medium">
                                             {isRefreshing ? 'Refreshing...' : pullDistance >= PULL_THRESHOLD ? 'Release to refresh' : 'Pull to refresh'}
                                           </span>
                                         </div>
                                       </div>
                                     )}
                                     {/* App Update Banner */}
                                     <AppUpdateBanner />
                                     <GpsWarningBanner />
                                     {/* Missed radio calls banner */}
                                     {visibleMissedCalls.length > 0 && (
                                       <div
                                         className="sticky top-0 z-40 bg-amber-600 px-4 py-3 flex items-center gap-3 cursor-pointer touch-manipulation"
                                         onClick={() => navigate(createPageUrl('TwoWayRadio'))}
                                       >
                                         <PhoneOff className="w-5 h-5 text-white shrink-0" />
                                         <div className="flex-1 min-w-0">
                                           {visibleMissedCalls.length === 1 ? (() => {
                                             const call = visibleMissedCalls[0];
                                             const personId = call.status === 'callback' ? call.caller_id : call.callee_id;
                                             const name = globalStaffRef.current.find(s => s.id === personId)?.full_name || 'Team Member';
                                             return (
                                               <>
                                                 <p className="text-white text-sm font-bold truncate">
                                                   {call.status === 'callback' ? `Call back: ${name}` : `Missed call from ${name}`}
                                                 </p>
                                                 <p className="text-amber-200 text-xs">Tap to open Radio</p>
                                               </>
                                             );
                                           })() : (
                                             <>
                                               <p className="text-white text-sm font-bold">{visibleMissedCalls.length} missed radio calls</p>
                                               <p className="text-amber-200 text-xs">Tap to open Radio</p>
                                             </>
                                           )}
                                         </div>
                                         <button
                                           onClick={e => { e.stopPropagation(); dismissBannerCalls(...visibleMissedCalls.map(c => c.id)); }}
                                           className="text-amber-200 hover:text-white shrink-0 p-1 touch-manipulation"
                                         >
                                           <X className="w-5 h-5" />
                                         </button>
                                       </div>
                                     )}
                                     {/* Call-back request banner */}
                                     {visibleCbRequests.length > 0 && (
                                       <div
                                         className="sticky top-0 z-40 bg-teal-700 px-4 py-3 flex items-center gap-3 cursor-pointer touch-manipulation"
                                         onClick={() => navigate(createPageUrl('TwoWayRadio'))}
                                       >
                                         <Phone className="w-5 h-5 text-white shrink-0" />
                                         <div className="flex-1 min-w-0">
                                           {visibleCbRequests.length === 1 ? (
                                             <>
                                               <p className="text-white text-sm font-bold truncate">
                                                 {globalStaffRef.current.find(s => s.id === visibleCbRequests[0].caller_id)?.full_name || 'Team Member'} wants a call back
                                               </p>
                                               <p className="text-teal-200 text-xs">Tap to open Radio</p>
                                             </>
                                           ) : (
                                             <>
                                               <p className="text-white text-sm font-bold">{visibleCbRequests.length} call-back requests</p>
                                               <p className="text-teal-200 text-xs">Tap to open Radio</p>
                                             </>
                                           )}
                                         </div>
                                         <button
                                           onClick={e => { e.stopPropagation(); dismissCbBannerCalls(...visibleCbRequests.map(c => c.id)); }}
                                           className="text-teal-200 hover:text-white shrink-0 p-1 touch-manipulation"
                                         >
                                           <X className="w-5 h-5" />
                                         </button>
                                       </div>
                                     )}
                                     {/* Keep-alive: all visited pages stay mounted, hidden with display:none */}
                                     <div className={currentPageName === 'Chat' || currentPageName === 'TwoWayRadio' ? 'p-0' : 'p-2 md:p-3 lg:p-4'}>
                                         {Object.entries(PAGES).map(([pageName, PageComponent]) => {
                                           const isActive = pageName === currentPageName;
                                           if (!isActive && !visitedPagesRef.current.has(pageName)) return null;
                                           if (isActive) visitedPagesRef.current.add(pageName);
                                           return (
                                             <div key={pageName} style={{ display: isActive ? 'block' : 'none' }}>
                                               <Suspense fallback={<div className="flex items-center justify-center h-96"><div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div></div>}>
                                                 <PageComponent />
                                               </Suspense>
                                             </div>
                                           );
                                         })}
                                     </div>
                      </main>

                      {/* Bottom Navigation for Mobile */}
                      <BottomNavigation
                        currentPageName={currentPageName}
                        unreadChatCount={unreadConversations.length}
                        unreadAssetsCount={openIncidents.length}
                        isControlDevice={!!user?.is_control_device}
                      />

                      {user?.id && <ActiveShiftAutoOpen userId={user.id} />}
                      <OfflineManager />
                      <SickBookingDialog
                        open={sickDialogOpen}
                        onOpenChange={setSickDialogOpen}
                        userId={user?.id}
                        userName={user?.staff_full_name || user?.full_name}
                      />
                      </div>
                      );
                      }