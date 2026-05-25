package com.noor.app.guard;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NoorGuard")
public class PrayerGuardBridgePlugin extends Plugin {

    @PluginMethod
    public void setEnabled(PluginCall call) {
        Boolean enabled = call.getBoolean("enabled", false);
        PrayerGuardPrefs.setEnabled(getContext(), Boolean.TRUE.equals(enabled));
        call.resolve();
    }

    @PluginMethod
    public void isEnabled(PluginCall call) {
        JSObject result = new JSObject();
        result.put("enabled", PrayerGuardPrefs.isEnabled(getContext()));
        call.resolve(result);
    }

    @PluginMethod
    public void setPrayedStatus(PluginCall call) {
        String date   = call.getString("date");
        String prayer = call.getString("prayer");
        Boolean prayed = call.getBoolean("prayed", false);

        if (date == null || prayer == null) {
            call.reject("Missing date or prayer");
            return;
        }

        PrayerGuardPrefs.setPrayed(getContext(), date, prayer, Boolean.TRUE.equals(prayed));
        call.resolve();
    }

    @PluginMethod
    public void checkPermissions(PluginCall call) {
        boolean hasOverlay       = hasOverlayPermission();
        boolean hasAccessibility = hasAccessibilityPermission();

        JSObject result = new JSObject();
        result.put("overlay",       hasOverlay);
        result.put("accessibility", hasAccessibility);
        call.resolve(result);
    }

    @PluginMethod
    public void requestOverlayPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(getContext())) {
            try {
                Intent intent = new Intent(
                    Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:" + getContext().getPackageName())
                );
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(intent);
            } catch (Exception ignored) {}
        }
        call.resolve();
    }

    @PluginMethod
    public void requestAccessibilityPermission(PluginCall call) {
        try {
            Intent intent = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
        } catch (Exception ignored) {}
        call.resolve();
    }

    private boolean hasOverlayPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            return Settings.canDrawOverlays(getContext());
        }
        return true;
    }

    private boolean hasAccessibilityPermission() {
        try {
            String enabledServices = Settings.Secure.getString(
                getContext().getContentResolver(),
                Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
            );
            if (enabledServices == null || enabledServices.isEmpty()) return false;

            android.content.ComponentName myComponent = new android.content.ComponentName(
                getContext().getPackageName(),
                PrayerGuardService.class.getName()
            );
            String flat = myComponent.flattenToString();

            for (String svc : enabledServices.split(":")) {
                if (svc.trim().equalsIgnoreCase(flat)) return true;
            }
            return false;
        } catch (Exception e) {
            return false;
        }
    }
}
