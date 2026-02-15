import React, { useState, useEffect, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
const Dashboard = React.lazy(() => import('@/pages/Dashboard'));
const Rota = React.lazy(() => import('@/pages/Rota'));
const Incidents = React.lazy(() => import('@/pages/Incidents'));
const Documents = React.lazy(() => import('@/pages/Documents'));
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AnnouncementAcknowledgementModal from '@/components/AnnouncementAcknowledgementModal';
import BottomNavigation from '@/components/ui/BottomNavigation';
import { cn } from "@/lib/utils";
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import OnboardingModal from '@/components/OnboardingModal';
import AppDownloadPrompt from '@/components/AppDownloadPrompt';
import PWAInstallButton from '@/components/PWAInstallButton';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import { useNotificationManager } from '@/components/hooks/useNotificationManager';
import { useNotifications } from '@/hooks/useNotifications';
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
import NotificationBanner from '@/components/notifications/NotificationBanner';
import AppUpdateBanner from '@/components/AppUpdateBanner';
import GpsWarningBanner from '@/components/GpsWarningBanner';
import OfflineManager from '@/components/OfflineManager';
import HeaderIcons from '@/components/HeaderIcons';
import LockScreen from '@/components/LockScreen';
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
  const [showMessageFlash, setShowMessageFlash] = useState(false);
    const [flashType, setFlashType] = useState(null); // 'chat' or 'notification'
    const [flashLink, setFlashLink] = useState(null); // page to link to
    const messageFlashTimeoutRef = React.useRef(null);


  
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
  const isAdmin = user?.role === 'admin' || user?.job_title === 'admin' || user?.job_title === 'manager' || user?.job_title === 'supervisor';

  // Initialize notification manager
  useNotificationManager();

  // In-app toast notifications + sound rules
  useNotifications({ user, currentPageName });

  const { data: pendingSwaps = [] } = useQuery({
    queryKey: ['pendingSwaps'],
    queryFn: () => base44.entities.ShiftSwapRequest.filter({ status: 'pending' }),
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



  const playMessageAlert = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const now = audioContext.currentTime;
      for (let i = 0; i < 3; i++) {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.frequency.value = i === 0 ? 800 : (i === 1 ? 1000 : 1200);
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.3, now + (i * 0.2));
        gain.gain.exponentialRampToValueAtTime(0.01, now + (i * 0.2) + 0.15);
        osc.start(now + (i * 0.2));
        osc.stop(now + (i * 0.2) + 0.15);
      }
    } catch (err) {
      console.log('Audio alert error:', err);
    }
  };

  // Play audio notification when message flash is shown
  React.useEffect(() => {
    if (showMessageFlash && currentPageName !== 'Chat') {
      try {
        const utterance = new SpeechSynthesisUtterance('You have a new notification');
        utterance.rate = 1;
        utterance.pitch = 1;
        speechSynthesis.speak(utterance);
      } catch (err) {
        console.log('Audio notification error:', err);
      }
    }
  }, [showMessageFlash, currentPageName]);

  // Reset flash when on Chat page or when unread conversations is empty
  React.useEffect(() => {
    if (currentPageName === 'Chat' || unreadConversations.length === 0) {
      setShowMessageFlash(false);
      if (messageFlashTimeoutRef.current) clearTimeout(messageFlashTimeoutRef.current);
    }
  }, [currentPageName, unreadConversations.length]);

  // Subscribe to chat messages and notifications - show flash and voice alert when new ones arrive
    React.useEffect(() => {
      if (!user?.id) return;

      const unsubscribeMessages = base44.entities.ChatMessage.subscribe((event) => {
            // Only trigger on new messages from other users
            if (event.type === 'create' && event.data?.sender_id !== user.id) {
              // Voice announcement and flash - only when not on Chat page
              if (currentPageName !== 'Chat') {
                setFlashType('chat');
                setFlashLink('Chat');
                setShowMessageFlash(true);
                playMessageAlert();
                if (messageFlashTimeoutRef.current) clearTimeout(messageFlashTimeoutRef.current);
                messageFlashTimeoutRef.current = setTimeout(() => {
                  setShowMessageFlash(false);
                }, 10000);
              }
            }
            // Always refresh conversations to update unread counts
            queryClient.invalidateQueries({ 
              queryKey: ['conversations', user.id],
              exact: true 
            });
          });

      const unsubscribeNotifications = base44.entities.Notification.subscribe((event) => {
            // Show flash for new notifications
            if (event.type === 'create') {
              // Map notification type to page
              const notificationType = event.data?.type || 'notification';
              let pageName = 'NotificationCenter';
              if (notificationType.includes('incident')) pageName = 'Incidents';
              if (notificationType.includes('leave')) pageName = 'LeaveManagement';
              if (notificationType.includes('shift')) pageName = 'Rota';
              if (notificationType.includes('training')) pageName = 'Training';
              if (notificationType.includes('document')) pageName = 'Documents';

              setFlashType('notification');
              setFlashLink(pageName);
              setShowMessageFlash(true);
              playMessageAlert();
              if (messageFlashTimeoutRef.current) clearTimeout(messageFlashTimeoutRef.current);
              messageFlashTimeoutRef.current = setTimeout(() => {
                setShowMessageFlash(false);
              }, 10000);
            }
            queryClient.invalidateQueries({ 
              queryKey: ['criticalNotifications', user.id],
              exact: true 
            });
          });

      return () => {
        unsubscribeMessages();
        unsubscribeNotifications();
        if (messageFlashTimeoutRef.current) clearTimeout(messageFlashTimeoutRef.current);
      };
    }, [user?.id, currentPageName, queryClient]);

  const { data: trackingSettings = [] } = useQuery({
    queryKey: ['trackingSettings'],
    queryFn: () => base44.entities.SystemSettings.filter({ setting_key: 'gps_tracking_enabled' }),
    enabled: !!user?.id,
  });

  // GPS tracking defaults to ON — admin can turn it off if needed
  const globalTrackingEnabled = trackingSettings.length === 0 || trackingSettings[0]?.setting_value !== 'false';

  const updateLocationMutation = useMutation({
   mutationFn: async (coords) => {
     return base44.entities.Location.create({
       staff_id: user.id,
       staff_name: user.staff_full_name || user.full_name,
       latitude: coords.latitude,
       longitude: coords.longitude,
       accuracy: coords.accuracy,
       timestamp: new Date().toISOString()
     });
   },
  });

  // Handle offline pending notifications and detect new chat messages
  React.useEffect(() => {
    if (!user?.id) return;

    const handleOfflineNotifications = async () => {
      try {
        let hasNewChatMessages = false;

        // Check for unread chat messages
        const convs = await base44.entities.Conversation.list();
        const newChatMessages = convs.some(conv => (conv.unread_count?.[user.id] || 0) > 0);

        // Show flash and play announcement if new chat messages detected (but not on Chat page)
        if (newChatMessages && currentPageName !== 'Chat') {
          setFlashType('chat');
          setFlashLink('Chat');
          setShowMessageFlash(true);
          playMessageAlert();
          if (messageFlashTimeoutRef.current) clearTimeout(messageFlashTimeoutRef.current);
          messageFlashTimeoutRef.current = setTimeout(() => {
            setShowMessageFlash(false);
          }, 10000);
        }

        // Refresh conversations to update unread counts
        await queryClient.invalidateQueries({ 
          queryKey: ['conversations', user.id],
          exact: true 
        });

        // Handle pending offline notifications
        const pendingNotifications = localStorage.getItem('pending_notifications');
        if (pendingNotifications) {
          const notifications = JSON.parse(pendingNotifications);
          
          for (const notification of notifications) {
            try {
              const audioContext = new (window.AudioContext || window.webkitAudioContext)();
              const now = audioContext.currentTime;
              for (let i = 0; i < 2; i++) {
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                osc.connect(gain);
                gain.connect(audioContext.destination);
                osc.frequency.value = i === 0 ? 800 : 1000;
                osc.type = 'sine';
                gain.gain.setValueAtTime(0.3, now + (i * 0.3));
                gain.gain.exponentialRampToValueAtTime(0.01, now + (i * 0.3) + 0.25);
                osc.start(now + (i * 0.3));
                osc.stop(now + (i * 0.3) + 0.25);
              }
            } catch (err) {
              console.log('Offline notification audio error:', err);
            }
          }

          await base44.functions.invoke('handleOfflineNotifications', {
            pending_notifications: notifications
          });
          localStorage.removeItem('pending_notifications');
        }
      } catch (error) {
        console.log('Error processing offline notifications:', error);
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        handleOfflineNotifications();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    handleOfflineNotifications();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user?.id, currentPageName]);

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

    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleDarkModeChange = (e) => {
      if (e.matches) {
        document.documentElement.classList.add('dark');
        document.documentElement.style.colorScheme = 'dark';
        themeColorMeta.content = '#0f172a'; // Dark slate background
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.style.colorScheme = 'light';
        themeColorMeta.content = '#ffffff'; // White background
      }
    };

    // Set initial preference
    if (darkModeQuery.matches) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
      themeColorMeta.content = '#0f172a';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
      themeColorMeta.content = '#ffffff';
    }

    // Listen for changes
    darkModeQuery.addEventListener('change', handleDarkModeChange);

    return () => {
      darkModeQuery.removeEventListener('change', handleDarkModeChange);
    };
  }, []);



  // Auto-start GPS tracking on app load (only if globally enabled)
  useEffect(() => {
    if (!user?.id || !globalTrackingEnabled) return;

    // Store the auth token so we can use it synchronously in unload handlers
    let currentToken = null;
    supabase.auth.getSession().then(({ data: { session } }) => {
      currentToken = session?.access_token;
    });

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        updateLocationMutation.mutate({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => console.error('Geolocation error:', error),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
    );

    // Remove location when app closes — uses direct Supabase REST DELETE
    // with keepalive:true so the browser sends it even during page close
    const removeLocation = () => {
      navigator.geolocation.clearWatch(watchId);
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

    const handleVisibilityChange = () => {
      if (document.hidden) removeLocation();
    };

    window.addEventListener('beforeunload', removeLocation);
    window.addEventListener('pagehide', removeLocation);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      navigator.geolocation.clearWatch(watchId);
      window.removeEventListener('beforeunload', removeLocation);
      window.removeEventListener('pagehide', removeLocation);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user?.id, globalTrackingEnabled]);

  // ─── Inactivity Lock Screen (2 hours) ─────────────────────────────
  const [isLocked, setIsLocked] = useState(false);
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

  const [visibleBanners, setVisibleBanners] = useState({});

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

  const { data: criticalNotifications = [] } = useQuery({
    queryKey: ['criticalNotifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const notifications = await base44.entities.Notification.filter({
        recipient_id: user.id,
        priority: 'critical',
        is_read: false,
        is_dismissed: false
      }, '-created_date', 10);
      return notifications;
    },
    enabled: !!user?.id,
    staleTime: 30000,
  });

  React.useEffect(() => {
    if (!user?.id) return;
    
    const unsubscribe = base44.entities.Notification.subscribe((event) => {
      if (event.type === 'create') {
        queryClient.invalidateQueries({ queryKey: ['criticalNotifications', user.id] });
      }
    });
    
    return unsubscribe;
  }, [user?.id]);

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
    // Weather warnings stay active until admin cancels them
    if (msg.type === 'weather_warning' && msg.priority === 'urgent') {
      return !msg.is_cancelled;
    }
    // Other urgent messages use read_by
    return msg.priority === 'urgent' && (!msg.read_by || !msg.read_by.includes(user?.id));
  }).length;

  const hasWeatherWarning = messages.some(msg =>
    msg.type === 'weather_warning' && msg.priority === 'urgent' &&
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
              <DropdownMenuContent align="start" className="w-56">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium text-slate-900">{user?.staff_full_name || user?.full_name}</p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate(createPageUrl('Profile'))} className="cursor-pointer">
                  <User className="w-4 h-4 mr-2" />
                  My Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate(createPageUrl('Settings'))} className="cursor-pointer">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => { await base44.auth.logout(); }}
                  className="cursor-pointer text-red-600 focus:text-red-600"
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
              <Link to={createPageUrl('Messages')} className={`font-semibold truncate ${unreadNotificationCount > 0 ? 'text-red-600' : 'text-slate-900'}`}>
                Weather Alert
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

      {/* Message Received Flash */}
      {showMessageFlash && (
        <div className="fixed bottom-32 left-1/2 transform -translate-x-1/2 z-40">
          <Link to={createPageUrl(flashLink || 'Chat')}>
            <div className={`text-white px-8 py-4 rounded-lg shadow-2xl font-semibold hover:opacity-90 transition-colors cursor-pointer animate-pulse text-lg ${
              flashType === 'chat' ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-500 hover:bg-blue-600'
            }`}>
              {flashType === 'chat' ? 'New Chat Message' : 'New Notification'}
            </div>
          </Link>
        </div>
      )}

      {/* Main Content — scrolls internally to prevent browser chrome from appearing */}
                   <main className="flex-1 overflow-y-auto lg:pb-0" style={{ overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch', paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}>
                                     {/* App Update Banner */}
                                     <AppUpdateBanner />
                                     <GpsWarningBanner />
                                     <AnimatePresence mode="wait">
                                       <motion.div 
                                         key={currentPageName}
                                         className="p-2 md:p-3 lg:p-4"
                                         initial={{ opacity: 0, y: 10 }}
                                         animate={{ opacity: 1, y: 0 }}
                                         exit={{ opacity: 0, y: -10 }}
                                         transition={{ duration: 0.2 }}
                                       >
                                      {/* Critical Notifications Banner */}
                                      {criticalNotifications.length > 0 && (
                                      <div className="mb-2 space-y-1">
                          {criticalNotifications.map(notification => (
                            !visibleBanners[notification.id] && (
                              <NotificationBanner
                                key={notification.id}
                                notification={notification}
                                onDismiss={() => {
                                  setVisibleBanners(prev => ({
                                    ...prev,
                                    [notification.id]: true
                                  }));
                                }}
                              />
                            )
                          ))}
                        </div>
                      )}
                      {/* Offstage Pattern with Suspense - Keep tab pages mounted to preserve state */}
                      <Suspense fallback={<div className="flex items-center justify-center h-96"><div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div></div>}>
                        <div style={{ display: currentPageName === 'Dashboard' ? 'block' : 'none' }}>
                          {currentPageName === 'Dashboard' && <Dashboard />}
                        </div>
                        <div style={{ display: currentPageName === 'Rota' ? 'block' : 'none' }}>
                          {currentPageName === 'Rota' && <Rota />}
                        </div>
                        <div style={{ display: currentPageName === 'Incidents' ? 'block' : 'none' }}>
                          {currentPageName === 'Incidents' && <Incidents />}
                        </div>
                        <div style={{ display: currentPageName === 'Documents' ? 'block' : 'none' }}>
                          {currentPageName === 'Documents' && <Documents />}
                        </div>
                      </Suspense>
                      {/* Render other pages normally */}
                      {!['Dashboard', 'Rota', 'Incidents', 'Documents'].includes(currentPageName) && children}
                      </motion.div>
                     </AnimatePresence>
                      </main>

                      {/* Bottom Navigation for Mobile */}
                      <BottomNavigation 
                        currentPageName={currentPageName}
                        unreadChatCount={unreadConversations.length}
                        unreadAssetsCount={openIncidents.length}
                      />

                      <OfflineManager />
                      </div>
                      );
                      }