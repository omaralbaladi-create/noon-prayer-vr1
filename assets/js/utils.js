(function () {
  function pad(num) {
    return String(num).padStart(2, "0");
  }

  function formatTime(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "--:--";
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  function formatDateKey(date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
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

  function formatCurrency(value) {
    const n = Number(value || 0);
    return `${n.toFixed(2)} SAR`;
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
      const locale = document.documentElement.lang === "en" ? "en-TN-u-ca-islamic" : "ar-TN-u-ca-islamic";
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
    formatDateKey,
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
