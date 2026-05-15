package com.noor.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

/**
 * Schedules a per-minute exact alarm that drives the standalone widget countdown.
 * Uses alarm chaining: each fired alarm reschedules the next one, so the widget
 * updates every minute even when the app is completely closed.
 */
public class WidgetAlarmManager {

    static final String ACTION_WIDGET_UPDATE = "com.noor.app.WIDGET_UPDATE";

    private static PendingIntent buildPendingIntent(Context context) {
        Intent intent = new Intent(context, WidgetUpdateReceiver.class);
        intent.setAction(ACTION_WIDGET_UPDATE);
        return PendingIntent.getBroadcast(
            context, 42,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
    }

    /**
     * Schedule the next widget update at the next minute boundary.
     * Call this from WidgetUpdateReceiver.onReceive() to chain alarms.
     */
    public static void scheduleNext(Context context) {
        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;

        // Align to the next exact minute boundary (e.g. :01, :02, ...)
        long now      = System.currentTimeMillis();
        long nextTick = ((now / 60_000L) + 1L) * 60_000L;

        PendingIntent pi = buildPendingIntent(context);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, nextTick, pi);
        } else {
            am.setExact(AlarmManager.RTC_WAKEUP, nextTick, pi);
        }
    }

    /** Cancel any pending widget-update alarms (call when last widget is removed). */
    public static void cancel(Context context) {
        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (am != null) {
            am.cancel(buildPendingIntent(context));
        }
    }
}
