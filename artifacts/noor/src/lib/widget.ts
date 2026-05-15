import { Capacitor, registerPlugin } from '@capacitor/core';

interface PrayerWidgetPlugin {
  updateWidget(options: { prayerName: string; prayerTime: string }): Promise<void>;
  isSupported(): Promise<{ supported: boolean }>;
}

const PrayerWidget = registerPlugin<PrayerWidgetPlugin>('PrayerWidget');

export async function updatePrayerWidget(prayerName: string, prayerTime: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await PrayerWidget.updateWidget({ prayerName, prayerTime });
  } catch {
    // Widget not installed or plugin unavailable — silent fail
  }
}
