import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.noor.app',
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
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#C19A6B',
      sound: 'beep.wav',
    },
  },
};

export default config;
