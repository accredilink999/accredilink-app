import { createClient } from 'npm:@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const url = new URL(req.url);
  const mode = url.searchParams.get('mode') || 'debug';
  const staffName = url.searchParams.get('name') || '';

  // Step 1: List ALL distinct staff on shifts
  const { data: allShifts, error: e1 } = await supabase
    .from('shifts')
    .select('staff_id, staff_name')
    .not('staff_id', 'is', null)
    .limit(10000);

  if (e1) return new Response(JSON.stringify({ error: e1.message }), { status: 500 });

  // Unique staff on shifts
  const staffMap: Record<string, { id: string; count: number }> = {};
  for (const s of (allShifts || [])) {
    const name = s.staff_name || 'Unknown';
    if (!staffMap[name]) staffMap[name] = { id: s.staff_id, count: 0 };
    staffMap[name].count++;
  }

  // Step 2: Get all users from users table
  const { data: allUsers } = await supabase.from('users').select('id, full_name');
  const userIds = new Set((allUsers || []).map(u => u.id));
  const userNames = new Set((allUsers || []).map(u => (u.full_name || '').toLowerCase()));

  // Step 3: Also check profiles table
  const { data: allProfiles } = await supabase.from('profiles').select('id, full_name');
  const profileIds = new Set((allProfiles || []).map(p => p.id));

  // Find staff on shifts who don't exist in users OR profiles
  const orphaned: Array<{ name: string; id: string; shiftCount: number; inUsers: boolean; inProfiles: boolean }> = [];
  for (const [name, info] of Object.entries(staffMap)) {
    const inUsers = userIds.has(info.id);
    const inProfiles = profileIds.has(info.id);
    if (!inUsers || !inProfiles) {
      orphaned.push({ name, id: info.id, shiftCount: info.count, inUsers, inProfiles });
    }
  }

  if (mode === 'debug') {
    return new Response(JSON.stringify({
      allStaffOnShifts: Object.entries(staffMap).map(([name, info]) => ({
        name, staffId: info.id, shiftCount: info.count,
        existsInUsers: userIds.has(info.id),
        existsInProfiles: profileIds.has(info.id),
      })),
      orphanedStaff: orphaned,
      totalUsers: allUsers?.length,
      totalProfiles: allProfiles?.length,
    }, null, 2));
  }

  // mode=clean — actually clean up
  // If a specific name is provided, only clean that person
  let targetIds: string[] = [];
  if (staffName) {
    const lower = staffName.toLowerCase();
    for (const [name, info] of Object.entries(staffMap)) {
      if (name.toLowerCase().includes(lower)) {
        targetIds.push(info.id);
      }
    }
  } else {
    targetIds = orphaned.map(o => o.id);
  }

  if (targetIds.length === 0) {
    return new Response(JSON.stringify({ message: 'No matching staff to clean up', staffName }));
  }

  // Get all shifts for target staff
  let shiftsToClean: any[] = [];
  for (const tid of targetIds) {
    const { data } = await supabase
      .from('shifts')
      .select('id, shift_name, paired_shift_id, date, staff_name')
      .eq('staff_id', tid)
      .limit(5000);
    if (data) shiftsToClean.push(...data);
  }

  const cleanedNames = [...new Set(shiftsToClean.map(s => s.staff_name).filter(Boolean))];
  const shiftIds = shiftsToClean.map(s => s.id);
  const partnerIds = shiftsToClean.filter(s => s.paired_shift_id).map(s => s.paired_shift_id);

  const BATCH = 50;

  // Delete shift_calls
  for (let i = 0; i < shiftIds.length; i += BATCH) {
    await supabase.from('shift_calls').delete().in('shift_id', shiftIds.slice(i, i + BATCH));
  }

  // Revert template shifts to blank
  const toRevert = shiftsToClean.filter(s => s.shift_name).map(s => s.id);
  for (let i = 0; i < toRevert.length; i += BATCH) {
    await supabase.from('shifts')
      .update({
        staff_id: null, staff_name: null, shift_pattern_id: null,
        paired_shift_id: null, paired_staff_name: null,
        is_base_shift: true, status: 'available',
      })
      .in('id', toRevert.slice(i, i + BATCH));
  }

  // Delete orphan shifts (no template)
  const toDelete = shiftsToClean.filter(s => !s.shift_name).map(s => s.id);
  for (let i = 0; i < toDelete.length; i += BATCH) {
    await supabase.from('shifts').delete().in('id', toDelete.slice(i, i + BATCH));
  }

  // Clear pairings
  if (partnerIds.length > 0) {
    for (let i = 0; i < partnerIds.length; i += BATCH) {
      await supabase.from('shifts')
        .update({ paired_shift_id: null, paired_staff_name: null })
        .in('id', partnerIds.slice(i, i + BATCH));
    }
  }

  // Delete shift_patterns
  for (const tid of targetIds) {
    await supabase.from('shift_patterns').delete().eq('staff_id', tid);
  }

  return new Response(JSON.stringify({
    message: 'Cleanup complete',
    cleanedStaff: cleanedNames,
    shiftsReverted: toRevert.length,
    shiftsDeleted: toDelete.length,
    pairingsCleared: partnerIds.length,
  }));
});
