(function () {
  // Market gold and silver prices for the zakat calculator.
  //
  // A GitHub job saves today's international price (in SAR per gram) to gold.json on the app's website once a day.
  // This module downloads that small file, remembers the last good copy for offline use, and tells the page
  // when new prices arrive. The calculator fills its price fields from it unless the user typed their own.

  const URL = "https://omaralbaladi-create.github.io/noon-prayer-vr1/gold.json";
  const CACHE_KEY = "noor-gold-price";
  const REFRESH_MS = 6 * 60 * 60 * 1000;

  let data = null;
  let lastTry = 0;

  function valid(d) {
    if (!d || typeof d !== "object") return null;
    const gold = Number(d.gold24);
    const silver = d.silver == null ? null : Number(d.silver);
    const when = new Date(d.updated);
    if (!(gold >= 50 && gold <= 5000)) return null;
    if (silver !== null && !(silver >= 0.5 && silver <= 200)) return null;
    if (Number.isNaN(when.getTime()) || when.getTime() > Date.now() + 36 * 3600 * 1000) return null;
    return { gold24: gold, silver, updated: when.toISOString() };
  }

  function readCache() {
    try {
      return valid(JSON.parse(localStorage.getItem(CACHE_KEY) || "null"));
    } catch (_) {
      return null;
    }
  }

  function writeCache(d) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(d));
    } catch (_) {}
  }

  function publish(d) {
    data = d;
    window.dispatchEvent(new Event("gold-updated"));
  }

  async function refresh() {
    lastTry = Date.now();
    try {
      const ctrl = typeof AbortController === "function" ? new AbortController() : null;
      const timer = ctrl ? setTimeout(() => ctrl.abort(), 10000) : null;
      const res = await fetch(URL, { cache: "no-store", signal: ctrl ? ctrl.signal : undefined });
      if (timer) clearTimeout(timer);
      if (!res.ok) return data;
      const fresh = valid(await res.json());
      if (!fresh) return data;
      if (!data || fresh.updated !== data.updated || fresh.gold24 !== data.gold24) {
        writeCache(fresh);
        publish(fresh);
      }
    } catch (_) {
      // Offline or the site is unreachable: keep showing the last saved price.
    }
    return data;
  }

  function start() {
    const cached = readCache();
    if (cached) publish(cached);
    refresh();
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && Date.now() - lastTry > REFRESH_MS) refresh();
    });
  }

  window.Gold = { start, refresh, get: () => data };
})();
