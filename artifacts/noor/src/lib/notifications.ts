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

// ─── Daily Reminder ───────────────────────────────────────────────────────────

export type DailyReminderSettings = {
  enabled: boolean;
  hour: number;   // 0–23
  minute: number; // 0 or 30
};

export const DEFAULT_DAILY_REMINDER_SETTINGS: DailyReminderSettings = {
  enabled: false,
  hour: 7,
  minute: 0,
};

const DAILY_REMINDER_KEY = 'noor_daily_reminder_settings';

export function getDailyReminderSettings(): DailyReminderSettings {
  try {
    const raw = localStorage.getItem(DAILY_REMINDER_KEY);
    if (raw) return { ...DEFAULT_DAILY_REMINDER_SETTINGS, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULT_DAILY_REMINDER_SETTINGS };
}

export function saveDailyReminderSettings(s: DailyReminderSettings): void {
  try { localStorage.setItem(DAILY_REMINDER_KEY, JSON.stringify(s)); } catch {}
}

// 40 curated short hadiths & ayahs — embedded so no file I/O at schedule time
const DAILY_REMINDERS: { text: string; source: string }[] = [
  { text: 'إِنَّ مَعَ الْعُسْرِ يُسْرًا', source: 'سورة الشرح: 6' },
  { text: 'وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ', source: 'سورة الطلاق: 3' },
  { text: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ', source: 'سورة الرعد: 28' },
  { text: 'وَقُل رَّبِّ زِدْنِي عِلْمًا', source: 'سورة طه: 114' },
  { text: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ', source: 'سورة آل عمران: 173' },
  { text: 'وَاسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ ۚ إِنَّ اللَّهَ مَعَ الصَّابِرِينَ', source: 'سورة البقرة: 153' },
  { text: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ', source: 'سورة البقرة: 201' },
  { text: 'وَهُوَ مَعَكُمْ أَيْنَ مَا كُنتُمْ ۚ وَاللَّهُ بِمَا تَعْمَلُونَ بَصِيرٌ', source: 'سورة الحديد: 4' },
  { text: 'إِنَّ اللَّهَ لَا يُضِيعُ أَجْرَ الْمُحْسِنِينَ', source: 'سورة التوبة: 120' },
  { text: 'وَمَا تَوْفِيقِي إِلَّا بِاللَّهِ ۚ عَلَيْهِ تَوَكَّلْتُ وَإِلَيْهِ أُنِيبُ', source: 'سورة هود: 88' },
  { text: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا', source: 'سورة الشرح: 5' },
  { text: 'وَاللَّهُ يُحِبُّ الصَّابِرِينَ', source: 'سورة آل عمران: 146' },
  { text: 'وَلَذِكْرُ اللَّهِ أَكْبَرُ', source: 'سورة العنكبوت: 45' },
  { text: 'رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي', source: 'سورة طه: 25-26' },
  { text: 'إِنَّ اللَّهَ جَمِيلٌ يُحِبُّ الْجَمَالَ', source: 'صحيح مسلم: 91' },
  { text: 'إنما الأعمال بالنيات، وإنما لكل امرئ ما نوى', source: 'صحيح البخاري: 1' },
  { text: 'المسلم من سلم المسلمون من لسانه ويده', source: 'صحيح البخاري: 10' },
  { text: 'خيركم من تعلم القرآن وعلّمه', source: 'صحيح البخاري: 5027' },
  { text: 'أحب الأعمال إلى الله أدومها وإن قلّ', source: 'صحيح البخاري: 6465' },
  { text: 'إن الله رفيق يحب الرفق في الأمر كله', source: 'صحيح البخاري: 6927' },
  { text: 'تبسمك في وجه أخيك صدقة', source: 'سنن الترمذي: 1956' },
  { text: 'كل معروف صدقة', source: 'صحيح البخاري: 6021' },
  { text: 'من لا يرحم لا يُرحم', source: 'صحيح البخاري: 5997' },
  { text: 'أكمل المؤمنين إيماناً أحسنهم خلقاً', source: 'سنن الترمذي: 1162' },
  { text: 'البر حسن الخلق، والإثم ما حاك في صدرك وكرهت أن يطلع عليه الناس', source: 'صحيح مسلم: 2553' },
  { text: 'من كان يؤمن بالله واليوم الآخر فليقل خيراً أو ليصمت', source: 'صحيح البخاري: 6018' },
  { text: 'سبحان الله وبحمده سبحان الله العظيم — كلمتان خفيفتان على اللسان، ثقيلتان في الميزان، حبيبتان إلى الرحمن', source: 'صحيح البخاري: 6682' },
  { text: 'من سلك طريقاً يلتمس فيه علماً سهّل الله له طريقاً إلى الجنة', source: 'صحيح مسلم: 2699' },
  { text: 'إن الله لا ينظر إلى صوركم وأموالكم، ولكن ينظر إلى قلوبكم وأعمالكم', source: 'صحيح مسلم: 2564' },
  { text: 'لا تحقرن من المعروف شيئاً ولو أن تلقى أخاك بوجه طلق', source: 'صحيح مسلم: 2626' },
  { text: 'المؤمن للمؤمن كالبنيان يشد بعضه بعضاً', source: 'صحيح البخاري: 481' },
  { text: 'اتق المحارم تكن أعبد الناس، وارض بما قسم الله تكن أغنى الناس', source: 'سنن الترمذي: 2305' },
  { text: 'انظر إلى من هو أسفل منك، ولا تنظر إلى من هو فوقك؛ فهو أجدر ألا تزدري نعمة الله عليك', source: 'صحيح مسلم: 2963' },
  { text: 'ازهد في الدنيا يحبك الله، وازهد فيما عند الناس يحبك الناس', source: 'سنن ابن ماجه: 4102' },
  { text: 'الطهور شطر الإيمان', source: 'صحيح مسلم: 223' },
  { text: 'إن الله يحب إذا عمل أحدكم عملاً أن يتقنه', source: 'صحيح ابن حبان: 93' },
  { text: 'من أصبح منكم آمناً في سربه، معافى في جسده، عنده قوت يومه؛ فكأنما حيزت له الدنيا بحذافيرها', source: 'سنن الترمذي: 2346' },
  { text: 'الدال على الخير كفاعله', source: 'سنن الترمذي: 2670' },
  { text: 'إن مما يلحق المؤمن من عمله وحسناته بعد موته: علماً علّمه ونشره', source: 'سنن ابن ماجه: 242' },
  { text: 'خير الناس أنفعهم للناس', source: 'صحيح الجامع: 3289' },
];

function _pickReminder(seed: number): { text: string; source: string } {
  return DAILY_REMINDERS[seed % DAILY_REMINDERS.length];
}

export async function cancelDailyReminder(): Promise<void> {
  const plugin = await _getPlugin();
  if (!plugin) return;
  try {
    const ids = Array.from({ length: 60 }, (_, i) => ({ id: 8000 + i }));
    await plugin.cancel({ notifications: ids });
  } catch {}
}

/** Schedule a daily Islamic reminder for the next 30 days. Fully offline. */
export async function syncDailyReminder(): Promise<void> {
  const plugin = await _getPlugin();
  if (!plugin) return;

  const s = getDailyReminderSettings();

  if (!s.enabled) {
    await cancelDailyReminder();
    return;
  }

  const hasPermission = await checkNotificationPermission();
  if (!hasPermission) return;

  await cancelDailyReminder();

  const now = new Date();
  // Use today's date as seed base so the same reminder shows the whole day
  const seedBase = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const notifications: any[] = [];

  for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
    const triggerDate = new Date(now);
    triggerDate.setDate(triggerDate.getDate() + dayOffset);
    triggerDate.setHours(s.hour, s.minute, 0, 0);
    if (triggerDate <= now) continue;

    const reminder = _pickReminder(seedBase + dayOffset);
    notifications.push({
      id: 8000 + dayOffset,
      title: '✨ تذكير يومي — نُور',
      body: `${reminder.text}\n— ${reminder.source}`,
      schedule: { at: triggerDate, allowWhileIdle: true },
      channelId: 'prayer_channel',
      iconColor: '#C19A6B',
      sound: 'default',
      extra: { type: 'daily_reminder', dayOffset },
    });
  }

  if (notifications.length > 0) {
    await plugin.schedule({ notifications });
  }
}

// ─── Test notification ────────────────────────────────────────────────────────

/**
 * Fires a single test notification after `delaySeconds` (default 5).
 * Returns true if the notification was scheduled, false if unavailable.
 */
export async function sendTestNotification(delaySeconds = 5): Promise<boolean> {
  const plugin = await _getPlugin();
  if (!plugin) return false;

  const hasPermission = await checkNotificationPermission();
  if (!hasPermission) {
    const granted = await requestNotificationPermission();
    if (!granted) return false;
  }

  const triggerDate = new Date(Date.now() + delaySeconds * 1_000);

  try {
    await plugin.schedule({
      notifications: [
        {
          id: 9001,
          title: '🕌 تطبيق نُور — إشعار تجريبي',
          body: `الإشعارات تعمل بشكل صحيح ✅`,
          schedule: { at: triggerDate, allowWhileIdle: true },
          channelId: 'prayer_channel',
          iconColor: '#C19A6B',
          sound: 'default',
        },
      ],
    });
    return true;
  } catch {
    return false;
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
