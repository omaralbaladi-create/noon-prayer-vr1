(function () {
  // Prayer alerts: notifications + adhan audio.
  //
  // This runs while the app is open (foreground or background). When the app is
  // fully closed, prayer notifications come from the push server instead
  // (see push.js and the "push" handler in service-worker.js). Both use the same
  // notification tags, so the phone never shows the same prayer twice.

  const FIRED_KEY = "noor-alerts-fired";
  const TICK_MS = 15000;
  const FIRE_WINDOW_MS = 2 * 60 * 1000;
  const PRAYERS = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

  let timer = null;
  let started = false;
  let currentAudio = null;

  function lang() {
    return window.I18N?.getLang?.() === "en" ? "en" : "ar";
  }

  function settings() {
    return window.APP_STATE.settings.notifications;
  }

  function label(key) {
    return window.Prayer?.prayerLabel ? window.Prayer.prayerLabel(key) : key;
  }

  function emitChanged() {
    window.dispatchEvent(new Event("alerts-changed"));
  }

  // ---------------------------------------------------------------
  // Permission / state
  // ---------------------------------------------------------------
  function notificationState() {
    if (!("Notification" in window)) return "unsupported";
    if (!settings().enabled) return "off";
    if (Notification.permission === "granted") return "on";
    if (Notification.permission === "denied") return "blocked";
    return "needs-permission";
  }

  function ensurePermission() {
    if (!("Notification" in window)) return Promise.resolve("unsupported");
    if (Notification.permission !== "default") return Promise.resolve(Notification.permission);

    return Notification.requestPermission().then((p) => {
      emitChanged();
      return p;
    });
  }

  // ---------------------------------------------------------------
  // Fired-alert memory (survives reloads, shared between tabs)
  // ---------------------------------------------------------------
  function readFired() {
    try {
      return JSON.parse(localStorage.getItem(FIRED_KEY) || "{}") || {};
    } catch (_) {
      return {};
    }
  }

  function writeFired(map) {
    try {
      localStorage.setItem(FIRED_KEY, JSON.stringify(map));
    } catch (_) {}
  }

  function dayStamp(date) {
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${date.getFullYear()}-${m}-${d}`;
  }

  function pruneFired(map, now) {
    const keep = new Set([dayStamp(now), dayStamp(new Date(now.getTime() - 86400000))]);
    Object.keys(map).forEach((k) => {
      if (!keep.has(k.split("|")[0])) delete map[k];
    });
  }

  // ---------------------------------------------------------------
  // Notifications
  // ---------------------------------------------------------------
  async function showNotification(title, body, tag) {
    if (!("Notification" in window) || Notification.permission !== "granted") return false;

    const options = {
      body,
      tag,
      icon: "./assets/icons/icon-512.png",
      lang: lang(),
      dir: lang() === "ar" ? "rtl" : "ltr"
    };

    try {
      if ("serviceWorker" in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg && typeof reg.showNotification === "function") {
          await reg.showNotification(title, options);
          return true;
        }
      }
    } catch (_) {
      // fall through to the page-level API
    }

    try {
      new Notification(title, options);
      return true;
    } catch (_) {
      return false;
    }
  }

  // ---------------------------------------------------------------
  // Adhan audio
  // ---------------------------------------------------------------
  function getAudio() {
    const name = settings().adhanAudio === "madinah" ? "madinah" : "makkah";
    return document.getElementById(`adhan-audio-${name}`);
  }

  function allAudio() {
    return ["makkah", "madinah"]
      .map((n) => document.getElementById(`adhan-audio-${n}`))
      .filter(Boolean);
  }

  // Browsers only allow audio that was first started by a user gesture.
  // Play-and-pause muted inside a click so later scheduled playback is allowed.
  function unlockAudio() {
    allAudio().forEach((a) => {
      try {
        a.muted = true;
        const p = a.play();
        const done = () => {
          a.pause();
          a.currentTime = 0;
          a.muted = false;
        };
        if (p && typeof p.then === "function") p.then(done).catch(() => { a.muted = false; });
        else done();
      } catch (_) {
        a.muted = false;
      }
    });
  }

  function armUnlockOnFirstGesture() {
    const handler = () => {
      if (settings().audioEnabled) unlockAudio();
      document.removeEventListener("click", handler, true);
      document.removeEventListener("touchend", handler, true);
    };
    document.addEventListener("click", handler, true);
    document.addEventListener("touchend", handler, true);
  }

  function hideStopBanner() {
    const banner = document.getElementById("notif-banner");
    if (!banner) return;
    banner.classList.add("hidden");
    banner.innerHTML = "";
  }

  function showStopBanner(text) {
    const banner = document.getElementById("notif-banner");
    if (!banner) return;

    banner.innerHTML = "";
    const span = document.createElement("span");
    span.textContent = text;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn-secondary";
    btn.id = "stop-adhan-btn";
    btn.style.marginInlineStart = "10px";
    btn.textContent = lang() === "ar" ? "إيقاف الأذان" : "Stop adhan";
    btn.addEventListener("click", stopAdhan);

    banner.appendChild(span);
    banner.appendChild(btn);
    banner.classList.remove("hidden");
  }

  function stopAdhan() {
    if (currentAudio) {
      try {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      } catch (_) {}
      currentAudio = null;
    }
    hideStopBanner();
  }

  async function playAdhan(prayerKey) {
    const audio = getAudio();
    if (!audio) return false;

    stopAdhan();
    audio.muted = false;
    audio.currentTime = 0;
    audio.onended = hideStopBanner;

    try {
      await audio.play();
      currentAudio = audio;
      showStopBanner(
        prayerKey
          ? (lang() === "ar" ? `حان وقت صلاة ${label(prayerKey)}` : `It is time for ${label(prayerKey)}`)
          : (lang() === "ar" ? "اختبار صوت الأذان" : "Adhan sound test")
      );
      return true;
    } catch (_) {
      // Autoplay blocked: the user has not interacted with the page yet.
      showStopBanner(
        lang() === "ar"
          ? "منع المتصفح تشغيل الأذان تلقائيًا. اضغط هنا لتشغيله."
          : "The browser blocked automatic adhan playback. Tap to play it."
      );
      const btn = document.getElementById("stop-adhan-btn");
      if (btn) {
        btn.textContent = lang() === "ar" ? "تشغيل" : "Play";
        btn.onclick = () => {
          hideStopBanner();
          playAdhan(prayerKey);
        };
        btn.removeEventListener("click", stopAdhan);
      }
      return false;
    }
  }

  // ---------------------------------------------------------------
  // Scheduler
  // ---------------------------------------------------------------
  function messages(prayerKey, minutesBefore) {
    const name = label(prayerKey);
    if (minutesBefore > 0) {
      return lang() === "ar"
        ? { title: `${name} بعد ${minutesBefore} دقائق`, body: "استعد للصلاة." }
        : { title: `${name} in ${minutesBefore} minutes`, body: "Get ready for prayer." };
    }
    return lang() === "ar"
      ? { title: `حان وقت صلاة ${name}`, body: "حي على الصلاة." }
      : { title: `It is time for ${name}`, body: "Prayer time has come." };
  }

  function check() {
    const cfg = settings();
    if (!cfg.enabled && !cfg.audioEnabled) return;
    if (!window.Prayer?.buildPrayerTimes) return;

    const now = new Date();
    const times = window.Prayer.buildPrayerTimes(now);
    const offset = Number(cfg.reminderOffset) || 0;
    const fired = readFired();
    const day = dayStamp(now);
    let dirty = false;

    pruneFired(fired, now);

    PRAYERS.forEach((key) => {
      if (cfg.prayers && cfg.prayers[key] === false) return;
      const when = times[key];
      if (!when || Number.isNaN(when.getTime())) return;

      const due = (target) => {
        const age = now.getTime() - target.getTime();
        return age >= 0 && age < FIRE_WINDOW_MS;
      };

      // Early reminder: notification only
      if (offset > 0 && cfg.enabled) {
        const preAt = new Date(when.getTime() - offset * 60000);
        const preKey = `${day}|${key}|pre`;
        if (due(preAt) && !fired[preKey]) {
          fired[preKey] = now.getTime();
          dirty = true;
          const m = messages(key, offset);
          showNotification(m.title, m.body, `noor-${key}-pre`);
        }
      }

      // At prayer time: notification (when no early reminder) + adhan audio
      const atKey = `${day}|${key}|at`;
      if (due(when) && !fired[atKey]) {
        fired[atKey] = now.getTime();
        dirty = true;

        if (cfg.enabled && offset === 0) {
          const m = messages(key, 0);
          showNotification(m.title, m.body, `noor-${key}-at`);
        }
        if (cfg.audioEnabled) playAdhan(key);
      }
    });

    if (dirty) writeFired(fired);
  }

  async function test() {
    const perm = await ensurePermission();
    const m = messages("dhuhr", 0);

    if (perm === "granted") {
      await showNotification(
        lang() === "ar" ? "اختبار التنبيه" : "Test alert",
        m.title,
        "noor-test"
      );
    } else {
      const banner = document.getElementById("notif-banner");
      if (banner && !settings().audioEnabled) {
        banner.textContent =
          lang() === "ar"
            ? "لم يُمنح إذن الإشعارات، لذلك لا يمكن عرض تنبيه."
            : "Notification permission was not granted, so no alert can be shown.";
        banner.classList.remove("hidden");
      }
    }

    if (settings().audioEnabled) await playAdhan(null);
    emitChanged();
  }

  function start() {
    if (started) return;
    started = true;

    armUnlockOnFirstGesture();
    check();
    timer = setInterval(check, TICK_MS);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) check();
    });
  }

  window.Alerts = {
    start,
    check,
    test,
    ensurePermission,
    unlockAudio,
    stopAdhan,
    notificationState,
    messages
  };
})();
