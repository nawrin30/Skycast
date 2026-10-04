import { weather, temp, timeOnly, dayName, dateLabel, shortDate, kmh, formatDuration, aqiStatus } from "./utils.js";

const $ = id => document.getElementById(id);

export function setLoading(on) {
  $("globalStatus").hidden = !on;
  $("globalStatus").textContent = on ? "Loading weather data…" : "";
}

export function showError(message) {
  $("globalStatus").hidden = false;
  $("globalStatus").textContent = message;
}
export function clearError() { $("globalStatus").hidden = true; }

export function renderWeather(place, data, unit) {
  const tz = data.timezone;
  const c = data.current;
  const info = weather(c.weather_code);
  $("locationName").textContent = `${place.name}${place.country ? ", " + place.country : ""}`;
  $("currentDate").textContent = `${dateLabel(c.time, tz)}`;
  $("currentIcon").textContent = info[1];
  $("currentTemp").textContent = temp(c.temperature_2m, unit);
  $("currentCondition").textContent = info[0];
  $("feelsLike").textContent = `Feels like ${temp(c.apparent_temperature, unit)}`;
  $("minTemp").textContent = temp(data.daily.temperature_2m_min[0], unit);
  $("maxTemp").textContent = temp(data.daily.temperature_2m_max[0], unit);
  $("updatedTime").textContent = timeOnly(c.time, tz);
  $("humidity").textContent = `${Math.round(c.relative_humidity_2m)}%`;
  $("wind").textContent = kmh(c.wind_speed_10m, unit);
  $("pressure").textContent = `${Math.round(c.surface_pressure)} hPa`;
  const idx = currentLocalHourIndex(data.hourly.time, tz);
  $("visibility").textContent = `${Math.round((data.hourly.visibility[idx] || 0)/1000)} km`;
  $("uv").textContent = Number(data.hourly.uv_index[idx] ?? data.daily.uv_index_max[0] ?? 0).toFixed(1);
  $("cloud").textContent = `${Math.round(c.cloud_cover)}%`;
  renderHourly(data, unit, tz, idx);
  renderDaily(data, unit, tz);
  renderPrecip(data, tz, idx);
  renderAir(data.air);
  renderSun(data);
  renderAlerts();
}

function currentLocalHourIndex(times, tz) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz, year:"numeric", month:"2-digit", day:"2-digit", hour:"2-digit", hourCycle:"h23"
  }).formatToParts(new Date());
  const map = Object.fromEntries(parts.filter(p => p.type !== "literal").map(p => [p.type, p.value]));
  const key = `${map.year}-${map.month}-${map.day}T${map.hour}:00`;
  let exact = times.findIndex(t => t.slice(0,13) === key.slice(0,13));
  if (exact >= 0) return exact;

  // Fallback: choose the closest hourly timestamp by calendar-hour string.
  const nowHour = Date.UTC(+map.year, +map.month-1, +map.day, +map.hour);
  let best=0, diff=Infinity;
  times.forEach((t,i)=>{
    const m=t.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):/);
    if(!m) return;
    const d=Date.UTC(+m[1],+m[2]-1,+m[3],+m[4]);
    const delta=Math.abs(d-nowHour);
    if(delta<diff){diff=delta;best=i;}
  });
  return best;
}

function renderHourly(data, unit, tz, currentIdx) {
  const start=currentIdx, end=Math.min(data.hourly.time.length,start+18);
  $("hourlyForecast").innerHTML="";
  for(let i=start;i<end;i++){
    const info=weather(data.hourly.weather_code[i]);
    const rain=Math.round(data.hourly.precipitation_probability[i] ?? 0);
    const div=document.createElement("div");
    div.className=`hour-card ${i===currentIdx?"current":""}`;
    div.innerHTML=`<div class="hour-time">${i===currentIdx?"Now":timeOnly(data.hourly.time[i],tz)}</div>
      <div class="hour-icon">${info[1]}</div><div class="hour-temp">${temp(data.hourly.temperature_2m[i],unit)}</div>
      <div class="hour-rain">💧 ${rain}%</div>`;
    $("hourlyForecast").append(div);
  }
}

