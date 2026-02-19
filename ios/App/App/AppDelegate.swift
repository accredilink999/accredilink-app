import UIKit
import Capacitor
import UserNotifications
import WebKit

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate, UNUserNotificationCenterDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // ── NUCLEAR FIX: Synchronously delete WebKit data directory ───────
        // A stale cached service worker causes a blank/black screen in WKWebView.
        // Async cache clearing (WKWebsiteDataStore.removeData) doesn't complete
        // before Capacitor loads the URL, so we delete the files directly from
        // the filesystem. This is SYNCHRONOUS and guaranteed to finish before
        // any WebView code runs.
        // Only runs once per app update (flagged by UserDefaults).
        let clearKey = "didNukeWebKitData_v3"
        if !UserDefaults.standard.bool(forKey: clearKey) {
            let fm = FileManager.default
            if let libDir = fm.urls(for: .libraryDirectory, in: .userDomainMask).first {
                // Delete the entire WebKit data directory (service workers, caches, etc.)
                let webkitDir = libDir.appendingPathComponent("WebKit")
                if fm.fileExists(atPath: webkitDir.path) {
                    do {
                        try fm.removeItem(at: webkitDir)
                        print("[AppDelegate] DELETED WebKit directory — stale SW removed")
                    } catch {
                        print("[AppDelegate] Failed to delete WebKit dir: \(error)")
                    }
                }
                // Also delete Caches directory which can hold stale web content
                let cachesDir = libDir.appendingPathComponent("Caches")
                if fm.fileExists(atPath: cachesDir.path) {
                    do {
                        try fm.removeItem(at: cachesDir)
                        print("[AppDelegate] DELETED Caches directory")
                    } catch {
                        print("[AppDelegate] Failed to delete Caches dir: \(error)")
                    }
                }
            }
            UserDefaults.standard.set(true, forKey: clearKey)
            UserDefaults.standard.synchronize()
            print("[AppDelegate] One-time WebKit data nuke complete")
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
