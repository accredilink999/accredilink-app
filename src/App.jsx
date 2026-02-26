import { useEffect, useRef } from 'react'
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from 'sonner'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Login from './pages/Login';
import DevicePreview from '@/components/DevicePreview';
import ErrorCatcher from '@/components/ErrorCatcher';
import HelpButton from '@/components/HelpButton';
import AutoPushRegistration from '@/components/notifications/AutoPushRegistration';
import AppUpdateChecker from '@/components/AppUpdateChecker';

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

  if (isAuthenticated) hasEverAuthedRef.current = true;

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

  // Extract page name from URL — always fall back to Dashboard
  const pageName = location.pathname.replace(/^\//, '') || mainPageKey;
  const currentPageName = Pages[pageName] ? pageName : mainPageKey;

  // Layout renders ONCE and never unmounts
  return (
    <>
      <AutoPushRegistration />
      <AppUpdateChecker />
      <Layout currentPageName={currentPageName} />
    </>
  );
};


function App() {
  return (
    <AuthProvider>
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
    </AuthProvider>
  )
}

export default App
