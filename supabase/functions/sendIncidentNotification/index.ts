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

        const { incident_id } = await req.json();

        // Get incident details
        const incidents = await (async () => { const { data, error } = await supabase.from('incidents').select('*'); if (error) throw error; return data || [] })();
        if (!incidents.length) {
            return Response.json({ error: 'Incident not found' }, { status: 404 });
        }

        const incident = incidents[0];

        // Get all admin users
        const allUsers = await (async () => { const { data, error } = await supabaseAdmin.from('profiles').select('*').order('created_at', { ascending: false }).limit(1000); if (error) throw error; return data || [] })();
        const admins = allUsers.filter(u => u.role === 'admin' || u.job_title === 'admin' || u.job_title === 'manager');

        // Send notification to all admins
        for (const admin of admins) {
            await supabase.integrations.Core.SendEmail({
                to: admin.email,
                subject: `New Incident Reported - ${incident.severity.toUpperCase()} Priority`,
                body: `
                    <h2>New Incident Report</h2>
                    <p>A new incident has been reported:</p>
                    <ul>
                        <li><strong>Title:</strong> ${incident.title}</li>
                        <li><strong>Type:</strong> ${incident.type}</li>
                        <li><strong>Severity:</strong> ${incident.severity}</li>
                        <li><strong>Service User:</strong> ${incident.service_user_name || 'N/A'}</li>
                        <li><strong>Reported By:</strong> ${incident.reported_by_name}</li>
                        <li><strong>Date:</strong> ${incident.incident_date}</li>
                    </ul>
                    <p><strong>Description:</strong></p>
                    <p>${incident.description}</p>
                    ${incident.cqc_notifiable ? '<p style="color: red;"><strong>âš ï¸ CQC Notifiable</strong></p>' : ''}
                    <p>Please review and take appropriate action.</p>
                    <p>Best regards,<br/>Accredi-Care System</p>
                `
            });
        }

        return Response.json({ success: true, message: 'Notifications sent to admins', count: admins.length });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});
