package com.noor.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.SystemClock;
import android.widget.RemoteViews;

public class PrayerWidgetProvider extends AppWidgetProvider {

    static final String PREFS_NAME        = "NoorWidgetPrefs";
    static final String KEY_PRAYER_NAME   = "prayer_name";
    static final String KEY_PRAYER_TIME   = "prayer_time";
    static final String KEY_PRAYER_EPOCH  = "prayer_epoch"; // ms since Unix epoch

    // ── Called by the system every 30 min (updatePeriodMillis) ───────────
    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        WidgetUpdateReceiver.recalcAndUpdate(context);
        WidgetAlarmManager.scheduleNext(context);
    }

    // ── First widget added to home screen ────────────────────────────────
    @Override
    public void onEnabled(Context context) {
        WidgetUpdateReceiver.recalcAndUpdate(context);
        WidgetAlarmManager.scheduleNext(context);
    }

    // ── Last widget removed from home screen ─────────────────────────────
    @Override
    public void onDisabled(Context context) {
        WidgetAlarmManager.cancel(context);
    }

    // ── Draws one widget instance ─────────────────────────────────────────
    static void updateWidget(Context context, AppWidgetManager appWidgetManager, int widgetId) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);

        String prayerName  = prefs.getString(KEY_PRAYER_NAME,  "...");
        String prayerTime  = prefs.getString(KEY_PRAYER_TIME,  "--:--");
        long   prayerEpoch = prefs.getLong(KEY_PRAYER_EPOCH, 0L);

        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.prayer_widget);
        views.setTextViewText(R.id.widget_prayer_name, prayerName);
        views.setTextViewText(R.id.widget_prayer_time, prayerTime);

        // ── Live countdown via Chronometer ────────────────────────────────
        // Chronometer updates every second on its own (no AlarmManager needed for seconds).
        // We set countdown mode + calculate the SystemClock base from the prayer epoch.
        if (prayerEpoch > 0L) {
            long remainingMs = Math.max(0L, prayerEpoch - System.currentTimeMillis());
            long base        = SystemClock.elapsedRealtime() + remainingMs;

            // setCountDown(true) makes it count down instead of up (API 24+)
            views.setBoolean(R.id.widget_countdown, "setCountDown", true);
            views.setChronometer(R.id.widget_countdown, base, null, true);
        } else {
            views.setChronometer(R.id.widget_countdown,
                SystemClock.elapsedRealtime(), "--:--:--", false);
        }

        // ── Tap anywhere → open the app ───────────────────────────────────
        Intent openApp = new Intent(context, MainActivity.class);
        openApp.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            context, 0, openApp,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.widget_prayer_name, pendingIntent);
        views.setOnClickPendingIntent(R.id.widget_prayer_time, pendingIntent);
        views.setOnClickPendingIntent(R.id.widget_countdown,   pendingIntent);

        appWidgetManager.updateAppWidget(widgetId, views);
    }
}
