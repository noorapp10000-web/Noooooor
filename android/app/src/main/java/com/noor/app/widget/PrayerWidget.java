package com.noor.app.widget;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.view.View;
import android.widget.RemoteViews;

import com.noor.app.R;

public class PrayerWidget extends AppWidgetProvider {

    public static final String ACTION_TOGGLE_THEME = "com.noor.app.widget.TOGGLE_THEME";

    // Size tiers (mirrors PrayerWidgetService thresholds)
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

    /**
     * Shows cached prayer times immediately when widget is added or resized.
     * If no cache exists yet, shows a clean "نُور" display (no "جاري التحميل").
     * The service will replace this with a live countdown within ~1 second.
     */
    private void applyStaticDisplay(Context context, AppWidgetManager awm, int widgetId) {
        try {
            SharedPreferences prefs = context.getSharedPreferences(
                PrayerWidgetService.PREFS_NAME, Context.MODE_PRIVATE);

            boolean isDark = !"light".equals(prefs.getString(PrayerWidgetService.KEY_WIDGET_THEME, "dark"));
            String  city   = prefs.getString(PrayerWidgetService.KEY_CITY, "");

            // Determine size tier
            Bundle options = awm.getAppWidgetOptions(widgetId);
            int minW = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 250);
            int minH = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT, 160);
            int tier = (minW < 180 || minH < 110) ? TIER_SMALL
                     : (minH < 160)               ? TIER_MEDIUM
                     :                              TIER_LARGE;

            boolean isMediumOrLarge = (tier != TIER_SMALL);
            boolean isLarge         = (tier == TIER_LARGE);

            // Read cached prayer times written by the service
            String cachedFajr    = prefs.getString(PrayerWidgetService.KEY_CACHE_FAJR,    "");
            String cachedDhuhr   = prefs.getString(PrayerWidgetService.KEY_CACHE_DHUHR,   "");
            String cachedAsr     = prefs.getString(PrayerWidgetService.KEY_CACHE_ASR,     "");
            String cachedMaghrib = prefs.getString(PrayerWidgetService.KEY_CACHE_MAGHRIB, "");
            String cachedIsha    = prefs.getString(PrayerWidgetService.KEY_CACHE_ISHA,    "");
            String cachedNext    = prefs.getString(PrayerWidgetService.KEY_CACHE_NEXT,    "");
            String cachedNextT   = prefs.getString(PrayerWidgetService.KEY_CACHE_NEXT_T,  "");
            String cachedPrev    = prefs.getString(PrayerWidgetService.KEY_CACHE_PREV,    "");
            boolean hasCached    = !cachedFajr.isEmpty();

            // Theme colors
            int textPrimary   = isDark ? 0xFFFFFFFF : 0xFF1A1A1A;
            int textSecondary = isDark ? 0xCCFFFFFF : 0xFF3D2B0F;
            int textSubtle    = isDark ? 0x55FFFFFF : 0xFF8A7060;
            int numBg = isDark ? R.drawable.widget_number_bg : R.drawable.widget_number_bg_light;

            RemoteViews rv = new RemoteViews(context.getPackageName(), R.layout.widget_unified);

            // ── Root background ───────────────────────────────────────────────
            rv.setInt(R.id.wg_root, "setBackgroundResource",
                isDark ? R.drawable.widget_bg : R.drawable.widget_bg_light);

