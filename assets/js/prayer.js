(function () {
  const prayerOrder = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"];

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

  const METHODS = {
    UmmAlQura: {
      fajrAngle: 18.5,
      ishaInterval: 90,
      ishaAngle: null,
      display: "Umm Al-Qura"
    },
    MuslimWorldLeague: {
      fajrAngle: 18,
      ishaAngle: 17,
      ishaInterval: null,
      display: "MWL"
    },
    NorthAmerica: {
      fajrAngle: 15,
      ishaAngle: 15,
      ishaInterval: null,
      display: "ISNA"
    },
    Dubai: {
      fajrAngle: 18.2,
      ishaAngle: 18.2,
      ishaInterval: null,
      display: "Dubai"
    },
    Qatar: {
      fajrAngle: 18,
      ishaInterval: 90,
      ishaAngle: null,
      display: "Qatar"
    },
    local: {
      fajrAngle: 18,
      ishaAngle: 17,
      ishaInterval: null,
      display: "Local"
    }
  };

  function getLang() {
    return (window.APP_STATE?.settings?.lang || "ar") === "en" ? "en" : "ar";
  }

  function getPrayerName(key) {
    return prayerNames[getLang()][key] || key;
  }

  function getMethod() {
    const methodKey = window.APP_STATE?.settings?.calcMethod || "UmmAlQura";
    return METHODS[methodKey] || METHODS.UmmAlQura;
  }

  function deg2rad(d) {
    return d * Math.PI / 180;
  }

  function rad2deg(r) {
    return r * 180 / Math.PI;
  }

  function normalizeDegrees(d) {
    let x = d % 360;
    if (x < 0) x += 360;
    return x;
  }

  function normalizeHours(h) {
    let x = h % 24;
    if (x < 0) x += 24;
    return x;
  }

  function julianDate(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day =
      date.getDate() +
      (date.getHours() +
        date.getMinutes() / 60 +
        date.getSeconds() / 3600) /
        24;

    let y = year;
    let m = month;

    if (m <= 2) {
      y -= 1;
      m += 12;
    }

    const A = Math.floor(y / 100);
    const B = 2 - A + Math.floor(A / 4);

    return (
      Math.floor(365.25 * (y + 4716)) +
      Math.floor(30.6001 * (m + 1)) +
      day +
      B -
      1524.5
    );
  }

  function solarPosition(jd) {
    const D = jd - 2451545.0;

    const g = normalizeDegrees(357.529 + 0.98560028 * D);
    const q = normalizeDegrees(280.459 + 0.98564736 * D);
    const L = normalizeDegrees(
      q + 1.915 * Math.sin(deg2rad(g)) + 0.020 * Math.sin(deg2rad(2 * g))
    );

    const e = 23.439 - 0.00000036 * D;

    const RA = rad2deg(
      Math.atan2(
        Math.cos(deg2rad(e)) * Math.sin(deg2rad(L)),
        Math.cos(deg2rad(L))
      )
    ) / 15;

    const eqt = q / 15 - normalizeHours(RA);
    const decl = rad2deg(
      Math.asin(Math.sin(deg2rad(e)) * Math.sin(deg2rad(L)))
    );

    return { declination: decl, equation: eqt };
  }

  function timezoneOffsetHours(date) {
    return -date.getTimezoneOffset() / 60;
  }

  function hourAngleForAltitude(latDeg, declDeg, altitudeDeg) {
    const lat = deg2rad(latDeg);
    const decl = deg2rad(declDeg);
    const alt = deg2rad(altitudeDeg);

    const cosH =
      (Math.sin(alt) - Math.sin(lat) * Math.sin(decl)) /
      (Math.cos(lat) * Math.cos(decl));

    if (cosH < -1 || cosH > 1) return null;
    return rad2deg(Math.acos(cosH)) / 15;
  }

  function solarNoon(date, lng) {
    const jd = julianDate(new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0));
    const sp = solarPosition(jd);
    const tz = timezoneOffsetHours(date);
    return 12 + tz - lng / 15 - sp.equation;
  }

  function timeForSunAltitude(date, lat, lng, altitudeDeg, afterNoon) {
    const jd = julianDate(new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0));
    const sp = solarPosition(jd);
    const noon = solarNoon(date, lng);
    const H = hourAngleForAltitude(lat, sp.declination, altitudeDeg);
    if (H == null) return null;
    return afterNoon ? noon + H : noon - H;
  }

  function asrTime(date, lat, lng, factor) {
    const jd = julianDate(new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0));
    const sp = solarPosition(jd);
    const decl = deg2rad(sp.declination);
    const latRad = deg2rad(lat);

    const angle = -rad2deg(Math.atan(1 / (factor + Math.tan(Math.abs(latRad - decl)))));
    const H = hourAngleForAltitude(lat, sp.declination, angle);
    if (H == null) return null;

    return solarNoon(date, lng) + H;
  }

  function hoursToDate(baseDate, hours) {
    const d = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 0, 0, 0, 0);
    const wholeMinutes = Math.round(hours * 60);
    d.setMinutes(wholeMinutes);
    return d;
  }

  function diffMinutes(a, b) {
    return Math.round((b.getTime() - a.getTime()) / 60000);
  }

  function nightPortionMinutes(sunsetDate, sunriseNextDate, portion) {
    return Math.round(diffMinutes(sunsetDate, sunriseNextDate) * portion);
  }

  function applyHighLatitudeFallback(baseDate, fajrDate, sunriseDate, sunsetDate, ishaDate, sunriseNextDate) {
    let fixedFajr = fajrDate;
    let fixedIsha = ishaDate;

    const fajrPortion = 1 / 7;
    const ishaPortion = 1 / 7;

    const fajrLimitMinutes = nightPortionMinutes(sunsetDate, sunriseNextDate, fajrPortion);
    const ishaLimitMinutes = nightPortionMinutes(sunsetDate, sunriseNextDate, ishaPortion);

    if (!fixedFajr || fixedFajr >= sunriseDate) {
      fixedFajr = new Date(sunriseDate.getTime() - fajrLimitMinutes * 60000);
    }

    if (!fixedIsha || fixedIsha <= sunsetDate) {
      fixedIsha = new Date(sunsetDate.getTime() + ishaLimitMinutes * 60000);
    }

    return { fajr: fixedFajr, isha: fixedIsha };
  }

  function getMethodAdjustedParams() {
    const key = window.APP_STATE?.settings?.calcMethod || "UmmAlQura";
    const method = METHODS[key] || METHODS.UmmAlQura;

    if (
      window.APP_STATE?.settings?.ramadanMode &&
      (key === "UmmAlQura" || key === "Qatar")
    ) {
      return { ...method, ishaInterval: 120 };
    }

    return method;
  }

  function calculatePrayerTimes(date, lat, lng) {
    const method = getMethodAdjustedParams();
    const asrFactor = window.APP_STATE?.settings?.asrMethod === "hanafi" ? 2 : 1;

    const sunriseAlt = -0.833;
    const sunsetAlt = -0.833;

    const sunriseH = timeForSunAltitude(date, lat, lng, sunriseAlt, false);
    const sunsetH = timeForSunAltitude(date, lat, lng, sunsetAlt, true);
    const dhuhrH = solarNoon(date, lng);
    const asrH = asrTime(date, lat, lng, asrFactor);

    let fajrH = timeForSunAltitude(date, lat, lng, -method.fajrAngle, false);
    let ishaH = method.ishaInterval != null
      ? null
      : timeForSunAltitude(date, lat, lng, -method.ishaAngle, true);

    if (
      sunriseH == null ||
      sunsetH == null ||
      dhuhrH == null ||
      asrH == null
    ) {
      const fallbackBase = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      return {
        fajr: window.Utils.setTime(fallbackBase, 5, 0),
        sunrise: window.Utils.setTime(fallbackBase, 6, 20),
        dhuhr: window.Utils.setTime(fallbackBase, 12, 0),
        asr: window.Utils.setTime(fallbackBase, asrFactor === 2 ? 16 : 15, asrFactor === 2 ? 15 : 35),
        maghrib: window.Utils.setTime(fallbackBase, 18, 0),
        isha: window.Utils.setTime(fallbackBase, 19, 20)
      };
    }

    const sunrise = hoursToDate(date, sunriseH);
    const sunset = hoursToDate(date, sunsetH);
    const dhuhr = hoursToDate(date, dhuhrH);
    const asr = hoursToDate(date, asrH);
    let fajr = fajrH == null ? null : hoursToDate(date, fajrH);
    let isha = null;

    if (method.ishaInterval != null) {
      isha = new Date(sunset.getTime() + method.ishaInterval * 60000);
    } else if (ishaH != null) {
      isha = hoursToDate(date, ishaH);
    }

    const tomorrow = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
    const sunriseNextH = timeForSunAltitude(tomorrow, lat, lng, sunriseAlt, false);
    const sunriseNext = sunriseNextH == null
      ? new Date(sunrise.getTime() + 24 * 60 * 60000)
      : hoursToDate(tomorrow, sunriseNextH);

    const fallback = applyHighLatitudeFallback(date, fajr, sunrise, sunset, isha, sunriseNext);
    fajr = fallback.fajr;
    isha = fallback.isha;

    const offsets = window.APP_STATE?.settings?.offsets || {};

    const times = {
      fajr,
      sunrise,
      dhuhr,
      asr,
      maghrib: sunset,
      isha
    };

    Object.keys(times).forEach((key) => {
      const off = Number(offsets[key] || 0);
      if (off) {
        times[key] = new Date(times[key].getTime() + off * 60000);
      }
    });

    return times;
  }

  function getPrayerEntriesForDate(date) {
    const { lat, lng } = window.APP_STATE.location;
    const times = calculatePrayerTimes(date, lat, lng);

    return prayerOrder.map((key) => ({
      key,
      name: getPrayerName(key),
      time: times[key]
    }));
  }

  function getNextPrayer(entries, now) {
    for (const entry of entries) {
      if (entry.time > now) return entry;
    }
    return null;
  }

  function getTomorrowFirstPrayer(now) {
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    return getPrayerEntriesForDate(tomorrow)[0];
  }

  function renderTodayPrayerList() {
    const now = new Date();
    const entries = getPrayerEntriesForDate(now);
    const next = getNextPrayer(entries, now);
    const prayerList = document.getElementById("prayer-list");
    prayerList.innerHTML = "";

    const highlightKey = next ? next.key : null;

    entries.forEach((entry) => {
      const row = document.createElement("div");
      row.className = "prayer-row" + (entry.key === highlightKey ? " active" : "");

      const iqamahMap = window.APP_STATE.settings.iqamah || {};
      const iqamahValue = iqamahMap[entry.key]
        ? `${getLang() === "ar" ? "الإقامة" : "Iqamah"}: ${iqamahMap[entry.key]}`
        : "—";

      row.innerHTML = `
        <div class="prayer-row-left">
          <strong>${entry.name}</strong>
          <span>${iqamahValue}</span>
        </div>
        <div class="prayer-time">${window.Utils.formatTime(entry.time)}</div>
      `;
      prayerList.appendChild(row);
    });

    renderHero(entries, now);
  }

  function renderHero(entries, now) {
    let next = getNextPrayer(entries, now);
    let subtitle = getLang() === "ar" ? "المتبقي حتى الأذان" : "Time remaining until adhan";

    if (!next) {
      next = getTomorrowFirstPrayer(now);
      subtitle = getLang() === "ar" ? "أول صلاة غدًا" : "First prayer tomorrow";
    }

    window.DOM.setText("next-prayer-title", next.name);
    window.DOM.setText("next-prayer-sub", `${subtitle} • ${window.Utils.formatTime(next.time)}`);
    window.DOM.setText("hijri-date", window.Utils.getHijriApprox(new Date()));

    const methodKey = window.APP_STATE?.settings?.calcMethod || "UmmAlQura";
    const method = METHODS[methodKey] || METHODS.UmmAlQura;
    window.DOM.setText(
      "method-chip",
      getLang() === "ar"
        ? `الطريقة: ${method.display}`
        : `Method: ${method.display}`
    );

    window.DOM.setText(
      "asr-chip",
      getLang() === "ar"
        ? `العصر: ${window.APP_STATE.settings.asrMethod === "hanafi" ? "حنفي" : "قياسي"}`
        : `Asr: ${window.APP_STATE.settings.asrMethod === "hanafi" ? "Hanafi" : "Standard"}`
    );

    const iqamahEnabled = Object.values(window.APP_STATE.settings.iqamah || {}).some(Boolean);
    window.DOM.setText(
      "iqamah-chip",
      getLang() === "ar"
        ? `الإقامة: ${iqamahEnabled ? "مفعلة" : "غير مفعلة"}`
        : `Iqamah: ${iqamahEnabled ? "Enabled" : "Off"}`
    );

    updateCountdown(next.time);
  }

  function updateCountdown(targetTime) {
    function tick() {
      const now = new Date();
      let diff = targetTime.getTime() - now.getTime();
      if (diff < 0) diff = 0;

      const hrs = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);

      window.DOM.setText(
        "countdown-timer",
        `${window.Utils.pad(hrs)}:${window.Utils.pad(mins)}:${window.Utils.pad(secs)}`
      );
    }

    tick();
    clearInterval(window.__countdownInterval);
    window.__countdownInterval = setInterval(tick, 1000);
  }

  function renderMonthTable() {
    const offset = window.APP_STATE.ui.currentMonthOffset || 0;
    const base = new Date();
    const monthDate = new Date(base.getFullYear(), base.getMonth() + offset, 1);
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    document.getElementById("month-label-btn").textContent =
      `${year}-${window.Utils.pad(month + 1)}`;

    const tbody = document.getElementById("month-table-body");
    tbody.innerHTML = "";

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      const entries = getPrayerEntriesForDate(d);

      const tr = document.createElement("tr");
      const iqamahAny = Object.values(window.APP_STATE.settings.iqamah || {}).filter(Boolean).join(" / ") || "—";

      tr.innerHTML = `
        <td>${day}</td>
        <td>${window.Utils.formatTime(entries[0].time)}</td>
        <td>${window.Utils.formatTime(entries[1].time)}</td>
        <td>${window.Utils.formatTime(entries[2].time)}</td>
        <td>${window.Utils.formatTime(entries[3].time)}</td>
        <td>${window.Utils.formatTime(entries[4].time)}</td>
        <td>${window.Utils.formatTime(entries[5].time)}</td>
        <td>${iqamahAny}</td>
      `;
      tbody.appendChild(tr);
    }
  }

  function exportMonthCSV() {
    const rows = [["Day", "Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha", "Iqamah"]];
    const offset = window.APP_STATE.ui.currentMonthOffset || 0;
    const base = new Date();
    const monthDate = new Date(base.getFullYear(), base.getMonth() + offset, 1);
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const iqamahAny = Object.values(window.APP_STATE.settings.iqamah || {}).filter(Boolean).join(" / ") || "";

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      const entries = getPrayerEntriesForDate(d);
      rows.push([
        day,
        ...entries.map((e) => window.Utils.formatTime(e.time)),
        iqamahAny
      ]);
    }

    const csv = rows.map((r) => r.join(",")).join("\n");
    window.Utils.downloadText(`prayer-times-${year}-${month + 1}.csv`, csv, "text/csv");
  }

  window.Prayer = {
    calculatePrayerTimes,
    getPrayerEntriesForDate,
    renderTodayPrayerList,
    renderMonthTable,
    exportMonthCSV
  };
})();
