/**
 * shiftCallAutoAssign.js — Shared utility for auto-assigning service user calls to shifts.
 *
 * Extracted from CreateShiftModal so it can be reused for shift claim approval.
 */

export function timeToMinutes(t) {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
}

/**
 * Find service user calls that fall within a shift's time window for a given area.
 *
 * @param {Array} serviceUsers - All service users (with call_times arrays)
 * @param {string} areaId - Rota area ID to match
 * @param {string} startTime - Shift start time "HH:MM"
 * @param {string} endTime - Shift end time "HH:MM"
 * @returns {Array} Matching call objects ready for ShiftCall creation
 */
export function getMatchingCallsForShift(serviceUsers, areaId, startTime, endTime) {
  if (!serviceUsers?.length || !startTime || !endTime) return [];
  if (!areaId || areaId === 'default') return [];

  const shiftStart = timeToMinutes(startTime);
  const shiftEnd = timeToMinutes(endTime);
  const calls = [];

  for (const su of serviceUsers) {
    if (!su.call_times || su.call_times.length === 0) continue;
    if (su.status !== 'active') continue;
    // Match on any area field — handles legacy area_id vs rota_area_id inconsistency
    const suAreaIds = [su.area_id, su.rota_area_id].filter(Boolean);
    if (!suAreaIds.includes(areaId)) continue;

    for (const ct of su.call_times) {
      const callStart = timeToMinutes(ct.time);
      const callDuration = parseInt(ct.duration) || 30;
      const callEnd = callStart + callDuration;
      if (callStart >= shiftStart && callStart < shiftEnd) {
        const types = (ct.types && Array.isArray(ct.types)) ? ct.types : (ct.type ? [ct.type] : ['Visit']);
        calls.push({
          service_user_id: su.id,
          service_user_name: su.full_name,
          service_user_address: su.address,
          scheduled_time: ct.time,
          duration_minutes: callDuration,
          call_type: types[0] || 'Visit',
          call_types: types,
          notes: ct.notes || '',
        });
      }
    }
  }
  return calls;
}
