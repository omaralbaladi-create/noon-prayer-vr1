import UIKit
import Capacitor

// The app's main screen: the standard Capacitor web view plus our own widget plugin.
class MainViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(NoorWidgetPlugin())
    }
}
