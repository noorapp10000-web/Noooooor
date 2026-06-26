package com.noor.app.widget;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.content.BroadcastReceiver;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.widget.RemoteViews;

import com.batoulapps.adhan.CalculationMethod;
import com.batoulapps.adhan.CalculationParameters;
import com.batoulapps.adhan.Coordinates;
import com.batoulapps.adhan.PrayerTimes;
import com.batoulapps.adhan.data.DateComponents;
import com.noor.app.R;

import java.util.Calendar;
import java.util.Date;

/**
 * Receiver مخصص للـ AlarmManager — يجدّد نفسه تلقائياً كل 30 ثانية.
 * يعمل حتى لو اتقُتل الـ Service، لأن الـ AlarmManager يبقى في الـ System Process.
 * عند الاستدعاء: يجدول الـ alarm التالي أولاً، ثم يحاول إعادة تشغيل الـ Service،
 * وإن فشل يُحدّث الويدجت مباشرةً (بدون sky bitmap لتوفير الوقت).
 */
public class WidgetRefreshReceiver extends BroadcastReceiver {

    public static final String ACTION   = "com.noor.app.WIDGET_REFRESH";
    static final        int    REQ_CODE = 9999;
    static final        long   INTERVAL = 30_000L;

    private static final String[] PRAYER_NAMES = {
        "الفجر", "الظهر", "العصر", "المغرب", "العشاء"
    };

    @Override
    public void onReceive(Context context, Intent intent) {
        // 1. جدول الـ alarm التالي فوراً (قبل أي حاجة تانية)
        schedule(context);

        // 2. حاول تشغيل الـ Service (مسموح من alarm-triggered BroadcastReceiver)
        try {
            PrayerWidgetService.start(context);
            return; // الـ Service هيتولى باقي التحديث
        } catch (Exception ignored) {}

        // 3. فولباك: حدّث الويدجت مباشرةً لو فشل الـ Service
        updateWidgetDirect(context);
    }

