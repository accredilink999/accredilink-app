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
import { supabase } from '@/api/supabaseClient';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];

/**
 * AppShell — no <Routes>, no route matching, no remounting.
 * Layout renders once and stays mounted forever.
 * Pages are swapped via the keep-alive pattern inside Layout.
 */
const AppShell = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, isAuthenticated, isPasswordRecovery } = useAuth();
  const location = useLocation();
  const hasEverAuthedRef = useRef(false);
  const [orgReady, setOrgReady] = useState(null); // null = loading, true = ready

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
          const { data: org, error: orgErr } = await supabase
            .from('organizations')
            .insert({ name: companyName, slug, plan: 'trial' })
            .select()
            .single();
          if (!orgErr && org) {
            await supabase
              .from('organization_members')
              .insert({ organization_id: org.id, user_id: user.id, role: 'owner' });
            supabase.from('users').update({ organization_id: org.id }).eq('id', user.id).then(() => {});
            resetOrg();
            await initOrg();
          }
        }

        // Always let the user through — no org membership just means legacy user
        setOrgReady(true);
      } catch (err) {
        console.error('Org init error:', err);
        setOrgReady(true); // let them through anyway
      }
    };

    initOrgContext();
  }, [isAuthenticated]);

  const isLoading = isLoadingPublicSettings || isLoadingAuth;

  // Hide splash screen once auth check is done
  useEffect(() => {
    if (!isLoading && window.hideSplash) window.hideSplash();
  }, [isLoading]);

  // First load only — splash covers this
  if (!hasEverAuthedRef.current && isLoading) return null;

  // Login page
  if (location.pathname === '/login') return <Login />;

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
      <HelpNudge />
      <Layout currentPageName={currentPageName} />
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
            <HelpButton />
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
