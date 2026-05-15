package com.noor.app;

import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(PrayerWidgetPlugin.class);
        super.onCreate(savedInstanceState);

        createPrayerNotificationChannel();

        // Android 12 only: SCHEDULE_EXACT_ALARM requires explicit user grant
        if (Build.VERSION.SDK_INT == Build.VERSION_CODES.S ||
            Build.VERSION.SDK_INT == Build.VERSION_CODES.S_V2) {
            AlarmManager alarmManager = (AlarmManager) getSystemService(ALARM_SERVICE);
            if (alarmManager != null && !alarmManager.canScheduleExactAlarms()) {
                try {
                    Intent intent = new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM);
                    intent.setData(Uri.parse("package:" + getPackageName()));
                    startActivity(intent);
                } catch (Exception ignored) {}
            }
        }
    }

    /**
     * Creates the notification channel for prayer reminders.
     * Required on Android 8+ (API 26+). Safe to call multiple times.
     * Must be HIGH importance so heads-up notifications and sound work.
     */
    private void createPrayerNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                "prayer_channel",
                "تنبيهات الصلاة",
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("تذكير بمواقيت الصلاة قبل حلول الوقت");
            channel.enableVibration(true);
            channel.setVibrationPattern(new long[]{0, 400, 200, 400});
            channel.setShowBadge(true);
            channel.enableLights(true);
            channel.setLightColor(0xFFC19A6B);

            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }
}
