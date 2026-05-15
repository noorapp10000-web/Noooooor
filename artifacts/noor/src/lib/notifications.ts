/**
 * Noor Prayer Notifications — 100% Offline
 *
 * Prayer times are computed locally via the `adhan` JS library (same library
 * the app already uses for the home screen widget). No API call needed.
 *
 * Works on Android only (silently no-ops in browser dev mode).
 */

import { Capacitor } from '@capacitor/core';
import { Coordinates, PrayerTimes, CalculationMethod } from 'adhan';
import { getProfileCache } from '@/lib/rtdb';

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

// Prayer order index — must match Android PRAYER_NAMES_AR array (0=Fajr … 5=Isha)
const PRAYER_ORDER: PrayerKey[] = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

// Cairo fallback coordinates (used if user hasn't set a location yet)
const DEFAULT_LAT = 30.0444;
const DEFAULT_LNG = 31.2357;

// ─── Settings storage ─────────────────────────────────────────────────────────

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
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch {}
  // Push to Android native layer so AlarmManager-based notifications update too
  _syncToNative(s);
}

// ─── Local prayer-time calculation (adhan library, no API) ───────────────────

/**
 * Computes the 6 prayer times for a given day using the Adhan JS library.
 * Uses Egyptian calculation method (same as the widget).
 * Returns { prayerKey → Date } — actual Date objects in the device's locale.
 */
function _computePrayerDates(
  lat: number,
  lng: number,
  dayOffset = 0,
): Record<PrayerKey, Date> {
  const coords = new Coordinates(lat, lng);
  const params  = CalculationMethod.Egyptian();

  // Build the date for the requested day in the device's local timezone
  const base = new Date();
  base.setDate(base.getDate() + dayOffset);
  const day = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 12, 0, 0);

  const pt = new PrayerTimes(coords, day, params);

  return {
    Fajr:    pt.fajr,
    Sunrise: pt.sunrise,
    Dhuhr:   pt.dhuhr,
    Asr:     pt.asr,
    Maghrib: pt.maghrib,
    Isha:    pt.isha,
  };
}

/** Returns stored lat/lng, falling back to Cairo if user hasn't set location. */
function _getCoords(): { lat: number; lng: number } {
  try {
    const profile = getProfileCache();
    if (profile?.lat && profile?.lng) {
      return { lat: profile.lat, lng: profile.lng };
    }
  } catch {}
  return { lat: DEFAULT_LAT, lng: DEFAULT_LNG };
}

// ─── Capacitor LocalNotifications plugin ─────────────────────────────────────

async function _getPlugin() {
  if (!Capacitor.isNativePlatform()) return null;
  const { LocalNotifications } = await import('@capacitor/local-notifications');
  return LocalNotifications;
}

/** Ask the OS for notification permission. Returns true if granted. */
export async function requestNotificationPermission(): Promise<boolean> {
  const plugin = await _getPlugin();
  if (!plugin) return false;
  try {
    const res = await plugin.requestPermissions();
    return res.display === 'granted';
  } catch { return false; }
}

/** Check current notification permission status. */
export async function checkNotificationPermission(): Promise<boolean> {
  const plugin = await _getPlugin();
  if (!plugin) return false;
  try {
    const res = await plugin.checkPermissions();
    return res.display === 'granted';
  } catch { return false; }
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

// ─── Cancel helpers ───────────────────────────────────────────────────────────

async function _cancelForDay(plugin: Awaited<ReturnType<typeof _getPlugin>>, dayOffset: number) {
  if (!plugin) return;
  try {
    await plugin.cancel({ notifications: PRAYER_META.map(m => ({ id: m.id + dayOffset * 10 })) });
  } catch {}
}

export async function cancelPrayerNotificationsForDay(dayOffset = 0): Promise<void> {
  const plugin = await _getPlugin();
  await _cancelForDay(plugin, dayOffset);
}

export async function cancelAllPrayerNotifications(): Promise<void> {
  const plugin = await _getPlugin();
  await _cancelForDay(plugin, 0);
  await _cancelForDay(plugin, 1);
}

// ─── Core scheduling ──────────────────────────────────────────────────────────

async function _scheduleForDay(
  plugin: Awaited<ReturnType<typeof _getPlugin>>,
  settings: NotificationSettings,
  dayOffset: number,
): Promise<void> {
  if (!plugin) return;

  // Cancel previous notifications for this day first
  await _cancelForDay(plugin, dayOffset);

  const { lat, lng } = _getCoords();
  const prayerDates = _computePrayerDates(lat, lng, dayOffset);
  const now = new Date();

  const notifications: Parameters<typeof plugin.schedule>[0]['notifications'] = [];

  for (const meta of PRAYER_META) {
    if (!settings.prayers[meta.key]) continue;

    const prayerDate = prayerDates[meta.key];
    if (!prayerDate) continue;

    // Trigger time = prayer time minus the advance offset
    const triggerDate = new Date(prayerDate.getTime() - settings.minutesBefore * 60_000);
    if (triggerDate <= now) continue; // already passed

    const atTime = settings.minutesBefore === 0;
    const body = atTime
      ? `حان وقت ${meta.name} ${meta.emoji}`
      : `${meta.name} بعد ${settings.minutesBefore} دقيقة ${meta.emoji}`;

    notifications.push({
      id:        meta.id + dayOffset * 10,
      title:     '🕌 تطبيق نُور',
      body,
      schedule:  { at: triggerDate, allowWhileIdle: true },
      channelId: 'prayer_channel',
      iconColor: '#C19A6B',
      sound:     'default',
      extra:     { prayerKey: meta.key, dayOffset },
    });
  }

  if (notifications.length > 0) {
    await plugin.schedule({ notifications });
  }
}

// ─── Native Android sync ──────────────────────────────────────────────────────

/**
 * Push notification settings to Android PrayerNotificationScheduler via Capacitor.
 * This updates the native AlarmManager alarms without needing the app to restart.
 */
async function _syncToNative(s: NotificationSettings): Promise<void> {
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

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Schedule prayer notifications for today and tomorrow.
 * Fully offline — computes prayer times locally via `adhan`.
 * Call whenever the app opens, location changes, or settings change.
 */
export async function syncPrayerNotifications(): Promise<void> {
  const plugin = await _getPlugin();
  if (!plugin) return;

  const settings = getNotificationSettings();

  if (!settings.enabled) {
    await cancelAllPrayerNotifications();
    _syncToNative(settings);
    return;
  }

  const hasPermission = await checkNotificationPermission();
  if (!hasPermission) return;

  // Schedule today and tomorrow (rolling 48-hour coverage)
  await Promise.all([
    _scheduleForDay(plugin, settings, 0),
    _scheduleForDay(plugin, settings, 1),
  ]);

  // Keep native Android AlarmManager layer in sync
  _syncToNative(settings);
}
