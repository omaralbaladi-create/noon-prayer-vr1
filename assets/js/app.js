(function () {
  const salahKeys = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
  const salahLabels = {
    ar: {
      fajr: "الفجر",
      dhuhr: "الظهر",
      asr: "العصر",
      maghrib: "المغرب",
      isha: "العشاء"
    },
    en: {
      fajr: "Fajr",
      dhuhr: "Dhuhr",
      asr: "Asr",
      maghrib: "Maghrib",
      isha: "Isha"
    }
  };

  const dhikrOptions = [
    { titleAr: "سُبْحَانَ اللَّهِ", titleEn: "Subhan Allah", arabic: "سُبْحَانَ اللَّهِ", target: 33 },
    { titleAr: "الْحَمْدُ لِلَّهِ", titleEn: "Alhamdulillah", arabic: "الْحَمْدُ لِلَّهِ", target: 33 },
    { titleAr: "اللَّهُ أَكْبَرُ", titleEn: "Allahu Akbar", arabic: "اللَّهُ أَكْبَرُ", target: 34 }
  ];

  function lang() {
    return window.I18N?.getLang?.() === "en" ? "en" : "ar";
  }

  function t(key) {
    return window.I18N?.t ? window.I18N.t(key) : key;
  }

  function tSalah(key) {
    return salahLabels[lang()][key] || key;
  }

  function showApiBanner(message) {
    const banner = window.DOM.qs("api-banner");
    if (!banner) return;
    banner.textContent = message;
    banner.classList.remove("hidden");
  }

  function hideApiBanner() {
    const banner = window.DOM.qs("api-banner");
    if (!banner) return;
    banner.textContent = "";
    banner.classList.add("hidden");
  }

  function ensurePrayerConfigBridge() {
    if (!window.Prayer?.getConfig) return;

    const prayerConfig = window.Prayer.getConfig();

    if (!window.APP_STATE.settings.calcMethod) {
      window.APP_STATE.settings.calcMethod = prayerConfig.settings.calcMethod;
    }
    if (!window.APP_STATE.settings.asrMethod) {
      window.APP_STATE.settings.asrMethod = prayerConfig.settings.asrMethod;
    }
    if (!window.APP_STATE.settings.highLatitudeRule) {
      window.APP_STATE.settings.highLatitudeRule = prayerConfig.settings.highLatitudeRule;
    }
    if (typeof window.APP_STATE.settings.midnightMode === "undefined") {
      window.APP_STATE.settings.midnightMode = prayerConfig.settings.midnightMode;
    }
    if (typeof window.APP_STATE.settings.ramadanMode === "undefined") {
      window.APP_STATE.settings.ramadanMode = prayerConfig.settings.ramadanMode;
    }

    window.APP_STATE.settings.offsets = {
      fajr: 0,
      sunrise: 0,
      dhuhr: 0,
      asr: 0,
      maghrib: 0,
      isha: 0,
      midnight: 0,
      ...(prayerConfig.settings.offsets || {}),
      ...(window.APP_STATE.settings.offsets || {})
    };

    window.APP_STATE.settings.customCalc = {
      fajr: "",
      maghrib: "",
      isha: "",
      midnight: "",
      ...(prayerConfig.settings.customCalc || {}),
      ...(window.APP_STATE.settings.customCalc || {})
    };

    window.APP_STATE.settings.iqamah = {
      fajr: "",
      dhuhr: "",
      asr: "",
      maghrib: "",
      isha: "",
      ...(prayerConfig.settings.iqamah || {}),
      ...(window.APP_STATE.settings.iqamah || {})
    };

    syncPrayerConfigFromAppState(false);
  }

  function syncPrayerConfigFromAppState(alsoRender = true) {
    if (!window.Prayer?.updateConfig) return;

    const lat = Number(window.APP_STATE.location.lat);
    const lng = Number(window.APP_STATE.location.lng);

    window.Prayer.updateConfig({
      location: {
        lat: Number.isFinite(lat) ? lat : 24.7136,
        lng: Number.isFinite(lng) ? lng : 46.6753
      },
      settings: {
        calcMethod: window.APP_STATE.settings.calcMethod || "Makkah",
        asrMethod: window.APP_STATE.settings.asrMethod || "standard",
        highLatitudeRule: window.APP_STATE.settings.highLatitudeRule || "NightMiddle",
        midnightMode: window.APP_STATE.settings.midnightMode || "",
        ramadanMode: !!window.APP_STATE.settings.ramadanMode,
        offsets: {
          fajr: Number(window.APP_STATE.settings.offsets?.fajr || 0),
          sunrise: Number(window.APP_STATE.settings.offsets?.sunrise || 0),
          dhuhr: Number(window.APP_STATE.settings.offsets?.dhuhr || 0),
          asr: Number(window.APP_STATE.settings.offsets?.asr || 0),
          maghrib: Number(window.APP_STATE.settings.offsets?.maghrib || 0),
          isha: Number(window.APP_STATE.settings.offsets?.isha || 0),
          midnight: Number(window.APP_STATE.settings.offsets?.midnight || 0)
        },
        customCalc: {
          fajr: String(window.APP_STATE.settings.customCalc?.fajr || ""),
          maghrib: String(window.APP_STATE.settings.customCalc?.maghrib || ""),
          isha: String(window.APP_STATE.settings.customCalc?.isha || ""),
          midnight: String(window.APP_STATE.settings.customCalc?.midnight || "")
        },
        iqamah: {
          fajr: String(window.APP_STATE.settings.iqamah?.fajr || ""),
          dhuhr: String(window.APP_STATE.settings.iqamah?.dhuhr || ""),
          asr: String(window.APP_STATE.settings.iqamah?.asr || ""),
          maghrib: String(window.APP_STATE.settings.iqamah?.maghrib || ""),
          isha: String(window.APP_STATE.settings.iqamah?.isha || "")
        }
      },
      ui: {
        currentMonthOffset: Number(window.APP_STATE.ui.currentMonthOffset || 0)
      }
    });

    if (alsoRender) {
      window.Prayer.renderTodayPrayerList?.();
      window.Prayer.renderMonthTable?.();
    }
  }

  function isFirstRun() {
    try {
      return localStorage.getItem(window.APP_CONFIG.storageKey) === null;
    } catch (_) {
      return false;
    }
  }

  let swReloading = false;

  function showUpdateBanner(worker) {
    const banner = window.DOM.qs("update-banner");
    if (!banner) return;

    window.DOM.setText("update-banner-text", t("updateAvailable"));
    window.DOM.show("update-banner");

    const apply = window.DOM.qs("apply-update-btn");
    const dismiss = window.DOM.qs("dismiss-update-btn");
    if (apply) apply.onclick = () => worker.postMessage({ type: "SKIP_WAITING" });
    if (dismiss) dismiss.onclick = () => window.DOM.hide("update-banner");
  }

  function registerServiceWorker() {
    if (window.NoorNative) return; // the Android app bundles its own files
    if (!("serviceWorker" in navigator)) return;

    const hadController = !!navigator.serviceWorker.controller;

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      // Skip the very first install (clients.claim) and only reload once after the user taps "Update".
      if (!hadController || swReloading) return;
      swReloading = true;
      window.location.reload();
    });

    navigator.serviceWorker
      .register("./service-worker.js")
      .then((reg) => {
        if (reg.waiting && navigator.serviceWorker.controller) {
          showUpdateBanner(reg.waiting);
        }

        reg.addEventListener("updatefound", () => {
          const worker = reg.installing;
          if (!worker) return;
          worker.addEventListener("statechange", () => {
            if (worker.state === "installed" && navigator.serviceWorker.controller) {
              showUpdateBanner(worker);
            }
          });
        });
      })
      .catch(console.error);
  }

  // Reset the daily trackers and repaint if the app stays open past midnight.
  function startDayRolloverWatcher() {
    let lastKey = window.Utils.formatDateKey(new Date());

    const check = () => {
      const key = window.Utils.formatDateKey(new Date());
      if (key === lastKey) return;
      lastKey = key;
      ensureDailyReset();
      renderSalahTracker();
      renderAzkar();
    };

    setInterval(check, 30000);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) check();
    });
  }

  function init() {
    const firstRun = isFirstRun();

    window.StorageAPI.loadState();

    if (firstRun) {
      // Nobody has chosen a location yet: ask GPS instead of silently assuming Riyadh.
      window.APP_STATE.location.mode = "auto";
      window.APP_STATE.location.cityName = lang() === "ar" ? "الرياض (افتراضي)" : "Riyadh (default)";
    }

    ensurePrayerConfigBridge();
    ensureDailyReset();
    applyStateToUI();
    bindEvents();
    renderAll();

    registerServiceWorker();

    if (window.Qibla?.requestIOSPermissionIfNeeded) {
      window.Qibla.requestIOSPermissionIfNeeded();
    }
    if (window.Qibla?.startCompass) {
      window.Qibla.startCompass();
    }

    handleOnlineStatus();

    // Honour "Automatic (GPS)" on every launch, not only when the setting is toggled.
    if (window.APP_STATE.location.mode === "auto") {
      detectLocation();
    }

    window.Alerts?.start?.();
    window.Push?.start?.();
    window.Native?.start?.();
    window.Gold?.start?.();
    startDayRolloverWatcher();
  }

  function ensureDailyReset() {
    const todayKey = window.Utils.formatDateKey(new Date());

    if (window.APP_STATE.trackers.salahDayKey !== todayKey) {
      window.APP_STATE.trackers.salahDayKey = todayKey;
      window.APP_STATE.trackers.salahToday = {
        fajr: false,
        dhuhr: false,
        asr: false,
        maghrib: false,
        isha: false
      };
    }

    if (window.APP_STATE.trackers.azkarDayKey !== todayKey) {
      window.APP_STATE.trackers.azkarDayKey = todayKey;
      window.APP_STATE.trackers.azkarProgress = {};
    }

    window.StorageAPI.saveState();
  }

  function applyStateToUI() {
    document.body.setAttribute("data-theme", window.APP_STATE.settings.theme);
    window.I18N.applyLanguage();

    window.DOM.setValue("lang-select", window.APP_STATE.settings.lang);
    window.DOM.setValue("theme-select", window.APP_STATE.settings.theme);
    window.DOM.setValue("loc-mode", window.APP_STATE.location.mode);
    window.DOM.setChecked("lookup-city", window.APP_STATE.location.lookupCity);

    window.DOM.setValue("calc-method", window.APP_STATE.settings.calcMethod || "Makkah");
    window.DOM.setValue("asr-method", window.APP_STATE.settings.asrMethod || "standard");
    window.DOM.setValue("high-latitude-rule", window.APP_STATE.settings.highLatitudeRule || "NightMiddle");
    window.DOM.setValue("midnight-mode", window.APP_STATE.settings.midnightMode || "");
    window.DOM.setChecked("ramadan-mode", !!window.APP_STATE.settings.ramadanMode);
    window.DOM.setChecked("debug-enabled", !!window.APP_STATE.settings.debugEnabled);

    window.DOM.setValue("custom-fajr", window.APP_STATE.settings.customCalc?.fajr || "");
    window.DOM.setValue("custom-maghrib", window.APP_STATE.settings.customCalc?.maghrib || "");
    window.DOM.setValue("custom-isha", window.APP_STATE.settings.customCalc?.isha || "");
    window.DOM.setValue("custom-midnight", window.APP_STATE.settings.customCalc?.midnight || "");

    window.DOM.setValue("loc-lat", window.APP_STATE.location.lat ?? "");
    window.DOM.setValue("loc-lng", window.APP_STATE.location.lng ?? "");

    const zakat = window.APP_STATE.settings.zakat;
    window.DOM.setValue("zakat-basis", zakat.basis);
    window.DOM.setValue("zakat-gold-price", zakat.goldPrice);
    window.DOM.setValue("zakat-silver-price", zakat.silverPrice);

    const notif = window.APP_STATE.settings.notifications;
    window.DOM.setChecked("notif-enabled", notif.enabled);
    window.DOM.setChecked("audio-enabled", notif.audioEnabled);
    window.DOM.setValue("adhan-audio-select", notif.adhanAudio);
    window.DOM.setValue("reminder-offset", String(notif.reminderOffset));
    window.DOM.setChecked("notify-fajr", notif.prayers.fajr);
    window.DOM.setChecked("notify-dhuhr", notif.prayers.dhuhr);
    window.DOM.setChecked("notify-asr", notif.prayers.asr);
    window.DOM.setChecked("notify-maghrib", notif.prayers.maghrib);
    window.DOM.setChecked("notify-isha", notif.prayers.isha);

    Object.entries(window.APP_STATE.settings.offsets || {}).forEach(([key, value]) => {
      window.DOM.setValue(`offset-${key}`, value);
    });

    Object.entries(window.APP_STATE.settings.iqamah || {}).forEach(([key, value]) => {
      window.DOM.setValue(`iqamah-${key}`, value);
    });

    setupPresetCities();
    toggleLocationModeFields();
  }

  function setupPresetCities() {
    const select = window.DOM.qs("loc-preset");
    if (!select) return;

    select.innerHTML = "";

    window.APP_CONFIG.presetCities.forEach((city) => {
      const opt = document.createElement("option");
      opt.value = city.id;
      opt.textContent = lang() === "ar" ? city.nameAr : city.nameEn;

      if (
        Math.abs(city.lat - Number(window.APP_STATE.location.lat)) < 0.0001 &&
        Math.abs(city.lng - Number(window.APP_STATE.location.lng)) < 0.0001
      ) {
        opt.selected = true;
      }

      select.appendChild(opt);
    });
  }

  function bindEvents() {
    document.querySelectorAll("#main-nav-tabs .tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => switchTab(btn.dataset.tab));
    });

    document.querySelectorAll("#azkar-sub-tabs .tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => switchAzkarTab(btn.dataset.azkar));
    });

    window.DOM.on("open-settings-btn", "click", () => window.DOM.openModal("settings-modal"));
    window.DOM.on("close-settings-btn", "click", () => window.DOM.closeModal("settings-modal"));

    window.DOM.on("overlay", "click", () => {
      window.DOM.closeModal("settings-modal");
      window.DOM.closeModal("confirm-modal");
    });

    window.DOM.on("lang-toggle-btn", "click", () => {
      window.APP_STATE.settings.lang = window.APP_STATE.settings.lang === "ar" ? "en" : "ar";
      persistAndRender();
    });

    window.DOM.on("theme-cycle-btn", "click", () => {
      const themes = ["emerald", "midnight", "desert", "sunset"];
      const current = window.APP_STATE.settings.theme;
      const nextIndex = (themes.indexOf(current) + 1) % themes.length;
      window.APP_STATE.settings.theme = themes[nextIndex];
      persistAndRender();
    });

    window.DOM.on("lang-select", "change", (e) => {
      window.APP_STATE.settings.lang = e.target.value;
      persistAndRender();
    });

    window.DOM.on("theme-select", "change", (e) => {
      window.APP_STATE.settings.theme = e.target.value;
      persistAndRender();
    });

    window.DOM.on("loc-mode", "change", (e) => {
      const mode = e.target.value;
      window.APP_STATE.location.mode = mode;
      toggleLocationModeFields();

      if (mode === "auto") {
        hideApiBanner();
        detectLocation();
      } else if (mode === "preset") {
        hideApiBanner();
        const presetSelect = window.DOM.qs("loc-preset");
        if (presetSelect && presetSelect.value) {
          applyPresetCity(presetSelect.value);
        }
      } else if (mode === "custom") {
        applyCustomCoordinatesFromInputs(true, true);
      }

      persistAndRender();
    });

    window.DOM.on("loc-preset", "change", (e) => {
      hideApiBanner();
      applyPresetCity(e.target.value);
      persistAndRender();
    });

    const latInput = window.DOM.qs("loc-lat");
    const lngInput = window.DOM.qs("loc-lng");

    if (latInput) {
      latInput.oninput = () => {
        if (window.APP_STATE.location.mode === "custom") {
          applyCustomCoordinatesFromInputs(false, false);
        }
      };
      latInput.onchange = () => {
        if (window.APP_STATE.location.mode !== "custom") {
          window.APP_STATE.location.mode = "custom";
        }
        applyCustomCoordinatesFromInputs(true, true);
        persistAndRender();
      };
    }

    if (lngInput) {
      lngInput.oninput = () => {
        if (window.APP_STATE.location.mode === "custom") {
          applyCustomCoordinatesFromInputs(false, false);
        }
      };
      lngInput.onchange = () => {
        if (window.APP_STATE.location.mode !== "custom") {
          window.APP_STATE.location.mode = "custom";
        }
        applyCustomCoordinatesFromInputs(true, true);
        persistAndRender();
      };
    }

    window.DOM.on("city-search-btn", "click", searchCity);

    window.DOM.on("lookup-city", "change", (e) => {
      window.APP_STATE.location.lookupCity = e.target.checked;
      if (e.target.checked && window.APP_STATE.location.mode === "custom") {
        reverseLookupCurrentLocation();
      }
      persistAndRender();
    });

    window.DOM.on("calc-method", "change", (e) => {
      window.APP_STATE.settings.calcMethod = e.target.value;
      persistAndRender();
    });

    window.DOM.on("asr-method", "change", (e) => {
      window.APP_STATE.settings.asrMethod = e.target.value;
      persistAndRender();
    });

    window.DOM.on("high-latitude-rule", "change", (e) => {
      window.APP_STATE.settings.highLatitudeRule = e.target.value;
      persistAndRender();
    });

    window.DOM.on("midnight-mode", "change", (e) => {
      window.APP_STATE.settings.midnightMode = e.target.value;
      persistAndRender();
    });

    window.DOM.on("ramadan-mode", "change", (e) => {
      window.APP_STATE.settings.ramadanMode = e.target.checked;
      persistAndRender();
    });

    window.DOM.on("custom-fajr", "change", (e) => {
      window.APP_STATE.settings.customCalc.fajr = e.target.value.trim();
      persistAndRender();
    });

    window.DOM.on("custom-maghrib", "change", (e) => {
      window.APP_STATE.settings.customCalc.maghrib = e.target.value.trim();
      persistAndRender();
    });

    window.DOM.on("custom-isha", "change", (e) => {
      window.APP_STATE.settings.customCalc.isha = e.target.value.trim();
      persistAndRender();
    });

    window.DOM.on("custom-midnight", "change", (e) => {
      window.APP_STATE.settings.customCalc.midnight = e.target.value.trim();
      persistAndRender();
    });

    ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha", "midnight"].forEach((key) => {
      window.DOM.on(`offset-${key}`, "change", (e) => {
        window.APP_STATE.settings.offsets[key] = Number(e.target.value || 0);
        persistAndRender();
      });
    });

    ["fajr", "dhuhr", "asr", "maghrib", "isha"].forEach((key) => {
      window.DOM.on(`iqamah-${key}`, "change", (e) => {
        window.APP_STATE.settings.iqamah[key] = e.target.value.trim();
        persistAndRender();
      });
    });

    window.DOM.on("save-salah-day-btn", "click", saveTodaySalahToHistory);
    window.DOM.on("reset-salah-btn", "click", resetTodaySalah);
    window.DOM.on("clear-history-btn", "click", clearHistory);
    window.DOM.on("reset-azkar-btn", "click", resetAzkarToday);
    window.DOM.on("tasbih-increment-btn", "click", incrementTasbih);
    window.DOM.on("tasbih-reset-btn", "click", resetTasbih);
    window.DOM.on("reset-khatm-btn", "click", resetQuranKhatm);
    window.DOM.on("export-csv-btn", "click", () => window.Prayer?.exportMonthCSV?.());

    window.DOM.on("month-prev-btn", "click", () => {
      window.APP_STATE.ui.currentMonthOffset -= 1;
      syncPrayerConfigFromAppState(false);
      persistAndRender();
    });

    window.DOM.on("month-next-btn", "click", () => {
      window.APP_STATE.ui.currentMonthOffset += 1;
      syncPrayerConfigFromAppState(false);
      persistAndRender();
    });

    document.querySelectorAll(".dhikr-btn").forEach((btn) => {
      btn.onclick = () => {
        window.APP_STATE.trackers.tasbih.index = Number(btn.dataset.dhikr);
        window.APP_STATE.trackers.tasbih.count = 0;
        persistAndRender();
      };
    });

    window.DOM.on("zakat-basis", "change", (e) => {
      window.APP_STATE.settings.zakat.basis = e.target.value;
      persistAndRender();
    });

    window.DOM.on("zakat-gold-price", "input", (e) => {
      window.APP_STATE.settings.zakat.goldPrice = e.target.value;
      window.APP_STATE.settings.zakat.goldManual = e.target.value !== "";
      window.StorageAPI.saveState();
      renderZakat();
    });

    // Leaving an emptied field brings the market price back (not while the user is still typing).
    window.DOM.on("zakat-gold-price", "change", (e) => {
      if (e.target.value !== "") return;
      // Wait for the field to lose focus; setValue never overwrites a field being typed in.
      setTimeout(() => {
        applyMarketPrices();
        renderZakat();
      }, 50);
    });

    window.DOM.on("zakat-silver-price", "input", (e) => {
      window.APP_STATE.settings.zakat.silverPrice = e.target.value;
      window.APP_STATE.settings.zakat.silverManual = e.target.value !== "";
      window.StorageAPI.saveState();
      renderZakat();
    });

    window.DOM.on("zakat-silver-price", "change", (e) => {
      if (e.target.value !== "") return;
      // Wait for the field to lose focus; setValue never overwrites a field being typed in.
      setTimeout(() => {
        applyMarketPrices();
        renderZakat();
      }, 50);
    });

    window.DOM.on("zakat-use-market", "click", () => {
      window.APP_STATE.settings.zakat.goldManual = false;
      window.APP_STATE.settings.zakat.silverManual = false;
      applyMarketPrices();
      window.StorageAPI.saveState();
      renderZakat();
    });

    window.addEventListener("gold-updated", () => {
      applyMarketPrices();
      renderZakat();
    });

    ["zakat-cash", "zakat-gold", "zakat-stocks", "zakat-debt", "zakat-hawl"].forEach((id) => {
      window.DOM.on(id, "input", renderZakat);
      window.DOM.on(id, "change", renderZakat);
    });

    window.DOM.on("notif-permission-btn", "click", requestNotificationPermission);
    window.DOM.on("test-alert-btn", "click", () => window.Alerts?.test?.());
    window.addEventListener("alerts-changed", renderBadges);
    window.addEventListener("push-changed", renderPushStatus);
    window.addEventListener("native-changed", () => {
      renderPushStatus();
      renderBadges();
    });
    window.DOM.on("test-push-btn", "click", runPushTest);

    window.DOM.on("notif-enabled", "change", (e) => {
      window.APP_STATE.settings.notifications.enabled = e.target.checked;
      if (e.target.checked) window.Alerts?.ensurePermission?.();
      persistAndRender();
    });

    window.DOM.on("audio-enabled", "change", (e) => {
      window.APP_STATE.settings.notifications.audioEnabled = e.target.checked;
      // This click is the user gesture that lets the browser play the adhan later.
      if (e.target.checked) window.Alerts?.unlockAudio?.();
      persistAndRender();
    });

    window.DOM.on("adhan-audio-select", "change", (e) => {
      window.APP_STATE.settings.notifications.adhanAudio = e.target.value;
      persistAndRender();
    });

    window.DOM.on("reminder-offset", "change", (e) => {
      window.APP_STATE.settings.notifications.reminderOffset = Number(e.target.value);
      persistAndRender();
    });

    ["fajr", "dhuhr", "asr", "maghrib", "isha"].forEach((key) => {
      window.DOM.on(`notify-${key}`, "change", (e) => {
        window.APP_STATE.settings.notifications.prayers[key] = e.target.checked;
        persistAndRender();
      });
    });

    window.DOM.on("export-backup-btn", "click", exportBackup);
    window.DOM.on("copy-backup-btn", "click", copyBackup);
    window.DOM.on("import-backup-btn", "click", importBackup);

    window.DOM.on("install-app-btn", "click", triggerInstallPrompt);

    window.DOM.on("debug-enabled", "change", (e) => {
      window.APP_STATE.settings.debugEnabled = e.target.checked;
      persistAndRender();
    });

    window.addEventListener("online", handleOnlineStatus);
    window.addEventListener("offline", handleOnlineStatus);

    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      window.__deferredInstallPrompt = e;
      window.DOM.setText("install-badge", t("installAvailable"));
      window.DOM.show("pwa-banner");
      window.DOM.setText("pwa-banner", t("pwaInstallText"));
    });
  }

  function applyPresetCity(cityId) {
    const city = window.APP_CONFIG.presetCities.find((c) => c.id === cityId);
    if (!city) return;

    window.APP_STATE.location.cityName = lang() === "ar" ? city.nameAr : city.nameEn;
    window.APP_STATE.location.lat = city.lat;
    window.APP_STATE.location.lng = city.lng;
  }

  function validateCoordinates(lat, lng) {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return {
        valid: false,
        message: lang() === "ar"
          ? "يرجى إدخال خط العرض وخط الطول كأرقام صحيحة."
          : "Please enter latitude and longitude as valid numbers."
      };
    }

    if (lat < -90 || lat > 90) {
      return {
        valid: false,
        message: lang() === "ar"
          ? "خط العرض يجب أن يكون بين -90 و 90."
          : "Latitude must be between -90 and 90."
      };
    }

    if (lng < -180 || lng > 180) {
      return {
        valid: false,
        message: lang() === "ar"
          ? "خط الطول يجب أن يكون بين -180 و 180."
          : "Longitude must be between -180 and 180."
      };
    }

    return { valid: true, message: "" };
  }

  function applyCustomCoordinatesFromInputs(updateLabel = true, showValidationBanner = true) {
    const latInput = window.DOM.qs("loc-lat");
    const lngInput = window.DOM.qs("loc-lng");
    if (!latInput || !lngInput) return false;

    const latRaw = latInput.value.trim();
    const lngRaw = lngInput.value.trim();

    if (!latRaw || !lngRaw) {
      if (showValidationBanner) {
        showApiBanner(lang() === "ar"
          ? "يرجى إدخال خط العرض وخط الطول."
          : "Please enter both latitude and longitude.");
      }
      return false;
    }

    const lat = Number(latRaw);
    const lng = Number(lngRaw);
    const validation = validateCoordinates(lat, lng);

    if (!validation.valid) {
      if (showValidationBanner) showApiBanner(validation.message);
      return false;
    }

    hideApiBanner();
    window.APP_STATE.location.lat = lat;
    window.APP_STATE.location.lng = lng;

    if (updateLabel) {
      if (window.APP_STATE.location.lookupCity) {
        reverseLookupCurrentLocation();
      } else {
        window.APP_STATE.location.cityName = t("customLocation");
      }
    }

    return true;
  }

  async function reverseLookupCurrentLocation() {
    const { lat, lng } = window.APP_STATE.location;

    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`;
      const res = await fetch(url, {
        headers: { "Accept-Language": "ar,en" }
      });
      const data = await res.json();

      const address = data.address || {};
      const cityName =
        address.city ||
        address.town ||
        address.village ||
        address.state ||
        data.display_name;

      if (cityName) {
        window.APP_STATE.location.cityName = cityName;
        renderLocationLabel();
        window.StorageAPI.saveState();
      }
    } catch (error) {
      console.error("Reverse lookup failed:", error);
    }
  }

  function switchTab(tabName) {
    window.APP_STATE.ui.activeTab = tabName;

    document.querySelectorAll("#main-nav-tabs .tab-btn").forEach((b) => {
      b.classList.toggle("active", b.dataset.tab === tabName);
    });

    document.querySelectorAll(".tab-content").forEach((tab) => tab.classList.add("hidden"));

    const activeTab = window.DOM.qs(`tab-${tabName}`);
    if (activeTab) activeTab.classList.remove("hidden");

    window.StorageAPI.saveState();
  }

  function switchAzkarTab(tabName) {
    window.APP_STATE.ui.activeAzkarTab = tabName;

    document.querySelectorAll("#azkar-sub-tabs .tab-btn").forEach((b) => {
      b.classList.toggle("active", b.dataset.azkar === tabName);
    });

    renderAzkar();
    window.StorageAPI.saveState();
  }

  function toggleLocationModeFields() {
    const mode = window.APP_STATE.location.mode;
    const preset = window.DOM.qs("loc-preset-group");
    const custom = window.DOM.qs("loc-custom-group");
    const search = window.DOM.qs("loc-search-group");

    if (preset) preset.classList.add("hidden");
    if (custom) custom.classList.add("hidden");
    if (search) search.classList.add("hidden");

    if (mode === "preset" && preset) preset.classList.remove("hidden");
    if (mode === "custom" && custom) custom.classList.remove("hidden");
    if (mode === "search" && search) search.classList.remove("hidden");
  }

  function nearestPresetName(lat, lng) {
    const R = 6371;
    const rad = (d) => (d * Math.PI) / 180;
    let best = null;

    window.APP_CONFIG.presetCities.forEach((city) => {
      const dLat = rad(city.lat - lat);
      const dLng = rad(city.lng - lng);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(rad(lat)) * Math.cos(rad(city.lat)) * Math.sin(dLng / 2) ** 2;
      const km = 2 * R * Math.asin(Math.sqrt(a));
      if (!best || km < best.km) best = { km, city };
    });

    if (best && best.km <= 40) {
      return lang() === "ar" ? best.city.nameAr : best.city.nameEn;
    }
    return null;
  }

  function detectLocation() {
    if (!navigator.geolocation) {
      showApiBanner(lang() === "ar"
        ? "هذا الجهاز لا يدعم تحديد الموقع GPS."
        : "This device does not support GPS location.");
      return;
    }

    if (window.isSecureContext === false) {
      showApiBanner(lang() === "ar"
        ? "تحديد الموقع GPS يتطلب HTTPS. تم الاحتفاظ بالموقع الحالي."
        : "GPS location requires HTTPS. Current location was kept.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        // The user may have switched to another location mode while GPS was working.
        if (window.APP_STATE.location.mode !== "auto") return;

        hideApiBanner();
        window.APP_STATE.location.lat = pos.coords.latitude;
        window.APP_STATE.location.lng = pos.coords.longitude;

        const near = nearestPresetName(pos.coords.latitude, pos.coords.longitude);
        window.APP_STATE.location.cityName = near ? `${near} (GPS)` : t("gpsLocation");

        if (window.APP_STATE.location.lookupCity) {
          await reverseLookupCurrentLocation();
        }

        persistAndRender();
      },
      () => {
        showApiBanner(lang() === "ar"
          ? "تعذر الوصول إلى GPS، تم الاحتفاظ بالموقع الحالي."
          : "Unable to access GPS. Current location was kept.");
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 10 * 60 * 1000 }
    );
  }

  async function searchCity() {
    const input = window.DOM.qs("city-search-input");
    const query = input?.value?.trim();
    if (!query) return;

    const status = window.DOM.qs("city-search-status");
    const results = window.DOM.qs("city-search-results");

    if (status) status.textContent = t("searching");
    if (results) results.innerHTML = "";

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`;
      const res = await fetch(url, {
        headers: { "Accept-Language": "ar,en" }
      });
      const data = await res.json();

      if (status) status.textContent = data.length ? t("chooseResult") : t("noResults");

      data.slice(0, 5).forEach((item) => {
        const btn = document.createElement("button");
        btn.className = "city-pill";
        btn.textContent = item.display_name;
        btn.onclick = () => {
          hideApiBanner();
          window.APP_STATE.location.mode = "search";
          window.APP_STATE.location.cityName = item.display_name;
          window.APP_STATE.location.lat = Number(item.lat);
          window.APP_STATE.location.lng = Number(item.lon);
          addRecentCity(item.display_name);
          persistAndRender();
        };
        results?.appendChild(btn);
      });
    } catch (error) {
      console.error(error);
      if (status) status.textContent = t("searchFailed");
    }
  }

  function addRecentCity(name) {
    const recent = window.APP_STATE.cityData.recent.filter((c) => c !== name);
    recent.unshift(name);
    window.APP_STATE.cityData.recent = recent.slice(0, 6);
  }

  function renderAll() {
    renderLocationLabel();
    window.Qibla?.update?.();
    window.Ramadan?.render?.();
    renderBadges();
    renderPushStatus();
    syncPrayerConfigFromAppState(false);
    window.Prayer?.renderTodayPrayerList?.();
    window.Prayer?.renderMonthTable?.();
    renderSalahTracker();
    renderHistory();
    renderAzkar();
    renderTasbih();
    renderQuran();
    renderZakat();
    renderRecentAndFavorites();
    renderDebug();
    switchTab(window.APP_STATE.ui.activeTab || "prayer");
  }

  function renderLocationLabel() {
    const { cityName, lat, lng } = window.APP_STATE.location;
    const safeName = cityName || t("unknownLocation");
    const latText = Number.isFinite(Number(lat)) ? Number(lat).toFixed(2) : "--";
    const lngText = Number.isFinite(Number(lng)) ? Number(lng).toFixed(2) : "--";
    window.DOM.setText("location-label", `${safeName} • ${latText}, ${lngText}`);
  }

  function renderBadges() {
    window.DOM.setText("version-badge", `v${window.APP_CONFIG.version}`);
    window.DOM.setText("install-badge", t("installReady"));
    window.DOM.setText(
      "ramadan-badge",
      window.APP_STATE.settings.ramadanMode || window.Prayer?.isRamadanDate?.(new Date())
        ? t("ramadanModeBadge")
        : t("normalMode")
    );
    const notifState =
      window.Alerts?.notificationState?.() ||
      (window.APP_STATE.settings.notifications.enabled ? "on" : "off");
    const notifKey = {
      on: "notificationsOn",
      off: "notificationsOff",
      blocked: "notificationsBlocked",
      "needs-permission": "notificationsNeedsPermission",
      unsupported: "notificationsUnsupported"
    }[notifState] || "notificationsOff";
    window.DOM.setText("notif-badge", t(notifKey));
    window.DOM.setText(
      "audio-badge",
      window.APP_STATE.settings.notifications.audioEnabled ? t("adhanAudioOn") : t("adhanAudioOff")
    );
    window.DOM.setText("lang-badge", lang().toUpperCase());
  }

  function renderSalahTracker() {
    const list = window.DOM.qs("salah-list");
    if (!list) return;

    list.innerHTML = "";

    salahKeys.forEach((key) => {
      const item = document.createElement("div");
      item.className = "salah-item";
      const checked = window.APP_STATE.trackers.salahToday[key];

      item.innerHTML = `
        <div class="check-row">
          <input type="checkbox" id="salah-${key}" ${checked ? "checked" : ""} />
          <label for="salah-${key}">${tSalah(key)}</label>
        </div>
      `;
      list.appendChild(item);

      item.querySelector("input").onchange = (e) => {
        window.APP_STATE.trackers.salahToday[key] = e.target.checked;
        persistAndRender();
      };
    });

    const done = salahKeys.filter((k) => window.APP_STATE.trackers.salahToday[k]).length;
    const pct = window.Utils.percent(done, 5);

    const bar = window.DOM.qs("salah-progress-bar");
    if (bar) bar.style.width = `${pct}%`;

    window.DOM.setText("salah-progress-text", lang() === "ar" ? `${done} / 5 مكتملة` : `${done} / 5 completed`);
  }

  function saveTodaySalahToHistory() {
    const today = window.Utils.formatDateKey(new Date());
    const entry = {
      date: today,
      prayers: { ...window.APP_STATE.trackers.salahToday }
    };

    window.APP_STATE.trackers.salahHistory = window.APP_STATE.trackers.salahHistory.filter((e) => e.date !== today);
    window.APP_STATE.trackers.salahHistory.unshift(entry);
    persistAndRender();
  }

  function resetTodaySalah() {
    window.APP_STATE.trackers.salahToday = {
      fajr: false,
      dhuhr: false,
      asr: false,
      maghrib: false,
      isha: false
    };
    persistAndRender();
  }

  function clearHistory() {
    window.APP_STATE.trackers.salahHistory = [];
    persistAndRender();
  }

  function renderHistory() {
    const history = window.APP_STATE.trackers.salahHistory || [];
    const list = window.DOM.qs("history-list");
    if (!list) return;

    list.innerHTML = "";

    let perfect = 0;
    let totalCompletion = 0;

    history.forEach((entry) => {
      const done = salahKeys.filter((k) => entry.prayers[k]).length;
      if (done === 5) perfect += 1;
      totalCompletion += done;

      const item = document.createElement("div");
      item.className = "history-item";
      item.innerHTML = `
        <strong>${entry.date}</strong>
        <div style="margin-top:6px; color: var(--text-muted);">${done}/5</div>
      `;
      list.appendChild(item);
    });

    window.DOM.setText("history-days-stat", String(history.length));
    window.DOM.setText("history-perfect-stat", String(perfect));

    const avg = history.length ? Math.round((totalCompletion / (history.length * 5)) * 100) : 0;
    window.DOM.setText("history-total-stat", `${avg}%`);
  }

  function renderAzkar() {
    const tab = window.APP_STATE.ui.activeAzkarTab || "morning";
    const list = window.AZKAR_DATA[tab] || [];
    const container = window.DOM.qs("azkar-container");
    if (!container) return;

    container.innerHTML = "";

    list.forEach((item) => {
      const count = window.APP_STATE.trackers.azkarProgress[item.id] || 0;
      const done = count >= item.repeat;

      const card = document.createElement("div");
      card.className = "azkar-card";
      card.innerHTML = `
        <h4>${lang() === "ar" ? (item.titleAr || item.title) : (item.titleEn || item.title)}</h4>
        <div class="azkar-arabic">${item.arabic}</div>
        <div class="actions">
          <span>${count} / ${item.repeat}</span>
          <button class="btn-secondary">${done ? t("done") : t("count")}</button>
        </div>
      `;

      card.querySelector("button").onclick = () => {
        const current = window.APP_STATE.trackers.azkarProgress[item.id] || 0;
        window.APP_STATE.trackers.azkarProgress[item.id] = Math.min(current + 1, item.repeat);
        persistAndRender();
      };

      container.appendChild(card);
    });
  }

  function resetAzkarToday() {
    window.APP_STATE.trackers.azkarProgress = {};
    persistAndRender();
  }

  function renderTasbih() {
    const { index, count } = window.APP_STATE.trackers.tasbih;
    const current = dhikrOptions[index] || dhikrOptions[0];

    window.DOM.setText("dhikr-title", lang() === "ar" ? current.titleAr : current.titleEn);
    window.DOM.setText("dhikr-ar", current.arabic);
    window.DOM.setText("tasbih-display", String(count));
    window.DOM.setText("tasbih-target", `${t("target")}: ${current.target}`);
    window.DOM.setText("tasbih-msg", count >= current.target ? t("completed") : "");
  }

  function incrementTasbih() {
    window.APP_STATE.trackers.tasbih.count += 1;
    if (navigator.vibrate) navigator.vibrate(20);
    persistAndRender();
  }

  function resetTasbih() {
    window.APP_STATE.trackers.tasbih.count = 0;
    persistAndRender();
  }

  function renderQuran() {
    const grid = window.DOM.qs("juz-grid");
    if (!grid) return;

    grid.innerHTML = "";

    for (let i = 1; i <= 30; i++) {
      const btn = document.createElement("button");
      const done = window.APP_STATE.trackers.quranDone.includes(i);
      btn.className = `juz-btn ${done ? "done" : ""}`;
      btn.textContent = lang() === "ar" ? `جزء ${i}` : `Juz ${i}`;
      btn.onclick = () => {
        const arr = window.APP_STATE.trackers.quranDone;
        if (arr.includes(i)) {
          window.APP_STATE.trackers.quranDone = arr.filter((x) => x !== i);
        } else {
          arr.push(i);
          window.APP_STATE.trackers.quranDone = arr.sort((a, b) => a - b);
        }
        persistAndRender();
      };
      grid.appendChild(btn);
    }

    const doneCount = window.APP_STATE.trackers.quranDone.length;
    const pct = window.Utils.percent(doneCount, 30);

    const bar = window.DOM.qs("quran-progress-bar");
    if (bar) bar.style.width = `${pct}%`;

    window.DOM.setText(
      "quran-progress-text",
      lang() === "ar"
        ? `${doneCount} / 30 جزء مكتمل (${pct}%)`
        : `${doneCount} / 30 completed (${pct}%)`
    );
  }

  function resetQuranKhatm() {
    window.APP_STATE.trackers.quranDone = [];
    persistAndRender();
  }

  // Fills the zakat price fields from the daily market price, unless the user typed their own.
  function applyMarketPrices() {
    const market = window.Gold?.get?.();
    const zakat = window.APP_STATE.settings.zakat;
    if (!market) return;

    // Prices typed before this feature existed count as the user's own.
    if (zakat.goldManual === undefined) zakat.goldManual = String(zakat.goldPrice || "") !== "";
    if (zakat.silverManual === undefined) zakat.silverManual = String(zakat.silverPrice || "") !== "";

    if (!zakat.goldManual && market.gold24 > 0) {
      zakat.goldPrice = String(market.gold24);
      window.DOM.setValue("zakat-gold-price", zakat.goldPrice);
    }
    if (!zakat.silverManual && market.silver > 0) {
      zakat.silverPrice = String(market.silver);
      window.DOM.setValue("zakat-silver-price", zakat.silverPrice);
    }
    window.StorageAPI.saveState();
  }

  function renderMarketNote() {
    const note = window.DOM.qs("zakat-market-note");
    const btn = window.DOM.qs("zakat-use-market");
    const market = window.Gold?.get?.();
    if (!note || !btn) return;

    if (!market) {
      note.classList.add("hidden");
      btn.classList.add("hidden");
      return;
    }

    const ar = lang() === "ar";
    const zakat = window.APP_STATE.settings.zakat;
    const date = new Date(market.updated).toLocaleDateString(ar ? "ar-SA" : "en-US", { year: "numeric", month: "long", day: "numeric" });
    const fmt = (v) => Number(v).toLocaleString(ar ? "ar-SA" : "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const silverPart = market.silver > 0 ? (ar ? `، الفضة ${fmt(market.silver)}` : `, silver ${fmt(market.silver)}`) : "";

    note.textContent = ar
      ? `سعر السوق العالمي بالريال للغرام (تقريبي): الذهب عيار 24 ${fmt(market.gold24)}${silverPart} — بتاريخ ${date}. يُحدَّث يوميًا. سعر محلات الذهب قد يكون أعلى قليلًا، ويمكنك تعديل السعر.`
      : `International market price in SAR per gram (approximate): 24k gold ${fmt(market.gold24)}${silverPart}, as of ${date}. Updated daily. Jewellers' prices can be slightly higher, and you can edit the price.`;
    note.classList.remove("hidden");

    const manual = !!(zakat.goldManual || zakat.silverManual);
    btn.textContent = ar ? "استخدام سعر السوق" : "Use the market price";
    btn.classList.toggle("hidden", !manual);
  }

  function renderZakat() {
    renderMarketNote();
    const num = (id) => Math.max(0, Number(window.DOM.qs(id)?.value || 0) || 0);

    const basis = window.DOM.qs("zakat-basis")?.value || "gold";
    const isGold = basis === "gold";
    const price = isGold ? num("zakat-gold-price") : num("zakat-silver-price");
    const cash = num("zakat-cash");
    const gold = num("zakat-gold");
    const stocks = num("zakat-stocks");
    const debt = num("zakat-debt");
    const hawl = !!window.DOM.qs("zakat-hawl")?.checked;

    const ar = lang() === "ar";
    const priceMissing = !(price > 0);
    const wealth = Math.max(0, cash + gold + stocks - debt);
    const nisab = priceMissing ? 0 : price * (isGold ? 85 : 595);
    const eligible = !priceMissing && hawl && wealth >= nisab;
    const due = eligible ? wealth * 0.025 : 0;

    window.DOM.setText(
      "zakat-nisab-label",
      isGold
        ? (ar ? "النصاب (85 غرام ذهب)" : "Nisab (85g gold)")
        : (ar ? "النصاب (595 غرام فضة)" : "Nisab (595g silver)")
    );

    window.DOM.setText("zakat-nisab-val", priceMissing ? "--" : window.Utils.formatCurrency(nisab));
    window.DOM.setText("zakat-total", window.Utils.formatCurrency(wealth));
    window.DOM.setText("zakat-due", window.Utils.formatCurrency(due));

    let message;
    if (priceMissing) {
      message = isGold
        ? (ar ? "أدخل سعر غرام الذهب اليوم لمعرفة النصاب." : "Enter today's gold price per gram to check nisab.")
        : (ar ? "أدخل سعر غرام الفضة اليوم لمعرفة النصاب." : "Enter today's silver price per gram to check nisab.");
    } else if (wealth < nisab) {
      message = ar ? "المبلغ أقل من النصاب." : "Amount is below nisab.";
    } else if (!hawl) {
      message = ar ? "بلغ المال النصاب، لكن لم يمر حول قمري كامل بعد." : "Wealth meets nisab, but one lunar year has not passed yet.";
    } else {
      message = ar ? "بلغ المال النصاب وتحققت الشروط الأساسية." : "Wealth meets nisab and basic conditions.";
    }
    window.DOM.setText("zakat-status-msg", message);
  }

  function renderRecentAndFavorites() {
    const recentBox = window.DOM.qs("recent-cities");
    const favBox = window.DOM.qs("favorite-cities");

    if (recentBox) recentBox.innerHTML = "";
    if (favBox) favBox.innerHTML = "";

    window.APP_STATE.cityData.recent.forEach((name) => {
      const btn = document.createElement("button");
      btn.className = "city-pill";
      btn.textContent = name;
      if (recentBox) recentBox.appendChild(btn);
    });

    window.APP_STATE.cityData.favorites.forEach((name) => {
      const btn = document.createElement("button");
      btn.className = "city-pill";
      btn.textContent = name;
      if (favBox) favBox.appendChild(btn);
    });
  }

  function requestNotificationPermission() {
    if (window.Native?.isNative?.()) {
      window.Native.requestPermissions();
      return;
    }
    if (!("Notification" in window)) return;

    Notification.requestPermission().then((permission) => {
      window.DOM.show("notif-banner");
      window.DOM.setText("notif-banner", `${t("permissionStatus")}: ${permission}`);
      renderBadges();
    });
  }

  function exportBackup() {
    const text = window.StorageAPI.exportBackup();
    const box = window.DOM.qs("backup-textarea");
    if (box) box.value = text;
    window.Utils.downloadText("noor-prayer-backup.json", text, "application/json");
  }

  async function copyBackup() {
    const text = window.StorageAPI.exportBackup();
    const box = window.DOM.qs("backup-textarea");
    if (box) box.value = text;

    try {
      await navigator.clipboard.writeText(text);
      showBackupStatus(t("backupCopied"), true);
    } catch (_) {
      showBackupStatus(t("backupCopyFailed"), false);
    }
  }

  // Show an import/export result inside the settings dialog (the page banner sits behind the overlay).
  function showBackupStatus(message, ok) {
    const box = window.DOM.qs("backup-status");
    if (!box) return;
    box.textContent = message;
    box.classList.remove("hidden", "success-banner", "warning-banner");
    box.classList.add(ok ? "success-banner" : "warning-banner");
  }

  function importBackup() {
    try {
      const text = window.DOM.qs("backup-textarea")?.value || "";
      window.StorageAPI.importBackup(text);
      ensurePrayerConfigBridge();
      applyStateToUI();
      renderAll();
      showBackupStatus(t("backupImported"), true);
    } catch (error) {
      console.error(error);
      showBackupStatus(t("backupInvalid"), false);
    }
  }

  async function triggerInstallPrompt() {
    if (window.__deferredInstallPrompt) {
      window.__deferredInstallPrompt.prompt();
      await window.__deferredInstallPrompt.userChoice;
      window.__deferredInstallPrompt = null;
    }
  }

  function handleOnlineStatus() {
    const banner = window.DOM.qs("offline-banner");
    if (!banner) return;

    if (navigator.onLine) {
      banner.classList.add("hidden");
    } else {
      banner.classList.remove("hidden");
      banner.textContent = t("offlineText");
    }
  }

  function renderDebug() {
    const panel = window.DOM.qs("debug-panel");
    if (!panel) return;

    if (!window.APP_STATE.settings.debugEnabled) {
      panel.classList.add("hidden");
      return;
    }

    panel.classList.remove("hidden");
    panel.textContent = JSON.stringify(window.APP_STATE, null, 2);
  }

  function persistAndRender() {
    syncPrayerConfigFromAppState(false);
    applyStateToUI();
    renderAll();
    window.StorageAPI.saveState();
    // Re-send the prayer schedule to the push server if anything that affects it changed.
    window.Push?.scheduleSync?.(false);
    window.Native?.scheduleSync?.();
  }

  let pushTestNote = "";

  function renderPushStatus() {
    const el = window.DOM.qs("push-status");

    if (window.Native?.isNative?.()) {
      const key = {
        off: "nativeOff",
        "needs-notifications": "nativeNeedsNotif",
        "needs-battery": "nativeNeedsBattery",
        on: "nativeOn"
      }[window.Native.status()];
      if (el) el.textContent = key ? t(key) : "";
      window.DOM.hide("test-push-btn");
      window.DOM.setText("notif-permission-btn", t("nativePermBtn"));
      return;
    }

    if (!el || !window.Push) return;

    const { state } = window.Push.status();
    const key = {
      active: "pushOn",
      off: "pushOff",
      unavailable: "pushUnavailable",
      "needs-permission": "pushNeedsPermission",
      blocked: "pushBlocked",
      error: "pushError"
    }[state];

    el.textContent = pushTestNote || (key ? t(key) : "");
    window.DOM.toggle("test-push-btn", state === "unavailable");
  }

  async function runPushTest() {
    if (!window.Push) return;
    pushTestNote = "";
    const result = await window.Push.test();
    const keys = {
      disabled: "pushTestDisabled",
      permission: null,
      unavailable: null,
      rate: "pushTestRate",
      error: "pushTestFail"
    };
    if (result.ok) pushTestNote = t("pushTestSent");
    else if (keys[result.reason]) pushTestNote = t(keys[result.reason]);
    renderPushStatus();
    // Keep the message visible for a couple of minutes, then fall back to the normal status.
    setTimeout(() => {
      pushTestNote = "";
      renderPushStatus();
    }, 120000);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
