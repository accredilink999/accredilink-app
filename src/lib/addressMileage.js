/**
 * addressMileage.js — Calculate miles between service user postcodes
 *
 * Uses postcodes.io (free UK postcode API) to get coordinates,
 * then haversine formula to calculate distance in miles.
 * No GPS from user devices — purely postcode-based.
 */

// Cache: postcode → { latitude, longitude }
const postcodeCache = new Map();

// Bulk lookup postcodes via postcodes.io (up to 100 per request)
async function bulkLookupPostcodes(postcodes) {
  const toFetch = [...new Set(postcodes)]
    .map(p => p.trim().toUpperCase())
    .filter(p => p && !postcodeCache.has(p));

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
            postcodeCache.set(r.query.toUpperCase(), {
              latitude: r.result.latitude,
              longitude: r.result.longitude,
            });
          }
        }
      }
    } catch (e) {
      console.warn('Bulk postcode lookup failed:', e);
    }
  }
}

// Haversine distance in miles
export function haversineMiles(lat1, lon1, lat2, lon2) {
  const R = 3959;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Resolve coordinates for an array of calls.
 * Each call should have service_user_address set to a UK postcode.
 * Returns array of { ...call, resolvedLat, resolvedLng }.
 */
export async function resolveCallAddresses(calls) {
  const postcodes = calls
    .map(c => c.service_user_address)
    .filter(Boolean)
    .map(p => p.trim().toUpperCase());

  if (postcodes.length > 0) {
    await bulkLookupPostcodes(postcodes);
  }

  const results = [];
  for (const call of calls) {
    if (!call.service_user_address) continue;
    const pc = call.service_user_address.trim().toUpperCase();
    const coords = postcodeCache.get(pc);
    if (coords) {
      results.push({ ...call, resolvedLat: coords.latitude, resolvedLng: coords.longitude });
    }
  }
  return results;
}