function renderDaily(data, unit, tz) {
  $("dailyForecast").innerHTML="";
  data.daily.time.forEach((iso,i)=>{
    const info=weather(data.daily.weather_code[i]);
    const rain=Math.round(data.daily.precipitation_probability_max[i] ?? 0);
    const d=document.createElement("div");
    d.className="daily-item";
    d.innerHTML=`<div><b>${i===0?"Today":dayName(iso,tz,false)}</b><br><span class="muted">${shortDate(iso,tz)}</span></div>
      <div class="daily-icon">${info[1]}</div><div class="muted">${info[0]}</div>
      <div class="daily-temps">${temp(data.daily.temperature_2m_max[i],unit)} / ${temp(data.daily.temperature_2m_min[i],unit)}<br><span class="rain-pill">💧 ${rain}%</span></div>`;
    $("dailyForecast").append(d);
  });
}

function renderPrecip(data,tz,idx){
  $("precipitation").innerHTML="";
  for(let i=idx;i<Math.min(idx+7,data.hourly.time.length);i++){
    const p=Math.round(data.hourly.precipitation_probability[i] ?? 0);
    const row=document.createElement("div"); row.className="precip-row";
    row.innerHTML=`<span>${timeOnly(data.hourly.time[i],tz)}</span><div class="progress"><span style="width:${p}%"></span></div><b>${p}%</b>`;
    $("precipitation").append(row);
  }
}

function renderAir(air){
  const el=$("airQuality");
  if(!air?.current){el.innerHTML='<div class="empty">Air quality data is unavailable for this location.</div>';return;}
  const a=air.current, [status]=aqiStatus(a.us_aqi);
  el.innerHTML=`<div class="aqi-main"><div class="aqi-number">${Math.round(a.us_aqi ?? 0)}</div><div class="aqi-status">${status}</div><span class="muted">US AQI</span></div>
    ${poll("PM2.5",a.pm2_5,"µg/m³")}${poll("PM10",a.pm10,"µg/m³")}${poll("CO",a.carbon_monoxide,"µg/m³")}${poll("NO₂",a.nitrogen_dioxide,"µg/m³")}${poll("O₃",a.ozone,"µg/m³")}`;
}
function poll(name,value,unit){return `<div class="pollutant"><span>${name}</span><b>${value == null ? "--" : Number(value).toFixed(1)} ${unit}</b></div>`;}

function renderSun(data){
  const tz=data.timezone, rise=data.daily.sunrise[0], set=data.daily.sunset[0];
  $("sunrise").textContent=timeOnly(rise,tz); $("sunset").textContent=timeOnly(set,tz);
  $("daylightDuration").textContent=`Daylight ${formatDuration(new Date(set)-new Date(rise))}`;
  const nowParts = new Intl.DateTimeFormat("en-US", {timeZone:tz, hour:"2-digit", minute:"2-digit", hourCycle:"h23"}).formatToParts(new Date());
  const nowMap = Object.fromEntries(nowParts.filter(p=>p.type!=="literal").map(p=>[p.type,p.value]));
  const nowMin = Number(nowMap.hour)*60 + Number(nowMap.minute);
  const parseHM = value => { const m=String(value).match(/T(\d{2}):(\d{2})/); return m ? Number(m[1])*60+Number(m[2]) : 0; };
  const riseMin=parseHM(rise), setMin=parseHM(set);
  const pct=Math.max(0,Math.min(100,(nowMin-riseMin)/Math.max(1,setMin-riseMin)*100));
  $("daylightProgress").style.width=`${pct}%`;
  $("daylightStatus").textContent=nowMin>=riseMin&&nowMin<=setMin?"Daylight":"Night";
}
function renderAlerts(){
  $("alerts").className="alert-box";
  $("alerts").innerHTML="<div><strong>✓ No active weather alerts</strong><br><span class='muted'>This weather source does not provide official global alert feeds.</span></div>";
}

export function renderCities(containerId, items, options={}){
  const el=$(containerId); el.innerHTML="";
  if(!items.length){el.innerHTML='<div class="empty">No cities saved yet.</div>';return;}
  items.forEach(city=>{
    const row=document.createElement("div"); row.className="city-item";
    row.innerHTML=`<button class="city-open small-btn" data-id="${city.id}" title="Open weather"><div class="city-info"><span>📍</span><div><div class="city-name">${escapeHTML(city.name)}</div><div class="city-meta">${escapeHTML(city.country||city.admin1||"")}</div></div></div></button>
      <div class="city-actions">${options.remove ? `<button class="city-remove small-btn" data-id="${city.id}" title="Remove">×</button>`:""}</div>`;
    el.append(row);
  });
}
function escapeHTML(v){return String(v).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
