package com.noor.app.widget;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;

public class PrayerWidget extends AppWidgetProvider {

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
}
