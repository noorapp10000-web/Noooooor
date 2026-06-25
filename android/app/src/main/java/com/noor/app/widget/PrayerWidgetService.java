package com.noor.app.widget;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.appwidget.AppWidgetManager;
import android.content.BroadcastReceiver;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.graphics.BitmapFactory;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.widget.RemoteViews;

import androidx.core.app.NotificationCompat;

import com.batoulapps.adhan.CalculationMethod;
import com.batoulapps.adhan.CalculationParameters;
import com.batoulapps.adhan.Coordinates;
import com.batoulapps.adhan.PrayerTimes;
import com.batoulapps.adhan.data.DateComponents;
import com.noor.app.MainActivity;
import com.noor.app.R;

import java.util.Calendar;
import java.util.Date;

/**
 * نُور — Foreground Service for per-second widget updates.
 *
 * New features (glassmorphism update):
 *   • Size-aware layouts: large (4×3+) / medium (4×2) / small (2×2)
 *   • Prayer emoji icons  (🌅☀️🌤️🌇🌙)
 *   • Hijri date          (API 24+ via android.icu.util.IslamicCalendar)
 *   • City name display   (📍 القاهرة)
 *   • Progress bar        between prev and next prayer
 *
 * Prayer times are calculated natively via the adhan library using
 * lat/lng stored by WidgetBridgePlugin. No internet required.
 */
public class PrayerWidgetService extends Service {

    public static final String PREFS_NAME = "NoorWidget";
    public static final String KEY_LAT    = "lat";
    public static final String KEY_LNG    = "lng";
    public static final String KEY_THEME  = "theme";
    public static final String KEY_CITY   = "cityName";

    private static final String CHANNEL_ID = "noor_widget_ch";
    private static final int    NOTIF_ID   = 9001;

    private static final String[] PRAYER_NAMES = {
        "الفجر", "الظهر", "العصر", "المغرب", "العشاء"
    };

    private static final String[] PRAYER_EMOJIS = {
        "🌅", "☀️", "🌤️", "🌇", "🌙"
    };

    private static final String[] HIJRI_MONTHS = {
        "محرم", "صفر", "ربيع الأول", "ربيع الآخر",
        "جمادى الأولى", "جمادى الآخرة", "رجب", "شعبان",
        "رمضان", "شوال", "ذو القعدة", "ذو الحجة"
    };

    private static final String[] HIJRI_DAYS = {
        "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"
    };

    private final Handler  handler    = new Handler(Looper.getMainLooper());
    private boolean        isScreenOn = true;
    private boolean        isRunning  = false;

    private final Runnable tickRunnable = new Runnable() {
        @Override public void run() {
            if (isScreenOn) performUpdate();
            handler.postDelayed(this, 1000L);
        }
    };

