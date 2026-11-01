(function () {
  const prayerNames = {
    ar: {
      fajr: "الفجر",
      sunrise: "الشروق",
      dhuhr: "الظهر",
      asr: "العصر",
      maghrib: "المغرب",
      isha: "العشاء"
    },
    en: {
      fajr: "Fajr",
      sunrise: "Sunrise",
      dhuhr: "Dhuhr",
      asr: "Asr",
      maghrib: "Maghrib",
      isha: "Isha"
    }
  };

  function getPrayerLang() {
    return window.I18N?.getLang?.() === "en" ? "en" : "ar";
  }

  function prayerLabel(key) {
    const lang = getPrayerLang();
    return prayerNames[lang]?.[key] || key;
  }

  window.PrayerLabels = {
    prayerNames,
    getPrayerLang,
    prayerLabel
  };
})();
