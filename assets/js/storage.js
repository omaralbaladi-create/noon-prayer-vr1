(function () {
  const KEY = window.APP_CONFIG.storageKey;

  function isPlainObject(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }

  function deepMerge(target, source) {
    const output = Array.isArray(target) ? [...target] : { ...target };

    if (!source || typeof source !== "object") return output;

    Object.keys(source).forEach((key) => {
      const sourceValue = source[key];
      const targetValue = output[key];

      if (isPlainObject(sourceValue) && isPlainObject(targetValue)) {
        output[key] = deepMerge(targetValue, sourceValue);
      } else if (Array.isArray(sourceValue)) {
        output[key] = [...sourceValue];
      } else {
        output[key] = sourceValue;
      }
    });

    return output;
  }

  function getFreshDefaultState() {
    if (typeof window.createDefaultAppState === "function") {
      return window.createDefaultAppState();
    }
    if (window.DEFAULT_APP_STATE) {
      return JSON.parse(JSON.stringify(window.DEFAULT_APP_STATE));
    }
    return {};
  }

  function normalizeLoadedState(parsedState) {
    const base = getFreshDefaultState();
    return deepMerge(base, parsedState || {});
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) {
        window.APP_STATE = normalizeLoadedState(window.APP_STATE);
        return;
      }

      const parsed = JSON.parse(raw);
      window.APP_STATE = normalizeLoadedState(parsed);
    } catch (error) {
      console.error("Failed to load state:", error);
      window.APP_STATE = normalizeLoadedState(window.APP_STATE);
    }
  }

  function saveState() {
    try {
      localStorage.setItem(KEY, JSON.stringify(window.APP_STATE));
    } catch (error) {
      console.error("Failed to save state:", error);
    }
  }

  function clearState() {
    try {
      localStorage.removeItem(KEY);
      window.APP_STATE = getFreshDefaultState();
    } catch (error) {
      console.error("Failed to clear state:", error);
    }
  }

  function exportBackup() {
    return JSON.stringify(
      {
        backupVersion: window.APP_CONFIG.backupVersion,
        exportedAt: new Date().toISOString(),
        appVersion: window.APP_CONFIG.version,
        state: window.APP_STATE
      },
      null,
      2
    );
  }

  function importBackup(jsonText) {
    const parsed = JSON.parse(jsonText);

    if (!parsed || typeof parsed !== "object" || !parsed.state || typeof parsed.state !== "object") {
      throw new Error("Invalid backup file.");
    }

    window.APP_STATE = normalizeLoadedState(parsed.state);
    saveState();
  }

  window.StorageAPI = {
    loadState,
    saveState,
    clearState,
    exportBackup,
    importBackup,
    deepMerge
  };
})();
