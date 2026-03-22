/**
 * useGeolocation.ts
 *
 * Standalone composable – drop into any Vue 3 / Ionic page.
 *
 * What it does
 * ────────────
 *  • Fetches the device's GPS coordinates via @capacitor/geolocation
 *  • Reverse-geocodes to a city name via Nominatim (free, no API key)
 *  • Fetches current weather via Open-Meteo (free, no API key)
 *
 * What it does NOT do
 * ───────────────────
 *  • Nothing related to motion / shake detection
 *  • No localStorage – that's left to the caller
 *
 * Usage
 * ─────
 *  import { useGeolocation } from './useGeolocation';
 *
 *  const { fetchLocationData, loading, error, locationData } = useGeolocation();
 *
 *  // Call whenever you want a fresh reading:
 *  const data = await fetchLocationData();
 *  //  data = { lat, lng, cityName, weatherText, weatherTemp, isDayTime }
 *  //  Returns null if location or network fails (error.value is set).
 *
 * Returned reactive refs
 * ──────────────────────
 *  loading      – true while the async chain is running
 *  error        – string | null, last error message
 *  locationData – the last successful GeoResult, or null
 */

import { ref } from 'vue';
import { Geolocation } from '@capacitor/geolocation';

// ── Types ──────────────────────────────────────────────────────────────────

export interface GeoResult {
  lat: number;
  lng: number;
  cityName: string | null;      // e.g. "Rapperswil"  (null if reverse-geocode failed)
  weatherText: string | null;   // e.g. "Partly cloudy"
  weatherTemp: number | null;   // °C, rounded
  isDayTime: boolean | null;    // true = day, false = night
}

// ── WMO weather-code → human-readable label ────────────────────────────────

const WMO_CODES: Record<number, string> = {
  0:  'Clear sky',
  1:  'Mainly clear',    2: 'Partly cloudy',   3: 'Overcast',
  45: 'Foggy',          48: 'Icy fog',
  51: 'Light drizzle',  53: 'Drizzle',         55: 'Heavy drizzle',
  61: 'Light rain',     63: 'Rain',            65: 'Heavy rain',
  71: 'Light snow',     73: 'Snow',            75: 'Heavy snow',   77: 'Snow grains',
  80: 'Light showers',  81: 'Showers',         82: 'Violent showers',
  85: 'Snow showers',   86: 'Heavy snow showers',
  95: 'Thunderstorm',   96: 'Thunderstorm w/ hail', 99: 'Thunderstorm w/ heavy hail',
};

// ── Composable ─────────────────────────────────────────────────────────────

export function useGeolocation() {
  const loading      = ref(false);
  const error        = ref<string | null>(null);
  const locationData = ref<GeoResult | null>(null);

  /**
   * Runs the full chain: GPS → reverse-geocode → weather.
   * Returns a GeoResult on success, or null on failure.
   */
  async function fetchLocationData(): Promise<GeoResult | null> {
    loading.value = true;
    error.value   = null;

    try {
      // 1. GPS coordinates
      const pos = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10_000,
      });
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      // 2. City name via Nominatim (reverse geocoding, free, no key)
      let cityName: string | null = null;
      try {
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
          { headers: { 'Accept-Language': 'en', 'User-Agent': 'TacTicApp/1.0' } }
        );
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          // Prefer town > city > village > county as city label
          cityName =
            geoData.address?.town   ??
            geoData.address?.city   ??
            geoData.address?.village ??
            geoData.address?.county ??
            geoData.display_name?.split(',')[0] ??
            null;
        }
      } catch {
        // Reverse-geocode failing is non-fatal; cityName stays null
      }

      // 3. Current weather via Open-Meteo (free, no key, CORS-enabled)
      let weatherText: string | null = null;
      let weatherTemp: number | null = null;
      let isDayTime:   boolean | null = null;
      try {
        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast` +
          `?latitude=${lat}&longitude=${lng}` +
          `&current=temperature_2m,weather_code,is_day` +
          `&temperature_unit=celsius&forecast_days=1`
        );
        if (weatherRes.ok) {
          const wData = await weatherRes.json();
          const cur   = wData.current;
          weatherTemp = Math.round(cur.temperature_2m);
          weatherText = WMO_CODES[cur.weather_code] ?? `Code ${cur.weather_code}`;
          isDayTime   = cur.is_day === 1;
        }
      } catch {
        // Weather failing is non-fatal; weather fields stay null
      }

      const result: GeoResult = { lat, lng, cityName, weatherText, weatherTemp, isDayTime };
      locationData.value = result;
      return result;

    } catch (e: any) {
      // GPS itself failed – this IS fatal
      error.value = e?.message ?? 'Location unavailable';
      return null;
    } finally {
      loading.value = false;
    }
  }

  return {
    loading,
    error,
    locationData,
    fetchLocationData,
  };
}