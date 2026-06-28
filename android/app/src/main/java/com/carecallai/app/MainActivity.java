package com.carecallai.app;

import android.Manifest;
import android.app.DownloadManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.media.AudioFormat;
import android.media.AudioRecord;
import android.media.MediaRecorder;
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
    private static final int KEYCODE_PTT         = 230; // confirmed keycode from T320 hardware
    private static final int KEYCODE_INRICO_SIDE = 293;

    // LED notification
    private static final int    LED_NOTIF_ID = 9001;
    private static final String CH_ONLINE    = "radio_led_online";
    private static final String CH_OFFLINE   = "radio_led_offline";

    private WebView webView;

    // Wake lock — acquired on PTT press to bring screen on if it went dark
    private PowerManager.WakeLock pttWakeLock;

    // Alerter CPU wake lock — keeps JS running in radio mode so GlobalAlerterMonitor
    // continues polling even when the screen is off, allowing wakeForCall() to fire.
    private PowerManager.WakeLock alerterWakeLock;

    // Long-press SOS: red button held for 800ms triggers emergency
    private final android.os.Handler sosHandler = new android.os.Handler(android.os.Looper.getMainLooper());
    private Runnable sosRunnable = null;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        requestMicPermission();
        requestNotificationPermission();
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

            // Keep CPU alive permanently so JS timers keep firing for alert polling.
            // This is a dedicated always-on radio handset so the battery cost is acceptable.
            alerterWakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "carecallai:alerter_cpu");
            alerterWakeLock.setReferenceCounted(false);
            alerterWakeLock.acquire();

            // Request Doze mode exemption so network stays alive indefinitely.
            // Without this Android cuts network access after ~10 min idle, dropping
            // the radio WebRTC connection and alerter Supabase polling.
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                if (!pm.isIgnoringBatteryOptimizations(getPackageName())) {
                    Intent intent = new Intent(
                        android.provider.Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS,
                        Uri.parse("package:" + getPackageName())
                    );
                    startActivity(intent);
                }
            }
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
                "  localStorage.setItem('radio_ptt_keycode','230');" +
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

        // Called by React when an incoming P2P call arrives via Supabase Realtime.
        // Wakes the screen from screensaver/sleep and brings the app to the front
        // so the user sees the answer controls immediately.
        @JavascriptInterface
        public void wakeForCall() {
            runOnUiThread(() -> {
                // Acquire wake lock — turns screen on at full brightness
                if (pttWakeLock != null && !pttWakeLock.isHeld()) {
                    pttWakeLock.acquire(60 * 1000L); // hold for up to 60s while ringing
                }
                moveTaskToFront();
            });
        }

        // ── Native mic bridge ─────────────────────────────────────────────────
        // Captures audio via Android AudioRecord (no getUserMedia / no user gesture
        // required) and streams raw PCM-16 chunks to JavaScript as base64 strings.
        // This bypasses WebView's getUserMedia user-gesture restriction entirely.

        private AudioRecord nativeAudioRecord = null;
        private Thread      nativeAudioThread = null;
        private volatile boolean nativeAudioActive = false;
        private static final int NATIVE_SAMPLE_RATE = 16000; // 16 kHz mono PCM-16

        @JavascriptInterface
        public void openNativeMic() {
            if (nativeAudioActive) return;
            if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
                webView.post(() -> webView.evaluateJavascript(
                    "window.__nativeMicError&&window.__nativeMicError('RECORD_AUDIO permission not granted')", null));
                return;
            }
            try {
                int minBuf = AudioRecord.getMinBufferSize(
                    NATIVE_SAMPLE_RATE, AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT);
                // Use 4× min buffer to reduce risk of overflow while evaluateJavascript is queued
                int bufSize = Math.max(minBuf * 4, NATIVE_SAMPLE_RATE / 10 * 2); // at least 100ms
                nativeAudioRecord = new AudioRecord(
                    MediaRecorder.AudioSource.MIC,
                    NATIVE_SAMPLE_RATE,
                    AudioFormat.CHANNEL_IN_MONO,
                    AudioFormat.ENCODING_PCM_16BIT,
                    bufSize
                );
                if (nativeAudioRecord.getState() != AudioRecord.STATE_INITIALIZED) {
                    webView.post(() -> webView.evaluateJavascript(
                        "window.__nativeMicError&&window.__nativeMicError('AudioRecord init failed')", null));
                    return;
                }
                nativeAudioRecord.startRecording();
                nativeAudioActive = true;
                // Each chunk = 20ms of audio = 320 samples × 2 bytes = 640 bytes
                final int chunkSamples = NATIVE_SAMPLE_RATE * 20 / 1000;
                final byte[] buf = new byte[chunkSamples * 2];
                nativeAudioThread = new Thread(() -> {
                    while (nativeAudioActive) {
                        int read = nativeAudioRecord.read(buf, 0, buf.length);
                        if (read > 0) {
                            final String b64 = android.util.Base64.encodeToString(
                                buf, 0, read, android.util.Base64.NO_WRAP);
                            webView.post(() -> webView.evaluateJavascript(
                                "window.__nativePcm&&window.__nativePcm('" + b64 + "')", null));
                        }
                    }
                }, "NativeMicThread");
                nativeAudioThread.setDaemon(true);
                nativeAudioThread.start();
            } catch (Exception e) {
                final String msg = e.getMessage();
                webView.post(() -> webView.evaluateJavascript(
                    "window.__nativeMicError&&window.__nativeMicError('" + msg + "')", null));
            }
        }

        @JavascriptInterface
        public void closeNativeMic() {
            nativeAudioActive = false;
            if (nativeAudioRecord != null) {
                try { nativeAudioRecord.stop(); nativeAudioRecord.release(); } catch (Exception ignored) {}
                nativeAudioRecord = null;
            }
            nativeAudioThread = null;
        }
    }

    // ── Hardware PTT key forwarding ───────────────────────────────────────────
    // Inrico T320 PTT fires KEYCODE_PTT (280). We intercept it here, acquire a
    // wake lock to ensure the screen is bright, then inject a synthetic keydown
    // event into the WebView so the React app's document.addEventListener fires.

    private boolean isPttKey(int keyCode) {
        return keyCode == KEYCODE_PTT;
    }

    // T320 PTT arrives via dispatchKeyEvent (not onKeyDown) — intercept here.
    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        if (webView == null) return super.dispatchKeyEvent(event);
        int keyCode = event.getKeyCode();
        int action  = event.getAction();

        if (isPttKey(keyCode) && event.getRepeatCount() == 0) {
            if (action == KeyEvent.ACTION_DOWN) {
                if (pttWakeLock != null && !pttWakeLock.isHeld())
                    pttWakeLock.acquire(10 * 60 * 1000L);
                moveTaskToFront();
                // Forward the REAL KeyEvent to the WebView BEFORE evaluateJavascript.
                // A genuine hardware KeyEvent activates the Blink renderer frame
                // (user-gesture context) via Android's IPC queue. Because IPC is FIFO,
                // the keydown is processed first (frame activated), then evaluateJavascript
                // runs second — inside an activated frame where getUserMedia is permitted
                // without any screen tap.
                super.dispatchKeyEvent(event);
                webView.evaluateJavascript(
                    "if(typeof window.__pttDetect==='function'){window.__pttDetect(" + keyCode + ");}else if(typeof window.__pttDown==='function'){window.__pttDown();}",
                    null
                );
                return true;
            }
            if (action == KeyEvent.ACTION_UP) {
                if (pttWakeLock != null && pttWakeLock.isHeld())
                    pttWakeLock.release();
                super.dispatchKeyEvent(event);
                webView.evaluateJavascript(
                    "if(typeof window.__pttUp==='function'){window.__pttUp();}",
                    null
                );
                return true;
            }
        }

        // Red button (KEYCODE_INRICO_SIDE 293) — long press (800ms) triggers SOS
        if (keyCode == KEYCODE_INRICO_SIDE && event.getRepeatCount() == 0) {
            if (action == KeyEvent.ACTION_DOWN) {
                final WebView wv = webView;
                sosRunnable = () -> wv.evaluateJavascript(
                    "if(typeof window.__sosLongPress==='function'){window.__sosLongPress();}",
                    null
                );
                sosHandler.postDelayed(sosRunnable, 800);
                return true;
            }
            if (action == KeyEvent.ACTION_UP) {
                if (sosRunnable != null) { sosHandler.removeCallbacks(sosRunnable); sosRunnable = null; }
                return true;
            }
        }

        // Detect mode: forward any non-PTT key so user can bind a different key
        if (action == KeyEvent.ACTION_DOWN && event.getRepeatCount() == 0) {
            webView.evaluateJavascript(
                "if(typeof window.__pttDetect==='function'){window.__pttDetect(" + keyCode + ");}",
                null
            );
        }

        return super.dispatchKeyEvent(event);
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (alerterWakeLock != null && alerterWakeLock.isHeld()) alerterWakeLock.release();
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

    /** Dispatch a synthetic touch at (1,1) into the WebView to satisfy Android's
     *  user-gesture requirement for getUserMedia before evaluateJavascript fires. */
    private void injectTouch(int action) {
        try {
            long now = android.os.SystemClock.uptimeMillis();
            android.view.MotionEvent ev = android.view.MotionEvent.obtain(now, now, action, 1f, 1f, 0);
            webView.dispatchTouchEvent(ev);
            ev.recycle();
        } catch (Exception ignored) {}
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

    private void requestNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                    != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(this,
                    new String[]{ Manifest.permission.POST_NOTIFICATIONS },
                    1002);
            }
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
