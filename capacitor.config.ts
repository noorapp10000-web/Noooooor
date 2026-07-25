/// <reference types="@capacitor/local-notifications" />

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.noor.noor',
  appName: 'Noor',
  webDir: 'artifacts/noor/dist/public',
  server: {
    androidScheme: 'https',
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    backgroundColor: '#F5EDD8',
    initialFocus: true,
    useLegacyBridge: false,
  },
  ios: {
    // contentInset: 'automatic' — lets WKWebView respect safe-area insets (notch, home bar)
    contentInset: 'automatic',
    // Keep WKWebView scrolling enabled; long app pages depend on it
    scrollEnabled: true,
    backgroundColor: '#F5EDD8',
    // Disable 3D-Touch link previews inside the WebView
    allowsLinkPreview: false,
    // Let Capacitor forward local-notification callbacks to the JS plugin
    handleApplicationNotifications: true,
    // Force mobile content mode even on large-screen iPads
    preferredContentMode: 'mobile',
  },
  plugins: {
    LocalNotifications: {
      // Android-only fields — iOS ignores smallIcon / iconColor / channelId
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#C19A6B',
      presentationOptions: ['badge', 'sound', 'banner', 'list'],
    },
  },
};

export default config;
