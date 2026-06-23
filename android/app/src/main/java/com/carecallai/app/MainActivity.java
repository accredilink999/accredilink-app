package com.carecallai.app;

import android.Manifest;
import android.app.DownloadManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.PowerManager;
import android.view.KeyEvent;
import android.view.WindowManager;
import android.webkit.CookieManager;
import android.webkit.GeolocationPermissions;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.URLUtil;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static final int MIC_PERMISSION_REQUEST = 1001;

    // Inrico T320 / PoC handset keycodes for the hardware PTT button
    // 139 (KEYCODE_MENU) deliberately excluded — it's used by Android for
    // navigation / app switching and intercepting it breaks scroll + multitasking.
    private static final int KEYCODE_PTT         = 280;
    private static final int KEYCODE_INRICO_SIDE = 293;

    // LED notification
    private static final int    LED_NOTIF_ID = 9001;
    private static final String CH_ONLINE    = "radio_led_online";
    private static final String CH_OFFLINE   = "radio_led_offline";

    private WebView webView;

    // Wake lock — acquired on PTT press to bring screen on if it went dark
    private PowerManager.WakeLock pttWakeLock;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        requestMicPermission();
        setupLedChannels();

        // ── Radio flavor: always-on, show-over-lock-screen ────────────────────
        // The T320 is a dedicated handset — screen must never sleep and calls must
        // appear even if the device is "locked" or in screensaver mode.
        if (BuildConfig.FLAVOR.equals("radio")) {
            getWindow().addFlags(
                WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON |
                WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
            );
            // API 27+ uses dedicated methods; older versions use window flags
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
                setShowWhenLocked(true);
                setTurnScreenOn(true);
            } else {
                getWindow().addFlags(
                    WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                    WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
                );
            }
            // Wake lock: if the screen somehow goes off (manual power button),
            // pressing PTT wakes it back to full brightness immediately.
            PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
            pttWakeLock = pm.newWakeLock(
                PowerManager.SCREEN_BRIGHT_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP,
                "carecallai:ptt_wake"
            );
            pttWakeLock.setReferenceCounted(false);
        }

        webView = getBridge().getWebView();

        // Expose LED bridge to JavaScript — called from TwoWayRadio when isOnline changes
        webView.addJavascriptInterface(new LedBridge(), "AndroidLED");

        // Expose app control bridge: minimize() sends app to background without exiting.
        // Needed on T320 which has no visible software navigation bar.
        webView.addJavascriptInterface(new AndroidAppBridge(), "AndroidApp");

        // Radio flavor: inject localStorage flags so React app boots to radio page
        // and the PTT key is pre-bound to T320's hardware keycode (280) on first run.
        if (BuildConfig.FLAVOR.equals("radio")) {
            webView.post(() -> webView.evaluateJavascript(
                "localStorage.setItem('carecall_radio_mode','true');" +
                "localStorage.setItem('radio_keep_awake','true');" +
                "if (!localStorage.getItem('radio_ptt_keycode')) {" +
                "  localStorage.setItem('radio_ptt_keycode','280');" +
                "}",
                null
            ));
        }

        // Download listener — uses Android DownloadManager to download APK files
        webView.setDownloadListener((url, userAgent, contentDisposition, mimetype, contentLength) -> {
            try {
                DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
                String filename = URLUtil.guessFileName(url, contentDisposition, mimetype);
                request.setTitle(filename);
                request.setDescription("Downloading app update...");
                request.setMimeType(mimetype);
                String cookie = CookieManager.getInstance().getCookie(url);
                if (cookie != null) request.addRequestHeader("Cookie", cookie);
                request.addRequestHeader("User-Agent", userAgent);
                request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, filename);
                DownloadManager dm = (DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE);
                dm.enqueue(request);
                Toast.makeText(this, "Downloading " + filename + "...", Toast.LENGTH_SHORT).show();
            } catch (Exception e) {
                Toast.makeText(this, "Download failed: " + e.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });

        final WebChromeClient capacitorClient = getBridge().getWebView().getWebChromeClient();

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                runOnUiThread(() -> request.grant(request.getResources()));
            }

            @Override
            public void onGeolocationPermissionsShowPrompt(String origin,
                    GeolocationPermissions.Callback callback) {
                callback.invoke(origin, true, false);
            }

            @Override
            public boolean onShowFileChooser(WebView webView,
                    ValueCallback<Uri[]> filePathCallback,
                    FileChooserParams fileChooserParams) {
                if (capacitorClient != null) {
                    return capacitorClient.onShowFileChooser(webView, filePathCallback, fileChooserParams);
                }
                return super.onShowFileChooser(webView, filePathCallback, fileChooserParams);
            }
        });
    }

    // ── LED status indicator ──────────────────────────────────────────────────
    // Blinks the T320 hardware LED green (online) or red (offline) by posting
    // a persistent notification on the matching LED notification channel.
    // Called from TwoWayRadio.jsx via window.AndroidLED.setOnline(bool).

    private void setupLedChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);

            NotificationChannel online = new NotificationChannel(
                CH_ONLINE, "Radio Online", NotificationManager.IMPORTANCE_LOW);
            online.setDescription("LED blinks green — radio connected");
            online.enableLights(true);
            online.setLightColor(Color.GREEN);
            online.setShowBadge(false);
            nm.createNotificationChannel(online);

            NotificationChannel offline = new NotificationChannel(
                CH_OFFLINE, "Radio Offline", NotificationManager.IMPORTANCE_LOW);
            offline.setDescription("LED blinks red — no network connection");
            offline.enableLights(true);
            offline.setLightColor(Color.RED);
            offline.setShowBadge(false);
            nm.createNotificationChannel(offline);
        }
    }

    private void showLedNotification(boolean online) {
        NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        String channel = online ? CH_ONLINE : CH_OFFLINE;

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, channel)
            .setSmallIcon(android.R.drawable.stat_sys_phone_call)
            .setContentTitle(online ? "Radio Connected" : "Radio Offline")
            .setContentText(online ? "CareCall Radio is online" : "No connection — check network")
            .setOngoing(true)
            .setSilent(true)
            .setPriority(NotificationCompat.PRIORITY_LOW);

        // Pre-Oreo: set LED colour directly on the notification
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            builder.setLights(online ? Color.GREEN : Color.RED, 500, 500);
        }

        nm.notify(LED_NOTIF_ID, builder.build());
    }

    private class LedBridge {
        @JavascriptInterface
        public void setOnline(boolean online) {
            runOnUiThread(() -> showLedNotification(online));
        }
    }

    private class AndroidAppBridge {
        @JavascriptInterface
        public void minimize() {
            runOnUiThread(() -> moveTaskToBack(true));
        }

        // Called synchronously from the React useState initializer to get the
        // default PTT keycode before evaluateJavascript injection has run.
        @JavascriptInterface
        public String getDefaultPttKeyCode() {
            return String.valueOf(KEYCODE_PTT); // "280"
        }
    }

    // ── Hardware PTT key forwarding ───────────────────────────────────────────
    // Inrico T320 PTT fires KEYCODE_PTT (280). We intercept it here, acquire a
    // wake lock to ensure the screen is bright, then inject a synthetic keydown
    // event into the WebView so the React app's document.addEventListener fires.

    private boolean isPttKey(int keyCode) {
        return keyCode == KEYCODE_PTT
            || keyCode == KEYCODE_INRICO_SIDE;
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (isPttKey(keyCode) && webView != null) {
            // Acquire wake lock — brings screen on if it was dark, keeps it on
            // for 10 minutes (cancelled on keyUp or if FLAG_KEEP_SCREEN_ON takes over)
            if (pttWakeLock != null && !pttWakeLock.isHeld()) {
                pttWakeLock.acquire(10 * 60 * 1000L);
            }
            // Bring activity to front in case it was backgrounded
            moveTaskToFront();
            webView.evaluateJavascript(
                "document.dispatchEvent(new KeyboardEvent('keydown',{keyCode:" + keyCode + ",bubbles:true,cancelable:true}));",
                null
            );
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }

    @Override
    public boolean onKeyUp(int keyCode, KeyEvent event) {
        if (isPttKey(keyCode) && webView != null) {
            // Release wake lock — FLAG_KEEP_SCREEN_ON keeps screen on anyway,
            // but releasing avoids holding it when radio mode isn't active
            if (pttWakeLock != null && pttWakeLock.isHeld()) {
                pttWakeLock.release();
            }
            webView.evaluateJavascript(
                "document.dispatchEvent(new KeyboardEvent('keyup',{keyCode:" + keyCode + ",bubbles:true,cancelable:true}));",
                null
            );
            return true;
        }
        return super.onKeyUp(keyCode, event);
    }

    // ── Back button ───────────────────────────────────────────────────────────
    // In radio flavor: pressing back minimises to the Android home screen
    // instead of closing the app or navigating browser history.

    @Override
    public void onBackPressed() {
        if (BuildConfig.FLAVOR.equals("radio")) {
            moveTaskToBack(true);
        } else {
            super.onBackPressed();
        }
    }

    /** Bring this activity to the foreground if it's been pushed back. */
    private void moveTaskToFront() {
        try {
            android.app.ActivityManager am =
                (android.app.ActivityManager) getSystemService(Context.ACTIVITY_SERVICE);
            if (am != null) {
                am.moveTaskToFront(getTaskId(), 0);
            }
        } catch (Exception ignored) {}
    }

    // ── Microphone permission ─────────────────────────────────────────────────

    private void requestMicPermission() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO)
                != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this,
                new String[]{ Manifest.permission.RECORD_AUDIO },
                MIC_PERMISSION_REQUEST);
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode,
            @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == MIC_PERMISSION_REQUEST) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                // Microphone granted — WebView getUserMedia will work
            } else {
                Toast.makeText(this, "Microphone permission is needed for radio",
                    Toast.LENGTH_LONG).show();
            }
        }
    }
}
