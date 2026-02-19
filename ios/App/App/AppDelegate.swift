import UIKit
import Capacitor
import UserNotifications

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate, UNUserNotificationCenterDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // ── One-time fix: delete stale WebKit data from filesystem ─────────
        // A cached service worker can cause a blank screen in WKWebView.
        // FileManager.removeItem is SYNCHRONOUS — guaranteed to finish before
        // any WebView code runs. Only executes once (flagged by UserDefaults).
        let clearKey = "didNukeWebKitData_v3"
        if !UserDefaults.standard.bool(forKey: clearKey) {
            let fm = FileManager.default
            if let libDir = fm.urls(for: .libraryDirectory, in: .userDomainMask).first {
                let webkitDir = libDir.appendingPathComponent("WebKit")
                if fm.fileExists(atPath: webkitDir.path) {
                    try? fm.removeItem(at: webkitDir)
                }
                let cachesDir = libDir.appendingPathComponent("Caches")
                if fm.fileExists(atPath: cachesDir.path) {
                    try? fm.removeItem(at: cachesDir)
                }
            }
            UserDefaults.standard.set(true, forKey: clearKey)
        }

        // Set notification delegate for foreground notifications
        UNUserNotificationCenter.current().delegate = self

        // Register for remote notifications
        application.registerForRemoteNotifications()

        return true
    }

    // MARK: - Push Notification Registration

    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        // Forward token to Capacitor's PushNotifications plugin
        NotificationCenter.default.post(
            name: .capacitorDidRegisterForRemoteNotifications,
            object: deviceToken
        )
    }

    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        NotificationCenter.default.post(
            name: .capacitorDidFailToRegisterForRemoteNotifications,
            object: error
        )
    }

    // MARK: - Foreground Notification Display

    func userNotificationCenter(_ center: UNUserNotificationCenter,
                                willPresent notification: UNNotification,
                                withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        // Show notifications even when app is in foreground
        if #available(iOS 14.0, *) {
            completionHandler([.banner, .sound, .badge])
        } else {
            completionHandler([.alert, .sound, .badge])
        }
    }

    func userNotificationCenter(_ center: UNUserNotificationCenter,
                                didReceive response: UNNotificationResponse,
                                withCompletionHandler completionHandler: @escaping () -> Void) {
        // Handle notification tap
        let userInfo = response.notification.request.content.userInfo
        NotificationCenter.default.post(
            name: Notification.Name("pushNotificationActionPerformed"),
            object: nil,
            userInfo: userInfo
        )
        completionHandler()
    }

    // MARK: - App Lifecycle

    func applicationWillResignActive(_ application: UIApplication) {}

    func applicationDidEnterBackground(_ application: UIApplication) {}

    func applicationWillEnterForeground(_ application: UIApplication) {}

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Clear badge count when app becomes active
        UIApplication.shared.applicationIconBadgeNumber = 0
    }

    func applicationWillTerminate(_ application: UIApplication) {}

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }
}
