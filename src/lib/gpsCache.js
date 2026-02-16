import { supabase } from '@/api/supabaseClient';

/**
 * Fetch average historical GPS coordinates for a list of service users.
 * Uses all past shift_calls where checkin_latitude is not null.
 * Returns a Map of serviceUserId → { latitude, longitude }.
 */
export async function getServiceUserLocations(serviceUserIds) {
  if (!serviceUserIds || serviceUserIds.length === 0) return new Map();

  const uniqueIds = [...new Set(serviceUserIds.filter(Boolean))];
  if (uniqueIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from('shift_calls')
    .select('service_user_id, checkin_latitude, checkin_longitude')
    .in('service_user_id', uniqueIds)
    .not('checkin_latitude', 'is', null)
    .not('checkin_longitude', 'is', null);

  if (error || !data) return new Map();

  // Group by service_user_id and compute average lat/lng
  const grouped = {};
  for (const row of data) {
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

  return result;
}

/**
 * Given an array of calls (drove_to_call=true), enrich each with coordinates.
 * Uses real GPS if available, falls back to historical average.
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

      return null; // No coordinates available at all
    })
    .filter(Boolean);
}
