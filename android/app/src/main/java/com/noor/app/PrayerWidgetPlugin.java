package com.noor.app;

import android.content.Context;
import android.content.SharedPreferences;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Capacitor plugin bridge — called by the React app when it has fresh location data.
 * Saves lat/lng to SharedPreferences so the standalone widget can calculate
 * prayer times independently, even when the app is closed.
 */
@CapacitorPlugin(name = "PrayerWidget")
public class PrayerWidgetPlugin extends Plugin {

    @PluginMethod
    public void updateWidget(PluginCall call) {
        Context           context = getContext();
        SharedPreferences prefs   = context.getSharedPreferences(
            PrayerWidgetProvider.PREFS_NAME, Context.MODE_PRIVATE
        );

        // Persist location so the widget can recalculate when the app is closed
        Double lat = call.getDouble("lat");
        Double lng = call.getDouble("lng");

        if (lat != null && lng != null) {
            prefs.edit()
                .putLong("widget_lat", Double.doubleToLongBits(lat))
                .putLong("widget_lng", Double.doubleToLongBits(lng))
                .apply();
        }

        // Immediately recalculate and update all widgets
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
