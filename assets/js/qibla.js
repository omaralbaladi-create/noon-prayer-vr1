(function () {
  function toRadians(deg) {
    return deg * Math.PI / 180;
  }

  function toDegrees(rad) {
    return rad * 180 / Math.PI;
  }

  function normalizeDegrees(deg) {
    return (deg + 360) % 360;
  }

  function getQiblaBearing(lat, lng) {
    const meccaLat = toRadians(window.APP_CONFIG.mecca.lat);
    const meccaLng = toRadians(window.APP_CONFIG.mecca.lng);
    const userLat = toRadians(lat);
    const userLng = toRadians(lng);

    const y = Math.sin(meccaLng - userLng);
    const x =
      Math.cos(userLat) * Math.tan(meccaLat) -
      Math.sin(userLat) * Math.cos(meccaLng - userLng);

    return normalizeDegrees(toDegrees(Math.atan2(y, x)));
  }

  function requestIOSPermissionIfNeeded() {
    const btn = document.getElementById("ios-permission-btn");

    if (
      typeof DeviceOrientationEvent !== "undefined" &&
      typeof DeviceOrientationEvent.requestPermission === "function"
    ) {
      btn.classList.remove("hidden");
      btn.onclick = async function () {
        try {
          const result = await DeviceOrientationEvent.requestPermission();
          if (result === "granted") {
            btn.classList.add("hidden");
            startCompass();
          }
        } catch (error) {
          console.error("Compass permission denied:", error);
        }
      };
    }
  }

  function startCompass() {
    const rose = document.getElementById("compass-rose");
    const needle = document.getElementById("compass-needle");
    const status = document.getElementById("haptic-status");
    const bearingText = document.getElementById("qibla-bearing-text");

    if (!rose || !needle || !status || !bearingText) return;

    const bearing = getQiblaBearing(
      window.APP_STATE.location.lat,
      window.APP_STATE.location.lng
    );

    bearingText.textContent =
      document.documentElement.lang === "en"
        ? `Qibla bearing: ${Math.round(bearing)}°`
        : `زاوية القبلة: ${Math.round(bearing)}°`;

    function updateStatus(message) {
      status.textContent = message;
    }

    function handle(event) {
      let heading = null;

      if (typeof event.webkitCompassHeading === "number") {
        heading = event.webkitCompassHeading;
      } else if (typeof event.alpha === "number") {
        heading = 360 - event.alpha;
      }

      if (heading == null || Number.isNaN(heading)) {
        updateStatus(
          document.documentElement.lang === "en"
            ? "Compass data is unavailable on this device."
            : "تعذر قراءة البوصلة من هذا الجهاز."
        );
        return;
      }

      heading = normalizeDegrees(heading);

      rose.style.transform = `rotate(${-heading}deg)`;
      needle.style.transform = `rotate(${bearing}deg)`;

      const diff = Math.abs(((heading - bearing + 540) % 360) - 180);

      if (diff < 8) {
        updateStatus(
          document.documentElement.lang === "en"
            ? "You are very close to the Qibla direction."
            : "أنت قريب جدًا من اتجاه القبلة."
        );
        if (navigator.vibrate) navigator.vibrate(60);
      } else {
        updateStatus(
          document.documentElement.lang === "en"
            ? `Approx. deviation: ${Math.round(diff)}°`
            : `انحراف تقريبي: ${Math.round(diff)}°`
        );
      }
    }

    window.removeEventListener("deviceorientationabsolute", window.__qiblaCompassHandler, true);
    window.removeEventListener("deviceorientation", window.__qiblaCompassHandler, true);

    window.__qiblaCompassHandler = handle;

    window.addEventListener("deviceorientationabsolute", handle, true);
    window.addEventListener("deviceorientation", handle, true);
  }

  window.Qibla = {
    getQiblaBearing,
    requestIOSPermissionIfNeeded,
    startCompass
  };
})();
