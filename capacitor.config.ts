import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.carecallai.app',
  appName: 'CareCallAI',
  webDir: 'dist',

  // Serve locally from built dist/ folder — required for App Store approval
  server: {
    androidScheme: 'https',
    // Allow Supabase API calls
    allowNavigation: ['*.supabase.co'],
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
      resize: 'body',
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
