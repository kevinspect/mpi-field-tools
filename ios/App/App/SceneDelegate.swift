import UIKit
import Capacitor
import FirebaseAuth

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        // When UISceneStoryboardFile is configured, iOS creates the scene window and
        // instantiates Main.storyboard before this delegate method is called. Keep that
        // storyboard-backed CAPBridgeViewController instead of replacing it with a bare
        // programmatic controller, which can leave Capacitor without its configured web
        // view and present a blank screen on launch.
        if window == nil {
            let storyboard = UIStoryboard(name: "Main", bundle: nil)
            let sceneWindow = UIWindow(windowScene: windowScene)
            sceneWindow.rootViewController = storyboard.instantiateInitialViewController()
            sceneWindow.makeKeyAndVisible()
            window = sceneWindow
        }

        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        URLContexts.forEach { _ = Auth.auth().canHandle($0.url) }
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }
}