    /** جدول الـ alarm التالي بعد INTERVAL ثانية. */
    public static void schedule(Context context) {
        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;

        Intent i  = new Intent(context, WidgetRefreshReceiver.class).setAction(ACTION);
        PendingIntent pi = PendingIntent.getBroadcast(
            context, REQ_CODE, i,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        long trigger = System.currentTimeMillis() + INTERVAL;

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, trigger, pi);
            } else {
                am.setExact(AlarmManager.RTC_WAKEUP, trigger, pi);
            }
        } catch (Exception ignored) {
            try { am.set(AlarmManager.RTC_WAKEUP, trigger, pi); } catch (Exception e2) {}
        }
    }

    /** ألغِ الـ alarm (لما الويدجت يُزال). */
    public static void cancel(Context context) {
        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        Intent i  = new Intent(context, WidgetRefreshReceiver.class).setAction(ACTION);
        PendingIntent pi = PendingIntent.getBroadcast(
            context, REQ_CODE, i,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        try { am.cancel(pi); } catch (Exception ignored) {}
    }

    /** تحديث الويدجت مباشرةً بدون Sky Bitmap (سريع، يشتغل من BroadcastReceiver). */
    private void updateWidgetDirect(Context context) {
        try {
            AppWidgetManager awm = AppWidgetManager.getInstance(context);
            int[] ids = awm.getAppWidgetIds(new ComponentName(context, PrayerWidget.class));
            if (ids == null || ids.length == 0) return;

            SharedPreferences prefs = context.getSharedPreferences(
                PrayerWidgetService.PREFS_NAME, Context.MODE_PRIVATE);
            float lat = prefs.getFloat(PrayerWidgetService.KEY_LAT, Float.MIN_VALUE);
            float lng = prefs.getFloat(PrayerWidgetService.KEY_LNG, Float.MIN_VALUE);

            String nextName = "", nextTimeFormatted = "", prevName = "";
            String hh = "--", mm = "--", ss = "--";

            if (lat != Float.MIN_VALUE) {
                long[] result = computeCountdown(lat, lng);
                if (result != null) {
                    long remaining = result[0];
                    int nextIdx    = (int) result[1];
                    long nextMs    = result[2];

                    if (remaining < 0) remaining = 0;
                    int h = (int)(remaining / 3_600_000L);
                    int m = (int)((remaining % 3_600_000L) / 60_000L);
                    int s = (int)((remaining % 60_000L) / 1_000L);
                    hh = pad2(h); mm = pad2(m); ss = pad2(s);

                    nextName = PRAYER_NAMES[nextIdx];
                    nextTimeFormatted = "وقت الأذان " + formatTime12(new Date(nextMs));
                    prevName = "الصلاة الحالية: " + PRAYER_NAMES[nextIdx > 0 ? nextIdx - 1 : 4];
                }
            }

            for (int id : ids) {
                RemoteViews rv = new RemoteViews(context.getPackageName(), R.layout.widget_unified);
                rv.setTextViewText(R.id.wg_hours,          hh);
                rv.setTextViewText(R.id.wg_minutes,        mm);
                rv.setTextViewText(R.id.wg_seconds,        ss);
                rv.setTextViewText(R.id.wg_prayer_name,    nextName.isEmpty() ? "نُور" : nextName);
                rv.setTextViewText(R.id.wg_adhan_time,     nextTimeFormatted);
                rv.setTextViewText(R.id.wg_current_prayer, prevName);
                rv.setTextColor(R.id.wg_hours,   0xFFFFFFFF);
                rv.setTextColor(R.id.wg_minutes, 0xFFFFFFFF);
                rv.setTextColor(R.id.wg_seconds, 0xFFFFFFFF);
                rv.setTextColor(R.id.wg_prayer_name, 0xFFFFFFFF);
                rv.setTextColor(R.id.wg_adhan_time,  0xCCFFFFFF);
                awm.partiallyUpdateAppWidget(id, rv);
            }
        } catch (Exception ignored) {}
    }

    /** يحسب الوقت المتبقي للصلاة القادمة. يرجع [remaining_ms, nextIdx, nextTimeMs] أو null. */
    private long[] computeCountdown(float lat, float lng) {
        try {
            Coordinates coords = new Coordinates(lat, lng);
            CalculationParameters params = CalculationMethod.EGYPTIAN.getParameters();
            long now = System.currentTimeMillis();
            DateComponents dc = DateComponents.from(new Date());
            PrayerTimes pt = new PrayerTimes(coords, dc, params);

            long[] times = {
                pt.fajr.getTime(), pt.dhuhr.getTime(),
                pt.asr.getTime(), pt.maghrib.getTime(), pt.isha.getTime()
            };

            int nextIdx = -1;
            for (int i = 0; i < times.length; i++) {
                if (times[i] > now) { nextIdx = i; break; }
            }

            long nextMs;
            if (nextIdx >= 0) {
                nextMs = times[nextIdx];
            } else {
                nextIdx = 0;
                Calendar tomorrow = Calendar.getInstance();
                tomorrow.add(Calendar.DAY_OF_YEAR, 1);
                PrayerTimes ptT = new PrayerTimes(coords,
                    DateComponents.from(tomorrow.getTime()), params);
                nextMs = ptT.fajr.getTime();
            }
            return new long[]{ nextMs - now, nextIdx, nextMs };
        } catch (Exception e) {
            return null;
        }
    }

    private String formatTime12(Date date) {
        Calendar c = Calendar.getInstance();
        c.setTime(date);
        int hour = c.get(Calendar.HOUR);
        if (hour == 0) hour = 12;
        int min  = c.get(Calendar.MINUTE);
        String amPm = (c.get(Calendar.AM_PM) == Calendar.AM) ? "ص" : "م";
        return hour + ":" + pad2(min) + " " + amPm;
    }

    private static String pad2(int n) {
        return n < 10 ? "0" + n : String.valueOf(n);
    }
}
