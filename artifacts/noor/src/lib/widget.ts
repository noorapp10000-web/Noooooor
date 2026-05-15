import { Capacitor, registerPlugin } from '@capacitor/core';

interface PrayerWidgetPlugin {
  updateWidget(options: {
    prayerName: string;
    prayerTime: string;
    countdown?: string;
    lat?: number;
    lng?: number;
  }): Promise<void>;
  isSupported(): Promise<{ supported: boolean }>;
}

const PrayerWidget = registerPlugin<PrayerWidgetPlugin>('PrayerWidget');

/**
 * Sends location + prayer data to the Android widget plugin.
 * The plugin saves lat/lng to SharedPreferences so the widget
 * can recalculate prayer times independently (even when app is closed).
 */
export async function updatePrayerWidget(
  prayerName: string,
  prayerTime: string,
  countdown?: string,
  lat?: number,
  lng?: number,
): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await PrayerWidget.updateWidget({ prayerName, prayerTime, countdown, lat, lng });
  } catch {
    // Widget not installed or plugin unavailable — silent fail
  }
}
