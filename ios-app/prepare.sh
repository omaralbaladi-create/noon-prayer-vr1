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
  proj.save
'
