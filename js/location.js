export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("GEO_UNSUPPORTED"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, error => {
      if (error.code === error.PERMISSION_DENIED) reject(new Error("GEO_DENIED"));
      else if (error.code === error.POSITION_UNAVAILABLE) reject(new Error("GEO_UNAVAILABLE"));
      else if (error.code === error.TIMEOUT) reject(new Error("GEO_TIMEOUT"));
      else reject(new Error("GEO_UNKNOWN"));
    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 });
  });
}
