# 🌦️ SkyCast — Advanced Weather Intelligence Dashboard

SkyCast is a professional, responsive weather dashboard built with **HTML5, CSS3 and Vanilla JavaScript (ES6 modules)**. It consumes live weather data from Open-Meteo and uses browser geolocation plus local storage to create a portfolio-ready frontend project.

## ✨ Features

- Live current weather for searched cities
- City search with geocoding suggestions
- Browser geolocation / “My Location”
- 18-hour horizontal forecast
- 7-day forecast
- Temperature trend visualization using HTML Canvas
- Precipitation probability
- Humidity, wind, pressure, visibility, UV and cloud cover
- Air quality and pollutant readings when available
- Sunrise, sunset and daylight progress
- Official-alert area handled gracefully when the selected API has no global alert feed
- Favorites with LocalStorage
- Recent searches with LocalStorage
- Celsius / Fahrenheit
- Light / dark theme with system preference on first visit
- Web Share API with clipboard fallback
- Loading and error states
- Responsive desktop, tablet and mobile UI
- Accessible semantic controls and keyboard focus states
- No React, Vue, Angular, Bootstrap, Tailwind or jQuery

## 🛠 Technologies

- HTML5
- CSS3
- Vanilla JavaScript ES6+
- Fetch API
- REST APIs
- Browser Geolocation API
- LocalStorage
- HTML Canvas
- Open-Meteo Forecast API
- Open-Meteo Geocoding API
- Open-Meteo Air Quality API
- OpenStreetMap Nominatim reverse geocoding

## 📁 Folder Structure

```text
SkyCast/
├── index.html
├── css/
│   ├── style.css
│   ├── responsive.css
│   └── animations.css
├── js/
│   ├── app.js
│   ├── api.js
│   ├── ui.js
│   ├── storage.js
│   ├── location.js
│   ├── chart.js
│   └── utils.js
├── assets/
│   ├── icons/
│   └── images/
└── README.md
```

The `assets/icons` and `assets/images` folders are intentionally kept available for future custom assets; the current interface uses lightweight text/Unicode weather symbols and does not require image files.

## 🔌 API Setup

SkyCast uses Open-Meteo, so **no API key is required** for the public endpoints used in this project.

API services:

- Forecast: `https://api.open-meteo.com/v1/forecast`
- Geocoding: `https://geocoding-api.open-meteo.com/v1/search`
- Air quality: `https://air-quality-api.open-meteo.com/v1/air-quality`
- Reverse geocoding: OpenStreetMap Nominatim

Because no private key is required, there is no secret credential in the frontend source.

### Weather Alerts

Open-Meteo does not provide a universal official severe-weather-alert feed for all countries. SkyCast therefore **does not fabricate alerts**. The alert panel explicitly explains when the selected source does not provide official global alerts.

## ▶️ How to Run Locally

Because the project uses ES modules, run it through a local HTTP server rather than opening `index.html` directly with `file://`.

### Option 1 — VS Code Live Server

1. Open the `SkyCast` folder in VS Code.
2. Install the **Live Server** extension.
3. Right-click `index.html`.
4. Select **Open with Live Server**.

### Option 2 — Python

From the project directory:

```bash
python -m http.server 5500
```

Then open:

```text
http://localhost:5500
```

### Option 3 — Node

If Node.js is installed:

```bash
npx serve .
```

## 💾 LocalStorage Keys

SkyCast persists these values:

```text
skycast_theme
skycast_favorites
skycast_recent_searches
skycast_last_city
skycast_unit
```

## 🌍 Deployment

This is a static frontend and can be deployed to:

- GitHub Pages
- Netlify
- Vercel static hosting
- Cloudflare Pages

For GitHub Pages, keep the relative folder structure unchanged.

## 📱 Screenshots

Add screenshots here after deployment:

```text
![SkyCast Desktop](assets/images/screenshot-desktop.png)
![SkyCast Mobile](assets/images/screenshot-mobile.png)
```

## 🧪 Testing Checklist

### Search
- Valid city
- Invalid city
- Empty input
- Enter key
- Search suggestions

### Location
- Permission granted
- Permission denied
- Timeout / unavailable location

### Preferences
- Favorites add/remove
- Recent search add/remove/clear
- Light/dark mode persistence
- Celsius/Fahrenheit persistence

### API
- Loading state
- Successful response
- Invalid city
- Network/API failure
- Optional air-quality failure

### Responsive
- Desktop
- Laptop
- Tablet
- Mobile

## 🚀 Future Improvements

- Country-specific official severe-weather alerts
- PWA/offline service worker
- Weather radar integration
- Interactive map
- More advanced historical weather analytics
- User-configurable dashboard widgets
- Multiple saved unit preferences
- Internationalization
- Backend proxy for production API governance
- Automated end-to-end tests

## 👤 Author / Project Credits

**Project:** SkyCast — Advanced Weather Intelligence Dashboard

**Author:** Add your name / GitHub profile here before publishing.

Weather data provided by **Open-Meteo**. Geocoding/reverse geocoding uses **Open-Meteo Geocoding** and **OpenStreetMap Nominatim**.

## 📄 License

For portfolio/educational use. Review the terms of the external data services before commercial deployment.
