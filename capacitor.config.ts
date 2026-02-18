import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.carecallai.app',
  appName: 'Accredilink',
  webDir: 'dist',

  // Serve from live Vercel deployment — app always shows latest version
  server: {
    androidScheme: 'https',
    url: 'https://care-call-ai-clone.vercel.app',
    // Allow the WebView to navigate within the app domain
    allowNavigation: ['care-call-ai-clone.vercel.app', '*.supabase.co'],
  },

  plugins: {
    // Status bar — match the app's teal theme
    StatusBar: {
      backgroundColor: '#0f766e',
      style: 'LIGHT',
      overlaysWebView: false,
    },

    // Keyboard — push content up when keyboard opens
    Keyboard: {
      resize: 'native',
      style: 'DARK',
    },

    // App — handle deep links and back button
    App: {
      launchShowDuration: 0,
    },

    // Push notifications — uses Firebase on Android, APNS on iOS
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },

  android: {
    backgroundColor: '#ffffff',
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },

  ios: {
    contentInset: 'automatic',
    scrollEnabled: true,
    backgroundColor: '#ffffff',
  },
}

export default config
