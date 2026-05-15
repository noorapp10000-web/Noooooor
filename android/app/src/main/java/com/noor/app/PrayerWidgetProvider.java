package com.noor.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

public class PrayerWidgetProvider extends AppWidgetProvider {

    static final String PREFS_NAME          = "NoorWidgetPrefs";
    static final String KEY_PRAYER_NAME     = "prayer_name";
    static final String KEY_PRAYER_TIME     = "prayer_time";
    static final String KEY_PRAYER_EPOCH    = "prayer_epoch";
    static final String KEY_COUNTDOWN_H     = "countdown_h";
    static final String KEY_COUNTDOWN_M     = "countdown_m";
    static final String KEY_COUNTDOWN_S     = "countdown_s";
    static final String KEY_HIJRI_DATE      = "hijri_date";
    static final String KEY_GREGORIAN_DATE  = "gregorian_date";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        WidgetUpdateReceiver.recalcAndUpdate(context);
        WidgetAlarmManager.scheduleNext(context);
    }

    @Override
    public void onEnabled(Context context) {
        WidgetUpdateReceiver.recalcAndUpdate(context);
        WidgetAlarmManager.scheduleNext(context);
    }

    @Override
    public void onDisabled(Context context) {
        WidgetAlarmManager.cancel(context);
    }

    static void updateWidget(Context context, AppWidgetManager appWidgetManager, int widgetId) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);

        String prayerName    = prefs.getString(KEY_PRAYER_NAME,    "...");
        String prayerTime    = prefs.getString(KEY_PRAYER_TIME,    "--:--");
        int    hours         = prefs.getInt(KEY_COUNTDOWN_H,       0);
        int    minutes       = prefs.getInt(KEY_COUNTDOWN_M,       0);
        int    seconds       = prefs.getInt(KEY_COUNTDOWN_S,       0);
        String hijriDate     = prefs.getString(KEY_HIJRI_DATE,     "");
        String gregorianDate = prefs.getString(KEY_GREGORIAN_DATE, "");

        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.prayer_widget);

        // Dates
        views.setTextViewText(R.id.widget_hijri_date,     hijriDate);
        views.setTextViewText(R.id.widget_gregorian_date, gregorianDate);

        // Prayer name and time
        views.setTextViewText(R.id.widget_prayer_name, prayerName);
        views.setTextViewText(R.id.widget_prayer_time, prayerTime);

        // H / M / S digit boxes
        views.setTextViewText(R.id.widget_hours,   String.format("%02d", hours));
        views.setTextViewText(R.id.widget_minutes, String.format("%02d", minutes));
        views.setTextViewText(R.id.widget_seconds, String.format("%02d", seconds));

        // Tap anywhere → open the app
        Intent openApp = new Intent(context, MainActivity.class);
        openApp.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            context, 0, openApp,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.widget_prayer_name, pendingIntent);
        views.setOnClickPendingIntent(R.id.widget_prayer_time, pendingIntent);
        views.setOnClickPendingIntent(R.id.widget_hijri_date,  pendingIntent);

        appWidgetManager.updateAppWidget(widgetId, views);
    }
}
