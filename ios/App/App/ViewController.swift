import UIKit
import Capacitor
import AVFoundation
import WebKit

class ViewController: CAPBridgeViewController {

    override func viewDidLoad() {
        super.viewDidLoad()
        requestMicrophonePermission()
    }

    // Request microphone permission at launch so it's ready when WebView needs it
    private func requestMicrophonePermission() {
        AVAudioSession.sharedInstance().requestRecordPermission { granted in
            if granted {
                print("[ViewController] Microphone permission granted")
            } else {
                print("[ViewController] Microphone permission denied")
            }
        }
    }

    // Auto-grant media capture (microphone/camera) permission requests from the WebView
    // This is the iOS equivalent of Android's onPermissionRequest
    @available(iOS 15.0, *)
    func webView(_ webView: WKWebView,
                 requestMediaCapturePermissionFor origin: WKSecurityOrigin,
                 initiatedByFrame frame: WKFrameInfo,
                 type: WKMediaCaptureType,
                 decisionHandler: @escaping (WKPermissionDecision) -> Void) {
        decisionHandler(.grant)
    }
}
