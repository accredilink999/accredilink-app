import { supabase } from '@/api/supabaseClient';

/**
 * Fetch average historical GPS coordinates for a list of service users.
 * Uses all past shift_calls where checkin_latitude is not null.
 * Returns a Map of serviceUserId → { latitude, longitude }.
 *
 * If addressFallbacks is provided (Map of id → address string),
 * any IDs not found in GPS history will be geocoded via Nominatim.
 */
export async function getServiceUserLocations(serviceUserIds, addressFallbacks) {
  if (!serviceUserIds || serviceUserIds.length === 0) return new Map();

  const uniqueIds = [...new Set(serviceUserIds.filter(Boolean))];
  if (uniqueIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from('shift_calls')
    .select('service_user_id, checkin_latitude, checkin_longitude')
    .in('service_user_id', uniqueIds)
    .not('checkin_latitude', 'is', null)
    .not('checkin_longitude', 'is', null);

  if (error) console.warn('GPS cache query error:', error);

  // Group by service_user_id and compute average lat/lng
  const grouped = {};
  for (const row of (data || [])) {
    const id = row.service_user_id;
    if (!grouped[id]) grouped[id] = { lats: [], lngs: [] };
    grouped[id].lats.push(parseFloat(row.checkin_latitude));
    grouped[id].lngs.push(parseFloat(row.checkin_longitude));
  }

  const result = new Map();
  for (const [id, coords] of Object.entries(grouped)) {
    const avgLat = coords.lats.reduce((a, b) => a + b, 0) / coords.lats.length;
    const avgLng = coords.lngs.reduce((a, b) => a + b, 0) / coords.lngs.length;
    result.set(id, { latitude: avgLat, longitude: avgLng });
  }

  // Geocode any missing IDs via Nominatim if address fallbacks provided
  if (addressFallbacks && addressFallbacks instanceof Map) {
    const missing = uniqueIds.filter(id => !result.has(id) && addressFallbacks.has(id));
    for (const id of missing) {
      const address = addressFallbacks.get(id);
      if (!address) continue;
      const coords = await geocodeAddress(address);
      if (coords) {
        result.set(id, coords);
      }
      // Rate limit: 1 req/sec for Nominatim
      if (missing.indexOf(id) < missing.length - 1) {
        await new Promise(r => setTimeout(r, 1100));
      }
    }
  }

  return result;
}

/**
 * Geocode an address string to { latitude, longitude } using OpenStreetMap Nominatim.
 * Free, no API key required. Rate limited to 1 request per second.
 */
export async function geocodeAddress(address) {
  if (!address || address.trim().length < 5) return null;
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'AccredilinkApp/1.0' },
    });
    if (!res.ok) return null;
    const results = await res.json();
    if (results && results.length > 0) {
      return {
        latitude: parseFloat(results[0].lat),
        longitude: parseFloat(results[0].lon),
      };
    }
  } catch (e) {
    console.warn('Geocode failed for:', address, e);
  }
  return null;
}

/**
 * Given an array of calls, enrich each with coordinates.
 * Uses real GPS if available, falls back to historical average / geocoded location.
 * Returns array of { ...call, resolvedLat, resolvedLng } (only calls with coordinates).
 */
export function resolveCallCoordinates(calls, locationCache) {
  return calls
    .map(call => {
      const lat = call.checkin_latitude ? parseFloat(call.checkin_latitude) : null;
      const lng = call.checkin_longitude ? parseFloat(call.checkin_longitude) : null;

      if (lat && lng) {
        return { ...call, resolvedLat: lat, resolvedLng: lng };
      }

      // Fallback to cached location
      const cached = locationCache.get(call.service_user_id);
      if (cached) {
        return { ...call, resolvedLat: cached.latitude, resolvedLng: cached.longitude };
      }

      return null;
    })
    .filter(Boolean);
}
