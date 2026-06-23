import { useEffect, useRef, useState } from 'react'
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from 'sonner'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { LanguageProvider } from '@/lib/LanguageContext';
import { HelpModeProvider } from '@/lib/HelpModeContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Login from './pages/Login';
import DevicePreview from '@/components/DevicePreview';
import ErrorCatcher from '@/components/ErrorCatcher';
import HelpButton from '@/components/HelpButton';
import AutoPushRegistration from '@/components/notifications/AutoPushRegistration';
import AppUpdateChecker from '@/components/AppUpdateChecker';
import HelpNudge from '@/components/HelpNudge';
import { initOrg, resetOrg, checkOrgAccess } from '@/lib/orgContext';
import SubscriptionGate from '@/components/billing/SubscriptionGate';
import OrgSetup from '@/pages/OrgSetup';
import TermsConsentGate from '@/components/TermsConsentGate';
import { supabase } from '@/api/supabaseClient';
import PinLockScreen from '@/components/auth/PinLockScreen';
import PinSetupModal from '@/components/auth/PinSetupModal';
import { hasPin, isPinSessionUnlocked, wasPinPromptShown } from '@/utils/pinUtils';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const TwoWayRadio = Pages.TwoWayRadio;

/**
 * AppShell — no <Routes>, no route matching, no remounting.
 * Layout renders once and stays mounted forever.
 * Pages are swapped via the keep-alive pattern inside Layout.
 */
