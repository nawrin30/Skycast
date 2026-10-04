import { geocodeCity, reverseGeocode, getWeather } from "./api.js";
import { getCurrentPosition } from "./location.js";
import { getTheme, setTheme, getUnit, setUnit, getFavorites, isFavorite, toggleFavorite, getRecent, addRecent, removeRecent, clearRecent } from "./storage.js";
import { renderWeather, renderCities, setLoading, showError, clearError } from "./ui.js";
import { setWeatherTheme, timeOnly } from "./utils.js";
import { drawTemperatureChart } from "./chart.js";

const $ = id => document.getElementById(id);
let state = { place:null, data:null, unit:getUnit(), suggestions:[] };
let weatherRefreshTimer = null;
let hourWatcherTimer = null;
let refreshInProgress = false;

document.addEventListener("DOMContentLoaded", init);

async function init(){
  applyTheme();
  startLiveClock();
  updateUnitButton();
  renderLists();
  bindEvents();

  const saved = localStorage.getItem("skycast_last_city");
  const cached = localStorage.getItem("skycast_last_weather");
  let place = null;

  try { place = saved ? JSON.parse(saved) : getDefaultDhaka(); } catch { place = getDefaultDhaka(); }

  // Render cached weather immediately so Live Server does not feel blocked by the API.
  if (place && cached) {
    try {
      const cacheObj = JSON.parse(cached);
      if (cacheObj.place?.latitude === place.latitude && cacheObj.data) {
        state = {...state, place, data: cacheObj.data};
        renderWeather(place, cacheObj.data, state.unit);
        updateFavoriteButton();
        setWeatherTheme(cacheObj.data.current.weather_code, cacheObj.data.current.is_day);
        redrawChart();
      }
    } catch {}
  }

  if (place) {
    // Fetch in the background; do not cover the dashboard with a blocking loader.
    await loadPlace(place, !saved, false);
  }
}

function getDefaultDhaka(){
  return {
    id:"dhaka-default", name:"Dhaka", country:"Bangladesh", admin1:"Dhaka",
    latitude:23.8103, longitude:90.4125, timezone:"Asia/Dhaka"
  };
}
function bindEvents(){
  $("searchForm").addEventListener("submit", e=>{e.preventDefault(); search($("citySearch").value.trim());});
  $("citySearch").addEventListener("input", async e=>{
    const q=e.target.value.trim(); $("searchForm").classList.toggle("has-value",!!q);
    if(q.length<2){hideSuggestions();return;}
    try{
      const results=await geocodeCity(q); state.suggestions=results; showSuggestions(results.slice(0,5));
    }catch{hideSuggestions();}
  });
  $("clearSearch").onclick=()=>{$("citySearch").value="";$("searchForm").classList.remove("has-value");hideSuggestions();$("citySearch").focus();};
  document.addEventListener("click", e=>{
    if(!e.target.closest(".search-form")) hideSuggestions();
  });
  $("locationBtn").onclick=useLocation;
  $("favoriteBtn").onclick=()=>{
    if(!state.place)return;
    const added=toggleFavorite(state.place); updateFavoriteButton(); renderLists(); toast(added?"Added to favorites":"Removed from favorites");
  };
  $("unitBtn").onclick=async()=>{
    state.unit=state.unit==="celsius"?"fahrenheit":"celsius"; setUnit(state.unit); updateUnitButton();
    if(state.place) await loadPlace(state.place,false,false);
  };
  $("themeBtn").onclick=()=>{const next=document.documentElement.dataset.theme==="dark"?"light":"dark"; setTheme(next); applyTheme(); redrawChart();};
  $("clearHistory").onclick=()=>{clearRecent();renderLists();toast("Recent searches cleared");};
  $("shareBtn").onclick=shareWeather;
  window.addEventListener("resize",()=>redrawChart());
  $("favorites").addEventListener("click", cityListHandler);
  $("recentSearches").addEventListener("click", recentHandler);
}

