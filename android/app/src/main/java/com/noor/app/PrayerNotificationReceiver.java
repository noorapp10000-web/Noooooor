package com.noor.app;

import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;

import androidx.core.app.NotificationCompat;

/**
 * Receives AlarmManager broadcasts for individual prayer times.
 * Shows a styled notification and then reschedules the next day's alarms
 * after Isha fires (so coverage is always rolling 48h ahead).
 *
 * Extras expected on the Intent:
 *   "prayer_name"  String  — Arabic name, e.g. "المغرب"
 *   "prayer_index" int     — 0=Fajr … 5=Isha
 *   "prayer_epoch" long    — UTC ms of the prayer time (for deduplication)
 */
public class PrayerNotificationReceiver extends BroadcastReceiver {

    static final String EXTRA_PRAYER_NAME  = "prayer_name";
    static final String EXTRA_PRAYER_INDEX = "prayer_index";
    static final String EXTRA_PRAYER_EPOCH = "prayer_epoch";

    // Unique notification IDs for each prayer (won't clash with Capacitor's IDs)
    private static final int[] NOTIF_IDS = { 201, 202, 203, 204, 205, 206 };

    private static final String[] PRAYER_EMOJIS = {
        "🌙", "🌅", "☀️", "🌤️", "🌆", "🌙"
    };

    @Override
    public void onReceive(Context context, Intent intent) {
        String prayerName  = intent.getStringExtra(EXTRA_PRAYER_NAME);
        int    prayerIndex = intent.getIntExtra(EXTRA_PRAYER_INDEX, -1);

        if (prayerName == null || prayerIndex < 0 || prayerIndex >= 6) return;

        // Load settings — check if notifications are enabled for this prayer
        PrayerNotificationScheduler.NotifSettings settings =
            PrayerNotificationScheduler.loadSettings(context);

        if (!settings.enabled) return;
        if (!settings.prayerEnabled[prayerIndex]) return;

        showNotification(context, prayerName, prayerIndex, settings.minutesBefore);

        // After Isha (index 5): reschedule all alarms for the next 2 days
        if (prayerIndex == 5) {
            PrayerNotificationScheduler.scheduleAllFromPrefs(context);
        }
    }

    private void showNotification(Context context, String prayerName,
                                  int prayerIndex, int minutesBefore) {
        NotificationManager nm =
            (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;

        // Tap notification → open app
        Intent openApp = new Intent(context, MainActivity.class);
        openApp.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pi = PendingIntent.getActivity(
            context, prayerIndex, openApp,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        String emoji = PRAYER_EMOJIS[prayerIndex];
        String title = "🕌 نُور — " + prayerName;
        String body;
        if (minutesBefore == 0) {
            body = "حان وقت " + prayerName + " " + emoji;
        } else {
            body = prayerName + " بعد " + minutesBefore + " دقيقة " + emoji;
        }

        Notification notification = new NotificationCompat.Builder(context, "prayer_channel")
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
            .setColor(Color.parseColor("#C19A6B"))
            .setColorized(true)
            .setContentIntent(pi)
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .build();

        nm.notify(NOTIF_IDS[prayerIndex], notification);
    }
}
