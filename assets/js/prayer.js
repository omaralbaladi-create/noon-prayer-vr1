(function () {
  const prayerKeys = ["fajr", "sunrise", "dhuhr", "asr", "sunset", "maghrib", "isha", "midnight"];

  const prayerNames = {
    ar: {
      fajr: "الفجر",
      sunrise: "الشروق",
      dhuhr: "الظهر",
      asr: "العصر",
      sunset: "الغروب",
      maghrib: "المغرب",
      isha: "العشاء",
      midnight: "منتصف الليل"
    },
    en: {
      fajr: "Fajr",
      sunrise: "Sunrise",
      dhuhr: "Dhuhr",
      asr: "Asr",
      sunset: "Sunset",
      maghrib: "Maghrib",
      isha: "Isha",
      midnight: "Midnight"
    }
  };

  const calcMethodLabels = {
    ar: {
      MWL: "رابطة العالم الإسلامي",
      ISNA: "أمريكا الشمالية",
      Egypt: "الهيئة المصرية",
      Makkah: "أم القرى",
      Karachi: "كراتشي",
      Tehran: "طهران",
      Jafari: "الجعفري",
      Dubai: "دبي",
      Qatar: "قطر",
      Kuwait: "الكويت",
      Singapore: "سنغافورة",
      Turkey: "تركيا",
      Custom: "مخصص"
    },
    en: {
      MWL: "Muslim World League",
      ISNA: "Islamic Society of North America",
      Egypt: "Egyptian General Authority of Survey",
      Makkah: "Umm al-Qura, Makkah",
      Karachi: "University of Islamic Sciences, Karachi",
      Tehran: "Institute of Geophysics, University of Tehran",
      Jafari: "Jafari",
      Dubai: "Dubai",
      Qatar: "Qatar",
      Kuwait: "Kuwait",
      Singapore: "Singapore",
      Turkey: "Turkey",
      Custom: "Custom"
    }
  };

  const METHODS = {
    MWL: {
      fajr: 18,
      isha: 17,
      maghrib: "sunset",
      midnight: "Standard"
    },
    ISNA: {
      fajr: 15,
      isha: 15,
      maghrib: "sunset",
      midnight: "Standard"
    },
    Egypt: {
      fajr: 19.5,
      isha: 17.5,
      maghrib: "sunset",
      midnight: "Standard"
    },
    Makkah: {
      fajr: 18.5,
      isha: "90 min",
      maghrib: "sunset",
      midnight: "Standard"
    },
    Karachi: {
      fajr: 18,
      isha: 18,
      maghrib: "sunset",
      midnight: "Standard"
    },
    Tehran: {
      fajr: 17.7,
      isha: 14,
      maghrib: 4.5,
      midnight: "Jafari"
    },
    Jafari: {
      fajr: 16,
      isha: 14,
      maghrib: 4,
      midnight: "Jafari"
    },
    Dubai: {
      fajr: 18.2,
      isha: 18.2,
      maghrib: "sunset",
      midnight: "Standard"
    },
    Qatar: {
      fajr: 18,
      isha: "90 min",
      maghrib: "sunset",
      midnight: "Standard"
    },
    Kuwait: {
      fajr: 18,
      isha: 17.5,
      maghrib: "sunset",
      midnight: "Standard"
    },
    Singapore: {
      fajr: 20,
      isha: 18,
      maghrib: "sunset",
      midnight: "Standard"
    },
    Turkey: {
      fajr: 18,
      isha: 17,
      maghrib: "sunset",
      midnight: "Standard"
    },
    Custom: {
      fajr: 18,
      isha: 17,
      maghrib: "sunset",
      midnight: "Standard"
    }
  };

  const monthNames = {
    ar: [
      "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
      "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
    ],
    en: [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ]
  };

  const weekdayNames = {
    ar: ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"],
    en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  };

  function lang() {
    return window.I18N?.getLang?.() === "en" ? "en" : "ar";
  }

  function t(key, fallbackAr, fallbackEn) {
    if (window.I18N?.t) {
      const value = window.I18N.t(key);
      if (value && value !== key) return value;
    }
    return lang() === "en" ? fallbackEn : fallbackAr;
  }

  function prayerLabel(key) {
    return prayerNames[lang()]?.[key] || key;
  }

  function getCalcMethodLabel(method) {
    return calcMethodLabels[lang()]?.[method] || method;
  }

  function deg2rad(d) {
    return (d * Math.PI) / 180;
  }

  function rad2deg(r) {
    return (r * 180) / Math.PI;
  }

  function sinDeg(d) {
    return Math.sin(deg2rad(d));
  }

  function cosDeg(d) {
    return Math.cos(deg2rad(d));
  }

  function tanDeg(d) {
    return Math.tan(deg2rad(d));
  }

  function arcsinDeg(x) {
    return rad2deg(Math.asin(x));
  }

  function arccosDeg(x) {
    return rad2deg(Math.acos(x));
  }

  function arctanDeg(x) {
    return rad2deg(Math.atan(x));
  }

  function arctan2Deg(y, x) {
    return rad2deg(Math.atan2(y, x));
  }

  function arccotDeg(x) {
    return rad2deg(Math.atan(1 / x));
  }

  function fixAngle(a) {
    a = a - 360 * Math.floor(a / 360);
    return a < 0 ? a + 360 : a;
  }

  function fixHour(h) {
    h = h - 24 * Math.floor(h / 24);
    return h < 0 ? h + 24 : h;
  }

  function getLocation() {
    const lat = Number(window.APP_STATE?.location?.lat);
    const lng = Number(window.APP_STATE?.location?.lng);
    return {
      lat: Number.isFinite(lat) ? lat : 24.7136,
      lng: Number.isFinite(lng) ? lng : 46.6753
    };
  }

  function getTimeZoneHours(date) {
    return -date.getTimezoneOffset() / 60;
  }

  function getJulianDate(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    let y = year;
    let m = month;
    if (m <= 2) {
      y -= 1;
      m += 12;
    }

    const A = Math.floor(y / 100);
    const B = 2 - A + Math.floor(A / 4);

    return Math.floor(365.25 * (y + 4716))
      + Math.floor(30.6001 * (m + 1))
      + day + B - 1524.5;
  }

  function sunPosition(jd) {
    const d = jd - 2451545.0;
    const g = fixAngle(357.529 + 0.98560028 * d);
    const q = fixAngle(280.459 + 0.98564736 * d);
    const L = fixAngle(q + 1.915 * sinDeg(g) + 0.020 * sinDeg(2 * g));
    const e = 23.439 - 0.00000036 * d;

    const RA = fixHour(arctan2Deg(cosDeg(e) * sinDeg(L), cosDeg(L)) / 15);
    const decl = arcsinDeg(sinDeg(e) * sinDeg(L));
    const eqt = q / 15 - RA;

    return { declination: decl, equation: eqt };
  }

  function midDay(jd, timeZone, lng) {
    const sp = sunPosition(jd);
    return fixHour(12 + timeZone - lng / 15 - sp.equation);
  }

  function timeForAngle(angleBelowHorizon, jd, lat, lng, timeZone, direction) {
    const sp = sunPosition(jd);
    const decl = sp.declination;
    const noon = midDay(jd, timeZone, lng);

    const numerator = -sinDeg(angleBelowHorizon) - sinDeg(decl) * sinDeg(lat);
    const denominator = cosDeg(decl) * cosDeg(lat);
    const ratio = numerator / denominator;

    if (ratio < -1 || ratio > 1) return null;

    const delta = arccosDeg(ratio) / 15;
    return noon + (direction === "ccw" ? -delta : delta);
  }

  function asrAngle(step, lat, decl) {
    return -rad2deg(Math.atan(1 / (step + Math.tan(Math.abs(deg2rad(lat - decl))))));
  }

  function asrTime(step, jd, lat, lng, timeZone) {
    const decl = sunPosition(jd).declination;
    return timeForAngle(asrAngle(step, lat, decl), jd, lat, lng, timeZone, "cw");
  }

  function hoursToDate(baseDate, hours) {
    if (hours == null || !Number.isFinite(hours)) return null;
    const date = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 0, 0, 0, 0);
    date.setMinutes(Math.round(fixHour(hours) * 60));
    return date;
  }

  function addMinutes(date, minutes) {
    return new Date(date.getTime() + minutes * 60000);
  }

  function differenceHours(later, earlier) {
    return (later.getTime() - earlier.getTime()) / 3600000;
  }

  function nightPortion(angle, nightHours, mode) {
    if (mode === "AngleBased") return (angle / 60) * nightHours;
    if (mode === "OneSeventh") return nightHours / 7;
    return nightHours / 2;
  }

  function getHighLatitudeMode() {
    return window.APP_STATE?.settings?.highLatitudeRule || "NightMiddle";
  }

  function getMidnightMode(methodParams) {
    if (window.APP_STATE?.settings?.midnightMode) {
      return window.APP_STATE.settings.midnightMode;
    }
    return methodParams.midnight || "Standard";
  }

  function safeOffset(key) {
    const n = Number(window.APP_STATE?.settings?.offsets?.[key] || 0);
    return Number.isFinite(n) ? n : 0;
  }

  function getBaseMethodName() {
    return window.APP_STATE?.settings?.calcMethod || "Makkah";
  }

  function parseMethodParams() {
    const methodName = getBaseMethodName();
    const base = METHODS[methodName] || METHODS.Makkah;

    const custom = window.APP_STATE?.settings?.customCalc || {};

    return {
      methodName,
      fajr: custom.fajr ?? base.fajr,
      isha: custom.isha ?? base.isha,
      maghrib: custom.maghrib ?? base.maghrib,
      midnight: custom.midnight ?? base.midnight
    };
  }

  function isRamadanMode() {
    return !!window.APP_STATE?.settings?.ramadanMode;
  }

  function resolveFixedMinutes(value, prayerName) {
    if (typeof value === "number") return null;
    if (typeof value !== "string") return null;

    if (value === "90 min") {
      if (prayerName === "isha" && getBaseMethodName() === "Makkah") {
        return isRamadanMode() ? 120 : 90;
      }
      return 90;
    }

    const match = value.match(/^(\d+)\s*min$/i);
    if (match) return Number(match[1]);

    return null;
  }

  function adjustHighLatTime(target, base, angle, nightHours, direction) {
    if (!base) return target;
    const mode = getHighLatitudeMode();
    const limit = nightPortion(angle, nightHours, mode);

    if (target == null) {
      return direction === "ccw" ? addMinutes(base, -limit * 60) : addMinutes(base, limit * 60);
    }

    const diff = Math.abs(differenceHours(target, base));
    if (diff > limit) {
      return direction === "ccw" ? addMinutes(base, -limit * 60) : addMinutes(base, limit * 60);
    }

    return target;
  }

  function applyOffsets(times) {
    const adjusted = {};
    Object.keys(times).forEach((key) => {
      adjusted[key] = times[key] ? addMinutes(times[key], safeOffset(key)) : null;
    });
    return adjusted;
  }

  function computeRawTimes(dateInput) {
    const date = new Date(dateInput);
    const { lat, lng } = getLocation();
    const timeZone = getTimeZoneHours(date);
    const jd = getJulianDate(date);
    const params = parseMethodParams();

    const dhuhrH = midDay(jd, timeZone, lng);
    const sunriseH = timeForAngle(0.833, jd, lat, lng, timeZone, "ccw");
    const sunsetH = timeForAngle(0.833, jd, lat, lng, timeZone, "cw");
    const asrStep = window.APP_STATE?.settings?.asrMethod === "hanafi" ? 2 : 1;
    const asrH = asrTime(asrStep, jd, lat, lng, timeZone);

    const fajrH = typeof params.fajr === "number"
      ? timeForAngle(params.fajr, jd, lat, lng, timeZone, "ccw")
      : null;

    let maghribH = sunsetH;
    if (typeof params.maghrib === "number") {
      maghribH = timeForAngle(params.maghrib, jd, lat, lng, timeZone, "cw");
    }

    let ishaH = null;
    if (typeof params.isha === "number") {
      ishaH = timeForAngle(params.isha, jd, lat, lng, timeZone, "cw");
    }

    let times = {
      fajr: hoursToDate(date, fajrH),
      sunrise: hoursToDate(date, sunriseH),
      dhuhr: hoursToDate(date, dhuhrH),
      asr: hoursToDate(date, asrH),
      sunset: hoursToDate(date, sunsetH),
      maghrib: hoursToDate(date, maghribH),
      isha: hoursToDate(date, ishaH)
    };

    const ishaFixed = resolveFixedMinutes(params.isha, "isha");
    if (ishaFixed != null && times.maghrib) {
      times.isha = addMinutes(times.maghrib, ishaFixed);
    }

    const maghribFixed = resolveFixedMinutes(params.maghrib, "maghrib");
    if (maghribFixed != null && times.sunset) {
      times.maghrib = addMinutes(times.sunset, maghribFixed);
    }

    const nextDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
    const prevDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1);

    const nextSunrise = hoursToDate(nextDate, timeForAngle(0.833, getJulianDate(nextDate), lat, lng, getTimeZoneHours(nextDate), "ccw"));
    const prevSunset = hoursToDate(prevDate, timeForAngle(0.833, getJulianDate(prevDate), lat, lng, getTimeZoneHours(prevDate), "cw"));

    if (times.sunset && nextSunrise) {
      const nightHours = differenceHours(nextSunrise, times.sunset) < 0
        ? differenceHours(addMinutes(nextSunrise, 24 * 60), times.sunset)
        : differenceHours(nextSunrise, times.sunset);

      if (typeof params.fajr === "number" && times.sunrise) {
        times.fajr = adjustHighLatTime(times.fajr, times.sunrise, params.fajr, nightHours, "ccw");
      }

      if (typeof params.isha === "number" && times.sunset) {
        times.isha = adjustHighLatTime(times.isha, times.sunset, params.isha, nightHours, "cw");
      }

      if (typeof params.maghrib === "number" && times.sunset) {
        times.maghrib = adjustHighLatTime(times.maghrib, times.sunset, params.maghrib, nightHours, "cw");
      }
    }

    let midnight = null;
    if (times.sunset) {
      if (getMidnightMode(params) === "Jafari") {
        const nextFajrRaw = computeRawFajrOnly(nextDate, lat, lng);
        if (times.sunset && nextFajrRaw) {
          midnight = new Date(times.sunset.getTime() + (nextFajrRaw.getTime() - times.sunset.getTime()) / 2);
        }
      } else {
        if (times.sunset && nextSunrise) {
          let end = nextSunrise;
          if (end <= times.sunset) end = addMinutes(end, 24 * 60);
          midnight = new Date(times.sunset.getTime() + (end.getTime() - times.sunset.getTime()) / 2);
        }
      }
    }

    times.midnight = midnight;
    return applyOffsets(times);
  }

  function computeRawFajrOnly(date, lat, lng) {
    const params = parseMethodParams();
    if (typeof params.fajr !== "number") return null;
    const timeZone = getTimeZoneHours(date);
    const jd = getJulianDate(date);
    const fajrH = timeForAngle(params.fajr, jd, lat, lng, timeZone, "ccw");
    return hoursToDate(date, fajrH);
  }

  function buildPrayerTimes(dateInput) {
    return computeRawTimes(dateInput);
  }

  function formatTime(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "--:--";
    return new Intl.DateTimeFormat(lang() === "en" ? "en-US" : "ar-SA", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    }).format(date);
  }

  function formatDateLabel(date) {
    const l = lang();
    if (l === "en") {
      return `${weekdayNames.en[date.getDay()]}, ${monthNames.en[date.getMonth()]} ${date.getDate()}`;
    }
    return `${weekdayNames.ar[date.getDay()]} ${date.getDate()} ${monthNames.ar[date.getMonth()]}`;
  }

  function formatMonthLabel(date) {
    const l = lang();
    return l === "en"
      ? `${monthNames.en[date.getMonth()]} ${date.getFullYear()}`
      : `${monthNames.ar[date.getMonth()]} ${date.getFullYear()}`;
  }

  function getMonthDateFromOffset() {
    const offset = Number(window.APP_STATE?.ui?.currentMonthOffset || 0);
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + offset, 1);
  }

  function getIqamahLabel(key) {
    const raw = window.APP_STATE?.settings?.iqamah?.[key];
    if (!raw) return t("iqamahDisabled", "غير مفعلة", "Disabled");
    return raw;
  }

  function getUpcomingPrayer(now, times) {
    const ordered = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"];
    for (const key of ordered) {
      const val = times[key];
      if (val && val > now) {
        return { key, time: val };
      }
    }

    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const tomorrowTimes = buildPrayerTimes(tomorrow);
    return { key: "fajr", time: tomorrowTimes.fajr };
  }

  function formatCountdown(ms) {
    const total = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function updateMetaChips() {
    const methodChip = document.getElementById("method-chip");
    const asrChip = document.getElementById("asr-chip");
    const iqamahChip = document.getElementById("iqamah-chip");

    const method = getBaseMethodName();
    const asrMode = window.APP_STATE?.settings?.asrMethod === "hanafi"
      ? t("hanafi", "حنفي", "Hanafi")
      : t("standard", "قياسي", "Standard");

    if (methodChip) {
      methodChip.textContent =
        lang() === "en"
          ? `Method: ${getCalcMethodLabel(method)}`
          : `الطريقة: ${getCalcMethodLabel(method)}`;
    }

    if (asrChip) {
      asrChip.textContent =
        lang() === "en"
          ? `Asr: ${asrMode}`
          : `العصر: ${asrMode}`;
    }

    if (iqamahChip) {
      const enabled = ["fajr", "dhuhr", "asr", "maghrib", "isha"].some(
        (k) => (window.APP_STATE?.settings?.iqamah?.[k] || "").trim()
      );
      iqamahChip.textContent =
        lang() === "en"
          ? `Iqamah: ${enabled ? "Enabled" : "Disabled"}`
          : `الإقامة: ${enabled ? "مفعلة" : "غير مفعلة"}`;
    }
  }

  function updateHijriAndDate(today) {
    const el = document.getElementById("hijri-date");
    if (!el) return;

    const gregorianText = formatDateLabel(today);

    try {
      const hijri = new Intl.DateTimeFormat(
        lang() === "en" ? "en-TN-u-ca-islamic" : "ar-SA-u-ca-islamic",
        { day: "numeric", month: "long", year: "numeric" }
      ).format(today);

      el.textContent = `${gregorianText} • ${hijri}`;
    } catch (_) {
      el.textContent = gregorianText;
    }
  }

  function sameDay(a, b) {
    return (
      a &&
      b &&
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  function renderTodayPrayerList() {
    const list = document.getElementById("prayer-list");
    const nextPrayerTitle = document.getElementById("next-prayer-title");
    const nextPrayerSub = document.getElementById("next-prayer-sub");
    const countdown = document.getElementById("countdown-timer");

    if (!list) return;

    const now = new Date();
    const times = buildPrayerTimes(now);
    const upcoming = getUpcomingPrayer(now, times);

    list.innerHTML = "";

    ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"].forEach((key) => {
      const row = document.createElement("div");
      row.className = "prayer-row";

      const timeValue = times[key];
      const isNext = upcoming.key === key && sameDay(timeValue, upcoming.time);
      const iqamah = key === "sunrise" ? "" : getIqamahLabel(key);

      row.innerHTML = `
        <div class="prayer-row-main ${isNext ? "active" : ""}">
          <div class="prayer-row-name">${prayerLabel(key)}</div>
          <div class="prayer-row-time">${formatTime(timeValue)}</div>
        </div>
        <div class="prayer-row-sub">
          ${key === "sunrise" ? "" : (lang() === "en" ? `Iqamah: ${iqamah}` : `الإقامة: ${iqamah}`)}
        </div>
      `;
      list.appendChild(row);
    });

    if (nextPrayerTitle) {
      nextPrayerTitle.textContent = prayerLabel(upcoming.key);
    }

    if (nextPrayerSub && upcoming.time) {
      nextPrayerSub.textContent = `${formatTime(upcoming.time)} • ${formatDateLabel(upcoming.time)}`;
    }

    if (countdown && upcoming.time) {
      countdown.textContent = formatCountdown(upcoming.time - now);
    }

    updateMetaChips();
    updateHijriAndDate(now);

    clearInterval(window.__prayerCountdownInterval);
    window.__prayerCountdownInterval = setInterval(() => {
      const currentNow = new Date();
      const currentTimes = buildPrayerTimes(currentNow);
      const currentUpcoming = getUpcomingPrayer(currentNow, currentTimes);

      if (countdown && currentUpcoming.time) {
        countdown.textContent = formatCountdown(currentUpcoming.time - currentNow);
      }
      if (nextPrayerTitle) {
        nextPrayerTitle.textContent = prayerLabel(currentUpcoming.key);
      }
      if (nextPrayerSub && currentUpcoming.time) {
        nextPrayerSub.textContent = `${formatTime(currentUpcoming.time)} • ${formatDateLabel(currentUpcoming.time)}`;
      }
    }, 1000);
  }

  function renderMonthTable() {
    const monthDate = getMonthDateFromOffset();
    const labelBtn = document.getElementById("month-label-btn");
    const body = document.getElementById("month-table-body");

    if (labelBtn) labelBtn.textContent = formatMonthLabel(monthDate);
    if (!body) return;

    body.innerHTML = "";

    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= lastDay; day++) {
      const date = new Date(year, month, day);
      const times = buildPrayerTimes(date);

      const iqamahSummary = ["fajr", "dhuhr", "asr", "maghrib", "isha"]
        .map((key) => {
          const val = window.APP_STATE?.settings?.iqamah?.[key];
          if (!val) return null;
          return `${prayerLabel(key)} ${val}`;
        })
        .filter(Boolean)
        .join(" • ");

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${formatDateLabel(date)}</td>
        <td>${formatTime(times.fajr)}</td>
        <td>${formatTime(times.sunrise)}</td>
        <td>${formatTime(times.dhuhr)}</td>
        <td>${formatTime(times.asr)}</td>
        <td>${formatTime(times.maghrib)}</td>
        <td>${formatTime(times.isha)}</td>
        <td>${iqamahSummary || "-"}</td>
      `;
      body.appendChild(tr);
    }
  }

  function exportMonthCSV() {
    const monthDate = getMonthDateFromOffset();
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();

    const headers =
      lang() === "en"
        ? ["Date", "Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha", "Iqamah"]
        : ["التاريخ", "الفجر", "الشروق", "الظهر", "العصر", "المغرب", "العشاء", "الإقامة"];

    const rows = [headers];

    for (let day = 1; day <= lastDay; day++) {
      const date = new Date(year, month, day);
      const times = buildPrayerTimes(date);

      const iqamahSummary = ["fajr", "dhuhr", "asr", "maghrib", "isha"]
        .map((key) => {
          const val = window.APP_STATE?.settings?.iqamah?.[key];
          if (!val) return null;
          return `${prayerLabel(key)} ${val}`;
        })
        .filter(Boolean)
        .join(" | ");

      rows.push([
        formatDateLabel(date),
        formatTime(times.fajr),
        formatTime(times.sunrise),
        formatTime(times.dhuhr),
        formatTime(times.asr),
        formatTime(times.maghrib),
        formatTime(times.isha),
        iqamahSummary || "-"
      ]);
    }

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const safeMonth = `${month + 1}`.padStart(2, "0");
    const filename =
      lang() === "en"
        ? `noor-prayer-month-${year}-${safeMonth}.csv`
        : `نور-الصلاة-الشهر-${year}-${safeMonth}.csv`;

    if (window.Utils?.downloadText) {
      window.Utils.downloadText(filename, csv, "text/csv;charset=utf-8");
    }
  }

  window.Prayer = {
    METHODS,
    prayerNames,
    prayerLabel,
    buildPrayerTimes,
    renderTodayPrayerList,
    renderMonthTable,
    exportMonthCSV
  };
})();
