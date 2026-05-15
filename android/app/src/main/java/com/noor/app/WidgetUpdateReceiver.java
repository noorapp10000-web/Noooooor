package com.noor.app;

import android.appwidget.AppWidgetManager;
import android.content.BroadcastReceiver;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;

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
 * It uses Adhan (pure math) to compute the next prayer time and stores the
 * result in SharedPreferences. PrayerWidgetProvider then feeds the prayer
 * epoch into a Chronometer which counts down every second automatically,
 * so no per-second alarms are needed.
 *
 * Triggered by:
 *  - WidgetAlarmManager (every minute, exact)
 *  - BOOT_COMPLETED / MY_PACKAGE_REPLACED
 *  - Widget onEnabled / onUpdate
 */
public class WidgetUpdateReceiver extends BroadcastReceiver {

    private static final double DEFAULT_LAT = 30.0444; // Cairo fallback
    private static final double DEFAULT_LNG = 31.2357;

    @Override
    public void onReceive(Context context, Intent intent) {
        recalcAndUpdate(context);
        WidgetAlarmManager.scheduleNext(context);
    }

    /**
     * Pure Java prayer-time calculation — no internet, no app required.
     * Reads saved lat/lng → calculates next prayer → saves epoch to prefs →
     * refreshes all widget instances on screen.
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

        TimeZone cairoTZ = TimeZone.getTimeZone("Africa/Cairo");
        Calendar nowCal  = Calendar.getInstance(cairoTZ);
        Date     now     = nowCal.getTime();

        // ── Calculate today's prayer times (Adhan, Egyptian method) ───────
        DateComponents today = new DateComponents(
            nowCal.get(Calendar.YEAR),
            nowCal.get(Calendar.MONTH) + 1,
            nowCal.get(Calendar.DAY_OF_MONTH)
        );

        Coordinates           coords = new Coordinates(lat, lng);
        CalculationParameters params = CalculationMethod.EGYPTIAN.get();
        PrayerTimes           pt     = new PrayerTimes(coords, today, params);

        String[] names = { "الفجر", "الشروق", "الظهر", "العصر", "المغرب", "العشاء" };
        Date[]   times = { pt.fajr, pt.sunrise, pt.dhuhr, pt.asr, pt.maghrib, pt.isha };

        String nextName = null;
        Date   nextTime = null;

        for (int i = 0; i < times.length; i++) {
            if (times[i] != null && times[i].after(now)) {
                nextName = names[i];
                nextTime = times[i];
                break;
            }
        }

        // All today's prayers passed → tomorrow's Fajr
        if (nextName == null) {
            Calendar tomorrow = Calendar.getInstance(cairoTZ);
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

        if (nextTime == null) return;

        // ── Format prayer time label (Arabic 12-h) ───────────────────────
        SimpleDateFormat sdf = new SimpleDateFormat("h:mm", Locale.ENGLISH);
        sdf.setTimeZone(cairoTZ);
        Calendar pCal = Calendar.getInstance(cairoTZ);
        pCal.setTime(nextTime);
        String amPm    = pCal.get(Calendar.HOUR_OF_DAY) >= 12 ? "م" : "ص";
        String timeFmt = sdf.format(nextTime) + " " + amPm;

        // ── Persist for PrayerWidgetProvider ─────────────────────────────
        // Store the prayer time as an epoch (ms) — the Chronometer base is
        // derived from this at draw time, giving live per-second countdown.
        prefs.edit()
            .putString(PrayerWidgetProvider.KEY_PRAYER_NAME,  nextName)
            .putString(PrayerWidgetProvider.KEY_PRAYER_TIME,  timeFmt)
            .putLong(PrayerWidgetProvider.KEY_PRAYER_EPOCH,   nextTime.getTime())
            .apply();

        // ── Refresh all widget instances on screen ────────────────────────
        AppWidgetManager manager   = AppWidgetManager.getInstance(context);
        ComponentName    component = new ComponentName(context, PrayerWidgetProvider.class);
        int[]            ids       = manager.getAppWidgetIds(component);
        for (int id : ids) {
            PrayerWidgetProvider.updateWidget(context, manager, id);
        }
    }
}
