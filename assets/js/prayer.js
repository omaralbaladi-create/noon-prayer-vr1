(function () {
  const prayerKeys = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"];
  const exportPrayerKeys = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"];

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

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function cloneDate(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds());
  }

  function addMinutes(date, minutes) {
    return new Date(date.getTime() + minutes * 60000);
  }

  function dayOfYear(date) {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date - start;
    return Math.floor(diff / 86400000);
  }

  function getLocation() {
    const lat = Number(window.APP_STATE?.location?.lat);
    const lng = Number(window.APP_STATE?.location?.lng);
    return {
      lat: Number.isFinite(lat) ? lat : 21.4225,
      lng: Number.isFinite(lng) ? lng : 39.8262
    };
  }

  function seasonalShift(dayIndex, amplitude) {
    return Math.round(Math.sin((2 * Math.PI * (dayIndex - 80)) / 365) * amplitude);
  }

  function offsetMinutes(base, key) {
    const val = Number(window.APP_STATE?.settings?.offsets?.[key] || 0);
    return Number.isFinite(val) ? val : 0;
  }

  function buildPrayerTimes(dateInput) {
    const date = new Date(dateInput);
    const { lat } = getLocation();
    const doy = dayOfYear(date);

    const latitudeFactor = Math.max(-1, Math.min(1, lat / 90));
    const summerShift = seasonalShift(doy, 70);
    const winterShift = seasonalShift(doy + 182, 40);

    const fajrBase = 300 - Math.round(latitudeFactor * 35) - Math.round(summerShift * 0.35);
    const sunriseBase = 360 - Math.round(latitudeFactor * 25) - Math.round(summerShift * 0.3);
    const dhuhrBase = 720 + seasonalShift(doy, 6);
    const asrBase = 930 + Math.round(latitudeFactor * 18) + winterShift;
    const maghribBase = 1080 + Math.round(latitudeFactor * 28) + Math.round(summerShift * 0.32);
    const ishaBase = 1155 + Math.round(latitudeFactor * 18) + Math.round(summerShift * 0.28);

    const times = {
      fajr: minutesToDate(date, fajrBase + offsetMinutes(fajrBase, "fajr")),
      sunrise: minutesToDate(date, sunriseBase + offsetMinutes(sunriseBase, "sunrise")),
      dhuhr: minutesToDate(date, dhuhrBase + offsetMinutes(dhuhrBase, "dhuhr")),
      asr: minutesToDate(
        date,
        asrBase +
          (window.APP_STATE?.settings?.asrMethod === "hanafi" ? 18 : 0) +
          offsetMinutes(asrBase, "asr")
      ),
      maghrib: minutesToDate(date, maghribBase + offsetMinutes(maghribBase, "maghrib")),
      isha: minutesToDate(date, ishaBase + offsetMinutes(ishaBase, "isha"))
    };

    if (window.APP_STATE?.settings?.ramadanMode) {
      times.isha = addMinutes(times.isha, 10);
    }

    return times;
  }

  function minutesToDate(baseDate, totalMinutes) {
    const date = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 0, 0, 0, 0);
    date.setMinutes(totalMinutes);
    return date;
  }

  function formatTime(date) {
    const isEn = lang() === "en";
    return new Intl.DateTimeFormat(isEn ? "en-US" : "ar-SA", {
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
      if (times[key] > now) {
        return { key, time: times[key] };
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
    return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
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

    let gregorianText = formatDateLabel(today);

    try {
      const hijri = new Intl.DateTimeFormat(lang() === "en" ? "en-TN-u-ca-islamic" : "ar-SA-u-ca-islamic", {
        day: "numeric",
        month: "long",
        year: "numeric"
      }).format(today);

      el.textContent =
        lang() === "en"
          ? `${gregorianText} • ${hijri}`
          : `${gregorianText} • ${hijri}`;
    } catch (_) {
      el.textContent = gregorianText;
    }
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

      const isNext = upcoming.key === key && sameDay(times[key], upcoming.time);
      const iqamah = key === "sunrise" ? "" : getIqamahLabel(key);

      row.innerHTML = `
        <div class="prayer-row-main ${isNext ? "active" : ""}">
          <div class="prayer-row-name">${prayerLabel(key)}</div>
          <div class="prayer-row-time">${formatTime(times[key])}</div>
        </div>
        <div class="prayer-row-sub">
          ${key === "sunrise"
            ? ""
            : (lang() === "en" ? `Iqamah: ${iqamah}` : `الإقامة: ${iqamah}`)}
        </div>
      `;
      list.appendChild(row);
    });

    if (nextPrayerTitle) {
      nextPrayerTitle.textContent = prayerLabel(upcoming.key);
    }

    if (nextPrayerSub) {
      nextPrayerSub.textContent =
        lang() === "en"
          ? `${formatTime(upcoming.time)} • ${formatDateLabel(upcoming.time)}`
          : `${formatTime(upcoming.time)} • ${formatDateLabel(upcoming.time)}`;
    }

    if (countdown) {
      countdown.textContent = formatCountdown(upcoming.time - now);
    }

    updateMetaChips();
    updateHijriAndDate(now);

    clearInterval(window.__prayerCountdownInterval);
    window.__prayerCountdownInterval = setInterval(() => {
      const currentNow = new Date();
      const currentTimes = buildPrayerTimes(currentNow);
      const currentUpcoming = getUpcomingPrayer(currentNow, currentTimes);

      if (countdown) {
        countdown.textContent = formatCountdown(currentUpcoming.time - currentNow);
      }
      if (nextPrayerTitle) {
        nextPrayerTitle.textContent = prayerLabel(currentUpcoming.key);
      }
      if (nextPrayerSub) {
        nextPrayerSub.textContent =
          lang() === "en"
            ? `${formatTime(currentUpcoming.time)} • ${formatDateLabel(currentUpcoming.time)}`
            : `${formatTime(currentUpcoming.time)} • ${formatDateLabel(currentUpcoming.time)}`;
      }
    }, 1000);
  }

  function sameDay(a, b) {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
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
      .map((row) =>
        row
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(",")
      )
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
