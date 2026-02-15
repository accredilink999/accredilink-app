import { createClient } from 'npm:@supabase/supabase-js@2'
import { sendEmail } from '../_shared/sendEmail.ts';


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

    const { staffEmail, staffName, trainingTitle, expiryDate } = await req.json();

    await sendEmail({
      to: staffEmail,
      subject: `Training Reminder: ${trainingTitle}`,
      body: `Hi ${staffName},\n\nThis is a reminder that your training "${trainingTitle}" expires on ${expiryDate}.\n\nPlease complete the required training in the Training section of your app.\n\nThank you,\nAccredi-Care Team`
    });

    // Update reminder sent status
    const record = await (async () => { const { data, error } = await supabase.from('training_matrix_records').select('*'); if (error) throw error; return data || [] })();

    if (record.length > 0) {
      await (async () => { const { data, error } = await supabase.from('training_matrix_records').update({
        reminder_sent: true,
        reminder_sent_date: new Date().toISOString().split('T')[0]
      }).eq('id', record[0].id).select().single(); if (error) throw error; return data })();
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
