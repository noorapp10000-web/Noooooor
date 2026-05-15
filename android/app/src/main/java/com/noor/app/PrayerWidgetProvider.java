package com.noor.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

public class PrayerWidgetProvider extends AppWidgetProvider {

    static final String PREFS_NAME = "NoorWidgetPrefs";
    static final String KEY_PRAYER_NAME = "prayer_name";
    static final String KEY_PRAYER_TIME = "prayer_time";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int widgetId : appWidgetIds) {
            updateWidget(context, appWidgetManager, widgetId);
        }
    }

    static void updateWidget(Context context, AppWidgetManager appWidgetManager, int widgetId) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String prayerName = prefs.getString(KEY_PRAYER_NAME, "المغرب");
        String prayerTime = prefs.getString(KEY_PRAYER_TIME, "--:--");

        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.prayer_widget);
        views.setTextViewText(R.id.widget_prayer_name, prayerName);
        views.setTextViewText(R.id.widget_prayer_time, prayerTime);

        Intent intent = new Intent(context, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            context, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.widget_prayer_name, pendingIntent);
        views.setOnClickPendingIntent(R.id.widget_prayer_time, pendingIntent);

        appWidgetManager.updateAppWidget(widgetId, views);
    }
}