const AppShell = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, isAuthenticated, isPasswordRecovery, user } = useAuth();
  const location = useLocation();
  const hasEverAuthedRef = useRef(false);
  const [orgReady, setOrgReady] = useState(null); // null = loading, true = ready
  const [needsOrgSetup, setNeedsOrgSetup] = useState(false);
  const [needsTermsConsent, setNeedsTermsConsent] = useState(false);

  // ── PIN state ─────────────────────────────────────────────────────────────
  // pinLocked: true = show lock screen (has PIN + session not yet unlocked)
  // showPinSetup: true = show "would you like a PIN?" prompt
  const [pinLocked, setPinLocked] = useState(false);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const pinCheckedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !user?.id || pinCheckedRef.current) return;
    pinCheckedRef.current = true;

    if (hasPin(user.id) && !isPinSessionUnlocked()) {
      // User has a PIN and hasn't unlocked this session → show lock screen
      setPinLocked(true);
    } else if (!hasPin(user.id) && !wasPinPromptShown(user.id)) {
      // Never been asked → show setup prompt after a short delay
      const t = setTimeout(() => setShowPinSetup(true), 1500);
      return () => clearTimeout(t);
    }
  }, [isAuthenticated, user?.id]);

  if (isAuthenticated) hasEverAuthedRef.current = true;

  // Initialize org context after auth — for new signups, auto-create org from metadata
  useEffect(() => {
    if (!isAuthenticated) { setOrgReady(null); return; }

    const initOrgContext = async () => {
      try {
        // Try to load existing org membership
        const orgId = await initOrg();
        if (orgId) { setOrgReady(true); return; }

        // No org membership — check if this is a NEW signup with metadata
        const { data: { user } } = await supabase.auth.getUser();
        const companyName = user?.user_metadata?.company_name;
        const inviteCode = user?.user_metadata?.invite_code;

        // Staff path — join existing org via invite code
        if (inviteCode) {
          const { data: orgs, error: rpcErr } = await supabase
            .rpc('find_org_by_invite_code', { code: inviteCode });
          if (!rpcErr && orgs && orgs.length > 0) {
            const targetOrg = orgs[0];
            const { error: memErr } = await supabase
              .from('organization_members')
              .insert({ organization_id: targetOrg.id, user_id: user.id, role: 'member' });
            if (memErr && memErr.code !== '23505') console.error('Join org error:', memErr);
            supabase.from('users').update({ organization_id: targetOrg.id }).eq('id', user.id).then(() => {});
            resetOrg();
            await initOrg();
          }
          setOrgReady(true);
          return;
        }

        // Owner path — create new org if they provided a company name during signup
        if (companyName) {
          const slug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
          const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
          let invCode = '';
          for (let i = 0; i < 8; i++) invCode += chars.charAt(Math.floor(Math.random() * chars.length));
          const { data: org, error: orgErr } = await supabase
            .from('organizations')
            .insert({
              name: companyName,
              slug,
              plan: 'trial',
              invite_code: invCode,
              trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              is_active: true,
            })
            .select()
            .single();
          if (!orgErr && org) {
            await supabase
              .from('organization_members')
              .insert({ organization_id: org.id, user_id: user.id, role: 'owner' });
            supabase.from('users').update({ organization_id: org.id }).eq('id', user.id).then(() => {});
            resetOrg();
            await initOrg();

            // ── Notify admin of new trial signup ──────────────────────
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.access_token) {
              fetch(`${supabaseUrl}/functions/v1/notifyNewSignup`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session.access_token}`,
                  'apikey': supabaseAnonKey,
                },
                body: JSON.stringify({
                  orgId: org.id,
                  orgName: companyName,
                  userEmail: user.email,
                  userName: user.user_metadata?.full_name || '',
                  plan: 'trial',
                }),
              }).catch(e => console.warn('[notifyNewSignup] failed:', e));
            }
          }
        }

        // No org and no signup metadata — but only show OrgSetup for TRULY new users
        // (account created within last 5 minutes). Existing legacy users get let through.
        if (!companyName && !inviteCode) {
          const createdAt = user?.created_at ? new Date(user.created_at) : null;
          const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
          const isNewUser = createdAt && createdAt > fiveMinAgo;

          // Also check if they already have data in the users table (legacy user)
          const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('id', user.id)
            .maybeSingle();

          if (isNewUser && !existingUser) {
            setNeedsOrgSetup(true);
          }
        }
        setOrgReady(true);
      } catch (err) {
        console.error('Org init error:', err);
        setOrgReady(true); // let them through anyway
      }
    };

    initOrgContext();
  }, [isAuthenticated]);

  // Check terms acceptance after auth — required by App Store & Google Play
  useEffect(() => {
    if (!isAuthenticated || !orgReady) return;
    const checkTerms = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: profile } = await supabase
          .from('profiles')
          .select('terms_accepted_at')
          .eq('id', user.id)
          .single();
        if (!profile?.terms_accepted_at) {
          setNeedsTermsConsent(true);
        }
      } catch {
        // If the column doesn't exist yet, skip the gate
      }
    };
    checkTerms();
  }, [isAuthenticated, orgReady]);

  const isLoading = isLoadingPublicSettings || isLoadingAuth;

  // Hide splash screen once auth check is done
  useEffect(() => {
    if (!isLoading && window.hideSplash) window.hideSplash();
  }, [isLoading]);

  // First load only — splash covers this
  if (!hasEverAuthedRef.current && isLoading) return null;

  // ── Radio handset mode ───────────────────────────────────────────────────
  // Set by MainActivity (radio flavor) via localStorage on app start.
  // Bypasses all app chrome — boots directly to TwoWayRadio.
  // Push notifications still register so shift alerts reach the handset.
  const isRadioMode = localStorage.getItem('carecall_radio_mode') === 'true';
  if (isRadioMode) {
    if (!isAuthenticated) return <Login />;
    if (orgReady === null) return (
      <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0f172a', gap: '12px' }}>
        <div style={{ width: 32, height: 32, border: '3px solid #334155', borderTopColor: '#22c55e', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: '#64748b', fontSize: 13, fontFamily: 'system-ui' }}>Connecting…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
    return <TwoWayRadio />;
  }
  // ────────────────────────────────────────────────────────────────────────

  // Login page
  if (location.pathname === '/login') return <Login />;

  // PIN lock screen — shown when user has a PIN and this session hasn't been unlocked yet
  if (pinLocked && user?.id) {
    return (
      <PinLockScreen
        userId={user.id}
        userName={user.full_name || user.staff_full_name || user.email}
        onUnlock={() => setPinLocked(false)}
      />
    );
  }

  // Auth error (before first auth only)
  if (!hasEverAuthedRef.current && authError) {
    if (authError.type === 'user_not_registered') return <UserNotRegisteredError />;
    return <Login />;
  }

  // Not authenticated (before first auth only)
  if (!hasEverAuthedRef.current && !isAuthenticated) {
    return <Login />;
  }

  // Password recovery redirect
  if (isPasswordRecovery && !location.pathname.toLowerCase().includes('settings')) {
    return <Navigate to="/Settings" replace />;
  }

  // Wait for org context to initialize
  if (orgReady === null && isAuthenticated) return null;

  // New user with no org — show OrgSetup (existing users with orgs skip this entirely)
  if (needsOrgSetup && isAuthenticated) {
    return <OrgSetup onComplete={async () => { setNeedsOrgSetup(false); resetOrg(); await initOrg(); }} />;
  }

  // Terms consent gate — required by Apple App Store & Google Play
  if (needsTermsConsent && isAuthenticated) {
    return <TermsConsentGate onAccepted={() => setNeedsTermsConsent(false)} />;
  }

  // Subscription gating — block access if trial expired or subscription cancelled
  // Settings page is always accessible so users can reach billing
  const orgAccess = checkOrgAccess();
  const isSettingsPage = location.pathname.toLowerCase().includes('settings');
  if (!orgAccess.active && !isSettingsPage) {
    return <SubscriptionGate />;
  }

  // Extract page name from URL — always fall back to Dashboard
  const pageName = location.pathname.replace(/^\//, '') || mainPageKey;
  const currentPageName = Pages[pageName] ? pageName : mainPageKey;

  // Layout renders ONCE and never unmounts
  return (
    <>
      <AutoPushRegistration />
      <AppUpdateChecker />
      <Layout currentPageName={currentPageName} />
      {/* PIN setup prompt — shown once after first login if no PIN set */}
      {showPinSetup && user?.id && (
        <PinSetupModal
          userId={user.id}
          userName={user.full_name || user.staff_full_name || user.email}
          onDone={() => setShowPinSetup(false)}
        />
      )}
    </>
  );
};


function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
      <HelpModeProvider>
      <QueryClientProvider client={queryClientInstance}>
        <DevicePreview>
          <Router>
            <NavigationTracker />
            <AppShell />
          </Router>
          <Toaster />
          <SonnerToaster position="top-center" richColors closeButton style={{ zIndex: 99999 }} toastOptions={{ style: { pointerEvents: 'auto' } }} />
          <ErrorCatcher />
        </DevicePreview>
      </QueryClientProvider>
      </HelpModeProvider>
      </LanguageProvider>
    </AuthProvider>
  )
}

export default App
