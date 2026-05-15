package com.noor.app;

import android.appwidget.AppWidgetManager;
import android.content.BroadcastReceiver;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;

import com.batoulapps.adhan.CalculationMethod;
import com.batoulapps.adhan.CalculationParameters;
import com.batoulapps.adhan.Coordinates;
import com.batoulapps.adhan.PrayerTimes;
import com.batoulapps.adhan.data.DateComponents;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;

/**
 * Standalone BroadcastReceiver — runs every minute via AlarmManager chaining.
 *
 * Uses Adhan (pure math) to compute next prayer time and stores the result in
 * SharedPreferences. PrayerWidgetProvider reads those values and updates the widget.
 *
 * DST is handled automatically: we use TimeZone.getDefault() which reflects the
 * device's current timezone rules (including any DST offset).
 */
public class WidgetUpdateReceiver extends BroadcastReceiver {

    private static final double DEFAULT_LAT = 30.0444; // Cairo fallback
    private static final double DEFAULT_LNG = 31.2357;

    static final String[] PRAYER_NAMES_AR = {
        "الفجر", "الشروق", "الظهر", "العصر", "المغرب", "العشاء"
    };

    private static final String[] HIJRI_MONTH_NAMES = {
        "Muharram", "Safar", "Rabi' I", "Rabi' II",
        "Jumada I", "Jumada II", "Rajab", "Sha'ban",
        "Ramadan", "Shawwal", "Dhu al-Qi'dah", "Dhu al-Hijjah"
    };

    private static final String[] GREGORIAN_MONTH_NAMES = {
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    };

    private static final String[] DAY_NAMES = {
        "Sunday", "Monday", "Tuesday", "Wednesday",
        "Thursday", "Friday", "Saturday"
    };

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent != null ? intent.getAction() : null;

        // On boot/replace: reschedule both widget alarm AND prayer notifications
        if ("android.intent.action.BOOT_COMPLETED".equals(action)
                || "android.intent.action.MY_PACKAGE_REPLACED".equals(action)) {
            PrayerNotificationScheduler.scheduleAllFromPrefs(context);
        }

