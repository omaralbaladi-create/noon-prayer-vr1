(function () {
  // Web Push: lets the phone show the prayer notification even when the app is closed.
  //
  // How it works:
  //  - The app computes the next 14 days of prayer times itself (so no location is ever sent).
  //  - It sends only a list of "fire at this time with this text" rows, plus the browser's
  //    anonymous push address, to the small push server (APP_CONFIG.pushServerUrl).
  //  - The server wakes the phone at each time. The service worker shows the notification.
  //  - The app re-sends the list whenever settings/location change and once per day on open.

  const DAYS_AHEAD = 14;
  const SYNC_KEY = "noor-push-sync";
  const VAPID_KEY = "noor-push-vapid";
  const DEBOUNCE_MS = 2500;
  const RETRY_MS = 30000;
  const PRAYERS = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

  let timer = null;
  let syncing = false;
  let state = "off"; // off | unavailable | needs-permission | active | error
  let message = "";

  function serverUrl() {
    return String(window.APP_CONFIG?.pushServerUrl || "").replace(/\/+$/, "");
  }

  function lang() {
    return window.I18N?.getLang?.() === "en" ? "en" : "ar";
  }

  function settings() {
    return window.APP_STATE.settings.notifications;
  }

  function supported() {
    if (window.NoorNative) return false; // the Android app schedules its own alarms
    return !!(serverUrl() && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window);
  }

  function emit() {
    window.dispatchEvent(new Event("push-changed"));
  }

  function setState(next, text) {
    state = next;
    message = text || "";
    emit();
  }

  function readStore(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || "null");
    } catch (_) {
      return null;
    }
  }

  function writeStore(key, value) {
    try {
      if (value == null) localStorage.removeItem(key);
      else localStorage.setItem(key, JSON.stringify(value));
    } catch (_) {}
  }

  function b64uToBytes(text) {
    const pad = "=".repeat((4 - (text.length % 4)) % 4);
    const raw = atob((text + pad).replace(/-/g, "+").replace(/_/g, "/"));
    const out = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
    return out;
  }

  function sameKey(buffer, bytes) {
    if (!buffer) return false;
    const a = new Uint8Array(buffer);
    if (a.length !== bytes.length) return false;
    for (let i = 0; i < a.length; i += 1) if (a[i] !== bytes[i]) return false;
    return true;
  }

  function hash(text) {
    let h = 5381;
    for (let i = 0; i < text.length; i += 1) h = ((h * 33) ^ text.charCodeAt(i)) >>> 0;
    return h.toString(36);
  }

  async function api(path, body) {
    const res = await fetch(serverUrl() + path, {
      method: body ? "POST" : "GET",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined
    });
    let json = null;
    try {
      json = await res.json();
    } catch (_) {}
    return { ok: res.ok, status: res.status, json };
  }

  // ---------------------------------------------------------------
  // Schedule
  // ---------------------------------------------------------------
  function buildSchedule() {
    const cfg = settings();
    const alerts = window.Alerts;
    if (!window.Prayer?.buildPrayerTimes || !alerts?.messages) return [];

    const offset = Number(cfg.reminderOffset) || 0;
    const language = lang();
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

        // Same rule as the in-app alerts: with an early reminder only that one is sent.
        const at = offset > 0 ? when.getTime() - offset * 60000 : when.getTime();
        if (at <= now + 5000) return;

        const m = alerts.messages(key, offset);
        rows.push({
          t: at,
          title: m.title,
          body: m.body,
          tag: `noor-${key}-${offset > 0 ? "pre" : "at"}`,
          key,
          lang: language
        });
      });
    }

    // buildPrayerTimes remembers the last date it was given; point it back at today.
    window.Prayer.buildPrayerTimes(new Date());

    rows.sort((a, b) => a.t - b.t);
    return rows;
  }

  // ---------------------------------------------------------------
  // Subscription
  // ---------------------------------------------------------------
  async function serverKey() {
    const cached = readStore(VAPID_KEY);
    if (cached && cached.url === serverUrl() && cached.key) return cached.key;

    const r = await api("/vapid");
    if (!r.ok || !r.json?.publicKey) throw new Error("vapid");
    writeStore(VAPID_KEY, { url: serverUrl(), key: r.json.publicKey });
    return r.json.publicKey;
  }

  async function getSubscription(create) {
    const reg = await navigator.serviceWorker.ready;
    const keyText = await serverKey();
    const keyBytes = b64uToBytes(keyText);
    let sub = await reg.pushManager.getSubscription();

    // A subscription made for a different server key can never receive our pushes.
    if (sub && !sameKey(sub.options?.applicationServerKey, keyBytes)) {
      await sub.unsubscribe().catch(() => {});
      sub = null;
    }
    if (!sub && create) {
      sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes });
    }
    return sub;
  }

  // ---------------------------------------------------------------
  // Sync
  // ---------------------------------------------------------------
  function wanted() {
    return supported() && settings().enabled && Notification.permission === "granted";
  }

  async function turnOff() {
    const saved = readStore(SYNC_KEY);
    writeStore(SYNC_KEY, null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await api("/unsubscribe", { endpoint: sub.endpoint }).catch(() => {});
        await sub.unsubscribe().catch(() => {});
      } else if (saved?.endpoint) {
        await api("/unsubscribe", { endpoint: saved.endpoint }).catch(() => {});
      }
    } catch (_) {}
  }

  async function syncNow(force) {
    if (syncing) return;

    if (!supported()) {
      setState("unavailable");
      return;
    }

    if (!settings().enabled) {
      if (readStore(SYNC_KEY)) await turnOff();
      setState("off");
      return;
    }

    if (Notification.permission !== "granted") {
      setState(Notification.permission === "denied" ? "blocked" : "needs-permission");
      return;
    }

    syncing = true;
    try {
      const sub = await getSubscription(true);
      const rows = buildSchedule();
      const signature = hash(JSON.stringify(rows.map((r) => [r.t, r.title, r.tag])) + "|" + sub.endpoint);
      const saved = readStore(SYNC_KEY);

      if (!force && saved && saved.hash === signature && saved.url === serverUrl()) {
        setState("active");
        return;
      }

      const r = await api("/subscribe", { subscription: sub.toJSON(), schedule: rows });

      if (r.status === 429) {
        // The server allows one update every few seconds: try again shortly.
        clearTimeout(timer);
        timer = setTimeout(() => syncNow(force), RETRY_MS);
        return;
      }
      if (!r.ok) throw new Error(`subscribe ${r.status}`);

      writeStore(SYNC_KEY, { hash: signature, url: serverUrl(), endpoint: sub.endpoint, at: Date.now() });
      setState("active");
    } catch (err) {
      console.error("push sync failed", err);
      setState("error");
      // Offline or the server is briefly unreachable: retry later.
      clearTimeout(timer);
      timer = setTimeout(() => syncNow(force), 5 * 60 * 1000);
    } finally {
      syncing = false;
    }
  }

  function scheduleSync(force) {
    if (!supported() && state === "unavailable") return;
    clearTimeout(timer);
    timer = setTimeout(() => syncNow(force), DEBOUNCE_MS);
  }

  // ---------------------------------------------------------------
  // Test: server sends a real push about a minute from now
  // ---------------------------------------------------------------
  async function test() {
    if (!supported()) {
      setState("unavailable");
      return { ok: false, reason: "unavailable" };
    }
    if (!settings().enabled) return { ok: false, reason: "disabled" };

    const perm = await window.Alerts.ensurePermission();
    if (perm !== "granted") {
      setState(perm === "denied" ? "blocked" : "needs-permission");
      return { ok: false, reason: "permission" };
    }

    try {
      const sub = await getSubscription(true);
      // Make sure the server knows this device before asking it to send.
      clearTimeout(timer);
      await syncNow(true);
      if (state === "error") return { ok: false, reason: "error" };

      const m = lang() === "ar"
        ? { title: "اختبار الإشعارات", body: "وصلك هذا الإشعار من خادم التنبيهات. التنبيهات ستعمل حتى مع إغلاق التطبيق." }
        : { title: "Notification test", body: "This arrived from the push server. Prayer alerts will work even when the app is closed." };

      const r = await api("/test", { endpoint: sub.endpoint, title: m.title, body: m.body, lang: lang() });
      if (r.status === 429) return { ok: false, reason: "rate" };
      if (!r.ok) return { ok: false, reason: "error" };
      return { ok: true };
    } catch (err) {
      console.error("push test failed", err);
      return { ok: false, reason: "error" };
    }
  }

  // ---------------------------------------------------------------
  // Start
  // ---------------------------------------------------------------
  function start() {
    if (!supported()) {
      setState("unavailable");
      return;
    }

    window.addEventListener("alerts-changed", () => scheduleSync(false));
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) scheduleSync(false);
    });
    window.addEventListener("online", () => scheduleSync(false));

    // A push that arrives while the page is open: let the in-app alerts also react (adhan audio).
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data && event.data.type === "PRAYER_PUSH") window.Alerts?.check?.();
    });

    scheduleSync(false);
  }

  window.Push = {
    start,
    scheduleSync,
    syncNow,
    test,
    supported,
    wanted,
    status: () => ({ state, message })
  };
})();