    private final BroadcastReceiver screenReceiver = new BroadcastReceiver() {
        @Override public void onReceive(Context ctx, Intent intent) {
            String a = intent.getAction();
            if (Intent.ACTION_SCREEN_OFF.equals(a)) {
                isScreenOn = false;
            } else if (Intent.ACTION_SCREEN_ON.equals(a)) {
                isScreenOn = true;
                performUpdate();
            }
        }
    };

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
        IntentFilter f = new IntentFilter();
        f.addAction(Intent.ACTION_SCREEN_OFF);
        f.addAction(Intent.ACTION_SCREEN_ON);
        registerReceiver(screenReceiver, f);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (!isRunning) {
            isRunning = true;
            startForeground(NOTIF_ID, buildNotification("نُور", "عداد الصلاة يعمل في الخلفية"));
            handler.post(tickRunnable);
        }
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        isRunning = false;
        handler.removeCallbacks(tickRunnable);
        try { unregisterReceiver(screenReceiver); } catch (Exception ignored) {}
        super.onDestroy();
    }

    @Override public IBinder onBind(Intent i) { return null; }

    // ── Core update logic ────────────────────────────────────────────────────
    private void performUpdate() {
        AppWidgetManager awm = AppWidgetManager.getInstance(this);
        int[] ids = awm.getAppWidgetIds(new ComponentName(this, PrayerWidget.class));
        if (ids.length == 0) { stopSelf(); return; }

        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        float  lat  = prefs.getFloat(KEY_LAT, Float.MIN_VALUE);
        float  lng  = prefs.getFloat(KEY_LNG, Float.MIN_VALUE);
        String city = prefs.getString(KEY_CITY, "");

        String hijri = getHijriDate();
        PrayerState state = (lat != Float.MIN_VALUE) ? getPrayerState(lat, lng) : null;

        Intent openApp = new Intent(this, MainActivity.class);
        openApp.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent openPi = PendingIntent.getActivity(
            this, 0, openApp,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        // Each widget gets its own layout based on its current size on screen
        for (int widgetId : ids) {
            Bundle options = awm.getAppWidgetOptions(widgetId);
            int minW = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH,  250);
            int minH = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT, 160);

            int layoutId;
            if (minW < 180 || minH < 130) {
                layoutId = R.layout.widget_prayer_small;
            } else if (minH < 155) {
                layoutId = R.layout.widget_prayer_medium;
            } else {
                layoutId = R.layout.widget_prayer;
            }

            RemoteViews rv = new RemoteViews(getPackageName(), layoutId);

            if (state != null) {
                long remaining = state.nextTimeMs - System.currentTimeMillis();
                if (remaining < 0) remaining = 0;

                int h = (int)(remaining / 3_600_000L);
                int m = (int)((remaining % 3_600_000L) / 60_000L);
                int s = (int)((remaining % 60_000L) / 1_000L);

                String nextLabel = state.nextEmoji + " " + state.nextName;

                rv.setTextViewText(R.id.wg_prayer_name, nextLabel);
                rv.setTextViewText(R.id.wg_hours,   pad2(h));
                rv.setTextViewText(R.id.wg_minutes, pad2(m));

                if (layoutId != R.layout.widget_prayer_small) {
                    rv.setTextViewText(R.id.wg_seconds, pad2(s));
                    rv.setProgressBar(R.id.wg_progress, 100, state.progress, false);
                }

                // Large widget: all extras
                if (layoutId == R.layout.widget_prayer) {
                    rv.setTextViewText(R.id.wg_hijri_date, hijri);
                    rv.setTextViewText(R.id.wg_city,
                        (city != null && !city.isEmpty()) ? "📍 " + city : "");
                    rv.setTextViewText(R.id.wg_prev_prayer,
                        state.prevEmoji + " " + state.prevName);
                    rv.setTextViewText(R.id.wg_next_prayer, nextLabel);
                }

                // Medium widget: city only
                if (layoutId == R.layout.widget_prayer_medium) {
                    rv.setTextViewText(R.id.wg_city,
                        (city != null && !city.isEmpty()) ? "📍 " + city : "");
                }

                // Update notification with live countdown
                String cd = pad2(h) + ":" + pad2(m) + ":" + pad2(s);
                getSystemService(NotificationManager.class)
                    .notify(NOTIF_ID, buildNotification(nextLabel, cd));

            } else {
                // No location set yet — prompt user to open the app
                rv.setTextViewText(R.id.wg_prayer_name, "🕌 افتح التطبيق");
                rv.setTextViewText(R.id.wg_hours,   "--");
                rv.setTextViewText(R.id.wg_minutes, "--");
                if (layoutId != R.layout.widget_prayer_small) {
                    rv.setTextViewText(R.id.wg_seconds, "--");
                }
            }

            rv.setOnClickPendingIntent(R.id.wg_root, openPi);
            awm.updateAppWidget(widgetId, rv);
        }
    }

    // ── Prayer state: previous + next + progress ─────────────────────────────
    private PrayerState getPrayerState(float lat, float lng) {
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

            // Find the next upcoming prayer
            int nextIdx = -1;
            for (int i = 0; i < times.length; i++) {
                if (times[i] > now) { nextIdx = i; break; }
            }

            long nextMs, prevMs;
            String nextName, nextEmoji, prevName, prevEmoji;

            if (nextIdx >= 0) {
                nextMs    = times[nextIdx];
                nextName  = PRAYER_NAMES[nextIdx];
                nextEmoji = PRAYER_EMOJIS[nextIdx];

                if (nextIdx > 0) {
                    prevMs    = times[nextIdx - 1];
                    prevName  = PRAYER_NAMES[nextIdx - 1];
                    prevEmoji = PRAYER_EMOJIS[nextIdx - 1];
                } else {
                    // Before Fajr — previous prayer is yesterday's Isha
                    Calendar yesterday = Calendar.getInstance();
                    yesterday.add(Calendar.DAY_OF_YEAR, -1);
                    PrayerTimes ptY = new PrayerTimes(coords,
                        DateComponents.from(yesterday.getTime()), params);
                    prevMs    = ptY.isha.getTime();
                    prevName  = PRAYER_NAMES[4];
                    prevEmoji = PRAYER_EMOJIS[4];
                }
            } else {
                // After Isha — next prayer is tomorrow's Fajr
                prevMs    = times[4];
                prevName  = PRAYER_NAMES[4];
                prevEmoji = PRAYER_EMOJIS[4];

                Calendar tomorrow = Calendar.getInstance();
                tomorrow.add(Calendar.DAY_OF_YEAR, 1);
                PrayerTimes ptT = new PrayerTimes(coords,
                    DateComponents.from(tomorrow.getTime()), params);
                nextMs    = ptT.fajr.getTime();
                nextName  = PRAYER_NAMES[0];
                nextEmoji = PRAYER_EMOJIS[0];
            }

            // Progress (0–100): how far between prevMs and nextMs
            int progress = 0;
            long total = nextMs - prevMs;
            if (total > 0) {
                progress = (int)(((now - prevMs) * 100L) / total);
                if (progress < 0) progress = 0;
                if (progress > 100) progress = 100;
            }

            return new PrayerState(
                prevName, prevEmoji, prevMs,
                nextName, nextEmoji, nextMs,
                formatTime12(new Date(nextMs)),
                progress
            );

        } catch (Exception e) {
            return null;
        }
    }

    // ── Hijri date (API 24+ via android.icu) ─────────────────────────────────
    private String getHijriDate() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N) return "";
        try {
            android.icu.util.IslamicCalendar cal = new android.icu.util.IslamicCalendar();
            int day      = cal.get(android.icu.util.Calendar.DATE);
            int monthIdx = cal.get(android.icu.util.Calendar.MONTH);        // 0-based
            int year     = cal.get(android.icu.util.Calendar.YEAR);
            int dowIdx   = cal.get(android.icu.util.Calendar.DAY_OF_WEEK) - 1; // SUNDAY=1 → index 0
            String dayName   = (dowIdx >= 0 && dowIdx < HIJRI_DAYS.length)
                               ? HIJRI_DAYS[dowIdx] : "";
            String monthName = (monthIdx >= 0 && monthIdx < HIJRI_MONTHS.length)
                               ? HIJRI_MONTHS[monthIdx] : "";
            return dayName + "، " + day + " " + monthName + " " + year + " هـ";
        } catch (Exception e) {
            return "";
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
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

    // ── Foreground notification ───────────────────────────────────────────────
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel ch = new NotificationChannel(
                CHANNEL_ID, "نُور — عداد الصلاة", NotificationManager.IMPORTANCE_MIN);
            ch.setDescription("يُبقي عداد الصلاة القادمة يعمل في الخلفية");
            ch.setShowBadge(false);
            ch.setLockscreenVisibility(Notification.VISIBILITY_SECRET);
            ch.setSound(null, null);
            ch.enableVibration(false);
            ch.enableLights(false);
            getSystemService(NotificationManager.class).createNotificationChannel(ch);
        }
    }

    private Notification buildNotification(String title, String content) {
        Intent open = new Intent(this, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        PendingIntent pi = PendingIntent.getActivity(
            this, 1, open, PendingIntent.FLAG_IMMUTABLE);
        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(content)
            .setSmallIcon(R.drawable.ic_stat_noor)
            .setLargeIcon(BitmapFactory.decodeResource(getResources(), R.mipmap.ic_launcher))
            .setContentIntent(pi)
            .setPriority(NotificationCompat.PRIORITY_MIN)
            .setSilent(true)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .build();
    }

    // ── Static start helper ───────────────────────────────────────────────────
    public static void start(Context context) {
        Intent intent = new Intent(context, PrayerWidgetService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(intent);
        } else {
            context.startService(intent);
        }
    }

    // ── Data model ────────────────────────────────────────────────────────────
    private static class PrayerState {
        final String prevName, prevEmoji;
        final long   prevTimeMs;
        final String nextName, nextEmoji;
        final long   nextTimeMs;
        final String nextFormattedTime;
        final int    progress;

        PrayerState(String prevName, String prevEmoji, long prevTimeMs,
                    String nextName, String nextEmoji, long nextTimeMs,
                    String nextFormattedTime, int progress) {
            this.prevName          = prevName;
            this.prevEmoji         = prevEmoji;
            this.prevTimeMs        = prevTimeMs;
            this.nextName          = nextName;
            this.nextEmoji         = nextEmoji;
            this.nextTimeMs        = nextTimeMs;
            this.nextFormattedTime = nextFormattedTime;
            this.progress          = progress;
        }
    }
}
