import { useEffect } from 'react'
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from 'sonner'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
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
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, isAuthenticated, isPasswordRecovery } = useAuth();
  const location = useLocation();
  const isLoading = isLoadingPublicSettings || isLoadingAuth;

  // Hide splash screen once auth check is done
  useEffect(() => {
    if (!isLoading && window.hideSplash) window.hideSplash();
  }, [isLoading]);

  // Splash screen covers the loading state — no spinner needed
  if (isLoading) return null;

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      return <Navigate to="/login" replace />;
    }
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to Settings for password recovery (user clicked reset link in email)
  if (isPasswordRecovery && !location.pathname.toLowerCase().includes('settings')) {
    return <Navigate to="/Settings" replace />;
  }

  // Render the main app
  return (
    <>
    <AutoPushRegistration />
    <AppUpdateChecker />
    <Routes>
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route path="*" element={<PageNotFound />} />
    </Routes>
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
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/*" element={<AuthenticatedApp />} />
            </Routes>
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
