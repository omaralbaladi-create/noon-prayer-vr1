(function () {
  // iPhone bridge. Loaded only inside the NoorPrayer iOS app (a Capacitor WebView); CI injects it into www/index.html.
  //
  // The Android app talks to the page through window.NoorNative (see assets/js/native.js).
  // This file provides the same interface on iOS, using Capacitor's Local Notifications plugin, so native.js,
  // alerts.js and the settings screen work unchanged.
  //
  // iOS differences:
  //  - iOS keeps at most 64 pending local notifications, so only the next ~60 alerts are scheduled. The list is
  //    rebuilt every time the app opens (about 12 days of alerts), so open the app now and then.
  //  - A notification sound can be at most 30 seconds, so the adhan is a 28-second clip (adhan-*.caf in the app bundle).

  const cap = window.Capacitor;
  if (!cap || typeof cap.getPlatform !== "function" || cap.getPlatform() !== "ios") return;
  // Plugins written in Swift are reachable from plain (un-bundled) JavaScript through Capacitor.registerPlugin.
  const LN = (cap.Plugins && cap.Plugins.LocalNotifications) || (typeof cap.registerPlugin === "function" ? cap.registerPlugin("LocalNotifications") : null);
  const MSG_OFF = "الإشعارات مغلقة لتطبيق NoorPrayer. فعّلها من الإعدادات ← الإشعارات ← NoorPrayer.\n\nNotifications are off for NoorPrayer. Turn them on in Settings > Notifications > NoorPrayer.";

  if (!LN) {
    // Plugin missing: still define the bridge so the app knows it is native, and tell the user on Test.
    const names = Object.keys(cap.Plugins || {}).join(", ");
    window.NoorNative = {
      schedule: () => 0,
      permissions: () => JSON.stringify({ notifications: false }),
      requestPermissions() {},
      test() {
        alert("Notification plugin not found. Plugins: " + names);
      },
      privacyOptionsRequired: () => false,
      showPrivacyOptions() {},
    };
    return;
  }

  const MAX_PENDING = 60;
  let notificationsGranted = false;
  let queue = Promise.resolve();

  function emit(name) {
    window.dispatchEvent(new Event(name));
  }

  function refreshPermissions() {
    return LN.checkPermissions()
      .then((p) => {
        notificationsGranted = p.display === "granted";
      })
      .catch(() => {})
      .then(() => emit("native-permissions"));
  }

  // Asks iOS for notification permission the first time; resolves to true when allowed.
  function ensurePermission() {
    return LN.checkPermissions()
      .then((p) => (p.display === "prompt" || p.display === "prompt-with-rationale" ? LN.requestPermissions() : p))
      .then((p) => {
        notificationsGranted = p.display === "granted";
        emit("native-permissions");
        return notificationsGranted;
      });
  }

  function toNotification(row, id) {
    const n = {
      id,
      title: row.title || "NoorPrayer",
      body: row.body || "",
      schedule: { at: new Date(row.t), allowWhileIdle: true },
    };
    if (row.audio) n.sound = row.voice === "madinah" ? "adhan-madinah.caf" : "adhan-makkah.caf";
    return n;
  }

  function replaceSchedule(rows) {
    return LN.getPending()
      .then((res) => (res.notifications && res.notifications.length ? LN.cancel({ notifications: res.notifications.map((x) => ({ id: x.id })) }) : null))
      .then(() => {
        const list = rows.slice(0, MAX_PENDING).map((r, i) => toNotification(r, i + 1));
        return list.length ? LN.schedule({ notifications: list }) : null;
      });
  }

  window.NoorNative = {
    // Returns right away with the number that will be scheduled; the work finishes in the background.
    schedule(json) {
      let rows = [];
      try {
        rows = JSON.parse(json) || [];
      } catch (_) {}
      const count = Math.min(rows.length, MAX_PENDING);
      queue = queue
        .then(() => (rows.length ? ensurePermission() : notificationsGranted))
        .then((granted) => (granted || !rows.length ? replaceSchedule(rows) : null))
        .catch((err) => console.error("ios schedule failed", err));
      return count;
    },

    permissions() {
      return JSON.stringify({ notifications: notificationsGranted });
    },

    requestPermissions() {
      ensurePermission().catch(refreshPermissions);
    },

    // Fires one alert in 3 seconds so the sound can be checked.
    test(json) {
      let row = {};
      try {
        row = JSON.parse(json) || {};
      } catch (_) {}
      row.t = Date.now() + 3000;
      ensurePermission()
        .then((granted) => {
          if (!granted) {
            alert(MSG_OFF);
            return null;
          }
          return LN.schedule({ notifications: [toNotification(row, 999999)] });
        })
        .catch((err) => alert("Notification error: " + (err && err.message ? err.message : err)));
    },

    // Ad consent / privacy options are Android-only for now.
    privacyOptionsRequired() {
      return false;
    },
    showPrivacyOptions() {},
  };

  // Ask for notification permission on first launch (iOS shows its prompt only once).
  ensurePermission().catch(refreshPermissions);
  // Coming back from Settings after granting permission.
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) refreshPermissions();
  });
})();
