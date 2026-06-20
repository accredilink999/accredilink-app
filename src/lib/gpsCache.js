import { supabase } from '@/api/supabaseClient';

// Re-export mileage utilities
export { resolveCallAddresses, haversineMiles } from './addressMileage';

// Cache: postcode → { latitude, longitude }
const postcodeLocationCache = new Map();

function median(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/**
 * Fetch coordinates for a list of service user IDs.
 * 1. Postcodes from service_users table → postcodes.io (fast bulk)
 * 2. Historical GPS check-in coords from shift_calls (median, robust to outliers)
 * 3. Geocode address fallbacks via Nominatim (last resort)
 * Returns Map<service_user_id, { latitude, longitude }>.
 */
export async function getServiceUserLocations(serviceUserIds, addressFallbacks) {
  if (!serviceUserIds || serviceUserIds.length === 0) return new Map();

  const uniqueIds = [...new Set(serviceUserIds.filter(Boolean))];
  if (uniqueIds.length === 0) return new Map();

  const result = new Map();

  // ── Step 1: Postcodes from service_users → postcodes.io ──
  try {
    const { data: serviceUsers } = await supabase
      .from('service_users')
      .select('id, postcode')
      .in('id', uniqueIds);

    const postcodeById = new Map();
    for (const su of (serviceUsers || [])) {
      const pc = (su.postcode || '').trim().toUpperCase();
      if (pc) postcodeById.set(su.id, pc);
    }

    const uniquePostcodes = [...new Set(postcodeById.values())];
    const toFetch = uniquePostcodes.filter(pc => !postcodeLocationCache.has(pc));

    for (let i = 0; i < toFetch.length; i += 100) {
      const batch = toFetch.slice(i, i + 100);
      try {
        const res = await fetch('https://api.postcodes.io/postcodes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postcodes: batch }),
        });
        if (!res.ok) continue;
        const data = await res.json();
        if (data.status === 200 && data.result) {
          for (const r of data.result) {
            if (r.result && r.result.latitude && r.result.longitude) {
              postcodeLocationCache.set(r.query.toUpperCase(), {
                latitude: r.result.latitude,
                longitude: r.result.longitude,
              });
            }
          }
        }
      } catch (e) {
        console.warn('Postcode lookup failed:', e);
      }
    }

    for (const id of uniqueIds) {
      const pc = postcodeById.get(id);
      if (pc && postcodeLocationCache.has(pc)) {
        result.set(id, postcodeLocationCache.get(pc));
      }
    }
  } catch (e) {
    console.warn('Postcode step failed:', e);
  }

  // ── Step 2: Fill gaps from GPS check-in history (median coords) ──
  const missing = uniqueIds.filter(id => !result.has(id));
  if (missing.length > 0) {
    try {
      const { data: gpsData } = await supabase
        .from('shift_calls')
        .select('service_user_id, checkin_latitude, checkin_longitude')
        .in('service_user_id', missing)
        .not('checkin_latitude', 'is', null)
        .not('checkin_longitude', 'is', null);

      const grouped = {};
      for (const row of (gpsData || [])) {
        const id = row.service_user_id;
        if (!grouped[id]) grouped[id] = { lats: [], lngs: [] };
        grouped[id].lats.push(parseFloat(row.checkin_latitude));
        grouped[id].lngs.push(parseFloat(row.checkin_longitude));
      }

      for (const [id, coords] of Object.entries(grouped)) {
        result.set(id, { latitude: median(coords.lats), longitude: median(coords.lngs) });
      }
    } catch (e) {
      console.warn('GPS history step failed:', e);
    }
  }

  // ── Step 3: Geocode remaining missing via Nominatim ──
  const stillMissing = uniqueIds.filter(id => !result.has(id));
  if (stillMissing.length > 0 && addressFallbacks instanceof Map) {
    for (const id of stillMissing) {
      const address = addressFallbacks.get(id);
      if (!address) continue;
      const coords = await geocodeAddress(address);
      if (coords) result.set(id, coords);
      // Nominatim rate limit: 1 req/sec
      if (stillMissing.indexOf(id) < stillMissing.length - 1) {
        await new Promise(r => setTimeout(r, 1100));
      }
    }
  }

  return result;
}

// In-memory geocode cache
const geocodeCache = new Map();

async function geocodeAddress(address) {
  if (!address || address.trim().length < 5) return null;
  const cacheKey = address.trim().toLowerCase();
  if (geocodeCache.has(cacheKey)) return geocodeCache.get(cacheKey);

  const clean = address.replace(/,\s*$/, '').trim();
  const parts = clean.split(/,\s*/);
  const variants = [clean];
  for (let i = 1; i < parts.length; i++) {
    variants.push(parts.slice(i).join(', '));
  }
  const postcodeMatch = clean.match(/[A-Z]{1,2}\d{1,2}\s*\d[A-Z]{2}/i);
  if (postcodeMatch) variants.push(postcodeMatch[0]);

  for (const query of variants) {
    if (query.length < 3) continue;
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=gb&limit=1`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'AccredilinkApp/1.0' },
      });
      if (!res.ok) continue;
      const results = await res.json();
      if (results && results.length > 0) {
        const coords = {
          latitude: parseFloat(results[0].lat),
          longitude: parseFloat(results[0].lon),
        };
        geocodeCache.set(cacheKey, coords);
        return coords;
      }
    } catch (e) {
      console.warn('Geocode failed for:', query, e);
    }
    if (variants.indexOf(query) < variants.length - 1) {
      await new Promise(r => setTimeout(r, 1100));
    }
  }

  geocodeCache.set(cacheKey, null);
  return null;
}

export function resolveCallCoordinates() { return []; }
