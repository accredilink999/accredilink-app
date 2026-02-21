/**
 * addressMileage.js — Calculate miles between service user addresses
 *
 * Uses Nominatim (OpenStreetMap) for full-address geocoding, then
 * postcodes.io as fallback for addresses with UK postcodes.
 * No GPS from user devices — purely address-based.
 */

// Cache: address key → { latitude, longitude } | null
const addressCache = new Map();

// Extract UK postcode from an address string
function extractPostcode(address) {
  if (!address) return null;
  const match = address.match(/[A-Z]{1,2}\d{1,2}\s*\d[A-Z]{2}/i);
  return match ? match[0].toUpperCase() : null;
}

// Geocode a single address — tries Nominatim first, postcodes.io fallback
async function geocodeAddress(address) {
  if (!address || address.trim().length < 3) return null;
  const key = address.trim().toLowerCase();
  if (addressCache.has(key)) return addressCache.get(key);

  const clean = address.replace(/,\s*$/, '').replace(/\s+/g, ' ').trim();
  const variants = [clean, clean + ', UK'];
  const parts = clean.split(/,\s*/);
  if (parts.length > 1) {
    for (let i = 1; i < parts.length; i++) {
      variants.push(parts.slice(i).join(', ') + ', UK');
    }
  }
  const postcodeMatch = clean.match(/[A-Z]{1,2}\d{1,2}\s*\d[A-Z]{2}/i);
  if (postcodeMatch) variants.push(postcodeMatch[0]);

  // Try Nominatim
  for (const query of variants) {
    if (query.length < 3) continue;
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=gb`;
      const res = await fetch(url, { headers: { 'User-Agent': 'AccredilinkApp/1.0' } });
      if (!res.ok) continue;
      const results = await res.json();
      if (results && results.length > 0) {
        const coords = { latitude: parseFloat(results[0].lat), longitude: parseFloat(results[0].lon) };
        addressCache.set(key, coords);
        return coords;
      }
    } catch (e) {
      console.warn('Nominatim failed for:', query, e);
    }
    await new Promise(r => setTimeout(r, 1100));
  }

  // Fallback: postcodes.io if address has a UK postcode
  if (postcodeMatch) {
    try {
      const pc = postcodeMatch[0].replace(/\s+/g, '');
      const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(pc)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.status === 200 && data.result) {
          const coords = { latitude: data.result.latitude, longitude: data.result.longitude };
          addressCache.set(key, coords);
          return coords;
        }
      }
    } catch (e) {
      console.warn('postcodes.io failed:', e);
    }
  }

  addressCache.set(key, null);
  return null;
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
 * Resolve coordinates for an array of calls using their service_user_address.
 * Geocodes each unique address (cached), returns calls with resolvedLat/resolvedLng.
 */
export async function resolveCallAddresses(calls) {
  // Geocode unique addresses first (only ~11 service users, so fast)
  const uniqueAddresses = [...new Set(calls.map(c => c.service_user_address).filter(Boolean))];
  for (const addr of uniqueAddresses) {
    await geocodeAddress(addr);
  }

  // Resolve each call from cache
  const results = [];
  for (const call of calls) {
    if (!call.service_user_address) continue;
    const coords = addressCache.get(call.service_user_address.trim().toLowerCase());
    if (coords) {
      results.push({ ...call, resolvedLat: coords.latitude, resolvedLng: coords.longitude });
    }
  }
  return results;
}
