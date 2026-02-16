package com.carecallai.app;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static final int MIC_PERMISSION_REQUEST = 1001;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Request microphone permission at startup so WebView can use getUserMedia
        requestMicPermission();

        // After the bridge is initialized, configure WebView
        WebView webView = getBridge().getWebView();

        // Add download listener
        webView.setDownloadListener((url, userAgent, contentDisposition, mimetype, contentLength) -> {
            try {
                Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(intent);
            } catch (Exception e) {
                Toast.makeText(this, "Cannot open download link", Toast.LENGTH_SHORT).show();
            }
        });

        // Override WebChromeClient to auto-grant microphone permission to WebView
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                // Auto-grant audio/video capture permissions to the WebView
                // (the Android runtime permission is already requested above)
                runOnUiThread(() -> {
                    String[] resources = request.getResources();
                    for (String resource : resources) {
                        if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(resource) ||
                            PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(resource)) {
                            request.grant(resources);
                            return;
                        }
                    }
                    request.deny();
                });
            }
        });
    }

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
                // Microphone permission granted — WebView getUserMedia will now work
            } else {
                Toast.makeText(this, "Microphone permission is needed for voice-to-text", Toast.LENGTH_LONG).show();
            }
        }
    }
}
