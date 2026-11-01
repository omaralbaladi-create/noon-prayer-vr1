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
    return window.APP_STATE.settings.lang === "en" ? "en" : "ar";
  }

  function tSalah(key) {
    return salahLabels[lang()][key] || key;
  }

  function init() {
    window.StorageAPI.loadState();
    ensureDailyReset();
    applyStateToUI();
    bindEvents();
    renderAll();

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("./service-worker.js").catch(console.error);
    }

    window.Qibla.requestIOSPermissionIfNeeded();
    window.Qibla.startCompass();
    handleOnlineStatus();
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

    window.DOM.qs("lang-select").value = window.APP_STATE.settings.lang;
    window.DOM.qs("theme-select").value = window.APP_STATE.settings.theme;
    window.DOM.qs("loc-mode").value = window.APP_STATE.location.mode;
    window.DOM.qs("lookup-city").checked = window.APP_STATE.location.lookupCity;
    window.DOM.qs("calc-method").value = window.APP_STATE.settings.calcMethod;
    window.DOM.qs("asr-method").value = window.APP_STATE.settings.asrMethod;
    window.DOM.qs("ramadan-mode").checked = window.APP_STATE.settings.ramadanMode;
    window.DOM.qs("debug-enabled").checked = window.APP_STATE.settings.debugEnabled;

    const latInput = window.DOM.qs("loc-lat");
    const lngInput = window.DOM.qs("loc-lng");
    if (latInput) latInput.value = window.APP_STATE.location.lat ?? "";
    if (lngInput) lngInput.value = window.APP_STATE.location.lng ?? "";

    const zakat = window.APP_STATE.settings.zakat;
    window.DOM.qs("zakat-basis").value = zakat.basis;
    window.DOM.qs("zakat-gold-price").value = zakat.goldPrice;
    window.DOM.qs("zakat-silver-price").value = zakat.silverPrice;

    const notif = window.APP_STATE.settings.notifications;
    window.DOM.qs("notif-enabled").checked = notif.enabled;
    window.DOM.qs("audio-enabled").checked = notif.audioEnabled;
    window.DOM.qs("adhan-audio-select").value = notif.adhanAudio;
    window.DOM.qs("reminder-offset").value = String(notif.reminderOffset);
    window.DOM.qs("notify-fajr").checked = notif.prayers.fajr;
    window.DOM.qs("notify-dhuhr").checked = notif.prayers.dhuhr;
    window.DOM.qs("notify-asr").checked = notif.prayers.asr;
    window.DOM.qs("notify-maghrib").checked = notif.prayers.maghrib;
    window.DOM.qs("notify-isha").checked = notif.prayers.isha;

    Object.entries(window.APP_STATE.settings.offsets).forEach(([key, value]) => {
      const el = window.DOM.qs(`offset-${key}`);
      if (el) el.value = value;
    });

    Object.entries(window.APP_STATE.settings.iqamah).forEach(([key, value]) => {
      const el = window.DOM.qs(`iqamah-${key}`);
      if (el) el.value = value;
    });

    setupPresetCities();
    toggleLocationModeFields();
  }

  function setupPresetCities() {
    const select = window.DOM.qs("loc-preset");
    select.innerHTML = "";
    window.APP_CONFIG.presetCities.forEach((city) => {
      const opt = document.createElement("option");
      opt.value = city.id;
      opt.textContent = lang() === "ar" ? city.nameAr : city.nameEn;
      if (
        Math.abs(city.lat - window.APP_STATE.location.lat) < 0.0001 &&
        Math.abs(city.lng - window.APP_STATE.location.lng) < 0.0001
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

    window.DOM.qs("open-settings-btn").onclick = () => window.DOM.openModal("settings-modal");
    window.DOM.qs("close-settings-btn").onclick = () => window.DOM.closeModal("settings-modal");
    window.DOM.qs("overlay").onclick = () => {
      window.DOM.closeModal("settings-modal");
      window.DOM.closeModal("confirm-modal");
    };

    window.DOM.qs("lang-toggle-btn").onclick = () => {
      window.APP_STATE.settings.lang = window.APP_STATE.settings.lang === "ar" ? "en" : "ar";
      persistAndRender();
    };

    window.DOM.qs("theme-cycle-btn").onclick = () => {
      const themes = ["emerald", "midnight", "desert", "sunset"];
      const current = window.APP_STATE.settings.theme;
      const nextIndex = (themes.indexOf(current) + 1) % themes.length;
      window.APP_STATE.settings.theme = themes[nextIndex];
      persistAndRender();
    };

    window.DOM.qs("lang-select").onchange = (e) => {
      window.APP_STATE.settings.lang = e.target.value;
      persistAndRender();
    };

    window.DOM.qs("theme-select").onchange = (e) => {
      window.APP_STATE.settings.theme = e.target.value;
      persistAndRender();
    };

    window.DOM.qs("loc-mode").onchange = (e) => {
      const mode = e.target.value;
      window.APP_STATE.location.mode = mode;
      toggleLocationModeFields();

      if (mode === "auto") {
        detectLocation();
      } else if (mode === "preset") {
        const presetSelect = window.DOM.qs("loc-preset");
        if (presetSelect && presetSelect.value) {
          applyPresetCity(presetSelect.value);
        }
      } else if (mode === "custom") {
        applyCustomCoordinatesFromInputs();
      }

      persistAndRender();
    };

    window.DOM.qs("loc-preset").onchange = (e) => {
      applyPresetCity(e.target.value);
      persistAndRender();
    };

    const latInput = window.DOM.qs("loc-lat");
    const lngInput = window.DOM.qs("loc-lng");

    if (latInput) {
      latInput.oninput = () => {
        if (window.APP_STATE.location.mode === "custom") {
          applyCustomCoordinatesFromInputs(false);
        }
      };
      latInput.onchange = () => {
        if (window.APP_STATE.location.mode !== "custom") {
          window.APP_STATE.location.mode = "custom";
        }
        applyCustomCoordinatesFromInputs(true);
        persistAndRender();
      };
    }

    if (lngInput) {
      lngInput.oninput = () => {
        if (window.APP_STATE.location.mode === "custom") {
          applyCustomCoordinatesFromInputs(false);
        }
      };
      lngInput.onchange = () => {
        if (window.APP_STATE.location.mode !== "custom") {
          window.APP_STATE.location.mode = "custom";
        }
        applyCustomCoordinatesFromInputs(true);
        persistAndRender();
      };
    }

    window.DOM.qs("city-search-btn").onclick = searchCity;

    window.DOM.qs("lookup-city").onchange = (e) => {
      window.APP_STATE.location.lookupCity = e.target.checked;
      if (e.target.checked && window.APP_STATE.location.mode === "custom") {
        reverseLookupCurrentLocation();
      }
      persistAndRender();
    };

    window.DOM.qs("calc-method").onchange = (e) => {
      window.APP_STATE.settings.calcMethod = e.target.value;
      persistAndRender();
    };

    window.DOM.qs("asr-method").onchange = (e) => {
      window.APP_STATE.settings.asrMethod = e.target.value;
      persistAndRender();
    };

    window.DOM.qs("ramadan-mode").onchange = (e) => {
      window.APP_STATE.settings.ramadanMode = e.target.checked;
      persistAndRender();
    };

    ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"].forEach((key) => {
      const el = window.DOM.qs(`offset-${key}`);
      el.onchange = (e) => {
        window.APP_STATE.settings.offsets[key] = Number(e.target.value || 0);
        persistAndRender();
      };
    });

    ["fajr", "dhuhr", "asr", "maghrib", "isha"].forEach((key) => {
      const el = window.DOM.qs(`iqamah-${key}`);
      el.onchange = (e) => {
        window.APP_STATE.settings.iqamah[key] = e.target.value.trim();
        persistAndRender();
      };
    });

    window.DOM.qs("save-salah-day-btn").onclick = saveTodaySalahToHistory;
    window.DOM.qs("reset-salah-btn").onclick = resetTodaySalah;
    window.DOM.qs("clear-history-btn").onclick = clearHistory;
    window.DOM.qs("reset-azkar-btn").onclick = resetAzkarToday;
    window.DOM.qs("tasbih-increment-btn").onclick = incrementTasbih;
    window.DOM.qs("tasbih-reset-btn").onclick = resetTasbih;
    window.DOM.qs("reset-khatm-btn").onclick = resetQuranKhatm;
    window.DOM.qs("export-csv-btn").onclick = window.Prayer.exportMonthCSV;

    window.DOM.qs("month-prev-btn").onclick = () => {
      window.APP_STATE.ui.currentMonthOffset -= 1;
      persistAndRender();
    };

    window.DOM.qs("month-next-btn").onclick = () => {
      window.APP_STATE.ui.currentMonthOffset += 1;
      persistAndRender();
    };

    document.querySelectorAll(".dhikr-btn").forEach((btn) => {
      btn.onclick = () => {
        window.APP_STATE.trackers.tasbih.index = Number(btn.dataset.dhikr);
        window.APP_STATE.trackers.tasbih.count = 0;
        persistAndRender();
      };
    });

    window.DOM.qs("zakat-basis").onchange = (e) => {
      window.APP_STATE.settings.zakat.basis = e.target.value;
      persistAndRender();
    };

    window.DOM.qs("zakat-gold-price").oninput = (e) => {
      window.APP_STATE.settings.zakat.goldPrice = e.target.value;
      persistAndRender();
    };

    window.DOM.qs("zakat-silver-price").oninput = (e) => {
      window.APP_STATE.settings.zakat.silverPrice = e.target.value;
      persistAndRender();
    };

    ["zakat-cash", "zakat-gold", "zakat-stocks", "zakat-debt", "zakat-hawl"].forEach((id) => {
      window.DOM.qs(id).oninput = renderZakat;
      window.DOM.qs(id).onchange = renderZakat;
    });

    window.DOM.qs("notif-permission-btn").onclick = requestNotificationPermission;
    window.DOM.qs("notif-enabled").onchange = (e) => {
      window.APP_STATE.settings.notifications.enabled = e.target.checked;
      persistAndRender();
    };
    window.DOM.qs("audio-enabled").onchange = (e) => {
      window.APP_STATE.settings.notifications.audioEnabled = e.target.checked;
      persistAndRender();
    };
    window.DOM.qs("adhan-audio-select").onchange = (e) => {
      window.APP_STATE.settings.notifications.adhanAudio = e.target.value;
      persistAndRender();
    };
    window.DOM.qs("reminder-offset").onchange = (e) => {
      window.APP_STATE.settings.notifications.reminderOffset = Number(e.target.value);
      persistAndRender();
    };

    ["fajr", "dhuhr", "asr", "maghrib", "isha"].forEach((key) => {
      const el = window.DOM.qs(`notify-${key}`);
      el.onchange = (e) => {
        window.APP_STATE.settings.notifications.prayers[key] = e.target.checked;
        persistAndRender();
      };
    });

    window.DOM.qs("export-backup-btn").onclick = exportBackup;
    window.DOM.qs("copy-backup-btn").onclick = copyBackup;
    window.DOM.qs("import-backup-btn").onclick = importBackup;

    window.DOM.qs("install-app-btn").onclick = triggerInstallPrompt;
    window.DOM.qs("debug-enabled").onchange = (e) => {
      window.APP_STATE.settings.debugEnabled = e.target.checked;
      persistAndRender();
    };

    window.addEventListener("online", handleOnlineStatus);
    window.addEventListener("offline", handleOnlineStatus);
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      window.__deferredInstallPrompt = e;
      window.DOM.setText("install-badge", lang() === "ar" ? "التثبيت متاح" : "Install available");
      window.DOM.show(window.DOM.qs("pwa-banner"));
      window.DOM.setText("pwa-banner", lang() === "ar" ? "يمكنك تثبيت التطبيق على جهازك." : "You can install the app on your device.");
    });
  }

  function applyPresetCity(cityId) {
    const city = window.APP_CONFIG.presetCities.find((c) => c.id === cityId);
    if (!city) return;
    window.APP_STATE.location.cityName = lang() === "ar" ? city.nameAr : city.nameEn;
    window.APP_STATE.location.lat = city.lat;
    window.APP_STATE.location.lng = city.lng;
  }

  function applyCustomCoordinatesFromInputs(updateLabel = true) {
    const latInput = window.DOM.qs("loc-lat");
    const lngInput = window.DOM.qs("loc-lng");
    if (!latInput || !lngInput) return;

    const lat = Number(latInput.value);
    const lng = Number(lngInput.value);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return;

    window.APP_STATE.location.lat = lat;
    window.APP_STATE.location.lng = lng;

    if (updateLabel) {
      if (window.APP_STATE.location.lookupCity) {
        reverseLookupCurrentLocation();
      } else {
        window.APP_STATE.location.cityName = lang() === "ar" ? "موقع مخصص" : "Custom location";
      }
    }
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
    window.DOM.qs(`tab-${tabName}`).classList.remove("hidden");
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

    preset.classList.add("hidden");
    custom.classList.add("hidden");
    search.classList.add("hidden");

    if (mode === "preset") preset.classList.remove("hidden");
    if (mode === "custom") custom.classList.remove("hidden");
    if (mode === "search") search.classList.remove("hidden");
  }

  function detectLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        window.APP_STATE.location.lat = pos.coords.latitude;
        window.APP_STATE.location.lng = pos.coords.longitude;
        window.APP_STATE.location.cityName = "GPS";

        if (window.APP_STATE.location.lookupCity) {
          await reverseLookupCurrentLocation();
        }

        persistAndRender();
      },
      () => {
        window.DOM.show(window.DOM.qs("api-banner"));
        window.DOM.setText("api-banner", lang() === "ar" ? "تعذر الوصول إلى GPS، تم الاحتفاظ بالموقع الحالي." : "Unable to access GPS. Current location was kept.");
      }
    );
  }

  async function searchCity() {
    const input = window.DOM.qs("city-search-input");
    const query = input.value.trim();
    if (!query) return;

    const status = window.DOM.qs("city-search-status");
    const results = window.DOM.qs("city-search-results");
    status.textContent = lang() === "ar" ? "جارٍ البحث..." : "Searching...";
    results.innerHTML = "";

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`;
      const res = await fetch(url, {
        headers: { "Accept-Language": "ar,en" }
      });
      const data = await res.json();

      status.textContent = data.length
        ? (lang() === "ar" ? "اختر نتيجة:" : "Choose a result:")
        : (lang() === "ar" ? "لا توجد نتائج." : "No results.");

      data.slice(0, 5).forEach((item) => {
        const btn = document.createElement("button");
        btn.className = "city-pill";
        btn.textContent = item.display_name;
        btn.onclick = () => {
          window.APP_STATE.location.mode = "search";
          window.APP_STATE.location.cityName = item.display_name;
          window.APP_STATE.location.lat = Number(item.lat);
          window.APP_STATE.location.lng = Number(item.lon);
          addRecentCity(item.display_name);
          persistAndRender();
        };
        results.appendChild(btn);
      });
    } catch (error) {
      console.error(error);
      status.textContent = lang() === "ar" ? "حدث خطأ أثناء البحث." : "Search failed.";
    }
  }

  function addRecentCity(name) {
    const recent = window.APP_STATE.cityData.recent.filter((c) => c !== name);
    recent.unshift(name);
    window.APP_STATE.cityData.recent = recent.slice(0, 6);
  }

  function renderAll() {
    renderLocationLabel();
    renderBadges();
    window.Prayer.renderTodayPrayerList();
    window.Prayer.renderMonthTable();
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
    const safeName = cityName || (lang() === "ar" ? "موقع غير محدد" : "Unknown location");
    window.DOM.setText("location-label", `${safeName} • ${Number(lat).toFixed(2)}, ${Number(lng).toFixed(2)}`);
  }

  function renderBadges() {
    window.DOM.setText("version-badge", `v${window.APP_CONFIG.version}`);
    window.DOM.setText("ramadan-badge", window.APP_STATE.settings.ramadanMode ? (lang() === "ar" ? "وضع رمضان" : "Ramadan mode") : (lang() === "ar" ? "الوضع العادي" : "Normal mode"));
    window.DOM.setText("notif-badge", window.APP_STATE.settings.notifications.enabled ? (lang() === "ar" ? "الإشعارات مفعلة" : "Notifications on") : (lang() === "ar" ? "الإشعارات متوقفة" : "Notifications off"));
    window.DOM.setText("audio-badge", window.APP_STATE.settings.notifications.audioEnabled ? (lang() === "ar" ? "صوت الأذان مفعّل" : "Adhan audio on") : (lang() === "ar" ? "صوت الأذان متوقف" : "Adhan audio off"));
  }

  function renderSalahTracker() {
    const list = window.DOM.qs("salah-list");
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

    window.DOM.qs("salah-progress-bar").style.width = `${pct}%`;
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
    container.innerHTML = "";

    list.forEach((item) => {
      const count = window.APP_STATE.trackers.azkarProgress[item.id] || 0;
      const done = count >= item.repeat;

      const card = document.createElement("div");
      card.className = "azkar-card";
      card.innerHTML = `
        <h4>${item.title}</h4>
        <div class="azkar-arabic">${item.arabic}</div>
        <div class="actions">
          <span>${count} / ${item.repeat}</span>
          <button class="btn-secondary">${done ? (lang() === "ar" ? "مكتمل" : "Done") : (lang() === "ar" ? "عدّ" : "Count")}</button>
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
    const current = dhikrOptions[index];

    window.DOM.setText("dhikr-title", lang() === "ar" ? current.titleAr : current.titleEn);
    window.DOM.setText("dhikr-ar", current.arabic);
    window.DOM.setText("tasbih-display", String(count));
    window.DOM.setText("tasbih-target", lang() === "ar" ? `الهدف: ${current.target}` : `Target: ${current.target}`);
    window.DOM.setText("tasbih-msg", count >= current.target ? (lang() === "ar" ? "تم بلوغ الهدف" : "Target reached") : "");
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
    window.DOM.qs("quran-progress-bar").style.width = `${pct}%`;
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

  function renderZakat() {
    const basis = window.DOM.qs("zakat-basis").value;
    const goldPrice = Number(window.DOM.qs("zakat-gold-price").value || 0);
    const silverPrice = Number(window.DOM.qs("zakat-silver-price").value || 0);
    const cash = Number(window.DOM.qs("zakat-cash").value || 0);
    const gold = Number(window.DOM.qs("zakat-gold").value || 0);
    const stocks = Number(window.DOM.qs("zakat-stocks").value || 0);
    const debt = Number(window.DOM.qs("zakat-debt").value || 0);
    const hawl = window.DOM.qs("zakat-hawl").checked;

    const wealth = Math.max(0, cash + gold + stocks - debt);
    const nisab = basis === "gold" ? goldPrice * 85 : silverPrice * 595;
    const eligible = hawl && wealth >= nisab;
    const due = eligible ? wealth * 0.025 : 0;

    window.DOM.setText("zakat-nisab-label", basis === "gold"
      ? (lang() === "ar" ? "النصاب (85 غرام ذهب)" : "Nisab (85g gold)")
      : (lang() === "ar" ? "النصاب (595 غرام فضة)" : "Nisab (595g silver)")
    );
    window.DOM.setText("zakat-nisab-val", window.Utils.formatCurrency(nisab));
    window.DOM.setText("zakat-total", window.Utils.formatCurrency(wealth));
    window.DOM.setText("zakat-due", window.Utils.formatCurrency(due));
    window.DOM.setText(
      "zakat-status-msg",
      !hawl
        ? (lang() === "ar" ? "الزكاة لا تُحسب حتى يمر حول قمري كامل." : "Zakat is not due until one lunar year passes.")
        : wealth < nisab
          ? (lang() === "ar" ? "المبلغ أقل من النصاب." : "Amount is below nisab.")
          : (lang() === "ar" ? "بلغ المال النصاب وتحققت الشروط الأساسية." : "Wealth meets nisab and basic conditions.")
    );
  }

  function renderRecentAndFavorites() {
    const recentBox = window.DOM.qs("recent-cities");
    const favBox = window.DOM.qs("favorite-cities");
    recentBox.innerHTML = "";
    favBox.innerHTML = "";

    window.APP_STATE.cityData.recent.forEach((name) => {
      const btn = document.createElement("button");
      btn.className = "city-pill";
      btn.textContent = name;
      recentBox.appendChild(btn);
    });

    window.APP_STATE.cityData.favorites.forEach((name) => {
      const btn = document.createElement("button");
      btn.className = "city-pill";
      btn.textContent = name;
      favBox.appendChild(btn);
    });
  }

  function requestNotificationPermission() {
    if (!("Notification" in window)) return;
    Notification.requestPermission().then((permission) => {
      window.DOM.show(window.DOM.qs("notif-banner"));
      window.DOM.setText("notif-banner", `Notification permission: ${permission}`);
    });
  }

  function exportBackup() {
    const text = window.StorageAPI.exportBackup();
    window.DOM.qs("backup-textarea").value = text;
    window.Utils.downloadText("noor-prayer-backup.json", text, "application/json");
  }

  async function copyBackup() {
    const text = window.StorageAPI.exportBackup();
    window.DOM.qs("backup-textarea").value = text;
    try {
      await navigator.clipboard.writeText(text);
      window.DOM.show(window.DOM.qs("backup-banner"));
      window.DOM.setText("backup-banner", lang() === "ar" ? "تم نسخ النسخة الاحتياطية." : "Backup copied.");
    } catch (_) {}
  }

  function importBackup() {
    try {
      const text = window.DOM.qs("backup-textarea").value;
      window.StorageAPI.importBackup(text);
      applyStateToUI();
      renderAll();
      window.DOM.show(window.DOM.qs("backup-banner"));
      window.DOM.setText("backup-banner", lang() === "ar" ? "تم استيراد النسخة الاحتياطية." : "Backup imported.");
    } catch (error) {
      console.error(error);
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
    if (navigator.onLine) {
      banner.classList.add("hidden");
    } else {
      banner.classList.remove("hidden");
      banner.textContent = lang() === "ar"
        ? "أنت غير متصل الآن. سيستمر التطبيق بالعمل بقدر الإمكان دون إنترنت."
        : "You are offline now. The app will keep working as much as possible.";
    }
  }

  function renderDebug() {
    const panel = window.DOM.qs("debug-panel");
    if (!window.APP_STATE.settings.debugEnabled) {
      panel.classList.add("hidden");
      return;
    }
    panel.classList.remove("hidden");
    panel.textContent = JSON.stringify(window.APP_STATE, null, 2);
  }

  function persistAndRender() {
    applyStateToUI();
    renderAll();
    window.StorageAPI.saveState();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
