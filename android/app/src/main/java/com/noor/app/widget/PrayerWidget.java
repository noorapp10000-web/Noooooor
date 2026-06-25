package com.noor.app.widget;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;

public class PrayerWidget extends AppWidgetProvider {

    public static final String ACTION_TOGGLE_THEME = "com.noor.app.widget.TOGGLE_THEME";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        PrayerWidgetService.start(context);
    }

    @Override
    public void onEnabled(Context context) {
        PrayerWidgetService.start(context);
    }

    @Override
    public void onDisabled(Context context) {
        context.stopService(new Intent(context, PrayerWidgetService.class));
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        if (ACTION_TOGGLE_THEME.equals(intent.getAction())) {
            SharedPreferences prefs = context.getSharedPreferences(
                PrayerWidgetService.PREFS_NAME, Context.MODE_PRIVATE);
            String current = prefs.getString(PrayerWidgetService.KEY_WIDGET_THEME, "dark");
            String next = "dark".equals(current) ? "light" : "dark";
            prefs.edit().putString(PrayerWidgetService.KEY_WIDGET_THEME, next).apply();
            PrayerWidgetService.start(context);
        }
    }
}
