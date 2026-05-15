package com.noor.app;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.SharedPreferences;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "PrayerWidget")
public class PrayerWidgetPlugin extends Plugin {

    @PluginMethod
    public void updateWidget(PluginCall call) {
        String prayerName = call.getString("prayerName", "المغرب");
        String prayerTime = call.getString("prayerTime", "--:--");

        Context context = getContext();
        SharedPreferences prefs = context.getSharedPreferences(
            PrayerWidgetProvider.PREFS_NAME, Context.MODE_PRIVATE
        );
        prefs.edit()
            .putString(PrayerWidgetProvider.KEY_PRAYER_NAME, prayerName)
            .putString(PrayerWidgetProvider.KEY_PRAYER_TIME, prayerTime)
            .apply();

        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        ComponentName component = new ComponentName(context, PrayerWidgetProvider.class);
        int[] widgetIds = manager.getAppWidgetIds(component);
        for (int id : widgetIds) {
            PrayerWidgetProvider.updateWidget(context, manager, id);
        }

        call.resolve();
    }

    @PluginMethod
    public void isSupported(PluginCall call) {
        JSObject result = new JSObject();
        result.put("supported", true);
        call.resolve(result);
    }
}
