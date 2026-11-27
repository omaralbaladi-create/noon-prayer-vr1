#!/usr/bin/env bash
# Builds the iOS project from the web files. Run from the repository root on a Mac (CI: macos-26).
# Used by both ios.yml (simulator check) and ios-release.yml (signed TestFlight build).
set -euo pipefail

WWW=ios-app/www
rm -rf "$WWW"
mkdir -p "$WWW"
cp index.html privacy.html manifest.json "$WWW/"
cp -r assets "$WWW/assets"

# iPhone alert scheduler: define window.NoorNative before native.js runs (the web files stay untouched).
cp ios-app/ios-bridge.js "$WWW/ios-bridge.js"
perl -0pi -e 's#(<script src="./assets/js/native.js"></script>)#<script src="./ios-bridge.js"></script>\n  $1#' "$WWW/index.html"
grep -n "ios-bridge.js\|assets/js/native.js" "$WWW/index.html"
test "$(grep -c 'ios-bridge.js' "$WWW/index.html")" -eq 1

cd ios-app
rm -rf ios
npm install --no-audit --no-fund
npx cap add ios
npx cap sync ios

APP=ios/App/App

# App icon (1024 px, no transparency) and launch screen.
ls "$APP/Assets.xcassets/AppIcon.appiconset" "$APP/Assets.xcassets/Splash.imageset"
for f in "$APP"/Assets.xcassets/AppIcon.appiconset/*.png; do cp art/AppIcon-1024.png "$f"; done
for f in "$APP"/Assets.xcassets/Splash.imageset/*.png; do cp art/Splash-2732.png "$f"; done

# Info.plist: permission texts, and no export-compliance question on every upload.
PLIST="$APP/Info.plist"
add() { /usr/libexec/PlistBuddy -c "Add :$1 $2 $3" "$PLIST" 2>/dev/null || /usr/libexec/PlistBuddy -c "Set :$1 $3" "$PLIST"; }
add NSLocationWhenInUseUsageDescription string "NoorPrayer uses your location to calculate accurate prayer times and the Qibla direction."
add NSMotionUsageDescription string "NoorPrayer uses the compass to show the Qibla direction."
add ITSAppUsesNonExemptEncryption bool false

# Adhan notification sounds (iOS limit: 30 seconds) go into the app bundle.
cp sounds/*.caf "$APP/"

# Widget: a small plugin the web page uses to hand the prayer times to the widget (through an App Group),
# the app's own main screen class that registers it, and the WidgetKit extension itself.
cp native/NoorWidgetPlugin.swift native/MainViewController.swift "$APP/"
cp widget/App.entitlements "$APP/App.entitlements"
mkdir -p ios/App/NoorWidget
cp widget/NoorWidget.swift widget/Info.plist widget/NoorWidget.entitlements ios/App/NoorWidget/
perl -pi -e 's/customClass="CAPBridgeViewController" customModule="Capacitor"/customClass="MainViewController" customModule="App"/' "$APP/Base.lproj/Main.storyboard"
grep -q 'customClass="MainViewController" customModule="App"' "$APP/Base.lproj/Main.storyboard"

cd ios/App
ruby -e '
  require "xcodeproj"
  proj = Xcodeproj::Project.open("App.xcodeproj")
  target = proj.targets.find { |t| t.name == "App" }
  group = proj.main_group["App"]
  Dir["App/*.caf"].sort.each do |path|
    name = File.basename(path)
    next if group.files.any? { |f| f.path == name }
    ref = group.new_file(name)
    target.resources_build_phase.add_file_reference(ref)
    puts "added #{name}"
  end

  # Our own Swift files and the App Group entitlement for the app.
  %w[NoorWidgetPlugin.swift MainViewController.swift].each do |name|
    next if group.files.any? { |f| f.path == name }
    target.source_build_phase.add_file_reference(group.new_file(name))
    puts "added #{name}"
  end
  group.new_file("App.entitlements")
  target.build_configurations.each do |c|
    c.build_settings["CODE_SIGN_ENTITLEMENTS"] = "App/App.entitlements"
  end

  # Widget extension (WidgetKit), embedded in the app.
  widget = proj.new_target(:app_extension, "NoorWidget", :ios, "16.0", proj.products_group, :swift)
  wgroup = proj.main_group.new_group("NoorWidget", "NoorWidget")
  widget.add_file_references([wgroup.new_file("NoorWidget.swift")])
  wgroup.new_file("Info.plist")
  wgroup.new_file("NoorWidget.entitlements")
  widget.build_configurations.each do |c|
    s = c.build_settings
    s["PRODUCT_BUNDLE_IDENTIFIER"] = "com.ageandcalculate.noorprayer.widget"
    s["PRODUCT_NAME"] = "$(TARGET_NAME)"
    s["INFOPLIST_FILE"] = "NoorWidget/Info.plist"
    s["GENERATE_INFOPLIST_FILE"] = "NO"
    s["CODE_SIGN_ENTITLEMENTS"] = "NoorWidget/NoorWidget.entitlements"
    s["CODE_SIGN_STYLE"] = "Automatic"
    s["SWIFT_VERSION"] = "5.0"
    s["TARGETED_DEVICE_FAMILY"] = "1,2"
    s["IPHONEOS_DEPLOYMENT_TARGET"] = "16.0"
    s["SKIP_INSTALL"] = "YES"
    s["MARKETING_VERSION"] = "1.0"
    s["CURRENT_PROJECT_VERSION"] = "1"
    s["LD_RUNPATH_SEARCH_PATHS"] = ["$(inherited)", "@executable_path/Frameworks", "@executable_path/../../Frameworks"]
  end
  target.add_dependency(widget)
  embed = target.new_copy_files_build_phase("Embed Foundation Extensions")
  embed.symbol_dst_subfolder_spec = :plug_ins
  build_file = embed.add_file_reference(widget.product_reference)
  build_file.settings = { "ATTRIBUTES" => ["RemoveHeadersOnCopy"] }
  puts "added widget target"

  proj.save
'
