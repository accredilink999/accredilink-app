/**
 * gpsCache.js — Simple address-based geocoding for mileage calculation
 *
 * Every call has a service_user_address. We geocode the address to lat/lng
 * and cache it in memory so we only geocode each unique address once per session.
 */

// In-memory cache: address string → { latitude, longitude }
const geocodeCache = new Map();

/**
 * Geocode an address string to { latitude, longitude } using OpenStreetMap Nominatim.
 * Results are cached in memory to avoid re-geocoding the same address.
 */
export async function geocodeAddress(address) {
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
  if (postcodeMatch) {
    variants.push(postcodeMatch[0]);
  }

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

/**
 * Resolve coordinates for an array of calls using their service_user_address.
 * Returns array of { ...call, resolvedLat, resolvedLng } (only calls with resolved coords).
 */
export async function resolveCallAddresses(calls) {
  const results = [];
  // Batch geocode unique addresses first
  const uniqueAddresses = [...new Set(calls.map(c => c.service_user_address).filter(Boolean))];
  for (const addr of uniqueAddresses) {
    await geocodeAddress(addr);
  }
  // Now resolve each call from cache
  for (const call of calls) {
    if (!call.service_user_address) continue;
    const coords = geocodeCache.get(call.service_user_address.trim().toLowerCase());
    if (coords) {
      results.push({ ...call, resolvedLat: coords.latitude, resolvedLng: coords.longitude });
    }
  }
  return results;
}

// Keep old exports for backwards compat during transition (unused but won't break imports)
export async function getServiceUserLocations() { return new Map(); }
export function resolveCallCoordinates(calls) { return []; }
