import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Coordinates, PrayerTimes, CalculationMethod } from 'adhan';
import { getSettingCache } from './rtdb';
import { DAILY_MESSAGES } from './daily-messages';

const EGYPT_TZ = 'Africa/Cairo';

const NOTIF_PRAYERS = [
  { id: 'Fajr',    name: 'الفجر',  idx: 0 },
  { id: 'Dhuhr',   name: 'الظهر',  idx: 1 },
  { id: 'Asr',     name: 'العصر',  idx: 2 },
  { id: 'Maghrib', name: 'المغرب', idx: 3 },
  { id: 'Isha',    name: 'العشاء', idx: 4 },
];

// ── ID Scheme ─────────────────────────────────────────────────────────────────
// Prayer: day(0-34) × 10000 + prayerIdx(0-4) × 100 + type(0=20min,1=10min,2=now)
// Daily:  500000 + daySlot(0-364)
function prayerNotifId(day: number, prayerIdx: number, type: 0 | 1 | 2): number {
  return day * 10000 + prayerIdx * 100 + type;
}
function dailyNotifId(slot: number): number {
  return 500000 + slot;
}

// ── Egypt-aware date helpers ───────────────────────────────────────────────────
function egyptCalendarDate(dayOffset = 0): Date {
  const nowStr = new Intl.DateTimeFormat('en-CA', { timeZone: EGYPT_TZ }).format(new Date());
  const [y, mo, da] = nowStr.split('-').map(Number);
  return new Date(y, mo - 1, da + dayOffset, 12, 0, 0);
}

function computePrayerTimesForDay(
  lat: number,
  lng: number,
  dayOffset: number,
): Record<string, Date> {
  const d = egyptCalendarDate(dayOffset);
  const coords = new Coordinates(lat, lng);
  const params = CalculationMethod.Egyptian();
  const pt = new PrayerTimes(coords, d, params);
  return {
    Fajr:    pt.fajr,
    Dhuhr:   pt.dhuhr,
    Asr:     pt.asr,
    Maghrib: pt.maghrib,
    Isha:    pt.isha,
  };
}

function addMinutes(date: Date, mins: number): Date {
  return new Date(date.getTime() + mins * 60 * 1000);
}

// ── Channels ──────────────────────────────────────────────────────────────────
async function setupChannels(): Promise<void> {
  try {
    await LocalNotifications.createChannel({
      id: 'prayer_sound',
      name: 'إشعارات الصلاة',
      description: 'إشعارات مواقيت الصلاة مع الصوت',
      importance: 5,
      visibility: 1,
      vibration: true,
    });
    await LocalNotifications.createChannel({
      id: 'prayer_silent',
      name: 'إشعارات الصلاة (صامت)',
      description: 'إشعارات مواقيت الصلاة بدون صوت',
      importance: 4,
      visibility: 1,
      vibration: false,
    });
    await LocalNotifications.createChannel({
      id: 'daily',
      name: 'الإشعار اليومي',
      description: 'آيات وأحاديث وأذكار يومية',
      importance: 3,
      visibility: 1,
      vibration: true,
    });
  } catch { /* channels may already exist */ }
}

// ── Permission ────────────────────────────────────────────────────────────────
export async function requestNotificationPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    const result = await LocalNotifications.requestPermissions();
    return result.display === 'granted';
  } catch {
    return false;
  }
}

export async function checkNotificationPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    const result = await LocalNotifications.checkPermissions();
    return result.display === 'granted';
  } catch {
    return false;
  }
}

// ── Cancel ────────────────────────────────────────────────────────────────────
export async function cancelAllPrayerNotifications(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const pending = await LocalNotifications.getPending();
    const prayerIds = pending.notifications.filter(n => n.id < 500000);
    if (prayerIds.length > 0) {
      await LocalNotifications.cancel({ notifications: prayerIds });
    }
  } catch { /* ignore */ }
}

export async function cancelAllDailyNotifications(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const pending = await LocalNotifications.getPending();
    const dailyIds = pending.notifications.filter(n => n.id >= 500000);
    if (dailyIds.length > 0) {
      await LocalNotifications.cancel({ notifications: dailyIds });
    }
  } catch { /* ignore */ }
}

export async function cancelAllNotifications(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({ notifications: pending.notifications });
    }
  } catch { /* ignore */ }
}

// ── Schedule in batches (avoid OS limits) ────────────────────────────────────
async function scheduleBatch(
  notifications: Parameters<typeof LocalNotifications.schedule>[0]['notifications'],
): Promise<void> {
  const BATCH = 50;
  for (let i = 0; i < notifications.length; i += BATCH) {
    try {
      await LocalNotifications.schedule({ notifications: notifications.slice(i, i + BATCH) });
    } catch { /* skip batch on error */ }
  }
}

