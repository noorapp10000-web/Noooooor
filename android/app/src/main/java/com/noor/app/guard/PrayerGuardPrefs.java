package com.noor.app.guard;

import android.content.Context;
import android.content.SharedPreferences;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class PrayerGuardPrefs {

    public static final String PREFS_NAME = "NoorGuard";

    private static final String KEY_ENABLED        = "guard_enabled";
    private static final String PREFIX_PRAYED      = "prayed_";
    private static final int    PRAYER_WINDOW_MINS = 30;

    public static final long PRAYER_WINDOW_MS = PRAYER_WINDOW_MINS * 60 * 1000L;

    public static SharedPreferences get(Context ctx) {
        return ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }

    public static boolean isEnabled(Context ctx) {
        return get(ctx).getBoolean(KEY_ENABLED, false);
    }

    public static void setEnabled(Context ctx, boolean enabled) {
        get(ctx).edit().putBoolean(KEY_ENABLED, enabled).apply();
    }

    public static String todayKey() {
        return new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());
    }

    public static boolean hasPrayed(Context ctx, String dateKey, String prayer) {
        return get(ctx).getBoolean(PREFIX_PRAYED + dateKey + "_" + prayer, false);
    }

    public static void setPrayed(Context ctx, String dateKey, String prayer, boolean prayed) {
        get(ctx).edit()
            .putBoolean(PREFIX_PRAYED + dateKey + "_" + prayer, prayed)
            .apply();
    }
}
