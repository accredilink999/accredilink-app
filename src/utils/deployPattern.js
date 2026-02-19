import { supabase } from '@/api/supabaseClient';
import { ShiftCallApi } from '@/api/rotaApi';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const VER = 'v5';
const BATCH = 50;
const PAGE = 1000;

/** Build tasks array for a shift_call from call_time tasks (string[]) */
function buildTasks(callTime) {
  const tasks = [];
  if (callTime.tasks && Array.isArray(callTime.tasks)) {
    for (const t of callTime.tasks) {
      if (typeof t === 'string') tasks.push({ text: t, completed: false });
      else if (t && t.text) tasks.push({ text: t.text, completed: false });
    }
  }
  return tasks;
}

// ── UK local-time date helpers (noon to avoid BST/GMT midnight edge) ──

/** Day of week from "YYYY-MM-DD" (0=Sun..6=Sat) in local (UK) time */
function localDow(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d, 12).getDay();
}

/** Add N days to "YYYY-MM-DD" → "YYYY-MM-DD" in local (UK) time */
function localAdd(dateStr, days) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d + days, 12); // JS handles month overflow
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

const DOW_NUM = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };

/**
 * Deploy a shift pattern — fill blank shifts with staff assignments.
 *
 * Algorithm (simple forward approach):
 * 1. Generate every target date+time by rolling through the pattern cycle
 * 2. Fetch all blank shifts in the rota area for the date range
 * 3. Match each target to ONE blank shift (by exact date + start_time + end_time)
 * 4. Update matched blanks with staff info
 * 5. Create client calls for filled shifts
 * 6. Auto-pair staff on the same time slot
 */