async function search(query){
  if(!query){toast("Type a city name first");return;}
  hideSuggestions(); setLoading(true);
  try{
    const results=await geocodeCity(query);
    if(!results.length) throw new Error("CITY_NOT_FOUND");
    showSuggestions(results.slice(0,5)); await loadPlace(results[0]);
    $("citySearch").value="";
    $("searchForm").classList.remove("has-value");
  }catch(e){showFriendlyError(e);}
  finally{setLoading(false);}
}
async function loadPlace(place, save=true, blocking=true){
  if (blocking) setLoading(true);
  clearError();
  try{
    const data=await getWeather(place,state.unit);
    state={...state,place,data};
    localStorage.setItem("skycast_last_weather", JSON.stringify({place, data, cachedAt: Date.now()}));
    if(save){addRecent(place);localStorage.setItem("skycast_last_city",JSON.stringify(place));renderLists();}
    renderWeather(place,data,state.unit);
    updateFavoriteButton();
    setWeatherTheme(data.current.weather_code, data.current.is_day);
    redrawChart();
    scheduleWeatherRefresh();
  }catch(e){showFriendlyError(e);}
  finally{setLoading(false);}
}
async function useLocation(){
  setLoading(true);
  try{
    const pos=await getCurrentPosition();
    const place=await reverseGeocode(pos.coords.latitude,pos.coords.longitude);
    await loadPlace(place);
  }catch(e){showFriendlyError(e);}
  finally{setLoading(false);}
}
function startLiveClock(){
  const tick = () => {
    if (!state.data?.timezone) return;
    const now = new Date();
    const dateText = new Intl.DateTimeFormat("en-US", {
      weekday:"long", month:"long", day:"numeric", year:"numeric",
      timeZone: state.data.timezone
    }).format(now);
    const timeText = new Intl.DateTimeFormat("en-US", {
      hour:"numeric", minute:"2-digit", second:"2-digit",
      timeZone: state.data.timezone
    }).format(now);

    const dateEl = $("currentDate");
    if (dateEl) dateEl.textContent = `${dateText} • ${timeText}`;
    const updatedEl = $("updatedTime");
    if (updatedEl) updatedEl.textContent = timeText;

    // Re-render the time-sensitive forecast at the beginning of each minute.
    // This makes the highlighted "Now" hour follow the real city clock.
    if (now.getSeconds() === 0 && state.place && state.data) {
      renderWeather(state.place, state.data, state.unit);
      redrawChart();
    }
  };
  tick();
  setInterval(tick, 1000);
}

function scheduleWeatherRefresh(){
  clearTimeout(weatherRefreshTimer);
  clearTimeout(hourWatcherTimer);
  if (!state.place) return;

  // Refresh real API data every 10 minutes while the dashboard is open.
  weatherRefreshTimer = setTimeout(() => refreshWeather(false), 5 * 60 * 1000);

  // Also refresh shortly after the city's next local hour begins, so the
  // highlighted hourly forecast/current values follow the clock.
  const now = new Date();
  const nextHour = new Date(now.getTime() + 60 * 1000);
  nextHour.setSeconds(5, 0);
  nextHour.setMinutes(0);
  if (nextHour <= now) nextHour.setHours(nextHour.getHours() + 1);
  hourWatcherTimer = setTimeout(() => refreshWeather(false), Math.max(1000, nextHour - now));
}

async function refreshWeather(showLoader=false){
  if (!state.place || refreshInProgress) return;
  refreshInProgress = true;
  if (showLoader) setLoading(true);
  try {
    const data = await getWeather(state.place, state.unit);
    state.data = data;
    localStorage.setItem("skycast_last_weather", JSON.stringify({place: state.place, data, cachedAt: Date.now()}));
    renderWeather(state.place, data, state.unit);
    setWeatherTheme(data.current.weather_code, data.current.is_day);
    redrawChart();
    scheduleWeatherRefresh();
  } catch(e) {
    showFriendlyError(e);
  } finally {
    refreshInProgress = false;
    if (showLoader) setLoading(false);
  }
}

