import React, { useState, useEffect, useRef, Suspense } from 'react';
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
                                HelpCircle
                              } from 'lucide-react';


const navigation = [
                    { name: 'Dashboard', icon: LayoutDashboard, page: 'Dashboard' },
                    { name: 'Incidents', icon: AlertTriangle, page: 'Incidents' },
                    { name: 'My Documents', icon: Folder, page: 'Documents' },
                    { name: 'Training', icon: GraduationCap, page: 'Training' },
                  ];

const ROOT_PAGES = ['Dashboard'];



export default function Layout({ children, currentPageName }) {
  const navigate = useNavigate();
  const visitedPagesRef = useRef(new Set());


  
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


  // Request all permissions early (notifications, GPS, camera)
  React.useEffect(() => {
    // Notifications
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

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

    // Force light mode — app is designed for light/teal theme only
    document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = 'light';
    themeColorMeta.content = '#ffffff';
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

  // ─── Inactivity Lock Screen (2 hours) ─────────────────────────────
  const [isLocked, setIsLocked] = useState(false);
  const [sickDialogOpen, setSickDialogOpen] = useState(false);
  const inactivityTimerRef = React.useRef(null);
  const INACTIVITY_MS = 2 * 60 * 60 * 1000; // 2 hours

  useEffect(() => {
    if (!user?.id) return;

    const resetTimer = () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = setTimeout(() => setIsLocked(true), INACTIVITY_MS);
    };

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer(); // start the timer

    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer));
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

    // Add styles for alternating flash animation and disable pull-to-refresh
    const flashStyles = `
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
      {/* Unified Header — all devices */}
      <div className="z-50 bg-white border-b border-slate-200 shadow-sm flex-shrink-0" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
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
              <Link to={createPageUrl('Admin')} className="relative touch-manipulation p-1">
                <Shield className="w-5 h-5 text-blue-600 fill-blue-600" />
                {totalAdminTasks > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {totalAdminTasks}
                  </span>
                )}
              </Link>
            )}
            <Link to={createPageUrl('HowToUseApp')} className="touch-manipulation p-1">
              <HelpCircle className="w-5 h-5 text-slate-600" />
            </Link>
          </div>
        </div>
      </div>

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />

      {/* Main Content — scrolls internally to prevent browser chrome from appearing */}
                   <main className="flex-1 overflow-y-auto overflow-x-hidden lg:pb-0" style={{ overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch', paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}>
                                     {/* App Update Banner */}
                                     <AppUpdateBanner />
                                     <GpsWarningBanner />
                                     {/* Keep-alive: all visited pages stay mounted, hidden with display:none */}
                                     <div className={currentPageName === 'Chat' ? 'p-0 md:p-3 lg:p-4' : 'p-2 md:p-3 lg:p-4'}>
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