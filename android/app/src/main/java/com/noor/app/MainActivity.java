package com.noor.app;

import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(WidgetBridgePlugin.class);
        super.onCreate(savedInstanceState);
    }

    /**
     * Override onPause so the WebView keeps running after the screen locks.
     *
     * Default Capacitor behaviour:
     *   BridgeActivity.onPause() → bridge.onPause()
     *                            → webView.onPause()       (stops JS execution)
     *                            → webView.pauseTimers()   (freezes all timers)
     *
     * That kills audio playback AND the MediaSession heartbeat, so the lock-screen
     * and notification-shade controls disappear immediately.
     *
     * Fix: call super (so the Activity lifecycle is correct) then immediately
     * re-resume the WebView, which restores JS execution and keeps audio alive.
     */
    @Override
    protected void onPause() {
        super.onPause();
        if (getBridge() != null) {
            WebView webView = getBridge().getWebView();
            if (webView != null) {
                webView.resumeTimers();
                webView.onResume();
            }
        }
    }

    /**
     * onStop is called when the app is fully hidden (e.g. another app covers it).
     * We apply the same fix so audio keeps going even when the app is in the
     * background task list.
     */
    @Override
    protected void onStop() {
        super.onStop();
        if (getBridge() != null) {
            WebView webView = getBridge().getWebView();
            if (webView != null) {
                webView.resumeTimers();
                webView.onResume();
            }
        }
    }
}
