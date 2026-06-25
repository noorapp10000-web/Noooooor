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

public class PrayerWidgetService extends Service {

    public static final String PREFS_NAME       = "NoorWidget";
    public static final String KEY_LAT          = "lat";
    public static final String KEY_LNG          = "lng";
    public static final String KEY_THEME        = "theme";
    public static final String KEY_WIDGET_THEME = "widgetTheme";
    public static final String KEY_CITY         = "cityName";
    public static final String KEY_USERNAME     = "username";
    public static final String KEY_HIJRI_DATE   = "hijriDate";

    private static final String CHANNEL_ID = "noor_widget_ch";
    private static final int    NOTIF_ID   = 9001;

    private static final String[] PRAYER_NAMES = {
        "الفجر", "الظهر", "العصر", "المغرب", "العشاء"
    };

    private static final int[] PRAYER_ICONS = {
        R.drawable.ic_prayer_fajr,
        R.drawable.ic_prayer_dhuhr,
        R.drawable.ic_prayer_asr,
        R.drawable.ic_prayer_maghrib,
        R.drawable.ic_prayer_isha
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
        } else {
            // Called again (e.g. theme toggle) — refresh immediately
            performUpdate();
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
        float  lat      = prefs.getFloat(KEY_LAT, Float.MIN_VALUE);
        float  lng      = prefs.getFloat(KEY_LNG, Float.MIN_VALUE);
        String city       = prefs.getString(KEY_CITY, "");
        String username   = prefs.getString(KEY_USERNAME, "");
        boolean isDark    = !"light".equals(prefs.getString(KEY_WIDGET_THEME, "dark"));

        // Use hijri date sent from JS (respects user's hijri adjustment).
        // Falls back to native calculation only if JS hasn't sent one yet.
        String storedHijri = prefs.getString(KEY_HIJRI_DATE, "");
        String hijri = !storedHijri.isEmpty() ? storedHijri : getHijriDate();
        int dayPct   = getDayPercent();
        PrayerState state = (lat != Float.MIN_VALUE) ? getPrayerState(lat, lng) : null;

        Intent openApp = new Intent(this, MainActivity.class);
        openApp.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent openPi = PendingIntent.getActivity(
            this, 0, openApp,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        Intent toggleIntent = new Intent(this, PrayerWidget.class);
        toggleIntent.setAction(PrayerWidget.ACTION_TOGGLE_THEME);
        PendingIntent togglePi = PendingIntent.getBroadcast(
            this, 2, toggleIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

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

            // ── Theme-aware backgrounds ────────────────────────────────────
            rv.setInt(R.id.wg_root, "setBackgroundResource",
                isDark ? R.drawable.widget_bg : R.drawable.widget_bg_light);

            if (layoutId != R.layout.widget_prayer_small) {
                rv.setInt(R.id.wg_main_card, "setBackgroundResource",
                    isDark ? R.drawable.widget_card_bg : R.drawable.widget_card_bg_light);
            }

            // Number boxes
            int numBg = isDark ? R.drawable.widget_number_bg : R.drawable.widget_number_bg_light;
            rv.setInt(R.id.wg_hours,   "setBackgroundResource", numBg);
            rv.setInt(R.id.wg_minutes, "setBackgroundResource", numBg);
            rv.setInt(R.id.wg_seconds, "setBackgroundResource", numBg);

            // Theme toggle icon
            rv.setImageViewResource(R.id.wg_theme_toggle,
                isDark ? R.drawable.ic_widget_theme_dark : R.drawable.ic_widget_theme_light);
            rv.setOnClickPendingIntent(R.id.wg_theme_toggle, togglePi);

            // Text colors based on theme
            int textPrimary = isDark ? 0xFFFFFFFF : 0xFF1A1A1A;
            int textMuted   = isDark ? 0xAAFFFFFF : 0xFF5A4A30;
            rv.setTextColor(R.id.wg_prayer_name, textPrimary);
            rv.setTextColor(R.id.wg_hours,       textPrimary);
            rv.setTextColor(R.id.wg_minutes,     textPrimary);
            rv.setTextColor(R.id.wg_seconds,     textPrimary);
            rv.setTextColor(R.id.wg_adhan_time,  isDark ? 0xCCFFFFFF : 0xFF3D2B0F);

            // ── Username & city ────────────────────────────────────────────
            String cityText = (city != null && !city.isEmpty()) ? city : "";
            rv.setTextViewText(R.id.wg_city, cityText);
            if (!username.isEmpty()) {
                rv.setTextViewText(R.id.wg_username, username);
            }

            // ── Hijri date & day % ─────────────────────────────────────────
            rv.setTextViewText(R.id.wg_hijri_date, hijri);
            rv.setTextViewText(R.id.wg_day_pct, dayPct + "%");

            if (state != null) {
                long remaining = state.nextTimeMs - System.currentTimeMillis();
                if (remaining < 0) remaining = 0;

                int h = (int)(remaining / 3_600_000L);
                int m = (int)((remaining % 3_600_000L) / 60_000L);
                int s = (int)((remaining % 60_000L) / 1_000L);

                // Prayer name (no emoji — use icon separately)
                rv.setTextViewText(R.id.wg_prayer_name, state.nextName);
                rv.setTextViewText(R.id.wg_hours,   pad2(h));
                rv.setTextViewText(R.id.wg_minutes, pad2(m));
                rv.setTextViewText(R.id.wg_seconds, pad2(s));
                rv.setTextViewText(R.id.wg_adhan_time, "وقت الأذان " + state.nextFormattedTime);

                // Next prayer icon in main card
                if (state.nextIdx >= 0 && state.nextIdx < PRAYER_ICONS.length) {
                    rv.setImageViewResource(R.id.wg_prayer_name_icon, PRAYER_ICONS[state.nextIdx]);
                }

                // Current prayer in header (the prev = current active prayer)
                rv.setTextViewText(R.id.wg_current_prayer, "الصلاة الحالية: " + state.prevName);

                // Progress
                rv.setProgressBar(R.id.wg_progress, 100, state.progress, false);

                // Remaining time text
                String remainText = "متبقي " + h + " ساعة و " + m + " دقيقة";
                rv.setTextViewText(R.id.wg_remaining_text, remainText);

                // Large + medium: extra labels and prayer row
                if (layoutId == R.layout.widget_prayer || layoutId == R.layout.widget_prayer_medium) {
                    rv.setTextViewText(R.id.wg_prev_prayer, state.prevName);
                    rv.setTextViewText(R.id.wg_next_prayer, state.nextName);
                    rv.setTextViewText(R.id.wg_progress_pct,
                        state.progress + "% من الوقت بين " + state.prevName + " و" + state.nextName);

                    // Prayer times
                    rv.setTextViewText(R.id.wg_fajr_time,    state.allTimes[0]);
                    rv.setTextViewText(R.id.wg_dhuhr_time,   state.allTimes[1]);
                    rv.setTextViewText(R.id.wg_asr_time,     state.allTimes[2]);
                    rv.setTextViewText(R.id.wg_maghrib_time, state.allTimes[3]);
                    rv.setTextViewText(R.id.wg_isha_time,    state.allTimes[4]);

                    // Prayer icons (vector drawables)
                    rv.setImageViewResource(R.id.wg_fajr_icon,    R.drawable.ic_prayer_fajr);
                    rv.setImageViewResource(R.id.wg_dhuhr_icon,   R.drawable.ic_prayer_dhuhr);
                    rv.setImageViewResource(R.id.wg_asr_icon,     R.drawable.ic_prayer_asr);
                    rv.setImageViewResource(R.id.wg_maghrib_icon, R.drawable.ic_prayer_maghrib);
                    rv.setImageViewResource(R.id.wg_isha_icon,    R.drawable.ic_prayer_isha);

                    // Reset all prayer box backgrounds
                    int normalCell = isDark
                        ? R.drawable.widget_prayer_cell_bg
                        : R.drawable.widget_prayer_cell_bg_light;
                    int activeCell = isDark
                        ? R.drawable.widget_prayer_cell_active_bg
                        : R.drawable.widget_prayer_cell_active_bg_light;

                    // boxIds maps prayer index (0=fajr,1=dhuhr,2=asr,3=maghrib,4=isha) → box view ID
                    int[] boxIds = {
                        R.id.wg_fajr_box, R.id.wg_dhuhr_box, R.id.wg_asr_box,
                        R.id.wg_maghrib_box, R.id.wg_isha_box
                    };
                    for (int id : boxIds) {
                        rv.setInt(id, "setBackgroundResource", normalCell);
                    }
                    if (state.nextIdx >= 0 && state.nextIdx < boxIds.length) {
                        rv.setInt(boxIds[state.nextIdx], "setBackgroundResource", activeCell);
                    }
                }

                // Notification
                String cd = pad2(h) + ":" + pad2(m) + ":" + pad2(s);
                getSystemService(NotificationManager.class)
                    .notify(NOTIF_ID, buildNotification(state.nextName, cd));

            } else {
                rv.setTextViewText(R.id.wg_prayer_name, "افتح التطبيق");
                rv.setTextViewText(R.id.wg_hours,   "--");
                rv.setTextViewText(R.id.wg_minutes, "--");
                rv.setTextViewText(R.id.wg_seconds, "--");
            }

            rv.setOnClickPendingIntent(R.id.wg_root, openPi);
            awm.updateAppWidget(widgetId, rv);
        }
    }

    // ── Prayer state ─────────────────────────────────────────────────────────
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

            String[] allTimes = new String[5];
            for (int i = 0; i < 5; i++) {
                allTimes[i] = formatTime12(new Date(times[i]));
            }

            int nextIdx = -1;
            for (int i = 0; i < times.length; i++) {
                if (times[i] > now) { nextIdx = i; break; }
            }

            long nextMs, prevMs;
            String nextName, prevName;
            int resolvedNextIdx;

            if (nextIdx >= 0) {
                resolvedNextIdx = nextIdx;
                nextMs   = times[nextIdx];
                nextName = PRAYER_NAMES[nextIdx];

                if (nextIdx > 0) {
                    prevMs   = times[nextIdx - 1];
                    prevName = PRAYER_NAMES[nextIdx - 1];
                } else {
                    Calendar yesterday = Calendar.getInstance();
                    yesterday.add(Calendar.DAY_OF_YEAR, -1);
                    PrayerTimes ptY = new PrayerTimes(coords,
                        DateComponents.from(yesterday.getTime()), params);
                    prevMs   = ptY.isha.getTime();
                    prevName = PRAYER_NAMES[4];
                }
            } else {
                resolvedNextIdx = 0;
                prevMs   = times[4];
                prevName = PRAYER_NAMES[4];

                Calendar tomorrow = Calendar.getInstance();
                tomorrow.add(Calendar.DAY_OF_YEAR, 1);
                PrayerTimes ptT = new PrayerTimes(coords,
                    DateComponents.from(tomorrow.getTime()), params);
                nextMs   = ptT.fajr.getTime();
                nextName = PRAYER_NAMES[0];
            }

            int progress = 0;
            long total = nextMs - prevMs;
            if (total > 0) {
                progress = (int)(((now - prevMs) * 100L) / total);
                if (progress < 0)   progress = 0;
                if (progress > 100) progress = 100;
            }

            return new PrayerState(
                prevName, prevMs,
                nextName, nextMs,
                formatTime12(new Date(nextMs)),
                progress, resolvedNextIdx, allTimes
            );

        } catch (Exception e) {
            return null;
        }
    }

    // ── Hijri date (short format: DD Month YYYY هـ) ───────────────────────────
    private String getHijriDate() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N) return "";
        try {
            android.icu.util.IslamicCalendar cal = new android.icu.util.IslamicCalendar();
            int day      = cal.get(android.icu.util.Calendar.DATE);
            int monthIdx = cal.get(android.icu.util.Calendar.MONTH);
            int year     = cal.get(android.icu.util.Calendar.YEAR);
            String monthName = (monthIdx >= 0 && monthIdx < HIJRI_MONTHS.length)
                               ? HIJRI_MONTHS[monthIdx] : "";
            return day + " " + monthName + " " + year + " هـ";
        } catch (Exception e) {
            return "";
        }
    }

    // ── Day progress (% of 24 hours elapsed since midnight) ──────────────────
    private int getDayPercent() {
        Calendar cal = Calendar.getInstance();
        int h = cal.get(Calendar.HOUR_OF_DAY);
        int m = cal.get(Calendar.MINUTE);
        int s = cal.get(Calendar.SECOND);
        return (int)(((h * 3600L + m * 60 + s) * 100) / 86400);
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
        final String   prevName;
        final long     prevTimeMs;
        final String   nextName;
        final long     nextTimeMs;
        final String   nextFormattedTime;
        final int      progress;
        final int      nextIdx;
        final String[] allTimes;

        PrayerState(String prevName, long prevTimeMs,
                    String nextName, long nextTimeMs,
                    String nextFormattedTime, int progress, int nextIdx, String[] allTimes) {
            this.prevName          = prevName;
            this.prevTimeMs        = prevTimeMs;
            this.nextName          = nextName;
            this.nextTimeMs        = nextTimeMs;
            this.nextFormattedTime = nextFormattedTime;
            this.progress          = progress;
            this.nextIdx           = nextIdx;
            this.allTimes          = allTimes;
        }
    }
}
