package com.noor.app;

import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(WidgetBridgePlugin.class);
        registerPlugin(BatteryOptPlugin.class);
        super.onCreate(savedInstanceState);
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

        // After the WebView is resumed, ask JS to resume audio
        // if it was playing before the system interrupted it.
        webView.post(() ->
            webView.evaluateJavascript(
                "(function(){ try { if(window.__noorKeepPlaying) window.__noorKeepPlaying(); } catch(e){} })();",
                null
            )
        );
    }
}
