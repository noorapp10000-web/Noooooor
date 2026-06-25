package com.noor.app;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.SharedPreferences;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.noor.app.widget.PrayerWidget;
import com.noor.app.widget.PrayerWidgetService;

@CapacitorPlugin(name = "NoorWidget")
public class WidgetBridgePlugin extends Plugin {

    @PluginMethod
    public void setPrayerTimes(PluginCall call) {
        Float lat = call.getFloat("lat");
        Float lng = call.getFloat("lng");

        if (lat == null || lng == null) {
            call.reject("Missing required lat/lng coordinates");
            return;
        }

        String city      = call.getString("city", "");
        String username  = call.getString("username", "");
        String hijriDate = call.getString("hijriDate", "");

        SharedPreferences prefs = getContext().getSharedPreferences(
            PrayerWidgetService.PREFS_NAME, Context.MODE_PRIVATE
        );
        prefs.edit()
            .putFloat(PrayerWidgetService.KEY_LAT,        lat)
            .putFloat(PrayerWidgetService.KEY_LNG,        lng)
            .putString(PrayerWidgetService.KEY_CITY,      city      != null ? city      : "")
            .putString(PrayerWidgetService.KEY_USERNAME,  username  != null ? username  : "")
            .putString(PrayerWidgetService.KEY_HIJRI_DATE, hijriDate != null ? hijriDate : "")
            .putLong("savedAt", System.currentTimeMillis())
            .apply();

        triggerWidgetUpdate();
        call.resolve();
    }

    @PluginMethod
    public void setUsername(PluginCall call) {
        String username = call.getString("username", "");
        SharedPreferences prefs = getContext().getSharedPreferences(
            PrayerWidgetService.PREFS_NAME, Context.MODE_PRIVATE
        );
        prefs.edit()
            .putString(PrayerWidgetService.KEY_USERNAME, username != null ? username : "")
            .apply();
        triggerWidgetUpdate();
        call.resolve();
    }

    @PluginMethod
    public void setTheme(PluginCall call) {
        String theme = call.getString("theme", "dark");
        SharedPreferences prefs = getContext().getSharedPreferences(
            PrayerWidgetService.PREFS_NAME, Context.MODE_PRIVATE
        );
        prefs.edit()
            .putString(PrayerWidgetService.KEY_THEME, theme)
            .apply();
        triggerWidgetUpdate();
        call.resolve();
    }

    private void triggerWidgetUpdate() {
        AppWidgetManager awm = AppWidgetManager.getInstance(getContext());
        int[] ids = awm.getAppWidgetIds(
            new ComponentName(getContext(), PrayerWidget.class)
        );
        if (ids.length > 0) {
            PrayerWidgetService.start(getContext());
        }
    }
}
