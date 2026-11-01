# NoorPrayer Pro

NoorPrayer Pro is a lightweight Progressive Web App for:

- Prayer times
- Qibla direction
- Daily azkar
- Tasbih counter
- Quran khatm tracking
- Daily salah tracking
- Prayer history
- Zakat estimation
- Offline usage
- Installable PWA support

---

## Features

### Prayer times
- Local astronomical prayer calculation
- Multiple calculation methods:
  - Umm Al-Qura
  - Muslim World League
  - ISNA / North America
  - Dubai
  - Qatar
- Standard and Hanafi Asr methods
- Manual minute offsets
- Iqamah time display

### Location options
- Automatic GPS
- Preset cities
- Search by city
- Custom coordinates
- Coordinate validation
- Optional reverse geocoding for city labels

### Qibla
- Qibla bearing calculation
- Device compass support where available
- iOS permission request support

### Worship tools
- Morning, evening, and sleep azkar
- Tasbih counter
- Quran khatm tracker
- Daily salah completion tracker
- Prayer history log
- Basic zakat calculator

### PWA / offline
- Installable web app
- Offline caching with service worker
- Local device storage
- Backup and restore via JSON

---

## Project structure

```text
/
├─ index.html
├─ 404.html
├─ privacy.html
├─ manifest.json
├─ service-worker.js
├─ README.md
└─ assets/
   ├─ audio/
   │  ├─ adhan-makkah.mp3
   │  └─ adhan-madinah.mp3
   ├─ css/
   │  └─ styles.css
   ├─ data/
   │  └─ azkar.js
   ├─ icons/
   │  └─ icon-512.png
   └─ js/
      ├─ app.js
      ├─ config.js
      ├─ dom.js
      ├─ i18n.js
      ├─ prayer.js
      ├─ qibla.js
      ├─ state.js
      ├─ storage.js
      └─ utils.js
