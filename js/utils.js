export const weatherInfo = {
  0:["Clear sky","☀️"], 1:["Mainly clear","🌤️"], 2:["Partly cloudy","⛅"], 3:["Overcast","☁️"],
  45:["Fog","🌫️"], 48:["Depositing rime fog","🌫️"],
  51:["Light drizzle","🌦️"], 53:["Drizzle","🌦️"], 55:["Heavy drizzle","🌧️"],
  56:["Freezing drizzle","🌧️"], 57:["Freezing drizzle","🌧️"],
  61:["Slight rain","🌦️"], 63:["Moderate rain","🌧️"], 65:["Heavy rain","🌧️"],
  66:["Freezing rain","🌧️"], 67:["Heavy freezing rain","🌧️"],
  71:["Slight snow","🌨️"], 73:["Snow","❄️"], 75:["Heavy snow","❄️"], 77:["Snow grains","❄️"],
  80:["Rain showers","🌦️"], 81:["Rain showers","🌧️"], 82:["Heavy rain showers","🌧️"],
  85:["Snow showers","🌨️"], 86:["Heavy snow showers","🌨️"],
  95:["Thunderstorm","⛈️"], 96:["Thunderstorm + hail","⛈️"], 99:["Thunderstorm + hail","⛈️"]
};

export function weather(code) { return weatherInfo[code] || ["Unknown","🌡️"]; }
export function temp(v, unit) { return `${Math.round(v)}°${unit === "fahrenheit" ? "F" : "C"}`; }
function parseLocalISO(iso) {
  const m = String(iso || "").match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return null;
  return { year:+m[1], month:+m[2], day:+m[3], hour:+m[4], minute:+m[5] };
}

export function timeOnly(iso, tz) {
  const p = parseLocalISO(iso);
  if (p) {
    const h = p.hour % 12 || 12;
    return `${h}:${String(p.minute).padStart(2,"0")} ${p.hour >= 12 ? "PM" : "AM"}`;
  }
  return new Intl.DateTimeFormat("en-US", { hour:"numeric", minute:"2-digit", timeZone: tz }).format(new Date(iso));
}
export function dayName(iso, tz, long=true) {
  const p = parseLocalISO(iso);
  if (p) return new Intl.DateTimeFormat("en-US", { weekday:long?"long":"short", timeZone:"UTC" }).format(new Date(Date.UTC(p.year,p.month-1,p.day)));
  return new Intl.DateTimeFormat("en-US", { weekday:long?"long":"short", timeZone:tz }).format(new Date(iso));
}
export function dateLabel(iso, tz) {
  const p = parseLocalISO(iso);
  if (p) return new Intl.DateTimeFormat("en-US", { weekday:"long", month:"long", day:"numeric", year:"numeric", timeZone:"UTC" }).format(new Date(Date.UTC(p.year,p.month-1,p.day)));
  return new Intl.DateTimeFormat("en-US", { weekday:"long", month:"long", day:"numeric", year:"numeric", timeZone:tz }).format(new Date(iso));
}
export function shortDate(iso, tz) {
  const p = parseLocalISO(iso);
  if (p) return new Intl.DateTimeFormat("en-US", { month:"short", day:"numeric", timeZone:"UTC" }).format(new Date(Date.UTC(p.year,p.month-1,p.day)));
  return new Intl.DateTimeFormat("en-US", { month:"short", day:"numeric", timeZone:tz }).format(new Date(iso));
}
export function kmh(v, unit) {
  return `${Math.round(v)} ${unit === "fahrenheit" ? "mph" : "km/h"}`;
}
export function formatDuration(ms) {
  const mins = Math.max(0, Math.round(ms / 60000));
  return `${Math.floor(mins/60)}h ${mins%60}m`;
}
export function aqiStatus(aqi) {
  if (aqi == null) return ["Unavailable",""];
  if (aqi <= 50) return ["Good","good"];
  if (aqi <= 100) return ["Moderate","moderate"];
  if (aqi <= 150) return ["Unhealthy for Sensitive Groups","usg"];
  if (aqi <= 200) return ["Unhealthy","unhealthy"];
  if (aqi <= 300) return ["Very Unhealthy","very"];
  return ["Hazardous","hazardous"];
}
export function setWeatherTheme(code, isDay) {
  document.body.classList.remove("weather-rain","weather-storm","weather-snow");
  if (!isDay) return;
  if ([95,96,99].includes(code)) document.body.classList.add("weather-storm");
  else if ([71,73,75,77,85,86].includes(code)) document.body.classList.add("weather-snow");
  else if ([51,53,55,56,57,61,63,65,66,67,80,81,82].includes(code)) document.body.classList.add("weather-rain");
}