function showFriendlyError(e){
  const messages={
    CITY_NOT_FOUND:"City not found. Please check the spelling and try another city.",
    GEO_DENIED:"Location access was denied. You can search for your city manually.",
    GEO_UNAVAILABLE:"Your location is currently unavailable. Please search manually.",
    GEO_TIMEOUT:"Location request timed out. Please try again.",
    GEO_UNSUPPORTED:"Geolocation is not supported by this browser.",
  };
  showError(messages[e.message]||"Unable to connect to the weather service. Please check your internet connection and try again.");
}
function showSuggestions(items){
  const box=$("suggestions");
  box.innerHTML="";
  if(!items.length){hideSuggestions();return;}
  items.forEach((p,i)=>{
    const b=document.createElement("button"); b.className="suggestion"; b.type="button";
    b.textContent=`${p.name}${p.admin1?`, ${p.admin1}`:""}${p.country?`, ${p.country}`:""}`;
    b.onclick=()=>loadPlace(p).then(()=>{hideSuggestions();$("citySearch").value="";$("searchForm").classList.remove("has-value");});
    box.append(b);
  });
  box.hidden=false;
}
function hideSuggestions(){$("suggestions").hidden=true;}
function updateFavoriteButton(){ $("favoriteBtn").textContent=state.place&&isFavorite(state.place)?"★":"☆"; }
function updateUnitButton(){ $("unitBtn").textContent=state.unit==="celsius"?"°C":"°F"; }
function renderLists(){
  renderCities("favorites",getFavorites(),{remove:true});
  renderCities("recentSearches",getRecent(),{remove:true});
}
async function cityListHandler(e){
  const open=e.target.closest(".city-open"), remove=e.target.closest(".city-remove");
  if(remove){const id=remove.dataset.id;toggleFavorite(getFavorites().find(x=>x.id===id));renderLists();updateFavoriteButton();return;}
  if(open){const city=getFavorites().find(x=>x.id===open.dataset.id);if(city)await loadPlace(city);}
}
async function recentHandler(e){
  const remove=e.target.closest(".city-remove"), open=e.target.closest(".city-open");
  if(remove){removeRecent(remove.dataset.id);renderLists();return;}
  if(open){const city=getRecent().find(x=>x.id===open.dataset.id);if(city)await loadPlace(city);}
}
function applyTheme(){
  let theme=getTheme();
  if(!theme) theme=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";
  document.documentElement.dataset.theme=theme;
  $("themeBtn").textContent=theme==="dark"?"☀":"☾";
}
function redrawChart(){
  if(!state.data)return;
  const tz=state.data.timezone;
  const currentIdx = state.data.hourly.time ? state.data.hourly.time.findIndex(t => t.slice(0,13) === new Intl.DateTimeFormat("en-CA", {timeZone:tz,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",hourCycle:"h23"}).format(new Date()).slice(0,13)) : 0;
  const start = currentIdx >= 0 ? currentIdx : 0;
  const times=state.data.hourly.time.slice(start,start+24), vals=state.data.hourly.temperature_2m.slice(start,start+24);
  const labels=times.map(t=>timeOnly(t, tz));
  drawTemperatureChart($("tempChart"),labels,vals,state.unit,document.documentElement.dataset.theme==="dark");
}
async function shareWeather(){
  if(!state.place||!state.data)return;
  const c=state.data.current;
  const condition=state.data.current.weather_code;
  const text=`🌦️ SkyCast\n\n${state.place.name}, ${state.place.country}\n${Math.round(c.temperature_2m)}°${state.unit==="celsius"?"C":"F"}\nWeather code: ${condition}\n\nHumidity: ${Math.round(c.relative_humidity_2m)}%\nWind: ${Math.round(c.wind_speed_10m)} ${state.unit==="celsius"?"km/h":"mph"}\n\nUpdated: ${c.time}`;
  try{
    if(navigator.share) await navigator.share({title:"SkyCast Weather",text});
    else {await navigator.clipboard.writeText(text);toast("Weather summary copied to clipboard");}
  }catch(e){if(e.name!=="AbortError")toast("Could not share weather");}
}
let toastTimer;
function toast(msg){const el=$("toast");el.textContent=msg;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),2600);}
