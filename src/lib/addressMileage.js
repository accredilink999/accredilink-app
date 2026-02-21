/**
 * addressMileage.js — Calculate miles between service user addresses
 *
 * Uses postcodes.io (free UK postcode API) to get coordinates from postcodes,
 * then haversine formula to calculate distance in miles.
 * No GPS from user devices — purely address-based.
 */

// Cache: postcode → { latitude, longitude }
const postcodeCache = new Map();

// Extract UK postcode from an address string
function extractPostcode(address) {
  if (!address) return null;
  const match = address.match(/[A-Z]{1,2}\d{1,2}\s*\d[A-Z]{2}/i);
  return match ? match[0].replace(/\s+/g, ' ').toUpperCase() : null;
}

// Look up a single postcode via postcodes.io
async function lookupPostcode(postcode) {
  const key = postcode.toUpperCase().replace(/\s+/g, '');
  if (postcodeCache.has(key)) return postcodeCache.get(key);

  try {
    const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(key)}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status === 200 && data.result) {
      const coords = { latitude: data.result.latitude, longitude: data.result.longitude };
      postcodeCache.set(key, coords);
      return coords;
    }
  } catch (e) {
    console.warn('Postcode lookup failed:', postcode, e);
  }
  return null;
}

// Bulk lookup postcodes via postcodes.io (up to 100 per request)
async function bulkLookupPostcodes(postcodes) {
  const toFetch = [...new Set(postcodes)]
    .map(p => p.toUpperCase().replace(/\s+/g, ''))
    .filter(p => !postcodeCache.has(p));

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
            postcodeCache.set(r.query.toUpperCase().replace(/\s+/g, ''), {
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
 * Resolve coordinates for an array of calls using their service_user_address.
 * Extracts postcodes from addresses, looks them up via postcodes.io.
 * Returns array of { ...call, resolvedLat, resolvedLng } (only calls with resolved coords).
 */
export async function resolveCallAddresses(calls) {
  // Extract postcodes from all addresses
  const postcodeMap = {}; // address key → postcode
  const postcodes = [];
  for (const call of calls) {
    if (!call.service_user_address) continue;
    const pc = extractPostcode(call.service_user_address);
    if (pc) {
      postcodeMap[call.service_user_address.trim().toLowerCase()] = pc;
      postcodes.push(pc);
    }
  }

  // Bulk lookup all postcodes
  if (postcodes.length > 0) {
    await bulkLookupPostcodes(postcodes);
  }

  // Resolve each call
  const results = [];
  for (const call of calls) {
    if (!call.service_user_address) continue;
    const pc = postcodeMap[call.service_user_address.trim().toLowerCase()];
    if (!pc) continue;
    const coords = postcodeCache.get(pc.toUpperCase().replace(/\s+/g, ''));
    if (coords) {
      results.push({ ...call, resolvedLat: coords.latitude, resolvedLng: coords.longitude });
    }
  }
  return results;
}
