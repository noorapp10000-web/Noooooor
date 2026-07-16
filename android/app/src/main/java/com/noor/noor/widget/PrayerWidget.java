package com.noor.noor.widget;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.view.View;
import android.widget.RemoteViews;

import com.noor.noor.R;

public class PrayerWidget extends AppWidgetProvider {

    private static final int TIER_SMALL  = 0;
    private static final int TIER_MEDIUM = 1;
    private static final int TIER_LARGE  = 2;

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int id : appWidgetIds) {
            applyStaticDisplay(context, appWidgetManager, id);
        }
        safeStart(context);
    }

    @Override
    public void onEnabled(Context context) {
        safeStart(context);
    }

    @Override
    public void onDisabled(Context context) {
        WidgetRefreshReceiver.cancel(context);
        try {
            context.stopService(new Intent(context, PrayerWidgetService.class));
        } catch (Exception ignored) {}
    }

    @Override
    public void onAppWidgetOptionsChanged(Context context, AppWidgetManager appWidgetManager,
                                          int appWidgetId, Bundle newOptions) {
        applyStaticDisplay(context, appWidgetManager, appWidgetId);
        safeStart(context);
    }

    private static void safeStart(Context context) {
        try {
            PrayerWidgetService.start(context);
        } catch (Exception ignored) {}
        PrayerWidgetService.scheduleAlarmFallback(context);
    }

    private void applyStaticDisplay(Context context, AppWidgetManager awm, int widgetId) {
        try {
            SharedPreferences prefs = context.getSharedPreferences(
                PrayerWidgetService.PREFS_NAME, Context.MODE_PRIVATE);

            String city = prefs.getString(PrayerWidgetService.KEY_CITY, "");

            Bundle options = awm.getAppWidgetOptions(widgetId);
            int minW = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 250);
            int minH = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT, 160);
            int tier = (minW < 180 || minH < 110) ? TIER_SMALL
                     : (minH < 160)               ? TIER_MEDIUM
                     :                              TIER_LARGE;

            boolean isMediumOrLarge = (tier != TIER_SMALL);
            boolean isLarge         = (tier == TIER_LARGE);
            boolean isMedium        = (tier == TIER_MEDIUM);

            String cachedFajr    = prefs.getString(PrayerWidgetService.KEY_CACHE_FAJR,    "");
            String cachedDhuhr   = prefs.getString(PrayerWidgetService.KEY_CACHE_DHUHR,   "");
            String cachedAsr     = prefs.getString(PrayerWidgetService.KEY_CACHE_ASR,     "");
            String cachedMaghrib = prefs.getString(PrayerWidgetService.KEY_CACHE_MAGHRIB, "");
            String cachedIsha    = prefs.getString(PrayerWidgetService.KEY_CACHE_ISHA,    "");
            String cachedNext    = prefs.getString(PrayerWidgetService.KEY_CACHE_NEXT,    "");
            String cachedNextT   = prefs.getString(PrayerWidgetService.KEY_CACHE_NEXT_T,  "");
            String cachedPrev    = prefs.getString(PrayerWidgetService.KEY_CACHE_PREV,    "");
            boolean hasCached    = !cachedFajr.isEmpty();

            RemoteViews rv = new RemoteViews(context.getPackageName(), R.layout.widget_unified);

            rv.setViewVisibility(R.id.wg_username,           isMediumOrLarge ? View.VISIBLE : View.GONE);
            rv.setViewVisibility(R.id.wg_current_prayer,     isMediumOrLarge ? View.VISIBLE : View.GONE);
            rv.setViewVisibility(R.id.wg_hijri_date,         isMedium        ? View.VISIBLE : View.GONE);
            rv.setViewVisibility(R.id.wg_next_prayer_label,  isMediumOrLarge ? View.VISIBLE : View.GONE);
            rv.setViewVisibility(R.id.wg_remaining_label,    isMediumOrLarge ? View.VISIBLE : View.GONE);
            rv.setViewVisibility(R.id.wg_hours_label,        isMediumOrLarge ? View.VISIBLE : View.GONE);
            rv.setViewVisibility(R.id.wg_minutes_label,      isMediumOrLarge ? View.VISIBLE : View.GONE);
            rv.setViewVisibility(R.id.wg_seconds_label,      isMediumOrLarge ? View.VISIBLE : View.GONE);
            rv.setViewVisibility(R.id.wg_progress_pct,       isMediumOrLarge ? View.VISIBLE : View.GONE);
            rv.setViewVisibility(R.id.wg_progress_container, isMediumOrLarge ? View.VISIBLE : View.GONE);
            rv.setViewVisibility(R.id.wg_remaining_text,     isLarge ? View.VISIBLE : View.GONE);
            rv.setViewVisibility(R.id.wg_prayers_row,        isMediumOrLarge ? View.VISIBLE : View.GONE);
            rv.setViewVisibility(R.id.wg_bottom_bar,         isLarge ? View.VISIBLE : View.GONE);
            rv.setViewVisibility(R.id.wg_hijri_date_bottom,  isLarge ? View.VISIBLE : View.GONE);
            rv.setViewVisibility(R.id.wg_day_pct,            isLarge ? View.VISIBLE : View.GONE);
            rv.setViewVisibility(R.id.wg_day_pct_label,      isLarge ? View.VISIBLE : View.GONE);
            rv.setViewVisibility(R.id.wg_hijri_label,        isLarge ? View.VISIBLE : View.GONE);
            rv.setViewVisibility(R.id.wg_prayer_name_icon,   View.GONE);
            rv.setViewVisibility(R.id.wg_fajr_icon,          View.GONE);
            rv.setViewVisibility(R.id.wg_asr_icon,           View.GONE);
            rv.setViewVisibility(R.id.wg_dhuhr_icon,         View.GONE);
            rv.setViewVisibility(R.id.wg_maghrib_icon,       View.GONE);
            rv.setViewVisibility(R.id.wg_isha_icon,          View.GONE);

            if (isMediumOrLarge) {
                rv.setInt(R.id.wg_main_card, "setBackgroundResource", R.drawable.widget_card_bg);
            } else {
                rv.setInt(R.id.wg_main_card, "setBackgroundColor", 0x00000000);
            }

            rv.setTextColor(R.id.wg_hours,   0xFFFFFFFF);
            rv.setTextColor(R.id.wg_minutes, 0xFFFFFFFF);
            rv.setTextColor(R.id.wg_seconds, 0xFFFFFFFF);
            rv.setInt(R.id.wg_hours,   "setBackgroundResource", R.drawable.widget_counter_box_dark);
            rv.setInt(R.id.wg_minutes, "setBackgroundResource", R.drawable.widget_counter_box_dark);
            rv.setInt(R.id.wg_seconds, "setBackgroundResource", R.drawable.widget_counter_box_dark);

            rv.setTextViewText(R.id.wg_city, city);
            rv.setTextColor(R.id.wg_city, 0xCCFFFFFF);
            rv.setTextColor(R.id.wg_prayer_name, 0xFFFFFFFF);
            rv.setTextColor(R.id.wg_adhan_time,  0xCCFFFFFF);
            rv.setTextColor(R.id.wg_day_pct,       0xFFFFFFFF);
            rv.setTextColor(R.id.wg_day_pct_label, 0x55FFFFFF);
            rv.setTextColor(R.id.wg_hijri_label,   0x55FFFFFF);

            if (isMediumOrLarge) {
                rv.setTextColor(R.id.wg_hours_label,   0xFFC19A6B);
                rv.setTextColor(R.id.wg_minutes_label, 0xFFC19A6B);
                rv.setTextColor(R.id.wg_seconds_label, 0xFFC19A6B);
                rv.setTextColor(R.id.wg_fajr_label,    0xBBFFFFFF);
                rv.setTextColor(R.id.wg_dhuhr_label,   0xBBFFFFFF);
                rv.setTextColor(R.id.wg_asr_label,     0xBBFFFFFF);
                rv.setTextColor(R.id.wg_maghrib_label, 0xBBFFFFFF);
                rv.setTextColor(R.id.wg_isha_label,    0xBBFFFFFF);
            }

            if (hasCached) {
                rv.setTextViewText(R.id.wg_prayer_name,    cachedNext);
                rv.setTextViewText(R.id.wg_adhan_time,     "وقت الأذان " + cachedNextT);
                rv.setTextViewText(R.id.wg_current_prayer, "الصلاة الحالية: " + cachedPrev);
                rv.setTextViewText(R.id.wg_hours,   "--");
                rv.setTextViewText(R.id.wg_minutes, "--");
                rv.setTextViewText(R.id.wg_seconds, "--");
                if (isMediumOrLarge) {
                    rv.setTextViewText(R.id.wg_fajr_time,    cachedFajr);
                    rv.setTextViewText(R.id.wg_dhuhr_time,   cachedDhuhr);
                    rv.setTextViewText(R.id.wg_asr_time,     cachedAsr);
                    rv.setTextViewText(R.id.wg_maghrib_time, cachedMaghrib);
                    rv.setTextViewText(R.id.wg_isha_time,    cachedIsha);
                }
            } else {
                rv.setTextViewText(R.id.wg_prayer_name, "نُور");
                rv.setTextViewText(R.id.wg_adhan_time,  "");
                rv.setTextViewText(R.id.wg_hours,   "--");
                rv.setTextViewText(R.id.wg_minutes, "--");
                rv.setTextViewText(R.id.wg_seconds, "--");
            }

            awm.updateAppWidget(widgetId, rv);
        } catch (Exception ignored) {}
    }
}
