package com.noor.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;

import com.batoulapps.adhan.CalculationMethod;
import com.batoulapps.adhan.CalculationParameters;
import com.batoulapps.adhan.Coordinates;
import com.batoulapps.adhan.PrayerTimes;
import com.batoulapps.adhan.data.DateComponents;

import java.util.Calendar;
import java.util.Date;
import java.util.TimeZone;

/**
 * Schedules native AlarmManager alarms for prayer-time notifications.
 *
 * Completely offline — uses Adhan (pure math) just like the widget.
 * Settings (enabled, minutesBefore, per-prayer toggles) are stored in
 * SharedPreferences so they survive app restarts and are written from
 * both the Java side (PrayerWidgetPlugin) and the JS side.
 *
 * Alarm IDs: 301–312 (today × 6 prayers + tomorrow × 6 prayers)
 */
public class PrayerNotificationScheduler {

    static final String PREFS_NAME           = "NoorNotifPrefs";
    static final String KEY_ENABLED          = "notif_enabled";
    static final String KEY_MINUTES_BEFORE   = "notif_minutes_before";
    // Per-prayer enabled keys: notif_prayer_0 … notif_prayer_5
    private static final String KEY_PRAYER_PREFIX = "notif_prayer_";

    // Alarm IDs: day0 uses 301-306, day1 uses 307-312
    private static final int BASE_ALARM_ID = 301;

    // ── Settings POJO ──────────────────────────────────────────────────────

    static class NotifSettings {
        boolean enabled       = true;
        int     minutesBefore = 10;
        boolean[] prayerEnabled = { true, false, true, true, true, true }; // Sunrise off by default
    }

    static NotifSettings loadSettings(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        NotifSettings s = new NotifSettings();
        s.enabled       = prefs.getBoolean(KEY_ENABLED, true);
        s.minutesBefore = prefs.getInt(KEY_MINUTES_BEFORE, 10);
        for (int i = 0; i < 6; i++) {
            s.prayerEnabled[i] = prefs.getBoolean(KEY_PRAYER_PREFIX + i, s.prayerEnabled[i]);
        }
        return s;
    }

    static void saveSettings(Context context, boolean enabled, int minutesBefore,
                              boolean[] prayerEnabled) {
        SharedPreferences.Editor ed = context.getSharedPreferences(
            PREFS_NAME, Context.MODE_PRIVATE
        ).edit();
        ed.putBoolean(KEY_ENABLED, enabled);
        ed.putInt(KEY_MINUTES_BEFORE, minutesBefore);
        for (int i = 0; i < Math.min(6, prayerEnabled.length); i++) {
            ed.putBoolean(KEY_PRAYER_PREFIX + i, prayerEnabled[i]);
        }
        ed.apply();
    }

    // ── Scheduling ─────────────────────────────────────────────────────────

    /**
     * Schedule alarms using pre-computed Adhan parameters.
     * Called from WidgetUpdateReceiver when the prayer epoch changes.
     */
    static void scheduleAll(Context context, Coordinates coords,
                             CalculationParameters params, TimeZone tz) {
        NotifSettings settings = loadSettings(context);
        if (!settings.enabled) {
            cancelAll(context);
            return;
        }
        scheduleForDayOffset(context, coords, params, tz, settings, 0);
        scheduleForDayOffset(context, coords, params, tz, settings, 1);
    }

    /**
     * Schedule alarms using stored lat/lng from SharedPreferences.
     * Called after device reboot or from BOOT_COMPLETED.
     */
    static void scheduleAllFromPrefs(Context context) {
        SharedPreferences widgetPrefs = context.getSharedPreferences(
            PrayerWidgetProvider.PREFS_NAME, Context.MODE_PRIVATE
        );
        double lat = Double.longBitsToDouble(
            widgetPrefs.getLong("widget_lat", Double.doubleToLongBits(30.0444))
        );
        double lng = Double.longBitsToDouble(
            widgetPrefs.getLong("widget_lng", Double.doubleToLongBits(31.2357))
        );
        Coordinates           coords = new Coordinates(lat, lng);
        CalculationParameters params = CalculationMethod.EGYPTIAN.getParameters();
        TimeZone              tz     = TimeZone.getDefault();
        scheduleAll(context, coords, params, tz);
    }

    /** Cancel all pending prayer notification alarms. */
    static void cancelAll(Context context) {
        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        for (int day = 0; day < 2; day++) {
            for (int p = 0; p < 6; p++) {
                int alarmId = BASE_ALARM_ID + day * 6 + p;
                PendingIntent pi = buildPendingIntent(context, alarmId, "", 0, 0);
                am.cancel(pi);
            }
        }
    }

    // ── Internals ──────────────────────────────────────────────────────────

    private static void scheduleForDayOffset(Context context, Coordinates coords,
                                              CalculationParameters params, TimeZone tz,
                                              NotifSettings settings, int dayOffset) {
        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;

        Calendar cal = Calendar.getInstance(tz);
        cal.add(Calendar.DAY_OF_MONTH, dayOffset);

        DateComponents dc = new DateComponents(
            cal.get(Calendar.YEAR),
            cal.get(Calendar.MONTH) + 1,
            cal.get(Calendar.DAY_OF_MONTH)
        );

        PrayerTimes pt = new PrayerTimes(coords, dc, params);
        Date[] times = { pt.fajr, pt.sunrise, pt.dhuhr, pt.asr, pt.maghrib, pt.isha };
        String[] names = WidgetUpdateReceiver.PRAYER_NAMES_AR;

        long now = System.currentTimeMillis();

        for (int i = 0; i < 6; i++) {
            int alarmId = BASE_ALARM_ID + dayOffset * 6 + i;

            // Cancel existing alarm for this slot
            PendingIntent old = buildPendingIntent(context, alarmId, names[i], i, 0);
            am.cancel(old);

            if (!settings.prayerEnabled[i]) continue;
            if (times[i] == null)            continue;

            // Subtract minutesBefore offset
            long triggerMs = times[i].getTime() - (settings.minutesBefore * 60_000L);
            if (triggerMs <= now) continue; // already past

            PendingIntent pi = buildPendingIntent(
                context, alarmId, names[i], i, times[i].getTime()
            );

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerMs, pi);
            } else {
                am.setExact(AlarmManager.RTC_WAKEUP, triggerMs, pi);
            }
        }
    }

    private static PendingIntent buildPendingIntent(Context context, int alarmId,
                                                     String prayerName, int prayerIndex,
                                                     long prayerEpoch) {
        Intent intent = new Intent(context, PrayerNotificationReceiver.class);
        intent.setAction("com.noor.app.PRAYER_NOTIF_" + alarmId);
        intent.putExtra(PrayerNotificationReceiver.EXTRA_PRAYER_NAME,  prayerName);
        intent.putExtra(PrayerNotificationReceiver.EXTRA_PRAYER_INDEX, prayerIndex);
        intent.putExtra(PrayerNotificationReceiver.EXTRA_PRAYER_EPOCH, prayerEpoch);
        return PendingIntent.getBroadcast(
            context, alarmId, intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
    }
}
