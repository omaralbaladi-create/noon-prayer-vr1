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
    return ((deg % 360) + 360) % 360;
  }

  // Signed shortest rotation from angle a to angle b, in (-180, 180]
  function shortestDelta(a, b) {
    return ((((b - a) % 360) + 540) % 360) - 180;
  }

  function hasValidCoordinates(lat, lng) {
    return (
      lat !== "" && lat != null && lng !== "" && lng != null &&
      Number.isFinite(Number(lat)) && Number.isFinite(Number(lng))
    );
  }

  function getQiblaBearing(lat, lng) {
    if (!hasValidCoordinates(lat, lng)) return null;

    const meccaLat = toRadians(window.APP_CONFIG.mecca.lat);
    const meccaLng = toRadians(window.APP_CONFIG.mecca.lng);
    const userLat = toRadians(Number(lat));
    const userLng = toRadians(Number(lng));

    const y = Math.sin(meccaLng - userLng);
    const x =
      Math.cos(userLat) * Math.tan(meccaLat) -
      Math.sin(userLat) * Math.cos(meccaLng - userLng);

    return normalizeDegrees(toDegrees(Math.atan2(y, x)));
  }

  // ---------------------------------------------------------------
  // Shared compass state (module level, so a location change can
  // refresh the bearing without re-registering the sensor listener)
  // ---------------------------------------------------------------
  let bearing = null;        // Qibla bearing for the CURRENT location
  let roseAngle = 0;         // unwrapped dial angle, avoids a full spin across north
  let sensorActive = false;  // true once a usable heading has been received
  let aligned = false;       // hysteresis flag so vibration fires once per alignment
  let listening = false;
  let activeEventName = null;
  let lastStatus = "";

  function setBearingText(value) {
    const bearingText = document.getElementById("qibla-bearing-text");
    if (!bearingText) return;

    if (value == null) {
      bearingText.textContent = t(
        "qiblaBearingUnavailable",
        "زاوية القبلة: غير متاحة",
        "Qibla bearing: unavailable"
      );
      return;
    }

    bearingText.textContent =
      document.documentElement.lang === "en"
        ? `Qibla bearing: ${Math.round(value)}°`
        : `زاوية القبلة: ${Math.round(value)}°`;
  }

  function setStatus(message) {
    if (message === lastStatus) return;
    lastStatus = message;
    const status = document.getElementById("haptic-status");
    if (status) status.textContent = message;
  }

  function idleStatus() {
    if (bearing == null) {
      return t(
        "qiblaLocationRequired",
        "يلزم تحديد موقع صحيح لحساب اتجاه القبلة.",
        "A valid location is required to calculate the Qibla direction."
      );
    }
    return document.documentElement.lang === "en"
      ? `No compass sensor in use. Qibla is ${Math.round(bearing)}° clockwise from North.`
      : `لا يوجد مستشعر بوصلة قيد الاستخدام. القبلة ${Math.round(bearing)}° باتجاه عقارب الساعة من الشمال.`;
  }

  // Re-read the location and refresh bearing text, needle and idle status.
  // Called from app.js on every render, so it always reflects the current location.
  function update() {
    const loc = window.APP_STATE && window.APP_STATE.location;
    bearing = loc ? getQiblaBearing(loc.lat, loc.lng) : null;

    setBearingText(bearing);

    const needle = document.getElementById("compass-needle");
    if (needle) {
      needle.style.transform = bearing == null ? "" : `rotate(${bearing}deg)`;
    }

    if (!sensorActive) setStatus(idleStatus());
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
          console.error("Compass permission error:", error);
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

  function readHeading(event) {
    // iOS Safari: already clockwise from magnetic/true north
    if (typeof event.webkitCompassHeading === "number" && !Number.isNaN(event.webkitCompassHeading)) {
      return normalizeDegrees(event.webkitCompassHeading);
    }
    // Android: only trust the ABSOLUTE alpha (relative alpha has an arbitrary zero)
    if (event.absolute === true && typeof event.alpha === "number" && !Number.isNaN(event.alpha)) {
      return normalizeDegrees(360 - event.alpha);
    }
    return null;
  }

  function onOrientation(event) {
    const rose = document.getElementById("compass-rose");
    if (!rose) return;

    const heading = readHeading(event);

    if (heading == null) {
      // No usable reading (desktop, or only relative data): keep the static bearing display.
      if (!sensorActive) {
        setStatus(
          t(
            "compassUnavailable",
            "تعذر قراءة البوصلة من هذا الجهاز.",
            "Compass data is unavailable on this device."
          )
        );
      }
      return;
    }

    sensorActive = true;

    // Dial turns opposite to the phone's heading; unwrap so crossing north never spins the long way.
    roseAngle += shortestDelta(roseAngle, -heading);
    rose.style.transform = `rotate(${roseAngle}deg)`;

    if (bearing == null) {
      setStatus(idleStatus());
      return;
    }

    // The needle sits at the Qibla bearing inside the dial, so on screen it points at (bearing - heading).
    const diff = Math.abs(shortestDelta(heading, bearing));

    if (!aligned && diff <= 3) {
      aligned = true;
      if (navigator.vibrate) {
        try { navigator.vibrate(60); } catch (_) {}
      }
    } else if (aligned && diff > 6) {
      aligned = false;
    }

    if (diff < 8) {
      setStatus(
        t(
          "qiblaVeryClose",
          "أنت قريب جدًا من اتجاه القبلة.",
          "You are very close to the Qibla direction."
        )
      );
    } else {
      setStatus(
        document.documentElement.lang === "en"
          ? `Approx. deviation: ${Math.round(diff)}°`
          : `انحراف تقريبي: ${Math.round(diff)}°`
      );
    }
  }

  function startCompass() {
    update();

    // Use exactly ONE event stream: absolute if the browser has it, otherwise plain deviceorientation (iOS).
    const eventName =
      "ondeviceorientationabsolute" in window ? "deviceorientationabsolute" : "deviceorientation";

    if (listening && activeEventName === eventName) return;

    if (listening && activeEventName) {
      window.removeEventListener(activeEventName, onOrientation, true);
    }

    window.addEventListener(eventName, onOrientation, true);
    activeEventName = eventName;
    listening = true;
  }

  window.Qibla = {
    getQiblaBearing,
    requestIOSPermissionIfNeeded,
    startCompass,
    update
  };
})();
