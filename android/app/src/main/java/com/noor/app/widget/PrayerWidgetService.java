package com.noor.app.widget;

import android.app.AlarmManager;
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
import android.util.TypedValue;
import android.view.View;
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

    public static final String KEY_CACHE_FAJR    = "c_fajr";
    public static final String KEY_CACHE_DHUHR   = "c_dhuhr";
    public static final String KEY_CACHE_ASR     = "c_asr";
    public static final String KEY_CACHE_MAGHRIB = "c_maghrib";
    public static final String KEY_CACHE_ISHA    = "c_isha";
    public static final String KEY_CACHE_NEXT    = "c_next";
    public static final String KEY_CACHE_NEXT_T  = "c_next_t";
    public static final String KEY_CACHE_PREV    = "c_prev";

    private static final String CHANNEL_ID = "noor_widget_ch";
    private static final int    NOTIF_ID   = 9001;

    private static final int TIER_SMALL  = 0;
    private static final int TIER_MEDIUM = 1;
    private static final int TIER_LARGE  = 2;

    private static final String[] PRAYER_NAMES = {
        "الفجر", "الظهر", "العصر", "المغرب", "العشاء"
    };

    private static final String[] HIJRI_MONTHS = {
        "محرم", "صفر", "ربيع الأول", "ربيع الآخر",
        "جمادى الأولى", "جمادى الآخرة", "رجب", "شعبان",
        "رمضان", "شوال", "ذو القعدة", "ذو الحجة"
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

    private void performUpdate() {
        AppWidgetManager awm = AppWidgetManager.getInstance(this);
        int[] ids = awm.getAppWidgetIds(new ComponentName(this, PrayerWidget.class));
        if (ids.length == 0) { stopSelf(); return; }

        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        float  lat      = prefs.getFloat(KEY_LAT, Float.MIN_VALUE);
        float  lng      = prefs.getFloat(KEY_LNG, Float.MIN_VALUE);
        String city     = prefs.getString(KEY_CITY, "");
        String username = prefs.getString(KEY_USERNAME, "");
        boolean isDark  = !"light".equals(prefs.getString(KEY_WIDGET_THEME, "dark"));

        String storedHijri = prefs.getString(KEY_HIJRI_DATE, "");
        String hijri = !storedHijri.isEmpty() ? storedHijri : getHijriDate();
        int dayPct   = getDayPercent();

        PrayerState state = (lat != Float.MIN_VALUE) ? getPrayerState(lat, lng) : null;

        if (state != null) {
            String prevCached = prefs.getString(KEY_CACHE_NEXT, "");
            if (!state.nextName.equals(prevCached)) {
                prefs.edit()
                    .putString(KEY_CACHE_FAJR,    state.allTimes[0])
                    .putString(KEY_CACHE_DHUHR,   state.allTimes[1])
                    .putString(KEY_CACHE_ASR,     state.allTimes[2])
                    .putString(KEY_CACHE_MAGHRIB, state.allTimes[3])
                    .putString(KEY_CACHE_ISHA,    state.allTimes[4])
                    .putString(KEY_CACHE_NEXT,    state.nextName)
                    .putString(KEY_CACHE_NEXT_T,  state.nextFormattedTime)
                    .putString(KEY_CACHE_PREV,    state.prevName)
                    .apply();
            }
        }

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
            try {
                Bundle options = awm.getAppWidgetOptions(widgetId);
                int minW = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH,  250);
                int minH = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT, 160);

                int tier = getSizeTier(minW, minH);

                RemoteViews rv = new RemoteViews(getPackageName(), R.layout.widget_unified);

                applyVisibility(rv, tier, isDark);

                int textPrimary   = isDark ? 0xFFFFFFFF : 0xFF1A1A1A;
                int textSecondary = isDark ? 0xCCFFFFFF : 0xFF3D2B0F;
                int textMuted     = isDark ? 0xAAFFFFFF : 0xFF5A4A30;
                int textSubtle    = isDark ? 0x55FFFFFF : 0xFF8A7060;

                rv.setInt(R.id.wg_root, "setBackgroundResource",
                    isDark ? R.drawable.widget_bg : R.drawable.widget_bg_light);

                // Theme toggle is now a TextView — show sun/moon glyph
                rv.setTextViewText(R.id.wg_theme_toggle, isDark ? "◑" : "☀");
                rv.setTextColor(R.id.wg_theme_toggle, isDark ? 0xFFFFFFFF : 0xFF7A5C2E);
                rv.setInt(R.id.wg_theme_toggle, "setBackgroundResource",
                    isDark ? R.drawable.widget_theme_btn_bg_dark : R.drawable.widget_theme_btn_bg_light);
                rv.setOnClickPendingIntent(R.id.wg_theme_toggle, togglePi);

                rv.setTextColor(R.id.wg_app_title, textPrimary);

                rv.setTextViewText(R.id.wg_city, city != null ? city : "");
                rv.setTextColor(R.id.wg_city, textSecondary);

                if (username != null && !username.isEmpty()) {
                    rv.setTextViewText(R.id.wg_username, username);
                }

                rv.setTextColor(R.id.wg_hours,   textPrimary);
                rv.setTextColor(R.id.wg_minutes, textPrimary);
                rv.setTextColor(R.id.wg_seconds, textPrimary);

                // Counter box backgrounds: rounded corners via drawable
                int counterBoxRes = isDark ? R.drawable.widget_counter_box_dark
                                           : R.drawable.widget_counter_box_light;
                rv.setInt(R.id.wg_hours,   "setBackgroundResource", counterBoxRes);
                rv.setInt(R.id.wg_minutes, "setBackgroundResource", counterBoxRes);
                rv.setInt(R.id.wg_seconds, "setBackgroundResource", counterBoxRes);

                float counterSp, prayerNameSp, adhanSp;
                if (tier == TIER_LARGE) {
                    if (minH >= 400) {
                        counterSp = 30f; prayerNameSp = 28f; adhanSp = 11f;
                    } else if (minH >= 280) {
                        counterSp = 24f; prayerNameSp = 22f; adhanSp = 10f;
                    } else {
                        counterSp = 20f; prayerNameSp = 19f; adhanSp = 9f;
                    }
                } else if (tier == TIER_MEDIUM) {
                    counterSp = 17f; prayerNameSp = 17f; adhanSp = 8f;
                } else {
                    counterSp = 15f; prayerNameSp = 15f; adhanSp = 7.5f;
                }
                rv.setTextViewTextSize(R.id.wg_hours,       TypedValue.COMPLEX_UNIT_SP, counterSp);
                rv.setTextViewTextSize(R.id.wg_minutes,     TypedValue.COMPLEX_UNIT_SP, counterSp);
                rv.setTextViewTextSize(R.id.wg_seconds,     TypedValue.COMPLEX_UNIT_SP, counterSp);
                rv.setTextViewTextSize(R.id.wg_prayer_name, TypedValue.COMPLEX_UNIT_SP, prayerNameSp);
                rv.setTextViewTextSize(R.id.wg_adhan_time,  TypedValue.COMPLEX_UNIT_SP, adhanSp);

                rv.setTextColor(R.id.wg_prayer_name, textPrimary);
                rv.setTextColor(R.id.wg_adhan_time,  textSecondary);

                rv.setTextViewText(R.id.wg_hijri_date,        hijri);
                rv.setTextViewText(R.id.wg_hijri_date_bottom, hijri);

                rv.setTextViewText(R.id.wg_day_pct, dayPct + "%");
                rv.setTextColor(R.id.wg_day_pct,       textPrimary);
                rv.setTextColor(R.id.wg_day_pct_label, textSubtle);
                rv.setTextColor(R.id.wg_hijri_label,   textSubtle);

                if (tier == TIER_MEDIUM || tier == TIER_LARGE) {
                    rv.setTextColor(R.id.wg_hours_label,   0xFFC19A6B);
                    rv.setTextColor(R.id.wg_minutes_label, 0xFFC19A6B);
                    rv.setTextColor(R.id.wg_seconds_label, 0xFFC19A6B);

                    int cellLabelColor = isDark ? 0xBBFFFFFF : 0xFF4A3828;
                    rv.setTextColor(R.id.wg_fajr_label,    cellLabelColor);
                    rv.setTextColor(R.id.wg_asr_label,     cellLabelColor);
                    rv.setTextColor(R.id.wg_dhuhr_label,   cellLabelColor);
                    rv.setTextColor(R.id.wg_maghrib_label, cellLabelColor);
                    rv.setTextColor(R.id.wg_isha_label,    cellLabelColor);
                }

                // Always hide icon ImageViews — vector drawables crash RemoteViews on EMUI
                rv.setViewVisibility(R.id.wg_prayer_name_icon, View.GONE);
                rv.setViewVisibility(R.id.wg_fajr_icon,        View.GONE);
                rv.setViewVisibility(R.id.wg_asr_icon,         View.GONE);
                rv.setViewVisibility(R.id.wg_dhuhr_icon,       View.GONE);
                rv.setViewVisibility(R.id.wg_maghrib_icon,     View.GONE);
                rv.setViewVisibility(R.id.wg_isha_icon,        View.GONE);

                if (state != null) {
                    long remaining = state.nextTimeMs - System.currentTimeMillis();
                    if (remaining < 0) remaining = 0;

                    int h = (int)(remaining / 3_600_000L);
                    int m = (int)((remaining % 3_600_000L) / 60_000L);
                    int s = (int)((remaining % 60_000L) / 1_000L);

                    rv.setTextViewText(R.id.wg_prayer_name, state.nextName);
                    rv.setTextViewText(R.id.wg_hours,       pad2(h));
                    rv.setTextViewText(R.id.wg_minutes,     pad2(m));
                    rv.setTextViewText(R.id.wg_seconds,     pad2(s));
                    rv.setTextViewText(R.id.wg_adhan_time,  "وقت الأذان " + state.nextFormattedTime);
                    rv.setTextViewText(R.id.wg_current_prayer, "الصلاة الحالية: " + state.prevName);

                    if (tier == TIER_MEDIUM || tier == TIER_LARGE) {
                        rv.setTextViewText(R.id.wg_progress_pct,
                            state.progress + "% من الوقت بين " + state.prevName + " و" + state.nextName);
                        rv.setProgressBar(R.id.wg_progress_container, 100, state.progress, false);
                        rv.setTextViewText(R.id.wg_prev_prayer, state.prevName);
                        rv.setTextViewText(R.id.wg_next_prayer, state.nextName);
                        rv.setTextViewText(R.id.wg_remaining_text,
                            "متبقي " + h + " ساعة و " + m + " دقيقة");

                        rv.setTextViewText(R.id.wg_fajr_time,    state.allTimes[0]);
                        rv.setTextViewText(R.id.wg_dhuhr_time,   state.allTimes[1]);
                        rv.setTextViewText(R.id.wg_asr_time,     state.allTimes[2]);
                        rv.setTextViewText(R.id.wg_maghrib_time, state.allTimes[3]);
                        rv.setTextViewText(R.id.wg_isha_time,    state.allTimes[4]);

                        int normalCell = isDark ? R.drawable.widget_prayer_cell_bg
                                                : R.drawable.widget_prayer_cell_bg_light;
                        int activeCell = isDark ? R.drawable.widget_prayer_cell_active_bg
                                                : R.drawable.widget_prayer_cell_active_bg_light;

                        int[] boxIds = {
                            R.id.wg_fajr_box, R.id.wg_dhuhr_box, R.id.wg_asr_box,
                            R.id.wg_maghrib_box, R.id.wg_isha_box
                        };
                        for (int boxId : boxIds) {
                            rv.setInt(boxId, "setBackgroundResource", normalCell);
                        }
                        if (state.nextIdx >= 0 && state.nextIdx < boxIds.length) {
                            rv.setInt(boxIds[state.nextIdx], "setBackgroundResource", activeCell);
                        }
                    }

                    String cd = pad2(h) + ":" + pad2(m) + ":" + pad2(s);
                    getSystemService(NotificationManager.class)
                        .notify(NOTIF_ID, buildNotification(state.nextName, cd));

                } else {
                    rv.setTextViewText(R.id.wg_prayer_name, "افتح التطبيق");
                    rv.setTextViewText(R.id.wg_hours,   "--");
                    rv.setTextViewText(R.id.wg_minutes, "--");
                    rv.setTextViewText(R.id.wg_seconds, "--");
                    rv.setTextViewText(R.id.wg_adhan_time, "");
                }

                rv.setOnClickPendingIntent(R.id.wg_root, openPi);
                awm.updateAppWidget(widgetId, rv);

            } catch (Exception ignored) {}
        }
    }

    private int getSizeTier(int minW, int minH) {
        if (minW < 180 || minH < 110) return TIER_SMALL;
        if (minH < 160)               return TIER_MEDIUM;
        return TIER_LARGE;
    }

    private void applyVisibility(RemoteViews rv, int tier, boolean isDark) {
        boolean isMedium = (tier == TIER_MEDIUM);
        boolean isLarge  = (tier == TIER_LARGE);
        boolean isMediumOrLarge = isMedium || isLarge;

        rv.setViewVisibility(R.id.wg_username,        isMediumOrLarge ? View.VISIBLE : View.GONE);
        rv.setViewVisibility(R.id.wg_current_prayer,  isMediumOrLarge ? View.VISIBLE : View.GONE);
        rv.setViewVisibility(R.id.wg_hijri_date,      isMedium        ? View.VISIBLE : View.GONE);

        if (isMediumOrLarge) {
            rv.setInt(R.id.wg_main_card, "setBackgroundResource",
                isDark ? R.drawable.widget_card_bg : R.drawable.widget_card_bg_light);
        } else {
            rv.setInt(R.id.wg_main_card, "setBackgroundColor", 0x00000000);
        }

        rv.setViewVisibility(R.id.wg_next_prayer_label,  isMediumOrLarge ? View.VISIBLE : View.GONE);
        rv.setViewVisibility(R.id.wg_remaining_label,    isMediumOrLarge ? View.VISIBLE : View.GONE);
        rv.setViewVisibility(R.id.wg_hours_label,        isMediumOrLarge ? View.VISIBLE : View.GONE);
        rv.setViewVisibility(R.id.wg_minutes_label,      isMediumOrLarge ? View.VISIBLE : View.GONE);
        rv.setViewVisibility(R.id.wg_seconds_label,      isMediumOrLarge ? View.VISIBLE : View.GONE);
        rv.setViewVisibility(R.id.wg_progress_pct,       isMediumOrLarge ? View.VISIBLE : View.GONE);
        rv.setViewVisibility(R.id.wg_progress_container, isMediumOrLarge ? View.VISIBLE : View.GONE);
        rv.setViewVisibility(R.id.wg_remaining_text,     isLarge         ? View.VISIBLE : View.GONE);

        rv.setViewVisibility(R.id.wg_prayers_row, isMediumOrLarge ? View.VISIBLE : View.GONE);

        rv.setViewVisibility(R.id.wg_bottom_bar,        isLarge ? View.VISIBLE : View.GONE);
        rv.setViewVisibility(R.id.wg_hijri_date_bottom, isLarge ? View.VISIBLE : View.GONE);
        rv.setViewVisibility(R.id.wg_day_pct,           isLarge ? View.VISIBLE : View.GONE);
        rv.setViewVisibility(R.id.wg_day_pct_label,     isLarge ? View.VISIBLE : View.GONE);
        rv.setViewVisibility(R.id.wg_hijri_label,       isLarge ? View.VISIBLE : View.GONE);
    }

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

    private int getDayPercent() {
        Calendar cal = Calendar.getInstance();
        int h = cal.get(Calendar.HOUR_OF_DAY);
        int m = cal.get(Calendar.MINUTE);
        int s = cal.get(Calendar.SECOND);
        return (int)(((h * 3600L + m * 60 + s) * 100) / 86400);
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
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent);
            } else {
                context.startService(intent);
            }
        } catch (Exception e) {
            try { context.startService(intent); } catch (Exception ignored) {}
        }
    }

    /**
     * Schedule an AlarmManager repeating update as fallback for EMUI/Huawei devices
     * where startForegroundService is blocked by battery restrictions.
     * The alarm fires every 30 seconds via the widget's onUpdate broadcast.
     */
    public static void scheduleAlarmFallback(Context context) {
        try {
            AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            if (am == null) return;

            Intent intent = new Intent(context, PrayerWidget.class);
            intent.setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE);
            PendingIntent pi = PendingIntent.getBroadcast(
                context, 7777, intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

            long interval = 30_000L;
            long trigger  = System.currentTimeMillis() + interval;

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, trigger, pi);
            } else {
                am.setRepeating(AlarmManager.RTC_WAKEUP, trigger, interval, pi);
            }
        } catch (Exception ignored) {}
    }

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
