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
import android.graphics.Color;
import android.os.Build;
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

    public static final String PREFS_NAME = "NoorWidget";
    public static final String KEY_LAT    = "lat";
    public static final String KEY_LNG    = "lng";
    public static final String KEY_THEME  = "theme";

    private static final String CHANNEL_ID = "noor_widget_ch";
    private static final int    NOTIF_ID   = 9001;

    private static final String[] PRAYER_NAMES_AR = {
        "الفجر", "الظهر", "العصر", "المغرب", "العشاء"
    };

    private final Handler  handler     = new Handler(Looper.getMainLooper());
    private boolean        isScreenOn  = true;
    private boolean        isRunning   = false;

    private final Runnable tickRunnable = new Runnable() {
        @Override public void run() {
            if (isScreenOn) performUpdate();
            handler.postDelayed(this, 1000L);
        }
    };

    private final BroadcastReceiver screenReceiver = new BroadcastReceiver() {
        @Override public void onReceive(Context ctx, Intent intent) {
            String action = intent.getAction();
            if (Intent.ACTION_SCREEN_OFF.equals(action)) {
                isScreenOn = false;
            } else if (Intent.ACTION_SCREEN_ON.equals(action)) {
                isScreenOn = true;
                performUpdate();
            }
        }
    };

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
        IntentFilter filter = new IntentFilter();
        filter.addAction(Intent.ACTION_SCREEN_OFF);
        filter.addAction(Intent.ACTION_SCREEN_ON);
        registerReceiver(screenReceiver, filter);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (!isRunning) {
            isRunning = true;
            startForeground(NOTIF_ID, buildNotification("نُور", "عداد الصلاة يعمل"));
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

    private void performUpdate() {
        AppWidgetManager awm = AppWidgetManager.getInstance(this);
        int[] ids = awm.getAppWidgetIds(new ComponentName(this, PrayerWidget.class));
        if (ids.length == 0) { stopSelf(); return; }

        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        float lat   = prefs.getFloat(KEY_LAT, Float.MIN_VALUE);
        float lng   = prefs.getFloat(KEY_LNG, Float.MIN_VALUE);
        String theme = prefs.getString(KEY_THEME, "light");
        boolean isDark = "dark".equals(theme);

        RemoteViews rv = new RemoteViews(getPackageName(), R.layout.widget_prayer);

        // ── Apply theme colors ──────────────────────────────────────────────
        if (isDark) {
            rv.setInt(R.id.wg_root, "setBackgroundResource", R.drawable.widget_bg_dark);
            rv.setInt(R.id.wg_card, "setBackgroundResource", R.drawable.widget_card_bg_dark);
            rv.setInt(R.id.wg_hours,   "setBackgroundResource", R.drawable.widget_number_bg_dark);
            rv.setInt(R.id.wg_minutes, "setBackgroundResource", R.drawable.widget_number_bg_dark);
            rv.setInt(R.id.wg_seconds, "setBackgroundResource", R.drawable.widget_number_bg_dark);
            rv.setTextColor(R.id.wg_prayer_name, Color.parseColor("#F5E6CC"));
            rv.setTextColor(R.id.wg_hours,       Color.parseColor("#F5E6CC"));
            rv.setTextColor(R.id.wg_minutes,     Color.parseColor("#F5E6CC"));
            rv.setTextColor(R.id.wg_seconds,     Color.parseColor("#F5E6CC"));
        } else {
            rv.setInt(R.id.wg_root, "setBackgroundResource", R.drawable.widget_bg);
            rv.setInt(R.id.wg_card, "setBackgroundResource", R.drawable.widget_card_bg);
            rv.setInt(R.id.wg_hours,   "setBackgroundResource", R.drawable.widget_number_bg);
            rv.setInt(R.id.wg_minutes, "setBackgroundResource", R.drawable.widget_number_bg);
            rv.setInt(R.id.wg_seconds, "setBackgroundResource", R.drawable.widget_number_bg);
            rv.setTextColor(R.id.wg_prayer_name, Color.WHITE);
            rv.setTextColor(R.id.wg_hours,       Color.WHITE);
            rv.setTextColor(R.id.wg_minutes,     Color.WHITE);
            rv.setTextColor(R.id.wg_seconds,     Color.WHITE);
        }

        if (lat == Float.MIN_VALUE) {
            setNoData(rv);
        } else {
            PrayerInfo next = getNextPrayer(lat, lng);
            if (next == null) {
                setNoData(rv);
            } else {
                long remaining = next.timeMs - System.currentTimeMillis();
                if (remaining < 0) remaining = 0;

                int h = (int) (remaining / 3_600_000L);
                int m = (int) ((remaining % 3_600_000L) / 60_000L);
                int s = (int) ((remaining % 60_000L) / 1_000L);

                rv.setTextViewText(R.id.wg_prayer_name, next.name);
                rv.setTextViewText(R.id.wg_hours,        pad2(h));
                rv.setTextViewText(R.id.wg_minutes,      pad2(m));
                rv.setTextViewText(R.id.wg_seconds,      pad2(s));
                rv.setTextViewText(R.id.wg_prayer_time,  next.formattedTime);

                String cd = pad2(h) + ":" + pad2(m) + ":" + pad2(s);
                getSystemService(NotificationManager.class)
                    .notify(NOTIF_ID, buildNotification(next.name, cd));
            }
        }

        Intent open = new Intent(this, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pi = PendingIntent.getActivity(
            this, 0, open,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        rv.setOnClickPendingIntent(R.id.wg_root, pi);

        awm.updateAppWidget(ids, rv);
    }

    private void setNoData(RemoteViews rv) {
        rv.setTextViewText(R.id.wg_prayer_name, "افتح التطبيق");
        rv.setTextViewText(R.id.wg_hours,   "--");
        rv.setTextViewText(R.id.wg_minutes, "--");
        rv.setTextViewText(R.id.wg_seconds, "--");
        rv.setTextViewText(R.id.wg_prayer_time, "");
    }

    private PrayerInfo getNextPrayer(float lat, float lng) {
        try {
            Coordinates coords = new Coordinates(lat, lng);
            CalculationParameters params = CalculationMethod.EGYPTIAN.getParameters();
            long now = System.currentTimeMillis();

            DateComponents dc = DateComponents.from(new Date());
            PrayerTimes pt = new PrayerTimes(coords, dc, params);
            Date[] times = { pt.fajr, pt.dhuhr, pt.asr, pt.maghrib, pt.isha };

            for (int i = 0; i < times.length; i++) {
                if (times[i].getTime() > now) {
                    return new PrayerInfo(PRAYER_NAMES_AR[i],
                        times[i].getTime(), formatTime12(times[i]));
                }
            }

            Calendar tomorrow = Calendar.getInstance();
            tomorrow.add(Calendar.DAY_OF_YEAR, 1);
            DateComponents dcT = DateComponents.from(tomorrow.getTime());
            PrayerTimes ptT = new PrayerTimes(coords, dcT, params);
            return new PrayerInfo(PRAYER_NAMES_AR[0],
                ptT.fajr.getTime(), formatTime12(ptT.fajr));

        } catch (Exception e) {
            return null;
        }
    }

    private String formatTime12(Date date) {
        Calendar c = Calendar.getInstance();
        c.setTime(date);
        int hour = c.get(Calendar.HOUR);
        if (hour == 0) hour = 12;
        int min = c.get(Calendar.MINUTE);
        String amPm = c.get(Calendar.AM_PM) == Calendar.AM ? "ص" : "م";
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
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(intent);
        } else {
            context.startService(intent);
        }
    }

    private static class PrayerInfo {
        final String name;
        final long   timeMs;
        final String formattedTime;
        PrayerInfo(String name, long timeMs, String formattedTime) {
            this.name          = name;
            this.timeMs        = timeMs;
            this.formattedTime = formattedTime;
        }
    }
}
