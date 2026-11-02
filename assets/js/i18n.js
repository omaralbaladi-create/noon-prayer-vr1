(function () {
  const translations = {
    ar: {
      updateAvailable: "يتوفر إصدار جديد من التطبيق.",
      privacyPolicy: "سياسة الخصوصية",
      backupInvalid: "ملف النسخة الاحتياطية غير صالح. لم يتم تغيير أي بيانات.",
      backupCopyFailed: "تعذر النسخ تلقائيًا. انسخ النص من المربع يدويًا.",
      gpsLocation: "موقعي (GPS)",
      notificationsBlocked: "الإشعارات محظورة من المتصفح",
      notificationsNeedsPermission: "الإشعارات تحتاج إذنًا",
      notificationsUnsupported: "الإشعارات غير مدعومة",
      testAlert: "اختبار التنبيه والصوت",
      alertsNote: "تعمل التنبيهات وصوت الأذان أثناء فتح التطبيق، حتى لو كان في الخلفية. لا تستطيع تطبيقات الويب إيقاظ الجهاز بعد إغلاقها تمامًا. عند اختيار التذكير قبل الصلاة يصلك التنبيه قبل الموعد، ويُرفع الأذان في الموعد نفسه.",
      appName: "نور الصلاة",
      appTitle: "نور الصلاة | مواقيت الصلاة",
      tagline: "مواقيت الصلاة",
      nextPrayer: "الصلاة القادمة",
      prayerAndQibla: "الصلاة والقبلة",
      month: "الشهر",
      salah: "سجل الصلوات",
      history: "السجل",
      azkar: "الأذكار",
      tasbih: "التسبيح",
      quran: "ختم القرآن",
      zakat: "الزكاة",

      todayTimes: "مواقيت اليوم",
      todayTimesSub: "يتم الحساب محليًا حسب الموقع والمنطقة الزمنية للجهاز وطريقة الحساب المختارة.",
      monthlyTable: "الجدول الشهري",
      monthlyTableSub: "مواقيت الشهر الحالي حسب موقعك وطريقة الحساب المختارة.",
      dailySalah: "متابعة الصلوات اليومية",
      dailySalahSub: "حدّد كل صلاة أديتها اليوم. تتم إعادة التعيين مع بداية يوم جديد.",
      historyTitle: "سجل الصلوات السابق",
      historySub: "ملخص الأيام التي حفظتها يدويًا في السجل.",
      qiblaTitle: "اتجاه القبلة",
      qiblaSub: "لف الجهاز حتى تتوافق علامة الكعبة مع السهم العلوي.",
      quranTitle: "تقدم ختم القرآن",
      quranSub: "اضغط على رقم الجزء لتحديده مكتملًا أو غير مكتمل.",
      zakatTitle: "حاسبة زكاة المال",
      zakatSub: "هذه مجرد حاسبة تقديرية بسيطة. راجع عالمًا موثوقًا للحالات المعقدة.",
      azkarMorning: "أذكار الصباح",
      azkarEvening: "أذكار المساء",
      azkarSleep: "أذكار النوم",
      azkarNote: "يتم تصفير التقدم يوميًا. يُرجى مراجعة النصوص والعدّ من نسخة موثوقة من حصن المسلم.",

      saveDay: "حفظ اليوم في السجل",
      resetToday: "إعادة تعيين سجل صلوات اليوم",
      clearHistory: "مسح السجل",
      resetAzkar: "إعادة تعيين تقدم الأذكار لليوم",
      tapToCount: "اضغط للعد",
      resetCounter: "إعادة تعيين العداد",
      newKhatm: "بدء ختمة جديدة",
      exportCsv: "تصدير CSV",
      installApp: "تثبيت التطبيق",
      close: "إغلاق",
      requestCompass: "تفعيل مستشعر البوصلة",
      requestNotifications: "طلب إذن الإشعارات",
      exportBackup: "تصدير نسخة",
      copyJson: "نسخ JSON",
      importBackup: "استيراد النسخة",

      settings: "إعدادات التطبيق",
      language: "اللغة",
      locationSource: "مصدر الموقع",
      lookupCity: "جلب اسم المدينة من الإحداثيات",
      calcMethod: "طريقة الحساب",
      asrMethod: "حساب العصر",
      highLatitudeRule: "قاعدة خطوط العرض العالية",
      midnightMode: "طريقة منتصف الليل",
      customCalcValues: "القيم المخصصة لطريقة الحساب",
      customFajr: "فجر مخصص",
      customMaghrib: "مغرب مخصص",
      customIsha: "عشاء مخصص",
      customMidnight: "منتصف ليل مخصص",
      theme: "المظهر",
      ramadanMode: "تفعيل وضع رمضان",
      manualOffsets: "الإزاحات اليدوية للمواقيت",
      iqamahTimes: "أوقات الإقامة",
      prayerAlerts: "تنبيهات الصلاة",
      enableNotifications: "تفعيل تنبيهات الصلاة",
      enableAdhanAudio: "تفعيل صوت الأذان",
      adhanVoice: "صوت الأذان",
      remindBefore: "ذكّرني قبل الصلاة",
      backupRestore: "النسخ الاحتياطي والاستعادة",
      backupData: "بيانات النسخة الاحتياطية",

      installReady: "جاهز كتطبيق ويب",
      installAvailable: "التثبيت متاح",
      notificationsOff: "الإشعارات متوقفة",
      notificationsOn: "الإشعارات مفعلة",
      adhanAudioOff: "صوت الأذان متوقف",
      adhanAudioOn: "صوت الأذان مفعّل",
      normalMode: "الوضع العادي",
      ramadanModeBadge: "وضع رمضان",

      footerNote: "يعمل نور الصلاة بشكل أفضل عبر HTTPS. قد لا تعمل بعض الإشعارات وأذونات البوصلة وخيارات التثبيت بالكامل داخل بعض المعاينات.",
      pwaInstallText: "يمكنك تثبيت التطبيق على جهازك.",
      offlineText: "أنت غير متصل الآن. سيستمر التطبيق بالعمل بقدر الإمكان دون إنترنت.",

      statsSavedDays: "أيام محفوظة",
      statsPerfectDays: "أيام كاملة",
      statsAverage: "متوسط الإنجاز",

      zakatNisab: "النصاب",
      zakatWealth: "المال الخاضع للزكاة",
      zakatDue: "الزكاة الواجبة (2.5%)",
      zakatBasis: "أساس النصاب",
      zakatGoldPrice: "سعر غرام الذهب عيار 24",
      zakatSilverPrice: "سعر غرام الفضة",
      zakatCash: "النقد",
      zakatGoldAssets: "قيمة الذهب والفضة",
      zakatStocks: "الاستثمارات والأسهم",
      zakatDebt: "الديون المستحقة",
      zakatHawl: "مرّ حول قمري كامل على هذا المال",

      target: "الهدف",
      completed: "مكتمل",
      count: "عدّ",
      done: "مكتمل",

      prayerReminderFajr: "تنبيه الفجر",
      prayerReminderDhuhr: "تنبيه الظهر",
      prayerReminderAsr: "تنبيه العصر",
      prayerReminderMaghrib: "تنبيه المغرب",
      prayerReminderIsha: "تنبيه العشاء",

      customLocation: "موقع مخصص",
      unknownLocation: "موقع غير محدد",
      locating: "جارٍ تحديد الموقع...",
      searchCityLabel: "ابحث عن مدينة أو منطقة",
      searchButton: "بحث",
      favorites: "المفضلة",
      recents: "عمليات البحث الأخيرة",
      searching: "جارٍ البحث...",
      chooseResult: "اختر نتيجة:",
      noResults: "لا توجد نتائج.",
      searchFailed: "حدث خطأ أثناء البحث.",

      atPrayerTime: "وقت الصلاة",
      minutesBefore5: "قبل 5 دقائق",
      minutesBefore10: "قبل 10 دقائق",
      minutesBefore15: "قبل 15 دقيقة",

      automaticGps: "تلقائي (GPS)",
      presetCity: "اختر مدينة",
      customCoordinates: "إحداثيات مخصصة",
      searchForCity: "البحث عن مدينة",

      standard: "قياسي",
      hanafi: "حنفي",
      nightMiddle: "منتصف الليل",
      angleBased: "حسب الزاوية",
      oneSeventh: "سبع الليل",
      useMethodDefault: "استخدام الافتراضي للطريقة",
      standardMidnight: "قياسي",
      jafari: "جعفري",

      monthDay: "اليوم",
      fajr: "الفجر",
      dhuhr: "الظهر",
      asr: "العصر",
      maghrib: "المغرب",
      isha: "العشاء",
      sunrise: "الشروق",
      midnight: "منتصف الليل",
      iqamah: "الإقامة",

      update: "تحديث",
      confirm: "تأكيد",
      areYouSure: "هل أنت متأكد؟",
      cancel: "إلغاء",

      noscript: "JavaScript مطلوب لكي يعمل NoorPrayer في حساب المواقيت وإدارة الإعدادات والعمل دون اتصال.",
      backupCopied: "تم نسخ النسخة الاحتياطية.",
      backupImported: "تم استيراد النسخة الاحتياطية.",
      permissionStatus: "حالة إذن الإشعارات",

      latPlaceholder: "خط العرض",
      lngPlaceholder: "خط الطول",
      citySearchPlaceholder: "مثال: الرياض، جدة، الخبر",

      customFajrPlaceholder: "مثال: 18",
      customMaghribPlaceholder: "مثال: sunset أو 4",
      customIshaPlaceholder: "مثال: 17 أو 90 min"
    },

    en: {
      updateAvailable: "A new version of the app is available.",
      privacyPolicy: "Privacy policy",
      backupInvalid: "Invalid backup file. Nothing was changed.",
      backupCopyFailed: "Could not copy automatically. Copy the text from the box manually.",
      gpsLocation: "My location (GPS)",
      notificationsBlocked: "Notifications are blocked by the browser",
      notificationsNeedsPermission: "Notifications need permission",
      notificationsUnsupported: "Notifications are not supported",
      testAlert: "Test alert and sound",
      alertsNote: "Alerts and adhan sound work while the app is open, even in the background. Web apps cannot wake the device after they are fully closed. If you choose a reminder before the prayer, the notification arrives early and the adhan plays at the prayer time.",
      appName: "NoorPrayer",
      appTitle: "NoorPrayer | Prayer Times",
      tagline: "Prayer Times",
      nextPrayer: "Next Prayer",
      prayerAndQibla: "Prayer and Qibla",
      month: "Month",
      salah: "Prayer Log",
      history: "History",
      azkar: "Azkar",
      tasbih: "Praise",
      quran: "Completing the Quran",
      zakat: "Zakat",

      todayTimes: "Today's times",
      todayTimesSub: "The calculation is done locally based on the device's location, time zone, and the chosen calculation method.",
      monthlyTable: "Monthly table",
      monthlyTableSub: "Prayer times for the current month based on your location and selected calculation method.",
      dailySalah: "Daily prayer tracking",
      dailySalahSub: "Mark each prayer you completed today. It resets at the start of a new day.",
      historyTitle: "Previous prayer history",
      historySub: "Summary of days you manually saved in the history.",
      qiblaTitle: "Qibla direction",
      qiblaSub: "Rotate the device until the Kaaba marker aligns with the top indicator.",
      quranTitle: "Quran completion progress",
      quranSub: "Tap a Juz number to toggle it as completed or not completed.",
      zakatTitle: "Zakat calculator",
      zakatSub: "This is a simple estimate only. Consult a trusted scholar for complex cases.",
      azkarMorning: "Morning azkar",
      azkarEvening: "Evening azkar",
      azkarSleep: "Sleep azkar",
      azkarNote: "Progress resets daily. Please review the wording and counts from a trusted Hisn al-Muslim source.",

      saveDay: "Save day to history",
      resetToday: "Reset today's prayer log",
      clearHistory: "Clear history",
      resetAzkar: "Reset today's azkar progress",
      tapToCount: "Tap to count",
      resetCounter: "Reset counter",
      newKhatm: "Start a new completion",
      exportCsv: "Export CSV",
      installApp: "Install app",
      close: "Close",
      requestCompass: "Enable compass sensor",
      requestNotifications: "Request notification permission",
      exportBackup: "Export backup",
      copyJson: "Copy JSON",
      importBackup: "Import backup",

      settings: "App settings",
      language: "Language",
      locationSource: "Location source",
      lookupCity: "Fetch city name from coordinates",
      calcMethod: "Calculation method",
      asrMethod: "Asr method",
      highLatitudeRule: "High-latitude rule",
      midnightMode: "Midnight mode",
      customCalcValues: "Custom calculation values",
      customFajr: "Custom Fajr",
      customMaghrib: "Custom Maghrib",
      customIsha: "Custom Isha",
      customMidnight: "Custom midnight",
      theme: "Theme",
      ramadanMode: "Enable Ramadan mode",
      manualOffsets: "Manual prayer offsets",
      iqamahTimes: "Iqamah times",
      prayerAlerts: "Prayer alerts",
      enableNotifications: "Enable prayer notifications",
      enableAdhanAudio: "Enable adhan audio",
      adhanVoice: "Adhan voice",
      remindBefore: "Remind me before prayer",
      backupRestore: "Backup and restore",
      backupData: "Backup data",

      installReady: "Ready as web app",
      installAvailable: "Installation is available",
      notificationsOff: "Notifications are turned off",
      notificationsOn: "Notifications are on",
      adhanAudioOff: "Adhan audio is off",
      adhanAudioOn: "Adhan audio is on",
      normalMode: "Normal mode",
      ramadanModeBadge: "Ramadan mode",

      footerNote: "NoorPrayer works best over HTTPS. Some notifications, compass permissions, and install options may not fully work in some previews.",
      pwaInstallText: "You can install the application on your device.",
      offlineText: "You are offline now. The app will keep working as much as possible.",

      statsSavedDays: "Saved days",
      statsPerfectDays: "Perfect days",
      statsAverage: "Average completion",

      zakatNisab: "Nisab",
      zakatWealth: "Zakatable wealth",
      zakatDue: "Zakat due (2.5%)",
      zakatBasis: "Nisab basis",
      zakatGoldPrice: "24k gold price per gram",
      zakatSilverPrice: "Silver price per gram",
      zakatCash: "Cash",
      zakatGoldAssets: "Gold and silver value",
      zakatStocks: "Investments and stocks",
      zakatDebt: "Due debts",
      zakatHawl: "A full lunar year has passed over this wealth",

      target: "Target",
      completed: "Completed",
      count: "Count",
      done: "Done",

      prayerReminderFajr: "Fajr reminder",
      prayerReminderDhuhr: "Dhuhr reminder",
      prayerReminderAsr: "Asr reminder",
      prayerReminderMaghrib: "Maghrib reminder",
      prayerReminderIsha: "Isha reminder",

      customLocation: "Custom location",
      unknownLocation: "Unknown location",
      locating: "Detecting location...",
      searchCityLabel: "Search for a city or area",
      searchButton: "Search",
      favorites: "Favorites",
      recents: "Recent searches",
      searching: "Searching...",
      chooseResult: "Choose a result:",
      noResults: "No results.",
      searchFailed: "Search failed.",

      atPrayerTime: "At prayer time",
      minutesBefore5: "5 minutes before",
      minutesBefore10: "10 minutes before",
      minutesBefore15: "15 minutes before",

      automaticGps: "Automatic (GPS)",
      presetCity: "Choose a city",
      customCoordinates: "Custom coordinates",
      searchForCity: "Search for a city",

      standard: "Standard",
      hanafi: "Hanafi",
      nightMiddle: "Night Middle",
      angleBased: "Angle Based",
      oneSeventh: "One Seventh",
      useMethodDefault: "Use method default",
      standardMidnight: "Standard",
      jafari: "Jafari",

      monthDay: "Day",
      fajr: "Fajr",
      dhuhr: "Dhuhr",
      asr: "Asr",
      maghrib: "Maghrib",
      isha: "Isha",
      sunrise: "Sunrise",
      midnight: "Midnight",
      iqamah: "Iqamah",

      update: "Update",
      confirm: "Confirm",
      areYouSure: "Are you sure?",
      cancel: "Cancel",

      noscript: "JavaScript is required for NoorPrayer to calculate prayer times, manage settings, and run offline.",
      backupCopied: "Backup copied.",
      backupImported: "Backup imported.",
      permissionStatus: "Notification permission",

      latPlaceholder: "Latitude",
      lngPlaceholder: "Longitude",
      citySearchPlaceholder: "e.g. Riyadh, Jeddah, Khobar",

      customFajrPlaceholder: "e.g. 18",
      customMaghribPlaceholder: "e.g. sunset or 4",
      customIshaPlaceholder: "e.g. 17 or 90 min"
    }
  };

  function getLang() {
    return window.APP_STATE?.settings?.lang === "en" ? "en" : "ar";
  }

  function t(key) {
    const lang = getLang();
    return translations[lang]?.[key] || key;
  }

  function setTextIf(id, key) {
    const el = document.getElementById(id);
    if (el) el.textContent = t(key);
  }

  function applyLanguage() {
    const lang = getLang();
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.body.dir = lang === "ar" ? "rtl" : "ltr";
    document.title = t("appTitle");

    setTextIf("app-title", "appName");
    setTextIf("app-tagline", "tagline");
    setTextIf("next-prayer-label", "nextPrayer");
    setTextIf("footer-note", "footerNote");
    setTextIf("close-settings-btn", "close");
    setTextIf("install-app-btn", "installApp");
    setTextIf("ios-permission-btn", "requestCompass");
    setTextIf("notif-permission-btn", "requestNotifications");
    setTextIf("test-alert-btn", "testAlert");
    setTextIf("privacy-link", "privacyPolicy");
    setTextIf("alerts-note", "alertsNote");
    setTextIf("export-backup-btn", "exportBackup");
    setTextIf("copy-backup-btn", "copyJson");
    setTextIf("import-backup-btn", "importBackup");
    setTextIf("save-salah-day-btn", "saveDay");
    setTextIf("reset-salah-btn", "resetToday");
    setTextIf("clear-history-btn", "clearHistory");
    setTextIf("reset-azkar-btn", "resetAzkar");
    setTextIf("tasbih-increment-btn", "tapToCount");
    setTextIf("tasbih-reset-btn", "resetCounter");
    setTextIf("reset-khatm-btn", "newKhatm");
    setTextIf("export-csv-btn", "exportCsv");

    setTextIf("history-days-label", "statsSavedDays");
    setTextIf("history-perfect-label", "statsPerfectDays");
    setTextIf("history-total-label", "statsAverage");

    setTextIf("zakat-total-label", "zakatWealth");
    setTextIf("zakat-due-label", "zakatDue");

    setTextIf("zakat-basis-label", "zakatBasis");
    setTextIf("zakat-gold-price-label", "zakatGoldPrice");
    setTextIf("zakat-silver-price-label", "zakatSilverPrice");
    setTextIf("zakat-cash-label", "zakatCash");
    setTextIf("zakat-gold-label", "zakatGoldAssets");
    setTextIf("zakat-stocks-label", "zakatStocks");
    setTextIf("zakat-debt-label", "zakatDebt");
    setTextIf("zakat-hawl-label", "zakatHawl");

    setTextIf("month-th-day", "monthDay");
    setTextIf("month-th-fajr", "fajr");
    setTextIf("month-th-sunrise", "sunrise");
    setTextIf("month-th-dhuhr", "dhuhr");
    setTextIf("month-th-asr", "asr");
    setTextIf("month-th-maghrib", "maghrib");
    setTextIf("month-th-isha", "isha");
    setTextIf("month-th-iqamah", "iqamah");

    setTextIf("apply-update-btn", "update");
    setTextIf("dismiss-update-btn", "close");
    setTextIf("confirm-title", "confirm");
    setTextIf("confirm-message", "areYouSure");
    setTextIf("confirm-cancel-btn", "cancel");
    setTextIf("confirm-ok-btn", "confirm");
    setTextIf("noscript-text", "noscript");

    const langBadge = document.getElementById("lang-badge");
    if (langBadge) langBadge.textContent = lang.toUpperCase();

    const locationLabel = document.getElementById("location-label");
    if (locationLabel && !locationLabel.dataset.locked && !locationLabel.textContent.trim()) {
      locationLabel.textContent = t("locating");
    }

    const mainTabs = document.querySelectorAll("#main-nav-tabs .tab-btn");
    const mainTabMap = [
      "prayerAndQibla",
      "month",
      "salah",
      "history",
      "azkar",
      "tasbih",
      "quran",
      "zakat"
    ];
    mainTabs.forEach((btn, index) => {
      if (!mainTabMap[index]) return;
      const label = btn.querySelector(".tab-label") || btn;
      label.textContent = t(mainTabMap[index]);
    });

    const azkarTabs = document.querySelectorAll("#azkar-sub-tabs .tab-btn");
    const azkarMap = ["azkarMorning", "azkarEvening", "azkarSleep"];
    azkarTabs.forEach((btn, index) => {
      if (azkarMap[index]) btn.textContent = t(azkarMap[index]);
    });

    const sectionTitles = document.querySelectorAll(".section-title");
    if (sectionTitles[0]) sectionTitles[0].textContent = t("todayTimes");
    if (sectionTitles[1]) sectionTitles[1].textContent = t("qiblaTitle");
    if (sectionTitles[2]) sectionTitles[2].textContent = t("monthlyTable");
    if (sectionTitles[3]) sectionTitles[3].textContent = t("dailySalah");
    if (sectionTitles[4]) sectionTitles[4].textContent = t("historyTitle");
    if (sectionTitles[5]) sectionTitles[5].textContent = t("quranTitle");
    if (sectionTitles[6]) sectionTitles[6].textContent = t("zakatTitle");

    const subtitles = document.querySelectorAll(".section-subtitle");
    if (subtitles[0]) subtitles[0].textContent = t("todayTimesSub");
    if (subtitles[1]) subtitles[1].textContent = t("qiblaSub");
    if (subtitles[2]) subtitles[2].textContent = t("monthlyTableSub");
    if (subtitles[3]) subtitles[3].textContent = t("dailySalahSub");
    if (subtitles[4]) subtitles[4].textContent = t("historySub");
    if (subtitles[5]) subtitles[5].textContent = t("quranSub");
    if (subtitles[6]) subtitles[6].textContent = t("zakatSub");

    const azkarNote = document.querySelector(".azkar-note");
    if (azkarNote) azkarNote.textContent = t("azkarNote");

    const latInput = document.getElementById("loc-lat");
    const lngInput = document.getElementById("loc-lng");
    const citySearchInput = document.getElementById("city-search-input");
    const customFajrInput = document.getElementById("custom-fajr");
    const customMaghribInput = document.getElementById("custom-maghrib");
    const customIshaInput = document.getElementById("custom-isha");

    if (latInput) latInput.placeholder = t("latPlaceholder");
    if (lngInput) lngInput.placeholder = t("lngPlaceholder");
    if (citySearchInput) citySearchInput.placeholder = t("citySearchPlaceholder");
    if (customFajrInput) customFajrInput.placeholder = t("customFajrPlaceholder");
    if (customMaghribInput) customMaghribInput.placeholder = t("customMaghribPlaceholder");
    if (customIshaInput) customIshaInput.placeholder = t("customIshaPlaceholder");

    updateSettingsLabels();
  }

  function updateSettingsLabels() {
    const modal = document.getElementById("settings-modal");
    if (!modal) return;

    const heading = modal.querySelector("h3");
    if (heading) heading.textContent = t("settings");

    const labels = modal.querySelectorAll("label");

    const map = {
      "lang-select": "language",
      "loc-mode": "locationSource",
      "lookup-city": "lookupCity",
      "calc-method": "calcMethod",
      "asr-method": "asrMethod",
      "high-latitude-rule": "highLatitudeRule",
      "midnight-mode": "midnightMode",
      "custom-fajr": "customFajr",
      "custom-maghrib": "customMaghrib",
      "custom-isha": "customIsha",
      "custom-midnight": "customMidnight",
      "theme-select": "theme",
      "ramadan-mode": "ramadanMode",
      "adhan-audio-select": "adhanVoice",
      "reminder-offset": "remindBefore",
      "backup-textarea": "backupData",
      "notif-enabled": "enableNotifications",
      "audio-enabled": "enableAdhanAudio",
      "notify-fajr": "prayerReminderFajr",
      "notify-dhuhr": "prayerReminderDhuhr",
      "notify-asr": "prayerReminderAsr",
      "notify-maghrib": "prayerReminderMaghrib",
      "notify-isha": "prayerReminderIsha"
    };

    labels.forEach((label) => {
      const forId = label.getAttribute("for");
      if (forId && map[forId]) {
        label.textContent = t(map[forId]);
      }
    });

    const h4s = modal.querySelectorAll("h4");
    if (h4s[0]) h4s[0].textContent = t("calcMethod");
    if (h4s[1]) h4s[1].textContent = t("customCalcValues");
    if (h4s[2]) h4s[2].textContent = t("manualOffsets");
    if (h4s[3]) h4s[3].textContent = t("iqamahTimes");
    if (h4s[4]) h4s[4].textContent = t("prayerAlerts");
    if (h4s[5]) h4s[5].textContent = t("backupRestore");

    const locMode = document.getElementById("loc-mode");
    if (locMode && locMode.options.length >= 4) {
      locMode.options[0].textContent = t("automaticGps");
      locMode.options[1].textContent = t("presetCity");
      locMode.options[2].textContent = t("customCoordinates");
      locMode.options[3].textContent = t("searchForCity");
    }

    const asrMethod = document.getElementById("asr-method");
    if (asrMethod && asrMethod.options.length >= 2) {
      asrMethod.options[0].textContent = t("standard");
      asrMethod.options[1].textContent = t("hanafi");
    }

    const highLatitudeRule = document.getElementById("high-latitude-rule");
    if (highLatitudeRule && highLatitudeRule.options.length >= 3) {
      highLatitudeRule.options[0].textContent = t("nightMiddle");
      highLatitudeRule.options[1].textContent = t("angleBased");
      highLatitudeRule.options[2].textContent = t("oneSeventh");
    }

    const midnightMode = document.getElementById("midnight-mode");
    if (midnightMode && midnightMode.options.length >= 3) {
      midnightMode.options[0].textContent = t("useMethodDefault");
      midnightMode.options[1].textContent = t("standardMidnight");
      midnightMode.options[2].textContent = t("jafari");
    }

    const customMidnight = document.getElementById("custom-midnight");
    if (customMidnight && customMidnight.options.length >= 3) {
      customMidnight.options[0].textContent = t("useMethodDefault");
      customMidnight.options[1].textContent = t("standardMidnight");
      customMidnight.options[2].textContent = t("jafari");
    }

    const reminderOffset = document.getElementById("reminder-offset");
    if (reminderOffset && reminderOffset.options.length >= 4) {
      reminderOffset.options[0].textContent = t("atPrayerTime");
      reminderOffset.options[1].textContent = t("minutesBefore5");
      reminderOffset.options[2].textContent = t("minutesBefore10");
      reminderOffset.options[3].textContent = t("minutesBefore15");
    }

    const citySearchLabel = modal.querySelector('label[for="city-search-input"]');
    if (citySearchLabel) citySearchLabel.textContent = t("searchCityLabel");

    const citySearchBtn = document.getElementById("city-search-btn");
    if (citySearchBtn) citySearchBtn.textContent = t("searchButton");

    const smallNotes = modal.querySelectorAll(".small-note");
    if (smallNotes[0]) smallNotes[0].textContent = t("favorites");
    if (smallNotes[1]) smallNotes[1].textContent = t("recents");
  }

  window.I18N = {
    t,
    applyLanguage,
    getLang
  };
})();
