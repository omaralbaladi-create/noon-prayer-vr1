(function () {
  // Android app bridge.
  //
  // Inside the NoorPrayer Android app (a WebView), window.NoorNative exists. Then:
  //  - the app sends the next 30 days of alerts to Android, which sets a real alarm for the next one,
  //  - at prayer time Android plays the full adhan (even when the app is closed / phone locked),
  //  - the in-app timer (alerts.js) and web push (push.js) stand down so nothing fires twice.
  // In a normal browser none of this runs.

  const DAYS_AHEAD = 30;
  const DEBOUNCE_MS = 1200;
  const PRAYERS = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

  let timer = null;
  let lastCount = 0;

  function bridge() {
    return window.NoorNative || null;
  }

  function isNative() {
    return !!bridge();
  }

  function settings() {
    return window.APP_STATE.settings.notifications;
  }

  function lang() {
    return window.I18N?.getLang?.() === "en" ? "en" : "ar";
  }

  function permissions() {
    try {
      return JSON.parse(bridge().permissions() || "{}");
    } catch (_) {
      return {};
    }
  }

  function row(at, key, m, audio, notify, voice) {
    return { t: at, key: `${key}-${audio ? "adhan" : "pre"}-${at}`, title: m.title, body: m.body, voice, audio, notify };
  }

  function buildSchedule() {
    const cfg = settings();
    const alerts = window.Alerts;
    if (!window.Prayer?.buildPrayerTimes || !alerts?.messages) return [];
    if (!cfg.enabled && !cfg.audioEnabled) return [];

    const offset = Number(cfg.reminderOffset) || 0;
    const voice = cfg.adhanAudio === "madinah" ? "madinah" : "makkah";
    const now = Date.now();
    const base = new Date();
    const rows = [];

    for (let d = 0; d < DAYS_AHEAD; d += 1) {
      const day = new Date(base.getFullYear(), base.getMonth(), base.getDate() + d, 12, 0, 0);
      const times = window.Prayer.buildPrayerTimes(day);

      PRAYERS.forEach((key) => {
        if (cfg.prayers && cfg.prayers[key] === false) return;
        const when = times[key];
        if (!when || Number.isNaN(when.getTime())) return;
        const at = when.getTime();

        // Early reminder: notification only.
        if (offset > 0 && cfg.enabled) {
          const preAt = at - offset * 60000;
          if (preAt > now + 5000) rows.push(row(preAt, key, alerts.messages(key, offset), false, true, voice));
        }

        // At prayer time: adhan audio (with its own notification) or, with audio off, a plain notification.
        const audio = !!cfg.audioEnabled;
        const notify = !!cfg.enabled && offset === 0;
        if ((audio || notify) && at > now + 5000) {
          rows.push(row(at, key, alerts.messages(key, 0), audio, notify, voice));
        }
      });
    }

    // buildPrayerTimes remembers the last date it was given; point it back at today.
    window.Prayer.buildPrayerTimes(new Date());

    rows.sort((a, b) => a.t - b.t);
    return rows;
  }

  function syncNow() {
    if (!isNative()) return 0;
    try {
      const n = bridge().schedule(JSON.stringify(buildSchedule()));
      lastCount = Number(n) || 0;
    } catch (err) {
      console.error("native schedule failed", err);
    }
    window.dispatchEvent(new Event("native-changed"));
    return lastCount;
  }

  function scheduleSync() {
    if (!isNative()) return;
    clearTimeout(timer);
    timer = setTimeout(syncNow, DEBOUNCE_MS);
  }

  function requestPermissions() {
    if (isNative()) bridge().requestPermissions();
  }

  // Plays/shows one alert right now so the sound and notification can be checked.
  function test() {
    if (!isNative()) return false;
    const cfg = settings();
    const m = window.Alerts.messages("dhuhr", 0);
    const audio = !!cfg.audioEnabled;
    const notify = !!cfg.enabled;
    const title = lang() === "ar" ? "اختبار التنبيه" : "Test alert";
    if (!audio && !notify) return false;
    const voice = cfg.adhanAudio === "madinah" ? "madinah" : "makkah";
    bridge().test(JSON.stringify({ t: Date.now(), key: "test", title, body: m.title, voice, audio, notify: notify || audio }));
    return true;
  }

  // One of: off | needs-notifications | needs-battery | on
  function status() {
    if (!isNative()) return "off";
    const cfg = settings();
    if (!cfg.enabled && !cfg.audioEnabled) return "off";
    const p = permissions();
    if (p.notifications === false) return "needs-notifications";
    if (p.battery === false) return "needs-battery";
    return "on";
  }

  function start() {
    if (!isNative()) return;

    document.documentElement.classList.add("is-native-app");
    window.addEventListener("alerts-changed", scheduleSync);
    window.addEventListener("online", scheduleSync);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) scheduleSync();
    });
    window.addEventListener("native-permissions", () => window.dispatchEvent(new Event("native-changed")));

    // Re-send on every launch so the 30-day window keeps rolling forward.
    syncNow();
  }

  window.Native = { isNative, start, syncNow, scheduleSync, requestPermissions, permissions, test, status };
})();
