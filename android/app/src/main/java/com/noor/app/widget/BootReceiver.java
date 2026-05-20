package com.noor.app.widget;

import android.appwidget.AppWidgetManager;
import android.content.BroadcastReceiver;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

public class BootReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        if (action == null) return;

        switch (action) {
            case Intent.ACTION_BOOT_COMPLETED:
            case "android.intent.action.QUICKBOOT_POWERON":
            case "android.intent.action.LOCKED_BOOT_COMPLETED":
            case Intent.ACTION_MY_PACKAGE_REPLACED:
                restartWidgetIfActive(context);
                break;
        }
    }

    private void restartWidgetIfActive(Context context) {
        try {
            Context storageContext = context;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                storageContext = context.createDeviceProtectedStorageContext();
            }

            AppWidgetManager awm = AppWidgetManager.getInstance(storageContext);
            ComponentName widgetComponent = new ComponentName(storageContext, PrayerWidget.class);
            int[] ids = awm.getAppWidgetIds(widgetComponent);

            if (ids != null && ids.length > 0) {
                PrayerWidgetService.start(context);
            }
        } catch (Exception ignored) {
        }
    }
}
