import Foundation
import Capacitor
import WidgetKit

// Lets the web page hand the prayer times to the home screen / lock screen widget.
// The page calls NoorWidget.setData({ json }); the text is saved in the shared App Group and the widget reloads.
@objc(NoorWidgetPlugin)
public class NoorWidgetPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "NoorWidgetPlugin"
    public let jsName = "NoorWidget"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "setData", returnType: CAPPluginReturnPromise)
    ]

    static let appGroup = "group.com.ageandcalculate.noorprayer"

    @objc func setData(_ call: CAPPluginCall) {
        guard let json = call.getString("json") else {
            call.reject("json is missing")
            return
        }
        guard let defaults = UserDefaults(suiteName: NoorWidgetPlugin.appGroup) else {
            call.reject("App Group is not available")
            return
        }
        defaults.set(json, forKey: "prayerData")
        WidgetCenter.shared.reloadAllTimelines()
        call.resolve(["saved": true])
    }
}
