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

/**
 * Capacitor plugin bridge — called by the React app when it has fresh location data.
 * Saves lat/lng to SharedPreferences so the standalone widget can use them
 * even when the app is closed.
 */
@CapacitorPlugin(name = "PrayerWidget")
public class PrayerWidgetPlugin extends Plugin {

    @PluginMethod
    public void updateWidget(PluginCall call) {
        Context context = getContext();
        SharedPreferences prefs = context.getSharedPreferences(
            PrayerWidgetProvider.PREFS_NAME, Context.MODE_PRIVATE
        );

        // Persist lat/lng so the widget can run independently
        Double lat = call.getDouble("lat");
        Double lng = call.getDouble("lng");

        SharedPreferences.Editor editor = prefs.edit();
        if (lat != null && lng != null) {
            editor.putLong("widget_lat", Double.doubleToLongBits(lat));
            editor.putLong("widget_lng", Double.doubleToLongBits(lng));
        }
        editor.apply();

        // Immediately recalculate with fresh data and update widgets
        WidgetUpdateReceiver.recalcAndUpdate(context);
        WidgetAlarmManager.scheduleNext(context);

        call.resolve();
    }

    @PluginMethod
    public void isSupported(PluginCall call) {
        JSObject result = new JSObject();
        result.put("supported", true);
        call.resolve(result);
    }
}
