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

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { shift_id } = await req.json();

        // Get shift details
        const shift = await (async () => { const { data, error } = await supabase.from('shifts').select('*'); if (error) throw error; return data || [] })();
        if (!shift.length) {
            return Response.json({ error: 'Shift not found' }, { status: 404 });
        }

        const shiftData = shift[0];

        // Send reminder email
        await supabase.integrations.Core.SendEmail({
            to: user.email,
            subject: `Shift Reminder - ${shiftData.service_user_name}`,
            body: `
                <h2>Upcoming Shift Reminder</h2>
                <p>Hi ${shiftData.staff_name},</p>
                <p>This is a reminder for your upcoming shift:</p>
                <ul>
                    <li><strong>Service User:</strong> ${shiftData.service_user_name}</li>
                    <li><strong>Date:</strong> ${shiftData.date}</li>
                    <li><strong>Time:</strong> ${shiftData.start_time} - ${shiftData.end_time}</li>
                </ul>
                <p>Please ensure you arrive on time and have all necessary equipment.</p>
                <p>Best regards,<br/>Accredi-Care Team</p>
            `
        });

        return Response.json({ success: true, message: 'Reminder sent' });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});
