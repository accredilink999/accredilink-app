import { createClient } from 'npm:@supabase/supabase-js@2'
import { sendEmail } from '../_shared/sendEmail.ts';


const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
Deno.serve(async (req) => {
    try {
        // Validate webhook with shared secret
        const url = new URL(req.url);
        const secret = url.searchParams.get('secret');
        
        if (secret !== Deno.env.get('WEBHOOK_SECRET')) {
            return Response.json({ error: 'Invalid webhook secret' }, { status: 403 });
        }

          if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } })
  }
  const authHeader = req.headers.get('Authorization') || ''
  const supabase = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authHeader } } })
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
  const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()
  if (authError || !currentUser) return Response.json({ error: 'Unauthorized' }, { status: 401 });
        const { event_type, data } = await req.json();

        switch (event_type) {
            case 'shift_reminder':
                // Handle shift reminder webhook
                const shifts = await (async () => { const { data, error } = await supabaseAdmin.from('shifts').select('*'); if (error) throw error; return data || [] })();

                for (const shift of shifts) {
                    // Send reminder to staff
                    const staff = await (async () => { const { data, error } = await supabaseAdmin.from('profiles').select('*'); if (error) throw error; return data || [] })();
                    if (staff.length) {
                        await supabaseAdmin.integrations.Core.SendEmail({
                            to: staff[0].email,
                            subject: 'Shift Reminder - Today',
                            body: `
                                <h2>Shift Reminder</h2>
                                <p>Hi ${shift.staff_name},</p>
                                <p>You have a shift today:</p>
                                <ul>
                                    <li><strong>Service User:</strong> ${shift.service_user_name}</li>
                                    <li><strong>Time:</strong> ${shift.start_time} - ${shift.end_time}</li>
                                </ul>
                                <p>Best regards,<br/>Accredi-Care Team</p>
                            `
                        });
                    }
                }
                return Response.json({ success: true, processed: shifts.length });

            case 'training_expiry':
                // Handle training expiry webhook
                const expiringTraining = await (async () => { const { data, error } = await supabaseAdmin.from('trainings').select('*'); if (error) throw error; return data || [] })();

                for (const training of expiringTraining) {
                    const staff = await (async () => { const { data, error } = await supabaseAdmin.from('profiles').select('*'); if (error) throw error; return data || [] })();
                    if (staff.length) {
                        await supabaseAdmin.integrations.Core.SendEmail({
                            to: staff[0].email,
                            subject: 'Training Expiring Soon',
                            body: `
                                <h2>Training Renewal Required</h2>
                                <p>Hi ${training.staff_name},</p>
                                <p>Your ${training.training_name} training is expiring soon on ${training.expiry_date}.</p>
                                <p>Please arrange for renewal training as soon as possible.</p>
                                <p>Best regards,<br/>Accredi-Care Team</p>
                            `
                        });
                    }
                }
                return Response.json({ success: true, processed: expiringTraining.length });

            default:
                return Response.json({ error: 'Unknown event type' }, { status: 400 });
        }
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});