            // ── Visibility per tier ───────────────────────────────────────────
            rv.setViewVisibility(R.id.wg_username,          isMediumOrLarge ? View.VISIBLE : View.GONE);
            rv.setViewVisibility(R.id.wg_current_prayer,    isMediumOrLarge ? View.VISIBLE : View.GONE);
            rv.setViewVisibility(R.id.wg_hijri_date,        (isMediumOrLarge && !isLarge) ? View.VISIBLE : View.GONE);
            rv.setViewVisibility(R.id.wg_next_prayer_label, isMediumOrLarge ? View.VISIBLE : View.GONE);
            rv.setViewVisibility(R.id.wg_remaining_label,   isMediumOrLarge ? View.VISIBLE : View.GONE);
            rv.setViewVisibility(R.id.wg_hours_label,       isMediumOrLarge ? View.VISIBLE : View.GONE);
            rv.setViewVisibility(R.id.wg_minutes_label,     isMediumOrLarge ? View.VISIBLE : View.GONE);
            rv.setViewVisibility(R.id.wg_seconds_label,     isMediumOrLarge ? View.VISIBLE : View.GONE);
            rv.setViewVisibility(R.id.wg_progress_pct,      isMediumOrLarge ? View.VISIBLE : View.GONE);
            rv.setViewVisibility(R.id.wg_progress_container,isMediumOrLarge ? View.VISIBLE : View.GONE);
            rv.setViewVisibility(R.id.wg_remaining_text,    isLarge ? View.VISIBLE : View.GONE);
            rv.setViewVisibility(R.id.wg_prayers_row,       isMediumOrLarge ? View.VISIBLE : View.GONE);
            rv.setViewVisibility(R.id.wg_bottom_bar,        isLarge ? View.VISIBLE : View.GONE);
            rv.setViewVisibility(R.id.wg_hijri_date_bottom, isLarge ? View.VISIBLE : View.GONE);
            rv.setViewVisibility(R.id.wg_day_pct,           isLarge ? View.VISIBLE : View.GONE);
            rv.setViewVisibility(R.id.wg_day_pct_label,     isLarge ? View.VISIBLE : View.GONE);
            rv.setViewVisibility(R.id.wg_hijri_label,       isLarge ? View.VISIBLE : View.GONE);

            // ── Main card background ──────────────────────────────────────────
            if (isMediumOrLarge) {
                rv.setInt(R.id.wg_main_card, "setBackgroundResource",
                    isDark ? R.drawable.widget_card_bg : R.drawable.widget_card_bg_light);
            } else {
                rv.setInt(R.id.wg_main_card, "setBackgroundColor", 0x00000000);
            }

            // ── Countdown boxes ───────────────────────────────────────────────
            rv.setInt(R.id.wg_hours,   "setBackgroundResource", numBg);
            rv.setInt(R.id.wg_minutes, "setBackgroundResource", numBg);
            rv.setInt(R.id.wg_seconds, "setBackgroundResource", numBg);
            rv.setTextColor(R.id.wg_hours,   textPrimary);
            rv.setTextColor(R.id.wg_minutes, textPrimary);
            rv.setTextColor(R.id.wg_seconds, textPrimary);

            // ── City ──────────────────────────────────────────────────────────
            rv.setTextViewText(R.id.wg_city, city);
            rv.setTextColor(R.id.wg_city, textSecondary);

            // ── Text colors ───────────────────────────────────────────────────
            rv.setTextColor(R.id.wg_prayer_name, textPrimary);
            rv.setTextColor(R.id.wg_adhan_time,  textSecondary);
            rv.setTextColor(R.id.wg_day_pct,     textPrimary);
            rv.setTextColor(R.id.wg_day_pct_label, textSubtle);
            rv.setTextColor(R.id.wg_hijri_label,   textSubtle);

            if (isMediumOrLarge) {
                rv.setTextColor(R.id.wg_hours_label,   0xFFC19A6B);
                rv.setTextColor(R.id.wg_minutes_label, 0xFFC19A6B);
                rv.setTextColor(R.id.wg_seconds_label, 0xFFC19A6B);
                int cellLabelColor = isDark ? 0xBBFFFFFF : 0xFF4A3828;
                rv.setTextColor(R.id.wg_fajr_label,    cellLabelColor);
                rv.setTextColor(R.id.wg_dhuhr_label,   cellLabelColor);
                rv.setTextColor(R.id.wg_asr_label,     cellLabelColor);
                rv.setTextColor(R.id.wg_maghrib_label, cellLabelColor);
                rv.setTextColor(R.id.wg_isha_label,    cellLabelColor);
            }

            // ── Content: cached times or clean placeholder ────────────────────
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
                // First-ever widget add — no cache yet; show clean state
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
