import Expo
import React
import ReactAppDependencyProvider
import AVFAudio
import WebRTC

@UIApplicationMain
public class AppDelegate: ExpoAppDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ExpoReactNativeFactoryDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  public override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let delegate = ReactNativeDelegate()
    let factory = ExpoReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory
    bindReactNativeFactory(factory)

#if os(iOS) || os(tvOS)
    window = UIWindow(frame: UIScreen.main.bounds)
    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: launchOptions)
#endif

    // Configure iOS AVAudioSession for WebRTC: PlayAndRecord + DefaultToSpeaker + voiceChat
    do {
      let rtcSession = RTCAudioSession.sharedInstance()
      rtcSession.lockForConfiguration()
      defer { rtcSession.unlockForConfiguration() }
      try rtcSession.setCategory(AVAudioSession.Category.playAndRecord,
                                 with: [.defaultToSpeaker, .allowBluetooth, .allowBluetoothA2DP])
      try rtcSession.setMode(AVAudioSession.Mode.voiceChat)
      try rtcSession.setActive(true)
      // Some iOS versions require an explicit override to loudspeaker after activation
      do {
        try AVAudioSession.sharedInstance().overrideOutputAudioPort(.speaker)
      } catch {
        // no-op
      }
    } catch {
      // no-op if configuration fails
    }

    // Re-assert loudspeaker on route changes (e.g., when WebRTC or Bluetooth adjusts the route)
    NotificationCenter.default.addObserver(forName: AVAudioSession.routeChangeNotification,
                                           object: nil,
                                           queue: .main) { _ in
      let rtcSession = RTCAudioSession.sharedInstance()
      rtcSession.lockForConfiguration()
      defer { rtcSession.unlockForConfiguration() }
      do {
        try AVAudioSession.sharedInstance().overrideOutputAudioPort(.speaker)
      } catch {
        // no-op
      }
    }

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  // Linking API
  public override func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    return super.application(app, open: url, options: options) || RCTLinkingManager.application(app, open: url, options: options)
  }

  // Universal Links
  public override func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    let result = RCTLinkingManager.application(application, continue: userActivity, restorationHandler: restorationHandler)
    return super.application(application, continue: userActivity, restorationHandler: restorationHandler) || result
  }
}

class ReactNativeDelegate: ExpoReactNativeFactoryDelegate {
  // Extension point for config-plugins

  override func sourceURL(for bridge: RCTBridge) -> URL? {
    // needed to return the correct URL for expo-dev-client.
    bridge.bundleURL ?? bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: ".expo/.virtual-metro-entry")
#else
    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
