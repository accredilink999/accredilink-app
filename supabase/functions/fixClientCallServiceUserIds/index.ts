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

    // Get all client calls and service users
    const clientCalls = await (async () => { const { data, error } = await supabaseAdmin.from('client_calls').select('*').order('created_at', { ascending: false }).limit(1000); if (error) throw error; return data || [] })();
    const serviceUsers = await (async () => { const { data, error } = await supabaseAdmin.from('service_users').select('*').order('created_at', { ascending: false }).limit(1000); if (error) throw error; return data || [] })();

    // Create name-to-ID mapping from current service users
    const nameToNewId = {};
    serviceUsers.forEach(user => {
      const normalizedName = user.full_name.trim().toLowerCase();
      nameToNewId[normalizedName] = user.id;
    });

    // Extract unique old IDs with their names
    const oldIdToNewId = {};
    const updates = [];

    clientCalls.forEach(call => {
      const oldId = call.service_user_id;
      const oldName = call.service_user_name?.trim() || '';
      
      if (oldId && !oldIdToNewId[oldId]) {
        const normalizedOldName = oldName.toLowerCase();
        const newId = nameToNewId[normalizedOldName];
        
        if (newId) {
          oldIdToNewId[oldId] = newId;
        }
      }
    });

    // Update all client calls with correct service user IDs
    for (const call of clientCalls) {
      const oldId = call.service_user_id;
      const newId = oldIdToNewId[oldId];
      
      if (newId && newId !== oldId) {
        updates.push({
          id: call.id,
          oldId,
          newId,
          name: call.service_user_name
        });

        await (async () => { const { data, error } = await supabaseAdmin.from('client_calls').update({
          service_user_id: newId
        }).eq('id', call.id).select().single(); if (error) throw error; return data })();
      }
    }

    return Response.json({
      success: true,
      mappings: oldIdToNewId,
      updatedCount: updates.length,
      updates
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
