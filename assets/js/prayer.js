(function () {
  const prayerKeys = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"];

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

  const calcMethodLabels = {
    ar: {
      UmmAlQura: "أم القرى",
      MuslimWorldLeague: "رابطة العالم الإسلامي",
      NorthAmerica: "أمريكا الشمالية",
      Dubai: "دبي",
      Qatar: "قطر"
    },
    en: {
      UmmAlQura: "Umm Al-Qura",
      MuslimWorldLeague: "Muslim World League",
      NorthAmerica: "North America",
      Dubai: "Dubai",
      Qatar: "Qatar"
    }
  };

  const methodParams = {
    UmmAlQura: { fajrAngle: 18.5, ishaMinutesAfterMaghrib: "ramadanAware" },
    MuslimWorldLeague: { fajrAngle: 18, ishaAngle: 17 },
    NorthAmerica: { fajrAngle: 15, ishaAngle: 15 },
    Dubai: { fajrAngle: 18.2, ishaAngle: 18.2 },
    Qatar: { fajrAngle: 18, ishaMinutesAfterMaghrib: 90 }
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

  function getAsrLabel() {
    return window.APP_STATE?.settings?.asrMethod === "hanafi"
      ? t("hanafi", "حنفي", "Hanafi")
      : t("standard", "قياسي", "Standard");
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

  function timeForSolarAngle(angleBelowHorizon, jd, lat, lng, timeZone, direction) {
    const sp = sunPosition(jd);
    const noon = midDay(jd, timeZone, lng);
    const decl = sp.declination;

    const term1 = -sinDeg(angleBelowHorizon) - sinDeg(decl) * sinDeg(lat);
    const term2 = cosDeg(decl) * cosDeg(lat);
    const ratio = term1 / term2;

    if (ratio < -1 || ratio > 1) return null;

    const t = arccosDeg(ratio) / 15;
    return noon + (direction === "ccw" ? -t : t);
  }

  function asrTime(step, jd, lat, lng, timeZone) {
    const sp = sunPosition(jd);
    const decl = sp.declination;
    const angle = -arccosForAsr(step, lat, decl);
    return timeForSolarAngle(angle, jd, lat, lng, timeZone, "cw");
  }

  function arccosForAsr(step, lat, decl) {
    const g = -arctanDeg(1 / (step + tanDeg(Math.abs(lat - decl))));
    return g;
  }

  function hoursToDate(baseDate, hours) {
    if (hours == null || !Number.isFinite(hours)) return null;
    const h = fixHour(hours);
    const totalMinutes = Math.round(h * 60);
    const date = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 0, 0, 0, 0);
    date.setMinutes(totalMinutes);
    return date;
  }

  function addMinutes(date, minutes) {
    return new Date(date.getTime() + minutes * 60000);
  }

  function safeOffset(key) {
    const n = Number(window.APP_STATE?.settings?.offsets?.[key] || 0);
    return Number.isFinite(n) ? n : 0;
  }

  function isRamadanMode() {
    return !!window.APP_STATE?.settings?.ramadanMode;
  }

  function getMethodParams() {
    const method = window.APP_STATE?.settings?.calcMethod || "UmmAlQura";
    return methodParams[method] || methodParams.UmmAlQura;
  }

  function buildPrayerTimes(dateInput) {
    const date = new Date(dateInput);
    const { lat, lng } = getLocation();
    const timeZone = getTimeZoneHours(date);
    const jd = getJulianDate(date);

    const params = getMethodParams();

    const dhuhrH = midDay(jd, timeZone, lng);
    const sunriseH = timeForSolarAngle(0.833, jd, lat, lng, timeZone, "ccw");
    const sunsetH = timeForSolarAngle(0.833, jd, lat, lng, timeZone, "cw");
    const fajrH = timeForSolarAngle(params.fajrAngle, jd, lat, lng, timeZone, "ccw");
    const asrFactor = window.APP_STATE?.settings?.asrMethod === "hanafi" ? 2 : 1;
    const asrH = asrTime(asrFactor, jd, lat, lng, timeZone);

    let ishaH = null;
    if (typeof params.ishaAngle === "number") {
      ishaH = timeForSolarAngle(params.ishaAngle, jd, lat, lng, timeZone, "cw");
    }

    const times = {
      fajr: hoursToDate(date, fajrH),
      sunrise: hoursToDate(date, sunriseH),
      dhuhr: hoursToDate(date, dhuhrH),
      asr: hoursToDate(date, asrH),
      maghrib: hoursToDate(date, sunsetH),
      isha: hoursToDate(date, ishaH)
    };

    if (params.ishaMinutesAfterMaghrib && times.maghrib) {
      let mins = params.ishaMinutesAfterMaghrib;
      if (mins === "ramadanAware") {
        mins = isRamadanMode() ? 120 : 90;
      }
      times.isha = addMinutes(times.maghrib, mins);
    }

    Object.keys(times).forEach((key) => {
      if (times[key]) {
        times[key] = addMinutes(times[key], safeOffset(key));
      }
    });

    return times;
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
    for (const key of prayerKeys) {
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

    if (methodChip) {
      methodChip.textContent =
        lang() === "en"
          ? `Method: ${getCalcMethodLabel(window.APP_STATE?.settings?.calcMethod || "UmmAlQura")}`
          : `الطريقة: ${getCalcMethodLabel(window.APP_STATE?.settings?.calcMethod || "UmmAlQura")}`;
    }

    if (asrChip) {
      asrChip.textContent =
        lang() === "en"
          ? `Asr: ${getAsrLabel()}`
          : `العصر: ${getAsrLabel()}`;
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

    prayerKeys.forEach((key) => {
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

      const tr = document.createElement("tr");

      const iqamahSummary = ["fajr", "dhuhr", "asr", "maghrib", "isha"]
        .map((key) => {
          const val = window.APP_STATE?.settings?.iqamah?.[key];
          if (!val) return null;
          return `${prayerLabel(key)} ${val}`;
        })
        .filter(Boolean)
        .join(" • ");

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
    prayerNames,
    prayerLabel,
    buildPrayerTimes,
    renderTodayPrayerList,
    renderMonthTable,
    exportMonthCSV
  };
})();
