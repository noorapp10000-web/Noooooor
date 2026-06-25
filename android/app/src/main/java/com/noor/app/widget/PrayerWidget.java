package com.noor.app.widget;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.widget.RemoteViews;

import com.noor.app.R;

public class PrayerWidget extends AppWidgetProvider {

    public static final String ACTION_TOGGLE_THEME = "com.noor.app.widget.TOGGLE_THEME";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int id : appWidgetIds) {
            applyPlaceholder(context, appWidgetManager, id);
        }
        safeStart(context);
    }

    @Override
    public void onEnabled(Context context) {
        safeStart(context);
    }

    @Override
    public void onDisabled(Context context) {
        try {
            context.stopService(new Intent(context, PrayerWidgetService.class));
        } catch (Exception ignored) {}
    }

    @Override
    public void onAppWidgetOptionsChanged(Context context, AppWidgetManager appWidgetManager,
                                          int appWidgetId, Bundle newOptions) {
        applyPlaceholder(context, appWidgetManager, appWidgetId);
        safeStart(context);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        if (ACTION_TOGGLE_THEME.equals(intent.getAction())) {
            try {
                SharedPreferences prefs = context.getSharedPreferences(
                    PrayerWidgetService.PREFS_NAME, Context.MODE_PRIVATE);
                String current = prefs.getString(PrayerWidgetService.KEY_WIDGET_THEME, "dark");
                String next = "dark".equals(current) ? "light" : "dark";
                prefs.edit().putString(PrayerWidgetService.KEY_WIDGET_THEME, next).apply();
            } catch (Exception ignored) {}
            safeStart(context);
        }
    }

    private static void safeStart(Context context) {
        try {
            PrayerWidgetService.start(context);
        } catch (Exception ignored) {}
    }

    private void applyPlaceholder(Context context, AppWidgetManager awm, int widgetId) {
        try {
            SharedPreferences prefs = context.getSharedPreferences(
                PrayerWidgetService.PREFS_NAME, Context.MODE_PRIVATE);
            boolean isDark = !"light".equals(prefs.getString(PrayerWidgetService.KEY_WIDGET_THEME, "dark"));

            RemoteViews rv = new RemoteViews(context.getPackageName(), R.layout.widget_unified);
            rv.setInt(R.id.wg_root, "setBackgroundResource",
                isDark ? R.drawable.widget_bg : R.drawable.widget_bg_light);
            awm.updateAppWidget(widgetId, rv);
        } catch (Exception ignored) {}
    }
}
