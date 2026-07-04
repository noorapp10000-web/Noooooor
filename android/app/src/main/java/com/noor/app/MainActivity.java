package com.noor.app;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.webkit.WebView;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;
import com.noor.app.guard.PrayerGuardBridgePlugin;

public class MainActivity extends BridgeActivity {

    private static final int REQUEST_LOCATION = 1001;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(WidgetBridgePlugin.class);
        registerPlugin(BatteryOptPlugin.class);
        registerPlugin(AudioBridgePlugin.class);
        registerPlugin(PrayerGuardBridgePlugin.class);
        super.onCreate(savedInstanceState);
        requestLocationPermissionIfNeeded();
    }

    private void requestLocationPermissionIfNeeded() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION)
                != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this,
                    new String[]{
                        Manifest.permission.ACCESS_FINE_LOCATION,
                        Manifest.permission.ACCESS_COARSE_LOCATION
                    },
                    REQUEST_LOCATION);
        }
    }

    /**
     * When the screen locks or the user leaves the app, Android calls onPause().
     * BridgeActivity.onPause() → bridge.onPause() → webView.onPause() + pauseTimers()
     * This freezes JS execution AND pauses the HTML5 audio element.
     *
     * Fix:
     *  1. Let super run (correct Activity lifecycle).
     *  2. Immediately resume the WebView so JS keeps running.
     *  3. Tell JS to resume audio if it was playing before the system paused it.
     */
    @Override
    public void onPause() {
        super.onPause();
        resumeWebViewAndAudio();
    }

    /**
     * onStop is called when the app is fully hidden (home button / task switcher).
     * Same treatment: keep WebView and audio alive.
     */
    @Override
    public void onStop() {
        super.onStop();
        resumeWebViewAndAudio();
    }

    /**
     * Called when the user presses Home. The Activity loses focus before onPause().
     * Resume timers early so the audio pipeline doesn't stutter.
     */
    @Override
    public void onUserLeaveHint() {
        super.onUserLeaveHint();
        if (getBridge() != null) {
            WebView webView = getBridge().getWebView();
            if (webView != null) {
                webView.resumeTimers();
            }
        }
    }

    private void resumeWebViewAndAudio() {
        if (getBridge() == null) return;
        WebView webView = getBridge().getWebView();
        if (webView == null) return;

        webView.resumeTimers();
        webView.onResume();

        webView.post(() ->
            webView.evaluateJavascript(
                "(function(){ try { if(window.__noorKeepPlaying) window.__noorKeepPlaying(); } catch(e){} })();",
                null
            )
        );
    }
}
