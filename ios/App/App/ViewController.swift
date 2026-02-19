import UIKit
import Capacitor
import AVFoundation
import WebKit

class ViewController: CAPBridgeViewController {

    private var pageLoaded = false

    override func viewDidLoad() {
        super.viewDidLoad()

        // Force white background on the view and WebView immediately to prevent
        // a black screen flash while the remote URL (Vercel) loads over the network.
        view.backgroundColor = .white
        webView?.isOpaque = false
        webView?.backgroundColor = .white
        webView?.scrollView.backgroundColor = .white

        // Safety net: if page hasn't loaded after 8 seconds, force reload the URL.
        // Handles edge cases where WebView gets stuck (e.g. failed initial load).
        webView?.navigationDelegate = self
        DispatchQueue.main.asyncAfter(deadline: .now() + 8.0) { [weak self] in
            guard let self = self, !self.pageLoaded else { return }
            print("[ViewController] Page not loaded after 8s — forcing reload")
            if let url = URL(string: "https://care-call-ai-clone.vercel.app") {
                self.webView?.load(URLRequest(url: url))
            }
        }

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

// MARK: - WKNavigationDelegate (track page load for safety-net reload)
extension ViewController: WKNavigationDelegate {
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        pageLoaded = true
        print("[ViewController] Page loaded successfully")
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        print("[ViewController] Navigation failed: \(error.localizedDescription) — retrying")
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) { [weak self] in
            if let url = URL(string: "https://care-call-ai-clone.vercel.app") {
                self?.webView?.load(URLRequest(url: url))
            }
        }
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        print("[ViewController] Provisional navigation failed: \(error.localizedDescription) — retrying")
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) { [weak self] in
            if let url = URL(string: "https://care-call-ai-clone.vercel.app") {
                self?.webView?.load(URLRequest(url: url))
            }
        }
    }
}
