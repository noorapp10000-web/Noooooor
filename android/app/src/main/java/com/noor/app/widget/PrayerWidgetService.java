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
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.util.TypedValue;
import android.view.View;
import android.widget.RemoteViews;

import androidx.annotation.RequiresApi;
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

    public static final String ACTION_SIMULATE_DAY = "com.noor.app.widget.ACTION_SIMULATE_DAY";

    /* وضع "معاينة اليوم كامل": يعرض شكل الويدجت من ١٢ص لـ ١١:٥٩م خلال دقيقتين فقط */
    private static final long SIM_DURATION_MS = 120_000L;      // مدة المعاينة الحقيقية
    private static final long SIM_DAY_MS      = 24 * 60 * 60_000L; // يوم كامل (٢٤ ساعة) بالميلي ثانية
    private static final long SIM_TICK_MS     = 200L;          // معدل تحديث الإطارات أثناء المعاينة

    private volatile boolean simulating       = false;
    private long             simStartRealMs   = 0L;
    private long             simDayStartMs    = 0L;

    private final Runnable simTickRunnable = new Runnable() {
        @Override public void run() {
            if (!simulating) return;
            long elapsed = System.currentTimeMillis() - simStartRealMs;
            if (elapsed >= SIM_DURATION_MS) {
                simulating = false;
                lastFullUpdateMs = 0L;
                performUpdate();
                handler.post(tickRunnable);
                return;
            }
            long simNow = simDayStartMs + (elapsed * SIM_DAY_MS) / SIM_DURATION_MS;
            performUpdate(simNow);
            handler.postDelayed(this, SIM_TICK_MS);
        }
    };

    private void startDaySimulation() {
        handler.removeCallbacks(tickRunnable);
        handler.removeCallbacks(simTickRunnable);
        simulating     = true;
        simStartRealMs = System.currentTimeMillis();
        Calendar midnight = Calendar.getInstance();
        midnight.set(Calendar.HOUR_OF_DAY, 0);
        midnight.set(Calendar.MINUTE, 0);
        midnight.set(Calendar.SECOND, 0);
        midnight.set(Calendar.MILLISECOND, 0);
        simDayStartMs = midnight.getTimeInMillis();
        handler.post(simTickRunnable);
    }

    public static final String PREFS_NAME       = "NoorWidget";
    public static final String KEY_LAT          = "lat";
    public static final String KEY_LNG          = "lng";
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

    private int  tickCount        = 0;
    private long lastFullUpdateMs = 0L;
    /* تحديث كامل (بما فيه رسم السماء) كل 15 ثانية فقط — العدّاد نفسه يتحدّث كل ثانية بدون
       إعادة رسم السماء أو حساب أوقات الصلاة من جديد، لتقليل استهلاك المعالج والبطارية. */
    private static final long FULL_UPDATE_INTERVAL_MS = 15_000L;

    private final Runnable tickRunnable = new Runnable() {
        @Override public void run() {
            if (isScreenOn) {
                long now = System.currentTimeMillis();
                if (now - lastFullUpdateMs >= FULL_UPDATE_INTERVAL_MS) {
                    lastFullUpdateMs = now;
                    performUpdate();
                } else {
                    performLightTick();
                }
            }
            tickCount++;
            // كل 20 ثانية نجدد الـ alarm الاحتياطي — يضمن وجود alarm حتى لو اتقتلنا
            if (tickCount % 20 == 0) {
                WidgetRefreshReceiver.schedule(PrayerWidgetService.this);
            }
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
        boolean simulateRequested = intent != null && ACTION_SIMULATE_DAY.equals(intent.getAction());

        if (!isRunning) {
            isRunning = true;
            startForeground(NOTIF_ID, buildNotification("نُور", "عداد الصلاة يعمل في الخلفية"));
            if (simulateRequested) {
                startDaySimulation();
            } else {
                handler.post(tickRunnable);
            }
        } else if (simulateRequested) {
            startDaySimulation();
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

    /*
     * أندرويد 14+ (API 34) يفرض حدّاً زمنياً (~6 ساعات) على خدمات foreground من نوع
     * dataSync، وبعده يستدعي onTimeout() بدل ما يقتل الخدمة فجأة بدون تنبيه.
     * لو ما تعاملناش مع الحدث ده، الويدجت هيتوقف عن التحديث بصمت لحد ما المستخدم
     * يفتح التطبيق تاني. هنا بنوقف الخدمة بأمان ونسيب WidgetRefreshReceiver (الـ
     * AlarmManager الاحتياطي) يعيد تشغيلها تلقائياً خلال 30 ثانية.
     */
    @RequiresApi(Build.VERSION_CODES.UPSIDE_DOWN_CAKE)
    public void onTimeout(int startId, int fgsType) {
        WidgetRefreshReceiver.schedule(this);
        stopSelf();
    }

    @Override public IBinder onBind(Intent i) { return null; }

    /** آخر حالة صلاة محسوبة — تُستخدم في التحديث الخفيف كل ثانية بدون إعادة حساب. */
    private volatile PrayerState cachedState = null;

    /**
     * تحديث خفيف يعمل كل ثانية: يحدّث العدّاد فقط (ساعات/دقائق/ثواني) بدون إعادة رسم
     * السماء أو إعادة حساب أوقات الصلاة — يوفّر المعالج والبطارية بشكل كبير.
     * لو الوقت المتبقي خلص (وصلنا لصلاة جديدة)، نعمل تحديث كامل فوراً.
     */
    private void performLightTick() {
        AppWidgetManager awm = AppWidgetManager.getInstance(this);
        int[] ids = awm.getAppWidgetIds(new ComponentName(this, PrayerWidget.class));
        if (ids.length == 0) { stopSelf(); return; }

        PrayerState state = cachedState;
        if (state == null) { performUpdate(); return; }

        long remaining = state.nextTimeMs - System.currentTimeMillis();
        if (remaining <= 0) {
            // الصلاة القادمة بقت هي الحالية — نحتاج تحديث كامل عشان نحسب الصلاة الجديدة
            lastFullUpdateMs = 0L;
            performUpdate();
            return;
        }

        int h = (int)(remaining / 3_600_000L);
        int m = (int)((remaining % 3_600_000L) / 60_000L);
        int s = (int)((remaining % 60_000L) / 1_000L);
        String cd = pad2(h) + ":" + pad2(m) + ":" + pad2(s);

        try {
            for (int widgetId : ids) {
                RemoteViews rv = new RemoteViews(getPackageName(), R.layout.widget_unified);
                rv.setTextViewText(R.id.wg_hours,   pad2(h));
                rv.setTextViewText(R.id.wg_minutes, pad2(m));
                rv.setTextViewText(R.id.wg_seconds, pad2(s));
                awm.partiallyUpdateAppWidget(widgetId, rv);
            }
            getSystemService(NotificationManager.class)
                .notify(NOTIF_ID, buildNotification(state.nextName, cd));
        } catch (Exception ignored) {}
    }

    private void performUpdate() {
        performUpdate(0L);
    }

    /**
     * @param simNowMs لو أكبر من صفر، بيتم استخدامه كوقت "مُحاكى" بدل الوقت الحقيقي —
     *                 يُستخدم في وضع "معاينة اليوم كامل" فقط.
     */
    private void performUpdate(long simNowMs) {
        boolean isSim = simNowMs > 0L;
        long    now   = isSim ? simNowMs : System.currentTimeMillis();

        if (!isSim) lastFullUpdateMs = now;

        AppWidgetManager awm = AppWidgetManager.getInstance(this);
        int[] ids = awm.getAppWidgetIds(new ComponentName(this, PrayerWidget.class));
        if (ids.length == 0) { stopSelf(); return; }

        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        float  lat      = prefs.getFloat(KEY_LAT, Float.MIN_VALUE);
        float  lng      = prefs.getFloat(KEY_LNG, Float.MIN_VALUE);
        String city     = prefs.getString(KEY_CITY, "");
        String username = prefs.getString(KEY_USERNAME, "");

        String storedHijri = prefs.getString(KEY_HIJRI_DATE, "");
        String hijri = !storedHijri.isEmpty() ? storedHijri : getHijriDate();
        int dayPct   = isSim
            ? (int)(((now - simDayStartMs) * 100L) / SIM_DAY_MS)
            : getDayPercent();

        PrayerState state = (lat != Float.MIN_VALUE) ? getPrayerState(lat, lng, now) : null;
        if (!isSim) cachedState = state;

        if (state != null && !isSim) {
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

        float density = getResources().getDisplayMetrics().density;

        Intent openApp = new Intent(this, MainActivity.class);
        openApp.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent openPi = PendingIntent.getActivity(
            this, 0, openApp,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        for (int widgetId : ids) {
            try {
                Bundle options = awm.getAppWidgetOptions(widgetId);
                int minW = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH,  250);
                int minH = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT, 160);
                int tier = getSizeTier(minW, minH);

                RemoteViews rv = new RemoteViews(getPackageName(), R.layout.widget_unified);

                /* ── سماء حية: حسابات فلكية حقيقية بناءً على GPS ── */
                {
                    // أقصى دقة مرفوعة من 600×400 لتفادي التمديد الضبابي — بحد أقصى آمن
                    // بالنسبة لحجم رسائل الـ Binder بين الخدمة والويدجت (RemoteViews)
                    int bmpW = Math.min((int)(minW * density), 840);
                    int bmpH = Math.min((int)(minH * density), 560);
                    try {
                        long fajrMs    = state != null ? state.allTimesMs[0] : 0;
                        long sunriseMs = state != null ? state.allTimesMs[1] : 0;
                        long dhuhrMs   = state != null ? state.allTimesMs[2] : 0;
                        long asrMs     = state != null ? state.allTimesMs[3] : 0;
                        long maghribMs = state != null ? state.allTimesMs[4] : 0;
                        long ishaMs    = state != null ? state.allTimesMs[5] : 0;
                        Bitmap sky = SkyBitmapRenderer.render(
                            bmpW, bmpH,
                            lat != Float.MIN_VALUE ? lat : 0.0,
                            lng != Float.MIN_VALUE ? lng : 0.0,
                            fajrMs, sunriseMs, dhuhrMs,
                            asrMs,  maghribMs, ishaMs,
                            now
                        );
                        if (sky != null) rv.setImageViewBitmap(R.id.wg_sky_bg, sky);
                    } catch (Exception ignored) {}
                }

                applyVisibility(rv, tier);

                rv.setTextColor(R.id.wg_app_title, 0xFFFFFFFF);
                rv.setTextViewText(R.id.wg_city, city != null ? city : "");
                rv.setTextColor(R.id.wg_city, 0xCCFFFFFF);

                if (username != null && !username.isEmpty()) {
                    rv.setTextViewText(R.id.wg_username, username);
                }

                rv.setTextColor(R.id.wg_hours,   0xFFFFFFFF);
                rv.setTextColor(R.id.wg_minutes, 0xFFFFFFFF);
                rv.setTextColor(R.id.wg_seconds, 0xFFFFFFFF);
                rv.setInt(R.id.wg_hours,   "setBackgroundResource", R.drawable.widget_counter_box_dark);
                rv.setInt(R.id.wg_minutes, "setBackgroundResource", R.drawable.widget_counter_box_dark);
                rv.setInt(R.id.wg_seconds, "setBackgroundResource", R.drawable.widget_counter_box_dark);

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

                rv.setTextColor(R.id.wg_prayer_name, 0xFFFFFFFF);
                rv.setTextColor(R.id.wg_adhan_time,  0xCCFFFFFF);

                rv.setTextViewText(R.id.wg_hijri_date,        hijri);
                rv.setTextViewText(R.id.wg_hijri_date_bottom, hijri);
                rv.setTextViewText(R.id.wg_day_pct, dayPct + "%");
                rv.setTextColor(R.id.wg_hijri_date,        0xFFFFFFFF);
                rv.setTextColor(R.id.wg_hijri_date_bottom, 0xFFFFFFFF);
                rv.setTextColor(R.id.wg_day_pct,           0xFFFFFFFF);
                rv.setTextColor(R.id.wg_day_pct_label,     0xBBFFFFFF);
                rv.setTextColor(R.id.wg_hijri_label,       0xBBFFFFFF);

                if (tier == TIER_MEDIUM || tier == TIER_LARGE) {
                    rv.setTextColor(R.id.wg_hours_label,   0xFFC19A6B);
                    rv.setTextColor(R.id.wg_minutes_label, 0xFFC19A6B);
                    rv.setTextColor(R.id.wg_seconds_label, 0xFFC19A6B);
                    rv.setTextColor(R.id.wg_fajr_label,    0xBBFFFFFF);
                    rv.setTextColor(R.id.wg_asr_label,     0xBBFFFFFF);
                    rv.setTextColor(R.id.wg_dhuhr_label,   0xBBFFFFFF);
                    rv.setTextColor(R.id.wg_maghrib_label, 0xBBFFFFFF);
                    rv.setTextColor(R.id.wg_isha_label,    0xBBFFFFFF);
                }

                rv.setViewVisibility(R.id.wg_prayer_name_icon, View.GONE);
                rv.setViewVisibility(R.id.wg_fajr_icon,        View.GONE);
                rv.setViewVisibility(R.id.wg_asr_icon,         View.GONE);
                rv.setViewVisibility(R.id.wg_dhuhr_icon,       View.GONE);
                rv.setViewVisibility(R.id.wg_maghrib_icon,     View.GONE);
                rv.setViewVisibility(R.id.wg_isha_icon,        View.GONE);

                if (state != null) {
                    long remaining = state.nextTimeMs - now;
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

                        int[] boxIds = {
                            R.id.wg_fajr_box, R.id.wg_dhuhr_box, R.id.wg_asr_box,
                            R.id.wg_maghrib_box, R.id.wg_isha_box
                        };
                        for (int boxId : boxIds) {
                            rv.setInt(boxId, "setBackgroundResource", R.drawable.widget_prayer_cell_bg);
                        }
                        if (state.nextIdx >= 0 && state.nextIdx < boxIds.length) {
                            rv.setInt(boxIds[state.nextIdx], "setBackgroundResource",
                                R.drawable.widget_prayer_cell_active_bg);
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

    private void applyVisibility(RemoteViews rv, int tier) {
        boolean isMedium        = (tier == TIER_MEDIUM);
        boolean isLarge         = (tier == TIER_LARGE);
        boolean isMediumOrLarge = isMedium || isLarge;

        rv.setViewVisibility(R.id.wg_username,        isMediumOrLarge ? View.VISIBLE : View.GONE);
        rv.setViewVisibility(R.id.wg_current_prayer,  isMediumOrLarge ? View.VISIBLE : View.GONE);
        rv.setViewVisibility(R.id.wg_hijri_date,      isMedium        ? View.VISIBLE : View.GONE);

        if (isMediumOrLarge) {
            rv.setInt(R.id.wg_main_card, "setBackgroundResource", R.drawable.widget_card_bg);
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
        rv.setViewVisibility(R.id.wg_prayers_row,        isMediumOrLarge ? View.VISIBLE : View.GONE);
        rv.setViewVisibility(R.id.wg_bottom_bar,         isLarge ? View.VISIBLE : View.GONE);
        rv.setViewVisibility(R.id.wg_hijri_date_bottom,  isLarge ? View.VISIBLE : View.GONE);
        rv.setViewVisibility(R.id.wg_day_pct,            isLarge ? View.VISIBLE : View.GONE);
        rv.setViewVisibility(R.id.wg_day_pct_label,      isLarge ? View.VISIBLE : View.GONE);
        rv.setViewVisibility(R.id.wg_hijri_label,        isLarge ? View.VISIBLE : View.GONE);
    }

    private PrayerState getPrayerState(float lat, float lng, long now) {
        try {
            Coordinates coords = new Coordinates(lat, lng);
            CalculationParameters params = CalculationMethod.EGYPTIAN.getParameters();

            DateComponents dc = DateComponents.from(new Date(now));
            PrayerTimes pt = new PrayerTimes(coords, dc, params);

            /* أوقات الصلاة الخمس + الشروق */
            long fajrMs    = pt.fajr.getTime();
            long sunriseMs = pt.sunrise.getTime();
            long dhuhrMs   = pt.dhuhr.getTime();
            long asrMs     = pt.asr.getTime();
            long maghribMs = pt.maghrib.getTime();
            long ishaMs    = pt.isha.getTime();

            long[] times = { fajrMs, dhuhrMs, asrMs, maghribMs, ishaMs };
            long[] allTimesMs = { fajrMs, sunriseMs, dhuhrMs, asrMs, maghribMs, ishaMs };

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
                    yesterday.setTimeInMillis(now);
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
                tomorrow.setTimeInMillis(now);
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
                progress, resolvedNextIdx, allTimes, allTimesMs
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

    /** @deprecated استخدم WidgetRefreshReceiver.schedule() مباشرةً */
    public static void scheduleAlarmFallback(Context context) {
        WidgetRefreshReceiver.schedule(context);
    }

    static class PrayerState {
        final String   prevName;
        final long     prevTimeMs;
        final String   nextName;
        final long     nextTimeMs;
        final String   nextFormattedTime;
        final int      progress;
        final int      nextIdx;
        final String[] allTimes;
        final long[]   allTimesMs;

        PrayerState(String prevName, long prevTimeMs,
                    String nextName, long nextTimeMs,
                    String nextFormattedTime, int progress, int nextIdx,
                    String[] allTimes, long[] allTimesMs) {
            this.prevName          = prevName;
            this.prevTimeMs        = prevTimeMs;
            this.nextName          = nextName;
            this.nextTimeMs        = nextTimeMs;
            this.nextFormattedTime = nextFormattedTime;
            this.progress          = progress;
            this.nextIdx           = nextIdx;
            this.allTimes          = allTimes;
            this.allTimesMs        = allTimesMs;
        }
    }
}
