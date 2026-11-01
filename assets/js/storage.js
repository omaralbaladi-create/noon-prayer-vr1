(function () {
  const KEY = window.APP_CONFIG.storageKey;

  function deepMerge(target, source) {
    const output = Array.isArray(target) ? [...target] : { ...target };

    if (!source || typeof source !== "object") return output;

    Object.keys(source).forEach((key) => {
      const sourceValue = source[key];
      const targetValue = output[key];

      if (
        sourceValue &&
        typeof sourceValue === "object" &&
        !Array.isArray(sourceValue) &&
        targetValue &&
        typeof targetValue === "object" &&
        !Array.isArray(targetValue)
      ) {
        output[key] = deepMerge(targetValue, sourceValue);
      } else {
        output[key] = sourceValue;
      }
    });

    return output;
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw);
      window.APP_STATE = deepMerge(window.APP_STATE, parsed);
    } catch (error) {
      console.error("Failed to load state:", error);
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

    if (!parsed || typeof parsed !== "object" || !parsed.state) {
      throw new Error("Invalid backup file.");
    }

    window.APP_STATE = deepMerge(window.APP_STATE, parsed.state);
    saveState();
  }

  window.StorageAPI = {
    loadState,
    saveState,
    clearState,
    exportBackup,
    importBackup
  };
})();
