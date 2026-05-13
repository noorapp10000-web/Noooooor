/**
 * Noor Prayer Notifications — Capacitor LocalNotifications
 * Works on Android only (silently skipped in browser dev mode)
 */

import { Capacitor } from '@capacitor/core';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PrayerKey = 'Fajr' | 'Sunrise' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';

export type NotificationSettings = {
  enabled: boolean;
  minutesBefore: number; // 0 = at prayer time
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

// ─── Core API (all calls are no-ops in browser) ───────────────────────────────

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
 * Schedule prayer time notifications for a given day.
 * @param timings  The timings object from the aladhan API
 * @param dayOffset 0 = today, 1 = tomorrow
 */
export async function schedulePrayerNotifications(
  timings: Record<string, string>,
  dayOffset = 0,
): Promise<void> {
  const plugin = await getPlugin();
  if (!plugin) return;

  const settings = getNotificationSettings();

  // Cancel existing notifications for this day before rescheduling
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

    // Skip notifications already in the past
    if (triggerDate <= now) continue;

    // Notification ID = base id + dayOffset*10 for uniqueness
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
      sound: undefined,
      smallIcon: 'ic_launcher',
      iconColor: '#C19A6B',
      extra: { prayerKey: meta.key, dayOffset },
    });
  }

  if (notifications.length > 0) {
    await plugin.schedule({ notifications });
    console.log(`[Notifications] Scheduled ${notifications.length} notifications for day+${dayOffset}`);
  }
}

/** Cancel all Noor prayer notifications for a specific day. */
export async function cancelPrayerNotificationsForDay(dayOffset = 0): Promise<void> {
  const plugin = await getPlugin();
  if (!plugin) return;
  try {
    const ids = PRAYER_META.map(m => ({ id: m.id + dayOffset * 10 }));
    await plugin.cancel({ notifications: ids });
  } catch {}
}

/** Cancel all Noor prayer notifications (today + tomorrow). */
export async function cancelAllPrayerNotifications(): Promise<void> {
  await cancelPrayerNotificationsForDay(0);
  await cancelPrayerNotificationsForDay(1);
}

/**
 * Main entry point — call this whenever prayer times are loaded or settings change.
 * Schedules today's and (if available) tomorrow's notifications.
 */
export async function syncPrayerNotifications(
  todayTimings: Record<string, string>,
  tomorrowTimings?: Record<string, string>,
): Promise<void> {
  await schedulePrayerNotifications(todayTimings, 0);
  if (tomorrowTimings) {
    await schedulePrayerNotifications(tomorrowTimings, 1);
  }
}