export async function deployPatternShifts({
  pattern,
  staffId,
  staffName,
  repeatCount,
  patternId,
  areaId: areaIdOverride,
}) {
  toast.info(`Deploy ${VER} starting...`);

  const areaId = areaIdOverride || pattern.rota_area_id;
  if (!areaId) throw new Error('Pattern has no rota area');
  if (!pattern.shifts || pattern.shifts.length === 0) throw new Error('Pattern has no shifts defined');

  const startDate = (pattern.start_date || new Date().toISOString().split('T')[0]).split('T')[0];
  const weeksInCycle =
    pattern.pattern_type === 'weekly' ? 1 :
    pattern.pattern_type === 'two_week' ? 2 :
    pattern.pattern_type === 'three_week' ? 3 : 4;
  const daysPerCycle = weeksInCycle * 7;

  // Anchor = Sunday of start_date's week (UK local time)
  const startDow = localDow(startDate);
  const anchor = localAdd(startDate, -startDow);
  const endDate = localAdd(anchor, daysPerCycle * repeatCount - 1);

  toast.info(`${VER}: ${startDate} to ${endDate} (${repeatCount}x ${weeksInCycle}wk)`);

  // ── Step 1: Generate every target date+time from the pattern ──
  const targets = [];
  for (let cycle = 0; cycle < repeatCount; cycle++) {
    for (const shift of pattern.shifts) {
      const dayNum = DOW_NUM[shift.day_of_week];
      if (dayNum === undefined) {
        console.warn(`[deploy ${VER}] Unknown day: ${shift.day_of_week}`);
        continue;
      }
      // anchor + (cycle * full-cycle-days) + (week-1 * 7) + day-of-week
      const date = localAdd(anchor, cycle * daysPerCycle + (shift.week - 1) * 7 + dayNum);
      if (date < startDate || date > endDate) continue;
      targets.push({ date, start_time: shift.start_time, end_time: shift.end_time });
    }
  }

  console.log(`[deploy ${VER}] ${targets.length} targets. First 10:`, targets.slice(0, 10));
  toast.info(`${VER}: ${targets.length} target slots from pattern`);

  // ── Step 1b: Fix shifts missing shift_name (set from shift_types by times) ──
  {
    const { data: noNameShifts } = await supabase
      .from('shifts')
      .select('id, start_time, end_time')
      .is('shift_name', null)
      .eq('rota_area_id', areaId)
      .gte('date', startDate)
      .lte('date', endDate)
      .limit(2000);

    if (noNameShifts && noNameShifts.length > 0) {
      // Fetch shift types to match by times
      const { data: stTypes } = await supabase.from('shift_types').select('name, start_time, end_time');
      if (stTypes && stTypes.length > 0) {
        const typeMap = {};
        for (const st of stTypes) {
          typeMap[`${st.start_time}|${st.end_time}`] = st.name;
        }
        // Group by matched type for batch updates
        const byName = {};
        for (const s of noNameShifts) {
          const name = typeMap[`${s.start_time}|${s.end_time}`];
          if (name) {
            if (!byName[name]) byName[name] = [];
            byName[name].push(s.id);
          }
        }
        let fixed = 0;
        for (const [name, ids] of Object.entries(byName)) {
          for (let i = 0; i < ids.length; i += BATCH) {
            await supabase.from('shifts').update({ shift_name: name }).in('id', ids.slice(i, i + BATCH));
          }
          fixed += ids.length;
        }
        if (fixed > 0) toast.info(`${VER}: Fixed shift type on ${fixed} shifts`);
      }
    }
  }

  // ── Step 2: Fetch ALL blank shifts in area with a shift_name (paginated) ──
  let blanks = [];
  let offset = 0;
  while (true) {
    const { data, error } = await supabase
      .from('shifts')
      .select('id, date, start_time, end_time, shift_name')
      .is('staff_id', null)
      .not('shift_name', 'is', null)
      .eq('rota_area_id', areaId)
      .gte('date', startDate)
      .lte('date', endDate)
      .range(offset, offset + PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    blanks.push(...data);
    if (data.length < PAGE) break;
    offset += PAGE;
  }

  console.log(`[deploy ${VER}] ${blanks.length} blanks. First 10:`, blanks.slice(0, 10));
  toast.info(`${VER}: ${blanks.length} blank shifts in area`);

  // ── Step 3: Index blanks by "date|start|end" for O(1) lookup ──
  const blanksBySlot = {};
  for (const b of blanks) {
    const key = `${b.date}|${b.start_time}|${b.end_time}`;
    if (!blanksBySlot[key]) blanksBySlot[key] = [];
    blanksBySlot[key].push(b);
  }

  const toFill = [];
  let noMatch = 0;
  for (const target of targets) {
    const key = `${target.date}|${target.start_time}|${target.end_time}`;
    const available = blanksBySlot[key];
    if (available && available.length > 0) {
      toFill.push(available.shift()); // take first available
    } else {
      noMatch++;
      if (noMatch <= 10) {
        console.log(`[deploy ${VER}] No blank for: ${key}`);
      }
    }
  }

  toast.info(`${VER}: ${toFill.length} matched, ${noMatch} unmatched`);

  if (toFill.length === 0) {
    toast.warning(`${VER}: Nothing to fill — 0 matches between ${targets.length} targets and ${blanks.length} blanks`);
    return { filled: 0, calls: 0 };
  }

  // ── Step 4: Batch-update blanks with staff info ──
  for (let i = 0; i < toFill.length; i += BATCH) {
    const batch = toFill.slice(i, i + BATCH);
    const { error } = await supabase
      .from('shifts')
      .update({
        staff_id: staffId,
        staff_name: staffName,
        shift_pattern_id: patternId || pattern.id,
        status: 'scheduled',
      })
      .in('id', batch.map(s => s.id));
    if (error) console.error(`[deploy ${VER}] Update error:`, error);
  }

  // ── Step 5: Create client calls ──
  let totalCalls = 0;
  try {
    const serviceUsers = await base44.entities.ServiceUser.filter({ status: 'active' });
    const areaUsers = serviceUsers.filter(su => (su.rota_area_id || su.area_id) === areaId);

    // Delete existing calls for these shifts first
    const allIds = toFill.map(s => s.id);
    for (let i = 0; i < allIds.length; i += BATCH) {
      await supabase.from('shift_calls').delete().in('shift_id', allIds.slice(i, i + BATCH));
    }

    const callsToCreate = [];
    for (const shift of toFill) {
      for (const su of areaUsers) {
        if (!su.call_times || !Array.isArray(su.call_times)) continue;
        for (const ct of su.call_times) {
          try {
            const [ch, cm] = ct.time.split(':').map(Number);
            const [sh, sm] = shift.start_time.split(':').map(Number);
            const [eh, em] = shift.end_time.split(':').map(Number);
            const callMins = ch * 60 + cm;
            const shiftStartMins = sh * 60 + sm;
            const shiftEndMins = eh * 60 + em;
            const dur = parseInt(ct.duration) || 60;
            if (callMins >= shiftStartMins && callMins + dur <= shiftEndMins) {
              callsToCreate.push({
                shift_id: shift.id,
                service_user_id: su.id,
                service_user_name: su.full_name,
                service_user_address: su.address || '',
                scheduled_time: ct.time,
                call_time: ct.time,
                call_date: shift.date,
                call_type: ct.type || 'visit',
                call_types: ct.types || [ct.type || 'visit'],
                duration_minutes: dur,
                status: 'pending',
                notes: ct.notes || '',
                tasks: buildTasks(ct),
              });
            }
          } catch {}
        }
      }
    }

    if (callsToCreate.length > 0) {
      await ShiftCallApi.bulkCreate(callsToCreate);
      totalCalls = callsToCreate.length;
    }
  } catch (err) {
    console.error(`[deploy ${VER}] Call creation error:`, err);
  }

  // ── Step 6: Auto-pair shifts (same date + time + area = pair) ──
  try {
    const filledDates = [...new Set(toFill.map(s => s.date))].sort();
    if (filledDates.length > 0) {
      let assigned = [];
      let pOff = 0;
      while (true) {
        const { data, error } = await supabase
          .from('shifts')
          .select('id, date, start_time, end_time, staff_id, staff_name')
          .not('staff_id', 'is', null)
          .eq('rota_area_id', areaId)
          .gte('date', filledDates[0])
          .lte('date', filledDates[filledDates.length - 1])
          .range(pOff, pOff + PAGE - 1);
        if (error || !data || data.length === 0) break;
        assigned.push(...data);
        if (data.length < PAGE) break;
        pOff += PAGE;
      }

      const bySlot = {};
      for (const s of assigned) {
        const k = `${s.date}|${s.start_time}|${s.end_time}`;
        if (!bySlot[k]) bySlot[k] = [];
        bySlot[k].push(s);
      }

      const updates = [];
      for (const shifts of Object.values(bySlot)) {
        if (shifts.length === 2) {
          const [a, b] = shifts;
          updates.push(
            supabase.from('shifts').update({ paired_shift_id: b.id, paired_staff_name: b.staff_name }).eq('id', a.id),
            supabase.from('shifts').update({ paired_shift_id: a.id, paired_staff_name: a.staff_name }).eq('id', b.id)
          );
        }
      }
      for (let i = 0; i < updates.length; i += 10) {
        await Promise.all(updates.slice(i, i + 10));
      }
    }
  } catch (err) {
    console.error(`[deploy ${VER}] Pairing error:`, err);
  }

  return { filled: toFill.length, calls: totalCalls };
}

/**
 * Clear previously deployed shifts for a pattern back to blank.
 */
export async function clearPatternShifts({ patternId, staffId, areaId }) {
  const today = new Date().toISOString().split('T')[0];
  let total = 0;
  const partnerIds = new Set(); // collect paired shift IDs so we can clear the other side

  // 1. By shift_pattern_id (only if staff still matches — skip swapped shifts)
  if (patternId) {
    let q = supabase
      .from('shifts')
      .select('id, shift_name, paired_shift_id')
      .eq('shift_pattern_id', patternId)
      .gte('date', today);
    if (staffId) q = q.eq('staff_id', staffId);
    const { data } = await q;

    if (data && data.length > 0) {
      // Collect partner shift IDs before clearing
      for (const s of data) {
        if (s.paired_shift_id) partnerIds.add(s.paired_shift_id);
      }

      const toRevert = data.filter(s => s.shift_name).map(s => s.id);
      const toDelete = data.filter(s => !s.shift_name).map(s => s.id);
      const allIds = data.map(s => s.id);

      for (let i = 0; i < allIds.length; i += BATCH) {
        await supabase.from('shift_calls').delete().in('shift_id', allIds.slice(i, i + BATCH));
      }
      for (let i = 0; i < toRevert.length; i += BATCH) {
        await supabase.from('shifts')
          .update({ staff_id: null, staff_name: null, shift_pattern_id: null, paired_shift_id: null, paired_staff_name: null })
          .in('id', toRevert.slice(i, i + BATCH));
      }
      for (let i = 0; i < toDelete.length; i += BATCH) {
        await supabase.from('shifts').delete().in('id', toDelete.slice(i, i + BATCH));
      }
      total += data.length;
    }
  }

  // 2. Fallback: by staff_id + area
  if (staffId) {
    let q = supabase.from('shifts').select('id, shift_name, paired_shift_id').eq('staff_id', staffId).gte('date', today);
    if (areaId) q = q.eq('rota_area_id', areaId);
    const { data } = await q;

    if (data && data.length > 0) {
      // Collect partner shift IDs before clearing
      for (const s of data) {
        if (s.paired_shift_id) partnerIds.add(s.paired_shift_id);
      }

      // Shifts WITH shift_name = original template slots → revert to blank
      const toRevert = data.filter(s => s.shift_name).map(s => s.id);
      // Shifts WITHOUT shift_name = orphans from old deploy → delete entirely
      const toDelete = data.filter(s => !s.shift_name).map(s => s.id);
      const allIds = data.map(s => s.id);

      for (let i = 0; i < allIds.length; i += BATCH) {
        await supabase.from('shift_calls').delete().in('shift_id', allIds.slice(i, i + BATCH));
      }
      for (let i = 0; i < toRevert.length; i += BATCH) {
        await supabase.from('shifts')
          .update({ staff_id: null, staff_name: null, shift_pattern_id: null, paired_shift_id: null, paired_staff_name: null })
          .in('id', toRevert.slice(i, i + BATCH));
      }
      for (let i = 0; i < toDelete.length; i += BATCH) {
        await supabase.from('shifts').delete().in('id', toDelete.slice(i, i + BATCH));
      }
      total += data.length;
    }
  }

  // 3. Clear pairing on partner shifts (e.g. Agnes no longer shows "paired with Sam")
  if (partnerIds.size > 0) {
    const ids = [...partnerIds];
    for (let i = 0; i < ids.length; i += BATCH) {
      await supabase.from('shifts')
        .update({ paired_shift_id: null, paired_staff_name: null })
        .in('id', ids.slice(i, i + BATCH));
    }
  }

  return total;
}

/**
 * Deploy a single client's call times to all future assigned shifts in their area.
 * Deletes existing future calls for this client first, then re-creates from call_times.
 *
 * @param {Object} opts
 * @param {string} opts.serviceUserId - Service user ID
 * @param {string} opts.serviceUserName - Display name
 * @param {string} opts.serviceUserAddress - Address
 * @param {string} opts.areaId - Rota area ID
 * @param {Array} opts.callTimes - Array of { time, duration, type, types, notes }
 * @returns {Promise<{created: number, deleted: number}>}
 */
export async function deployClientCallsToRota({ serviceUserId, serviceUserName, serviceUserAddress, areaId, callTimes }) {
  if (!areaId || !callTimes || callTimes.length === 0) {
    return { created: 0, deleted: 0 };
  }

  const today = new Date().toISOString().split('T')[0];

  // 1. Delete all future shift_calls for this service user
  let existing = [];
  let offset = 0;
  while (true) {
    const { data, error } = await supabase
      .from('shift_calls')
      .select('id')
      .eq('service_user_id', serviceUserId)
      .gte('call_date', today)
      .range(offset, offset + PAGE - 1);
    if (error || !data || data.length === 0) break;
    existing.push(...data);
    if (data.length < PAGE) break;
    offset += PAGE;
  }

  if (existing.length > 0) {
    const ids = existing.map(c => c.id);
    for (let i = 0; i < ids.length; i += BATCH) {
      await supabase.from('shift_calls').delete().in('id', ids.slice(i, i + BATCH));
    }
  }

  // 2. Fetch all future assigned shifts in this area
  let shifts = [];
  offset = 0;
  while (true) {
    const { data, error } = await supabase
      .from('shifts')
      .select('id, date, start_time, end_time')
      .not('staff_id', 'is', null)
      .eq('rota_area_id', areaId)
      .gte('date', today)
      .range(offset, offset + PAGE - 1);
    if (error || !data || data.length === 0) break;
    shifts.push(...data);
    if (data.length < PAGE) break;
    offset += PAGE;
  }

  // 3. Match call times to shift windows
  const callsToCreate = [];
  for (const shift of shifts) {
    const [sh, sm] = shift.start_time.split(':').map(Number);
    const [eh, em] = shift.end_time.split(':').map(Number);
    const shiftStartMins = sh * 60 + sm;
    const shiftEndMins = eh * 60 + em;

    for (const ct of callTimes) {
      if (!ct.time) continue;
      const [ch, cm] = ct.time.split(':').map(Number);
      const callMins = ch * 60 + cm;
      const dur = parseInt(ct.duration) || 60;

      if (callMins >= shiftStartMins && callMins + dur <= shiftEndMins) {
        callsToCreate.push({
          shift_id: shift.id,
          service_user_id: serviceUserId,
          service_user_name: serviceUserName || '',
          service_user_address: serviceUserAddress || '',
          scheduled_time: ct.time,
          call_time: ct.time,
          call_date: shift.date,
          call_type: ct.type || (ct.types && ct.types[0]) || 'visit',
          call_types: ct.types || [ct.type || 'visit'],
          duration_minutes: dur,
          status: 'pending',
          notes: ct.notes || '',
          tasks: buildTasks(ct),
        });
      }
    }
  }

  // 4. Bulk create
  if (callsToCreate.length > 0) {
    await ShiftCallApi.bulkCreate(callsToCreate);
  }

  return { created: callsToCreate.length, deleted: existing.length };
}