        recalcAndUpdate(context);
        WidgetAlarmManager.scheduleNext(context);
    }

    /**
     * Pure Java prayer-time calculation — no internet, no app required.
     * Uses device timezone for DST-safe calculation.
     */
    static void recalcAndUpdate(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(
            PrayerWidgetProvider.PREFS_NAME, Context.MODE_PRIVATE
        );

        // Location (saved by app on first open; fallback = Cairo)
        double lat = Double.longBitsToDouble(
            prefs.getLong("widget_lat", Double.doubleToLongBits(DEFAULT_LAT))
        );
        double lng = Double.longBitsToDouble(
            prefs.getLong("widget_lng", Double.doubleToLongBits(DEFAULT_LNG))
        );

        // Use device timezone — automatically handles DST
        TimeZone tz  = TimeZone.getDefault();
        Calendar now = Calendar.getInstance(tz);
        Date nowDate = now.getTime();

        // ── Today's prayer times (Adhan, Egyptian method) ─────────────────
        DateComponents today = new DateComponents(
            now.get(Calendar.YEAR),
            now.get(Calendar.MONTH) + 1,
            now.get(Calendar.DAY_OF_MONTH)
        );

        Coordinates           coords = new Coordinates(lat, lng);
        CalculationParameters params = CalculationMethod.EGYPTIAN.getParameters();
        PrayerTimes           pt     = new PrayerTimes(coords, today, params);

        Date[] times = { pt.fajr, pt.sunrise, pt.dhuhr, pt.asr, pt.maghrib, pt.isha };

        String nextName  = null;
        Date   nextTime  = null;

        for (int i = 0; i < times.length; i++) {
            if (times[i] != null && times[i].after(nowDate)) {
                nextName = PRAYER_NAMES_AR[i];
                nextTime = times[i];
                break;
            }
        }

        // All today's prayers passed → tomorrow's Fajr
        if (nextName == null) {
            Calendar tomorrow = Calendar.getInstance(tz);
            tomorrow.add(Calendar.DAY_OF_MONTH, 1);
            DateComponents tomorrowDate = new DateComponents(
                tomorrow.get(Calendar.YEAR),
                tomorrow.get(Calendar.MONTH) + 1,
                tomorrow.get(Calendar.DAY_OF_MONTH)
            );
            PrayerTimes tp = new PrayerTimes(coords, tomorrowDate, params);
            nextName = "الفجر";
            nextTime = tp.fajr;
        }

        // ── Schedule prayer notifications (offline, native AlarmManager) ──
        // Only reschedule when the next prayer epoch actually changes
        long prevEpoch = prefs.getLong(PrayerWidgetProvider.KEY_PRAYER_EPOCH, 0L);
        if (nextTime != null && nextTime.getTime() != prevEpoch) {
            PrayerNotificationScheduler.scheduleAll(context, coords, params, tz);
        }

        if (nextTime == null) return;

        // ── Format prayer time label (12-h English) ───────────────────────
        SimpleDateFormat sdf = new SimpleDateFormat("h:mm a", Locale.ENGLISH);
        sdf.setTimeZone(tz);
        String timeFmt = "At " + sdf.format(nextTime);

        // ── Compute countdown H / M / S ───────────────────────────────────
        long remainingMs = Math.max(0L, nextTime.getTime() - System.currentTimeMillis());
        long totalSec    = remainingMs / 1000L;
        int  hours       = (int)(totalSec / 3600);
        int  minutes     = (int)((totalSec % 3600) / 60);
        int  seconds     = (int)(totalSec % 60);

        // ── Gregorian date string ─────────────────────────────────────────
        int dayOfWeek = now.get(Calendar.DAY_OF_WEEK) - 1; // 0=Sun
        String gregorianDate = DAY_NAMES[dayOfWeek] + ", "
            + now.get(Calendar.DAY_OF_MONTH) + " "
            + GREGORIAN_MONTH_NAMES[now.get(Calendar.MONTH)] + " "
            + now.get(Calendar.YEAR);

        // ── Hijri date string (offline, device ICU for API 24+) ──────────
        String hijriDate = buildHijriDate(now);

        // ── Persist for PrayerWidgetProvider ─────────────────────────────
        prefs.edit()
            .putString(PrayerWidgetProvider.KEY_PRAYER_NAME,      nextName)
            .putString(PrayerWidgetProvider.KEY_PRAYER_TIME,      timeFmt)
            .putLong(PrayerWidgetProvider.KEY_PRAYER_EPOCH,       nextTime.getTime())
            .putInt(PrayerWidgetProvider.KEY_COUNTDOWN_H,         hours)
            .putInt(PrayerWidgetProvider.KEY_COUNTDOWN_M,         minutes)
            .putInt(PrayerWidgetProvider.KEY_COUNTDOWN_S,         seconds)
            .putString(PrayerWidgetProvider.KEY_HIJRI_DATE,       hijriDate)
            .putString(PrayerWidgetProvider.KEY_GREGORIAN_DATE,   gregorianDate)
            .apply();

        // ── Refresh all widget instances ──────────────────────────────────
        AppWidgetManager manager   = AppWidgetManager.getInstance(context);
        ComponentName    component = new ComponentName(context, PrayerWidgetProvider.class);
        int[]            ids       = manager.getAppWidgetIds(component);
        for (int id : ids) {
            PrayerWidgetProvider.updateWidget(context, manager, id);
        }
    }

    /**
     * Returns Hijri date string like "17 Dhul Qadah 1447".
     * Uses Android ICU library (API 24+) which correctly implements Umm Al-Qura.
     * Falls back to tabular arithmetic calendar on API 22-23.
     */
    @SuppressWarnings("NewApi")
    private static String buildHijriDate(Calendar gregorianCal) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                // android.icu is available from API 24 — uses Umm Al-Qura calendar
                android.icu.util.IslamicCalendar ic = new android.icu.util.IslamicCalendar();
                ic.setTimeInMillis(gregorianCal.getTimeInMillis());
                int hYear  = ic.get(android.icu.util.Calendar.YEAR);
                int hMonth = ic.get(android.icu.util.Calendar.MONTH); // 0 = Muharram
                int hDay   = ic.get(android.icu.util.Calendar.DAY_OF_MONTH);
                return hDay + " " + HIJRI_MONTH_NAMES[hMonth] + " " + hYear;
            }
        } catch (Exception ignored) {
            // fall through to tabular calculation
        }

        // Tabular Hijri calendar fallback (arithmetic, accurate within ±1 day)
        int y = gregorianCal.get(Calendar.YEAR);
        int m = gregorianCal.get(Calendar.MONTH) + 1;
        int d = gregorianCal.get(Calendar.DAY_OF_MONTH);
        int[] h = tabularGregorianToHijri(y, m, d);
        return h[2] + " " + HIJRI_MONTH_NAMES[h[1] - 1] + " " + h[0];
    }

    /**
     * Arithmetic (tabular) Gregorian → Hijri conversion.
     * Returns int[]{hYear, hMonth (1-12), hDay}.
     */
    static int[] tabularGregorianToHijri(int y, int m, int d) {
        if (m < 3) { y--; m += 12; }
        int a  = y / 100;
        int b  = 2 - a + (a / 4);
        int jd = (int)(365.25f * (y + 4716)) + (int)(30.6001f * (m + 1)) + d + b - 1524;

        int L  = jd - 1948440 + 10632;
        int n  = (L - 1) / 10631;
        L      = L - 10631 * n + 354;
        int j  = ((10985 - L) / 5316) * ((50 * L) / 17719)
                 + (L / 5670) * ((43 * L) / 15238);
        L      = L - ((32 - j) / 5316) * ((52 * L) / 179)
                 - (j / 28) * ((182 * j) / 5170);

        int hYear  = 30 * n + j - 30;
        int hMonth = (8 * L + 51) / 15 + 1;
        int hDay   = L - (59 * (hMonth - 1)) / 2;

        // Sanity clamp
        if (hDay   < 1)  { hMonth--; hDay += 30; }
        if (hMonth < 1)  { hYear--;  hMonth = 12; }
        if (hMonth > 12) { hYear++;  hMonth = 1;  }
        if (hDay   < 1)  hDay = 1;
        if (hDay   > 30) hDay = 30;

        return new int[]{hYear, hMonth, hDay};
    }
}
