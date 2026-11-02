(function () {
  // Ramadan tab: start date, Imsak / Suhoor / Iftar and a full timetable for the whole month.
  // Dates follow the Umm al-Qura calendar. The moon sighting can move the real start by a day.

  const DAY = 24 * 60 * 60 * 1000;

  const TEXT = {
    ar: {
      title: (y) => `رمضان ${y} هـ`,
      startsIn: (n) => (n === 1 ? "يبدأ غدًا" : `يبدأ بعد ${n} يومًا`),
      dayOf: (d, total) => `اليوم ${d} من ${total}`,
      lastDay: "اليوم الأخير من رمضان",
      range: (a, b) => `من ${a} إلى ${b} (تقريبًا)`,
      imsak: "الإمساك",
      fajr: "الفجر (انتهاء السحور)",
      iftar: "الإفطار (المغرب)",
      refToday: "مواقيت اليوم",
      refFirst: "مواقيت أول يوم من رمضان",
      imsakSetting: "الإمساك قبل الفجر (دقائق)",
      export: "تصدير CSV",
      print: "طباعة / PDF",
      headers: ["اليوم", "التاريخ", "الإمساك", "الفجر", "الظهر", "العصر", "المغرب", "العشاء"],
      csvHeaders: ["اليوم", "التاريخ الميلادي", "الإمساك", "الفجر", "الظهر", "العصر", "المغرب (الإفطار)", "العشاء"],
      note:
        "التواريخ حسب تقويم أم القرى، وقد يختلف بداية الشهر بيوم واحد حسب رؤية الهلال. في رمضان يكون العشاء بعد المغرب بساعتين في طريقة أم القرى.",
      unavailable: "تعذر حساب تاريخ رمضان على هذا الجهاز.",
      locale: "ar-SA-u-ca-gregory"
    },
    en: {
      title: (y) => `Ramadan ${y} AH`,
      startsIn: (n) => (n === 1 ? "Starts tomorrow" : `Starts in ${n} days`),
      dayOf: (d, total) => `Day ${d} of ${total}`,
      lastDay: "Last day of Ramadan",
      range: (a, b) => `${a} to ${b} (approx.)`,
      imsak: "Imsak",
      fajr: "Fajr (end of suhoor)",
      iftar: "Iftar (Maghrib)",
      refToday: "Today's times",
      refFirst: "Times for the first day of Ramadan",
      imsakSetting: "Imsak before Fajr (minutes)",
      export: "Export CSV",
      print: "Print / PDF",
      headers: ["Day", "Date", "Imsak", "Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"],
      csvHeaders: ["Day", "Gregorian date", "Imsak", "Fajr", "Dhuhr", "Asr", "Maghrib (Iftar)", "Isha"],
      note:
        "Dates follow the Umm al-Qura calendar; the real start can differ by a day depending on moon sighting. During Ramadan, Isha is two hours after Maghrib in the Umm al-Qura method.",
      unavailable: "Could not work out the date of Ramadan on this device.",
      locale: "en-US"
    }
  };

  function lang() {
    return window.I18N?.getLang?.() === "en" ? "en" : "ar";
  }

  function tx() {
    return TEXT[lang()];
  }

  function el(id) {
    return document.getElementById(id);
  }

  function setText(id, value) {
    const node = el(id);
    if (node) node.textContent = value;
  }

  function midnight(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function addDays(date, n) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);
  }

  // Finds the Ramadan that is running now, or the next one.
  function findRamadan(today) {
    for (let i = -32; i <= 420; i++) {
      const d = addDays(today, i);
      const h = window.Prayer.hijriParts(d);
      if (!h || h.month !== 9 || h.day !== 1) continue;

      let length = 0;
      while (length < 31) {
        const x = window.Prayer.hijriParts(addDays(d, length));
        if (!x || x.month !== 9) break;
        length++;
      }

      if (addDays(d, length - 1) >= today) {
        return { start: d, length, year: h.year };
      }
    }
    return null;
  }

  // Time as hour:minute without AM/PM (the usual style of Ramadan timetables).
  function fmt(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "--:--";
    const parts = new Intl.DateTimeFormat(tx().locale === "en-US" ? "en-US" : "ar-SA", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    }).formatToParts(date);
    return parts
      .filter((p) => p.type !== "dayPeriod")
      .map((p) => p.value)
      .join("")
      .trim();
  }

  function longDate(date) {
    return new Intl.DateTimeFormat(tx().locale, { weekday: "long", day: "numeric", month: "long" }).format(date);
  }

  function shortDate(date) {
    return new Intl.DateTimeFormat(tx().locale, { day: "numeric", month: "numeric" }).format(date);
  }

  function imsakMinutes() {
    const v = Number(window.APP_STATE?.settings?.imsakMinutes);
    return Number.isFinite(v) && v >= 0 ? v : 10;
  }

  function dayTimes(date) {
    const times = window.Prayer.buildPrayerTimes(date);
    const imsak = times.fajr ? new Date(times.fajr.getTime() - imsakMinutes() * 60000) : null;
    return { imsak, ...times };
  }

  function render() {
    if (!el("tab-ramadan") || !window.Prayer?.hijriParts) return;

    const T = tx();
    const today = midnight(new Date());
    const info = findRamadan(today);

    setText("ramadan-imsak-label", T.imsakSetting);
    setText("ramadan-export-btn", T.export);
    setText("ramadan-print-btn", T.print);
    setText("ramadan-note", T.note);
    setText("ramadan-stat-imsak-label", T.imsak);
    setText("ramadan-stat-fajr-label", T.fajr);
    setText("ramadan-stat-iftar-label", T.iftar);

    const select = el("ramadan-imsak-select");
    if (select && document.activeElement !== select) select.value = String(imsakMinutes());

    const thead = el("ramadan-thead");
    if (thead) thead.innerHTML = `<tr>${T.headers.map((h) => `<th>${h}</th>`).join("")}</tr>`;

    const body = el("ramadan-tbody");
    if (!info) {
      setText("ramadan-title", "");
      setText("ramadan-status", T.unavailable);
      setText("ramadan-range", "");
      if (body) body.innerHTML = "";
      return;
    }

    const { start, length, year } = info;
    const end = addDays(start, length - 1);
    const inRamadan = today >= start;
    const dayNo = Math.round((today - start) / DAY) + 1;

    setText("ramadan-title", T.title(year));
    if (!inRamadan) {
      setText("ramadan-status", T.startsIn(Math.round((start - today) / DAY)));
    } else if (dayNo === length) {
      setText("ramadan-status", T.lastDay);
    } else {
      setText("ramadan-status", T.dayOf(dayNo, length));
    }
    setText("ramadan-range", T.range(longDate(start), longDate(end)));

    const ref = dayTimes(inRamadan ? today : start);
    setText("ramadan-stat-imsak", fmt(ref.imsak));
    setText("ramadan-stat-fajr", fmt(ref.fajr));
    setText("ramadan-stat-iftar", fmt(ref.maghrib));
    setText("ramadan-ref-note", inRamadan ? T.refToday : T.refFirst);

    if (!body) return;
    body.innerHTML = "";

    for (let i = 0; i < length; i++) {
      const date = addDays(start, i);
      const t = dayTimes(date);
      const tr = document.createElement("tr");
      if (date.getTime() === today.getTime()) tr.className = "today";
      tr.innerHTML = `
        <td>${i + 1}</td>
        <td>${shortDate(date)}</td>
        <td>${fmt(t.imsak)}</td>
        <td>${fmt(t.fajr)}</td>
        <td>${fmt(t.dhuhr)}</td>
        <td>${fmt(t.asr)}</td>
        <td class="iftar">${fmt(t.maghrib)}</td>
        <td>${fmt(t.isha)}</td>
      `;
      body.appendChild(tr);
    }
  }

  function exportCSV() {
    const info = findRamadan(midnight(new Date()));
    if (!info) return;

    const T = tx();
    const pad = (n) => String(n).padStart(2, "0");
    const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const hm = (d) => (d instanceof Date && !Number.isNaN(d.getTime()) ? `${pad(d.getHours())}:${pad(d.getMinutes())}` : "");

    const rows = [T.csvHeaders];
    for (let i = 0; i < info.length; i++) {
      const date = addDays(info.start, i);
      const t = dayTimes(date);
      rows.push([i + 1, iso(date), hm(t.imsak), hm(t.fajr), hm(t.dhuhr), hm(t.asr), hm(t.maghrib), hm(t.isha)]);
    }

    const csv = "﻿" + rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    window.Utils.downloadText(`ramadan-${info.year}.csv`, csv, "text/csv;charset=utf-8");
  }

  function bind() {
    const select = el("ramadan-imsak-select");
    if (select) {
      select.addEventListener("change", () => {
        window.APP_STATE.settings.imsakMinutes = Number(select.value);
        window.StorageAPI?.saveState?.();
        render();
      });
    }

    const exportBtn = el("ramadan-export-btn");
    if (exportBtn) exportBtn.addEventListener("click", exportCSV);

    const printBtn = el("ramadan-print-btn");
    if (printBtn) printBtn.addEventListener("click", () => window.print());
  }

  bind();

  window.Ramadan = { render, exportCSV, findRamadan };
})();