// ── Prayer Notifications ──────────────────────────────────────────────────────
export async function schedulePrayerNotifications(lat: number, lng: number): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  const now = new Date();
  const notifications: Parameters<typeof LocalNotifications.schedule>[0]['notifications'] = [];

  for (let day = 0; day <= 34; day++) {
    const times = computePrayerTimesForDay(lat, lng, day);

    for (const prayer of NOTIF_PRAYERS) {
      const enabled = getSettingCache<string>(`notif_${prayer.id.toLowerCase()}`, 'on') === 'on';
      if (!enabled) continue;

      const isSilent =
        getSettingCache<string>(`notif_${prayer.id.toLowerCase()}_sound`, 'sound') === 'silent';
      const channelId = isSilent ? 'prayer_silent' : 'prayer_sound';

      const prayerTime = times[prayer.id];
      if (!prayerTime || isNaN(prayerTime.getTime())) continue;

      // 20 minutes before
      const t20 = addMinutes(prayerTime, -20);
      if (t20 > now) {
        notifications.push({
          id: prayerNotifId(day, prayer.idx, 0),
          title: 'نُور',
          body: `صلاة ${prayer.name} بعد 20 دقيقة استعد لها ♥️`,
          schedule: { at: t20, allowWhileIdle: true },
          channelId,
          extra: { route: '/' },
          smallIcon: 'ic_stat_noor',
          iconColor: '#C19A6B',
          sound: isSilent ? undefined : 'default',
        });
      }

      // 10 minutes before
      const t10 = addMinutes(prayerTime, -10);
      if (t10 > now) {
        notifications.push({
          id: prayerNotifId(day, prayer.idx, 1),
          title: 'نُور',
          body: `صلاة ${prayer.name} بعد 10 دقائق استعد لها ♥️`,
          schedule: { at: t10, allowWhileIdle: true },
          channelId,
          extra: { route: '/' },
          smallIcon: 'ic_stat_noor',
          iconColor: '#C19A6B',
          sound: isSilent ? undefined : 'default',
        });
      }

      // At prayer time
      if (prayerTime > now) {
        notifications.push({
          id: prayerNotifId(day, prayer.idx, 2),
          title: 'نُور',
          body: `حان الآن موعد صلاة ${prayer.name} قم للصلاة ♥️`,
          schedule: { at: prayerTime, allowWhileIdle: true },
          channelId,
          extra: { route: '/' },
          smallIcon: 'ic_stat_noor',
          iconColor: '#C19A6B',
          sound: isSilent ? undefined : 'default',
        });
      }
    }
  }

  await scheduleBatch(notifications);
}

// ── Daily Inspirational Notifications ────────────────────────────────────────
export async function scheduleDailyNotifications(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  const enabled = getSettingCache<string>('notif_daily', 'on') === 'on';
  if (!enabled) return;

  const now = new Date();
  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);

  // Deterministic day seed (days since Unix epoch)
  const epochDay = Math.floor(todayMidnight.getTime() / 86400000);

  const notifications: Parameters<typeof LocalNotifications.schedule>[0]['notifications'] = [];

  for (let slot = 0; slot < 365; slot++) {
    const dayDate = new Date(todayMidnight.getTime() + slot * 86400000);

    // Deterministic "random" time between 13:00–21:00 using day seed
    const seed = (epochDay + slot) * 1000003 + 7919;
    const minutesOffset = ((seed % 480) + 480) % 480; // 0..479 minutes in 8h window
    const hours = 13 + Math.floor(minutesOffset / 60);
    const mins = minutesOffset % 60;
    dayDate.setHours(hours, mins, 0, 0);

    if (dayDate <= now) continue;

    const msgIdx = (epochDay + slot) % DAILY_MESSAGES.length;
    const msg = DAILY_MESSAGES[msgIdx];

    notifications.push({
      id: dailyNotifId(slot),
      title: 'نُور',
      body: msg.text,
      schedule: { at: dayDate, allowWhileIdle: true },
      channelId: 'daily',
      extra: { route: msg.route },
      smallIcon: 'ic_stat_noor',
      iconColor: '#C19A6B',
      sound: 'default',
    });
  }

  await scheduleBatch(notifications);
}

// ── Notification Tap Handler ──────────────────────────────────────────────────
let _tapListenerRegistered = false;

export function setupNotificationTapHandler(navigate: (route: string) => void): void {
  if (!Capacitor.isNativePlatform() || _tapListenerRegistered) return;
  _tapListenerRegistered = true;

  LocalNotifications.addListener('localNotificationActionPerformed', (event) => {
    const route: string = event.notification?.extra?.route ?? '/';
    try { navigate(route); } catch { /* ignore navigation errors */ }
  });
}

// ── Main Entry Points ─────────────────────────────────────────────────────────

/**
 * Full schedule: cancel everything and reschedule all notifications.
 * Call on app start and when governorate changes.
 */
export async function scheduleAllNotifications(lat: number, lng: number): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  const granted = await requestNotificationPermission();
  if (!granted) return;

  await setupChannels();
  await cancelAllNotifications();
  await schedulePrayerNotifications(lat, lng);
  await scheduleDailyNotifications();
}

/**
 * Reschedule only prayer notifications (faster, for sound/enable setting changes).
 */
export async function reschedulePrayerNotifications(lat: number, lng: number): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  const granted = await checkNotificationPermission();
  if (!granted) return;

  await cancelAllPrayerNotifications();
  await schedulePrayerNotifications(lat, lng);
}

/**
 * Reschedule only daily notifications (for daily notification toggle changes).
 */
export async function rescheduleDailyNotifications(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  const granted = await checkNotificationPermission();
  if (!granted) return;

  await cancelAllDailyNotifications();
  await scheduleDailyNotifications();
}
