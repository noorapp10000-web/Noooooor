import { registerPlugin } from '@capacitor/core';

export interface PrayerEntry {
  name: string;
  timeMs: number;
  timeStr: string;
}

export interface NoorWidgetPlugin {
  setPrayerTimes(data: {
    prayers: PrayerEntry[];
    lat: number;
    lng: number;
  }): Promise<void>;
  setTheme(data: { theme: 'light' | 'dark' }): Promise<void>;
}

const NoorWidget = registerPlugin<NoorWidgetPlugin>('NoorWidget', {
  web: {
    async setPrayerTimes() {},
    async setTheme() {},
  } as NoorWidgetPlugin,
});

export default NoorWidget;
