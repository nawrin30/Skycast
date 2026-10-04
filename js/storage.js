const KEYS = {
  theme: "skycast_theme",
  favorites: "skycast_favorites",
  recent: "skycast_recent_searches",
  lastCity: "skycast_last_city",
  unit: "skycast_unit"
};

const read = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
};
const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));

export function getTheme() { return localStorage.getItem(KEYS.theme); }
export function setTheme(theme) { localStorage.setItem(KEYS.theme, theme); }

export function getUnit() { return localStorage.getItem(KEYS.unit) || "celsius"; }
export function setUnit(unit) { localStorage.setItem(KEYS.unit, unit); }

export function getFavorites() { return read(KEYS.favorites, []); }
export function isFavorite(city) {
  return getFavorites().some(x => x.id === city.id || (x.name === city.name && x.country === city.country));
}
export function toggleFavorite(city) {
  const items = getFavorites();
  const index = items.findIndex(x => x.id === city.id || (x.name === city.name && x.country === city.country));
  if (index >= 0) items.splice(index, 1); else items.unshift(city);
  write(KEYS.favorites, items.slice(0, 12));
  return index < 0;
}

export function getRecent() { return read(KEYS.recent, []); }
export function addRecent(city) {
  const items = getRecent().filter(x => !(x.id === city.id || (x.name === city.name && x.country === city.country)));
  items.unshift(city);
  write(KEYS.recent, items.slice(0, 8));
}
export function removeRecent(id) {
  write(KEYS.recent, getRecent().filter(x => x.id !== id));
}
export function clearRecent() { localStorage.removeItem(KEYS.recent); }
export { KEYS };
