import { createClient } from 'npm:@supabase/supabase-js@2';


const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
Deno.serve(async (req) => {
  try {
      if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } })
  }
  const authHeader = req.headers.get('Authorization') || ''
  const supabase = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authHeader } } })
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
  const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()
  if (authError || !currentUser) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const user = currentUser;

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const results = {};
    const serviceUsers = await (async () => { const { data, error } = await supabaseAdmin.from('service_users').select('*').order('created_at', { ascending: false }).limit(1000); if (error) throw error; return data || [] })();
    
    // Create name-to-ID mapping
    const nameToNewId = {};
    serviceUsers.forEach(su => {
      const normalizedName = su.full_name.trim().toLowerCase();
      nameToNewId[normalizedName] = su.id;
    });

    // Fix CareLog
    const careLogs = await (async () => { const { data, error } = await supabaseAdmin.from('care_logs').select('*').order('created_at', { ascending: false }).limit(1000); if (error) throw error; return data || [] })();
    let careLogUpdates = 0;
    for (const log of careLogs) {
      const newId = nameToNewId[log.service_user_name?.trim().toLowerCase()];
      if (newId && newId !== log.service_user_id) {
        await (async () => { const { data, error } = await supabaseAdmin.from('care_logs').update({ service_user_id: newId }).eq('id', log.id).select().single(); if (error) throw error; return data })();
        careLogUpdates++;
      }
    }
    results.careLogs = { updatedCount: careLogUpdates };

    // Fix MedicationAdministration
    const medAdmin = await (async () => { const { data, error } = await supabaseAdmin.from('medication_administrations').select('*').order('created_at', { ascending: false }).limit(1000); if (error) throw error; return data || [] })();
    let medAdminUpdates = 0;
    for (const log of medAdmin) {
      const newId = nameToNewId[log.service_user_name?.trim().toLowerCase()];
      if (newId && newId !== log.service_user_id) {
        await (async () => { const { data, error } = await supabaseAdmin.from('medication_administrations').update({ service_user_id: newId }).eq('id', log.id).select().single(); if (error) throw error; return data })();
        medAdminUpdates++;
      }
    }
    results.medicationAdministration = { updatedCount: medAdminUpdates };

    // Fix MedicationRecord
    const medRecords = await (async () => { const { data, error } = await supabaseAdmin.from('medication_records').select('*').order('created_at', { ascending: false }).limit(1000); if (error) throw error; return data || [] })();
    let medRecordUpdates = 0;
    for (const record of medRecords) {
      const newId = nameToNewId[record.service_user_name?.trim().toLowerCase()];
      if (newId && newId !== record.service_user_id) {
        await (async () => { const { data, error } = await supabaseAdmin.from('medication_records').update({ service_user_id: newId }).eq('id', record.id).select().single(); if (error) throw error; return data })();
        medRecordUpdates++;
      }
    }
    results.medicationRecords = { updatedCount: medRecordUpdates };

    // Fix ShiftCall
    const shiftCalls = await (async () => { const { data, error } = await supabaseAdmin.from('shift_calls').select('*').order('created_at', { ascending: false }).limit(1000); if (error) throw error; return data || [] })();
    let shiftCallUpdates = 0;
    for (const call of shiftCalls) {
      const newId = nameToNewId[call.service_user_name?.trim().toLowerCase()];
      if (newId && newId !== call.service_user_id) {
        await (async () => { const { data, error } = await supabaseAdmin.from('shift_calls').update({ service_user_id: newId }).eq('id', call.id).select().single(); if (error) throw error; return data })();
        shiftCallUpdates++;
      }
    }
    results.shiftCalls = { updatedCount: shiftCallUpdates };

    // Fix ClientCall
    const clientCalls = await (async () => { const { data, error } = await supabaseAdmin.from('client_calls').select('*').order('created_at', { ascending: false }).limit(1000); if (error) throw error; return data || [] })();
    let clientCallUpdates = 0;
    for (const call of clientCalls) {
      const newId = nameToNewId[call.service_user_name?.trim().toLowerCase()];
      if (newId && newId !== call.service_user_id) {
        await (async () => { const { data, error } = await supabaseAdmin.from('client_calls').update({ service_user_id: newId }).eq('id', call.id).select().single(); if (error) throw error; return data })();
        clientCallUpdates++;
      }
    }
    results.clientCalls = { updatedCount: clientCallUpdates };

    return Response.json({
      success: true,
      completedAt: new Date().toISOString(),
      totalUpdates: careLogUpdates + medAdminUpdates + medRecordUpdates + shiftCallUpdates + clientCallUpdates,
      results
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
