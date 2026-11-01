(function () {
  function t(key, fallbackAr, fallbackEn) {
    if (window.I18N && typeof window.I18N.t === "function") {
      const value = window.I18N.t(key);
      if (value && value !== key) return value;
    }
    const isEn = document.documentElement.lang === "en";
    return isEn ? fallbackEn : fallbackAr;
  }

  function toRadians(deg) {
    return deg * Math.PI / 180;
  }

  function toDegrees(rad) {
    return rad * 180 / Math.PI;
  }

  function normalizeDegrees(deg) {
    return (deg + 360) % 360;
  }

  function hasValidCoordinates(lat, lng) {
    return Number.isFinite(Number(lat)) && Number.isFinite(Number(lng));
  }

  function getQiblaBearing(lat, lng) {
    if (!hasValidCoordinates(lat, lng)) return null;

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

  function setBearingText(bearing) {
    const bearingText = document.getElementById("qibla-bearing-text");
    if (!bearingText) return;

    if (bearing == null) {
      bearingText.textContent = t(
        "qiblaBearingUnavailable",
        "زاوية القبلة: غير متاحة",
        "Qibla bearing: unavailable"
      );
      return;
    }

    bearingText.textContent =
      document.documentElement.lang === "en"
        ? `Qibla bearing: ${Math.round(bearing)}°`
        : `زاوية القبلة: ${Math.round(bearing)}°`;
  }

  function setStatus(message) {
    const status = document.getElementById("haptic-status");
    if (status) status.textContent = message;
  }

  function requestIOSPermissionIfNeeded() {
    const btn = document.getElementById("ios-permission-btn");
    if (!btn) return;

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
          } else {
            setStatus(
              t(
                "compassPermissionDenied",
                "تم رفض إذن البوصلة.",
                "Compass permission was denied."
              )
            );
          }
        } catch (error) {
          console.error("Compass permission denied:", error);
          setStatus(
            t(
              "compassPermissionDenied",
              "تم رفض إذن البوصلة.",
              "Compass permission was denied."
            )
          );
        }
      };
    }
  }

  function startCompass() {
    const rose = document.getElementById("compass-rose");
    const needle = document.getElementById("compass-needle");

    if (!rose || !needle) return;

    const lat = window.APP_STATE?.location?.lat;
    const lng = window.APP_STATE?.location?.lng;
    const bearing = getQiblaBearing(lat, lng);

    setBearingText(bearing);

    if (bearing == null) {
      setStatus(
        t(
          "qiblaLocationRequired",
          "يلزم تحديد موقع صحيح لحساب اتجاه القبلة.",
          "A valid location is required to calculate the Qibla direction."
        )
      );
      return;
    }

    setStatus(
      t(
        "compassCalibrating",
        "جارٍ معايرة البوصلة...",
        "Calibrating compass..."
      )
    );

    function handle(event) {
      let heading = null;

      if (typeof event.webkitCompassHeading === "number") {
        heading = event.webkitCompassHeading;
      } else if (typeof event.alpha === "number") {
        heading = 360 - event.alpha;
      }

      if (heading == null || Number.isNaN(heading)) {
        setStatus(
          t(
            "compassUnavailable",
            "تعذر قراءة البوصلة من هذا الجهاز.",
            "Compass data is unavailable on this device."
          )
        );
        return;
      }

      heading = normalizeDegrees(heading);

      rose.style.transform = `rotate(${-heading}deg)`;
      needle.style.transform = `rotate(${bearing}deg)`;

      const diff = Math.abs(((heading - bearing + 540) % 360) - 180);

      if (diff < 8) {
        setStatus(
          t(
            "qiblaVeryClose",
            "أنت قريب جدًا من اتجاه القبلة.",
            "You are very close to the Qibla direction."
          )
        );
        if (navigator.vibrate) navigator.vibrate(60);
      } else {
        setStatus(
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
