const GEO_URL = "https://geocoding-api.open-meteo.com/v1/search";
const WEATHER_URL = "https://api.open-meteo.com/v1/forecast";
const AIR_URL = "https://air-quality-api.open-meteo.com/v1/air-quality";

async function fetchJSON(url, timeoutMs = 9000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let response;
  try {
    response = await fetch(url, { signal: controller.signal, cache: "no-store" });
  } finally {
    clearTimeout(timer);
  }
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

export async function geocodeCity(query) {
  const url = `${GEO_URL}?name=${encodeURIComponent(query)}&count=8&language=en&format=json`;
  const data = await fetchJSON(url);
  return (data.results || []).map((x, i) => ({
    id: `${x.id || ""}-${i}`,
    name: x.name,
    country: x.country || "",
    admin1: x.admin1 || "",
    latitude: x.latitude,
    longitude: x.longitude,
    timezone: x.timezone || "auto"
  }));
}

export async function reverseGeocode(lat, lon) {
  // Nominatim is used only to obtain a friendly city label for coordinates.
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&zoom=10&addressdetails=1`;
  const data = await fetchJSON(url);
  const a = data.address || {};
  return {
    id: `geo-${lat.toFixed(4)}-${lon.toFixed(4)}`,
    name: a.city || a.town || a.municipality || a.village || "Current location",
    country: a.country || "",
    admin1: a.state || "",
    latitude: lat,
    longitude: lon,
    timezone: "auto"
  };
}

export async function getWeather(place, unit = "celsius") {
  const temp = unit === "fahrenheit" ? "fahrenheit" : "celsius";
  const wind = unit === "fahrenheit" ? "mph" : "kmh";
  const url = `${WEATHER_URL}?latitude=${place.latitude}&longitude=${place.longitude}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,weather_code,cloud_cover,surface_pressure,wind_speed_10m,wind_direction_10m` +
    `&hourly=temperature_2m,apparent_temperature,precipitation_probability,precipitation,rain,weather_code,cloud_cover,visibility,uv_index,wind_speed_10m` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max,rain_sum` +
    `&timezone=auto&forecast_days=7&temperature_unit=${temp}&wind_speed_unit=${wind}&forecast_hours=48`;
  const weather = await fetchJSON(url);

  // Air quality is optional. Load it independently so a slow AQ request never
  // delays the main weather dashboard.
  const airUrl = `${AIR_URL}?latitude=${place.latitude}&longitude=${place.longitude}&current=us_aqi,pm2_5,pm10,carbon_monoxide,nitrogen_dioxide,ozone&timezone=auto`;
  const airPromise = fetchJSON(airUrl, 5000).catch(() => null);
  const air = await airPromise;

  return { ...weather, air };
}
