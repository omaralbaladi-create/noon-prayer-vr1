(function () {
  const translations = {
    ar: {
      appName: "نور الصلاة برو",
      nextPrayer: "الصلاة القادمة",
      todaySchedule: "مواقيت اليوم",
      prayerAndQibla: "الصلاة والقبلة",
      month: "الشهر",
      salah: "سجل الصلوات",
      history: "السجل",
      azkar: "الأذكار",
      tasbih: "التسبيح",
      quran: "ختم القرآن",
      zakat: "الزكاة",
      settings: "إعدادات التطبيق",
      close: "إغلاق"
    },
    en: {
      appName: "NoorPrayer Pro",
      nextPrayer: "Next Prayer",
      todaySchedule: "Today's Schedule",
      prayerAndQibla: "Prayer & Qibla",
      month: "Month",
      salah: "Prayer Log",
      history: "History",
      azkar: "Azkar",
      tasbih: "Tasbih",
      quran: "Quran ختمة",
      zakat: "Zakat",
      settings: "App Settings",
      close: "Close"
    }
  };

  function getLang() {
    return window.APP_STATE?.settings?.lang === "en" ? "en" : "ar";
  }

  function t(key) {
    const lang = getLang();
    return translations[lang]?.[key] || key;
  }

  function applyLanguage() {
    const lang = getLang();
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.body.dir = lang === "ar" ? "rtl" : "ltr";

    const appTitle = document.getElementById("app-title");
    const langBadge = document.getElementById("lang-badge");
    const nextPrayerLabel = document.getElementById("next-prayer-label");
    const closeSettingsBtn = document.getElementById("close-settings-btn");

    if (appTitle) appTitle.textContent = t("appName");
    if (langBadge) langBadge.textContent = lang.toUpperCase();
    if (nextPrayerLabel) nextPrayerLabel.textContent = t("nextPrayer");
    if (closeSettingsBtn) closeSettingsBtn.textContent = t("close");
  }

  window.I18N = {
    t,
    applyLanguage,
    getLang
  };
})();
