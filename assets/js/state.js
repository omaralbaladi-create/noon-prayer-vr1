(function () {
  function createDefaultState() {
    return {
      location: {
        mode: "preset",
        cityName: "Riyadh",
        lat: 24.7136,
        lng: 46.6753,
        lookupCity: false
      },

      settings: {
        lang: "ar",
        theme: "emerald",
        calcMethod: "UmmAlQura",
        asrMethod: "standard",
        ramadanMode: false,

        offsets: {
          fajr: 0,
          sunrise: 0,
          dhuhr: 0,
          asr: 0,
          maghrib: 0,
          isha: 0
        },

        iqamah: {
          fajr: "",
          dhuhr: "",
          asr: "",
          maghrib: "",
          isha: ""
        },

        notifications: {
          enabled: false,
          audioEnabled: false,
          adhanAudio: "makkah",
          reminderOffset: 0,
          prayers: {
            fajr: true,
            dhuhr: true,
            asr: true,
            maghrib: true,
            isha: true
          }
        },

        zakat: {
          basis: "gold",
          goldPrice: "",
          silverPrice: ""
        },

        debugEnabled: false
      },

      ui: {
        activeTab: "prayer",
        activeAzkarTab: "morning",
        currentMonthOffset: 0
      },

      trackers: {
        salahDayKey: "",
        salahToday: {
          fajr: false,
          dhuhr: false,
          asr: false,
          maghrib: false,
          isha: false
        },

        salahHistory: [],

        azkarDayKey: "",
        azkarProgress: {},

        tasbih: {
          index: 0,
          count: 0
        },

        quranDone: []
      },

      cityData: {
        favorites: [],
        recent: []
      }
    };
  }

  function cloneState(state) {
    return JSON.parse(JSON.stringify(state));
  }

  window.DEFAULT_APP_STATE = createDefaultState();
  window.createDefaultAppState = createDefaultState;
  window.cloneAppState = function () {
    return cloneState(window.DEFAULT_APP_STATE);
  };

  window.APP_STATE = cloneState(window.DEFAULT_APP_STATE);
})();
