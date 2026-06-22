package com.carecallai.app;

import android.Manifest;
import android.app.DownloadManager;
import android.content.Context;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.view.KeyEvent;
import android.view.WindowManager;
import android.webkit.CookieManager;
import android.webkit.GeolocationPermissions;
import android.webkit.PermissionRequest;
import android.webkit.URLUtil;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static final int MIC_PERMISSION_REQUEST = 1001;

    // Inrico T320 / PoC handset keycodes for the hardware PTT button
    private static final int KEYCODE_PTT          = 280;
    private static final int KEYCODE_INRICO_SIDE  = 293;
    private static final int KEYCODE_MENU_PTT     = 139;

    private WebView webView;
    private boolean keepScreenOn = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        requestMicPermission();

        webView = getBridge().getWebView();

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

    // ── Hardware PTT key forwarding ────────────────────────────────────────────
    // Inrico T320 PTT key fires KEYCODE_PTT (280) at Android level. Some PoC
    // firmware consumes it before the WebView sees it. We intercept here and
    // inject the keydown/keyup event directly into the WebView via JS so our
    // document.addEventListener('keydown') handler in the app always fires.

    private boolean isPttKey(int keyCode) {
        return keyCode == KEYCODE_PTT || keyCode == KEYCODE_INRICO_SIDE || keyCode == KEYCODE_MENU_PTT;
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (isPttKey(keyCode) && webView != null) {
            webView.evaluateJavascript(
                "document.dispatchEvent(new KeyboardEvent('keydown',{keyCode:" + keyCode + ",bubbles:true,cancelable:true}));",
                null
            );
            return true; // consumed — don't let system do anything else with PTT
        }
        return super.onKeyDown(keyCode, event);
    }

    @Override
    public boolean onKeyUp(int keyCode, KeyEvent event) {
        if (isPttKey(keyCode) && webView != null) {
            webView.evaluateJavascript(
                "document.dispatchEvent(new KeyboardEvent('keyup',{keyCode:" + keyCode + ",bubbles:true,cancelable:true}));",
                null
            );
            return true;
        }
        return super.onKeyUp(keyCode, event);
    }

    // ── Keep screen on (called from JS via window.setKeepScreenOn) ─────────────
    // The Web Wake Lock API works in modern WebView but this is the reliable
    // Android-level fallback for older firmware on PoC handsets.

    @Override
    protected void onResume() {
        super.onResume();
        // Re-read the localStorage flag each time app comes to foreground
        if (webView != null) {
            webView.evaluateJavascript(
                "(function(){var v=localStorage.getItem('radio_keep_awake');return v;})()",
                value -> {
                    boolean on = "'true'".equals(value);
                    runOnUiThread(() -> applyKeepScreenOn(on));
                }
            );
        }
    }

    private void applyKeepScreenOn(boolean on) {
        if (on) {
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        } else {
            getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        }
        keepScreenOn = on;
    }

    // ─────────────────────────────────────────────────────────────────────────

    private void requestMicPermission() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO)
                != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this,
                    new String[]{Manifest.permission.RECORD_AUDIO},
                    MIC_PERMISSION_REQUEST);
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == MIC_PERMISSION_REQUEST) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                // Microphone granted — WebView getUserMedia will work
            } else {
                Toast.makeText(this, "Microphone permission is needed for radio", Toast.LENGTH_LONG).show();
            }
        }
    }
}
