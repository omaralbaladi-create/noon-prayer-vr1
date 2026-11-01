(function () {
  function lang() {
    return window.I18N?.getLang?.() === "en" ? "en" : "ar";
  }

  function pad(num) {
    return String(num).padStart(2, "0");
  }

  function formatTime(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "--:--";
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  function formatTime12(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "--:--";
    return new Intl.DateTimeFormat(lang() === "en" ? "en-US" : "ar-SA", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    }).format(date);
  }

  function formatDateKey(date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  function formatGregorianDate(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat(lang() === "en" ? "en-US" : "ar-SA", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric"
    }).format(date);
  }

  function addMinutes(date, minutes) {
    return new Date(date.getTime() + minutes * 60000);
  }

  function cloneDate(date) {
    return new Date(date.getTime());
  }

  function setTime(baseDate, hour, minute) {
    const d = new Date(baseDate);
    d.setHours(hour, minute, 0, 0);
    return d;
  }

  function percent(done, total) {
    if (!total) return 0;
    return Math.round((done / total) * 100);
  }

  function degreesToCardinal(deg) {
    const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    return dirs[Math.round(deg / 45) % 8];
  }

  function formatCurrency(value, currency = "SAR") {
    const n = Number(value || 0);

    try {
      return new Intl.NumberFormat(lang() === "en" ? "en-US" : "ar-SA", {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(n);
    } catch (_) {
      return `${n.toFixed(2)} ${currency}`;
    }
  }

  function downloadText(filename, text, mimeType) {
    const blob = new Blob([text], { type: mimeType || "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function getHijriApprox(date) {
    try {
      const locale = lang() === "en" ? "en-u-ca-islamic-umalqura" : "ar-SA-u-ca-islamic-umalqura";
      return new Intl.DateTimeFormat(locale, {
        day: "numeric",
        month: "long",
        year: "numeric"
      }).format(date);
    } catch (_) {
      return "";
    }
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function isFiniteNumber(value) {
    return Number.isFinite(Number(value));
  }

  function safeNumber(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function debounce(fn, wait = 250) {
    let timeoutId = null;
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  function uid(prefix = "id") {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  window.Utils = {
    pad,
    formatTime,
    formatTime12,
    formatDateKey,
    formatGregorianDate,
    addMinutes,
    cloneDate,
    setTime,
    percent,
    degreesToCardinal,
    formatCurrency,
    downloadText,
    getHijriApprox,
    clamp,
    isFiniteNumber,
    safeNumber,
    debounce,
    uid
  };
})();
