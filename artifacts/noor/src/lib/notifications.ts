/**
 * Noor Prayer Notifications
 *
 * Two-layer approach:
 *  1. Native Android (PrayerNotificationScheduler) — 100% offline, AlarmManager-based,
 *     synced via PrayerWidget Capacitor plugin. Works even if the app was never opened online.
 *  2. Capacitor LocalNotifications — JS-scheduled backup layer for when API timings are available.
 *
 * Settings are stored in localStorage AND synced to Android SharedPreferences.
 */

import { Capacitor } from '@capacitor/core';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PrayerKey = 'Fajr' | 'Sunrise' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';

export type NotificationSettings = {
  enabled: boolean;
  minutesBefore: number;
  prayers: Record<PrayerKey, boolean>;
};

// ─── Defaults ─────────────────────────────────────────────────────────────────

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  minutesBefore: 10,
  prayers: {
    Fajr:    true,
    Sunrise: false,
    Dhuhr:   true,
    Asr:     true,
    Maghrib: true,
    Isha:    true,
  },
};

// Prayer order (index matches Android PRAYER_NAMES_AR array)
const PRAYER_ORDER: PrayerKey[] = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

// ─── Storage ──────────────────────────────────────────────────────────────────

const SETTINGS_KEY = 'noor_notification_settings';

export function getNotificationSettings(): NotificationSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Partial<NotificationSettings>;
      return {
        ...DEFAULT_NOTIFICATION_SETTINGS,
        ...saved,
        prayers: { ...DEFAULT_NOTIFICATION_SETTINGS.prayers, ...(saved.prayers ?? {}) },
      };
    }
  } catch {}
  return { ...DEFAULT_NOTIFICATION_SETTINGS };
}

export function saveNotificationSettings(s: NotificationSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch {}
  // Sync to Android native layer (offline notifications)
  syncToNative(s);
}

// ─── Native sync ──────────────────────────────────────────────────────────────

/**
 * Push notification settings to the Android PrayerNotificationScheduler.
 * This allows the native AlarmManager-based system to reschedule prayer alarms
 * immediately without needing the app to reopen.
 */
async function syncToNative(s: NotificationSettings): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { registerPlugin } = await import('@capacitor/core');
    const PrayerWidgetPlugin = registerPlugin<{
      updateNotificationSettings(opts: {
        enabled: boolean;
        minutesBefore: number;
        prayers: boolean[];
      }): Promise<void>;
    }>('PrayerWidget');

    await PrayerWidgetPlugin.updateNotificationSettings({
      enabled:       s.enabled,
      minutesBefore: s.minutesBefore,
      prayers:       PRAYER_ORDER.map(k => s.prayers[k]),
    });
  } catch (e) {
    console.warn('[Notifications] Native sync failed:', e);
  }
}

// ─── Prayer metadata ──────────────────────────────────────────────────────────

const PRAYER_META: { key: PrayerKey; name: string; emoji: string; id: number }[] = [
  { key: 'Fajr',    name: 'الفجر',  emoji: '🌙', id: 101 },
  { key: 'Sunrise', name: 'الشروق', emoji: '🌅', id: 102 },
  { key: 'Dhuhr',   name: 'الظهر',  emoji: '☀️', id: 103 },
  { key: 'Asr',     name: 'العصر',  emoji: '🌤️', id: 104 },
  { key: 'Maghrib', name: 'المغرب', emoji: '🌆', id: 105 },
  { key: 'Isha',    name: 'العشاء', emoji: '🌙', id: 106 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseHHMM(timeStr: string): { h: number; m: number } | null {
  const match = timeStr?.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  return { h: parseInt(match[1], 10), m: parseInt(match[2], 10) };
}

// ─── Capacitor LocalNotifications layer ──────────────────────────────────────

async function getPlugin() {
  if (!Capacitor.isNativePlatform()) return null;
  const { LocalNotifications } = await import('@capacitor/local-notifications');
  return LocalNotifications;
}

/** Ask the OS for notification permission. Returns true if granted. */
export async function requestNotificationPermission(): Promise<boolean> {
  const plugin = await getPlugin();
  if (!plugin) return false;
  try {
    const res = await plugin.requestPermissions();
    return res.display === 'granted';
  } catch {
    return false;
  }
}

/** Check current notification permission status. */
export async function checkNotificationPermission(): Promise<boolean> {
  const plugin = await getPlugin();
  if (!plugin) return false;
  try {
    const res = await plugin.checkPermissions();
    return res.display === 'granted';
  } catch {
    return false;
  }
}

/**
 * Schedule Capacitor LocalNotification prayer notifications for a given day.
 * Acts as a backup layer alongside the native AlarmManager notifications.
 */
export async function schedulePrayerNotifications(
  timings: Record<string, string>,
  dayOffset = 0,
): Promise<void> {
  const plugin = await getPlugin();
  if (!plugin) return;

  const settings = getNotificationSettings();
  await cancelPrayerNotificationsForDay(dayOffset);
  if (!settings.enabled) return;

  const hasPermission = await checkNotificationPermission();
  if (!hasPermission) return;

  const now = new Date();
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() + dayOffset);

  const notifications: Parameters<typeof plugin.schedule>[0]['notifications'] = [];

  for (const meta of PRAYER_META) {
    if (!settings.prayers[meta.key]) continue;
    const timeStr = timings[meta.key];
    if (!timeStr) continue;
    const parsed = parseHHMM(timeStr);
    if (!parsed) continue;

    const triggerDate = new Date(baseDate);
    triggerDate.setHours(parsed.h, parsed.m - settings.minutesBefore, 0, 0);
    if (triggerDate <= now) continue;

    const notifId = meta.id + dayOffset * 10;
    const atTime = settings.minutesBefore === 0;
    const body = atTime
      ? `حان وقت ${meta.name} ${meta.emoji}`
      : `${meta.name} بعد ${settings.minutesBefore} دقيقة ${meta.emoji}`;

    notifications.push({
      id: notifId,
      title: '🕌 تطبيق نُور',
      body,
      schedule: { at: triggerDate, allowWhileIdle: true },
      channelId: 'prayer_channel',
      iconColor: '#C19A6B',
      sound: 'default',
      extra: { prayerKey: meta.key, dayOffset },
    });
  }

  if (notifications.length > 0) {
    await plugin.schedule({ notifications });
  }
}

/** Cancel all Noor Capacitor notifications for a specific day. */
export async function cancelPrayerNotificationsForDay(dayOffset = 0): Promise<void> {
  const plugin = await getPlugin();
  if (!plugin) return;
  try {
    const ids = PRAYER_META.map(m => ({ id: m.id + dayOffset * 10 }));
    await plugin.cancel({ notifications: ids });
  } catch {}
}

/** Cancel all Noor Capacitor notifications (today + tomorrow). */
export async function cancelAllPrayerNotifications(): Promise<void> {
  await cancelPrayerNotificationsForDay(0);
  await cancelPrayerNotificationsForDay(1);
}

/**
 * Main entry point — call whenever prayer times are loaded or settings change.
 * Schedules both the Capacitor layer (online timings) and syncs native layer settings.
 */
export async function syncPrayerNotifications(
  todayTimings: Record<string, string>,
  tomorrowTimings?: Record<string, string>,
): Promise<void> {
  await schedulePrayerNotifications(todayTimings, 0);
  if (tomorrowTimings) {
    await schedulePrayerNotifications(tomorrowTimings, 1);
  }
  // Also push current settings to native layer to ensure it's in sync
  syncToNative(getNotificationSettings());
}
