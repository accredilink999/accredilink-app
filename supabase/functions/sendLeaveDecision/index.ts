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

        if (user?.role !== 'admin' && user?.job_title !== 'admin' && user?.job_title !== 'manager') {
            return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const { leave_request_id, decision, notes } = await req.json();

        if (!['approved', 'rejected'].includes(decision)) {
            return Response.json({ error: 'Invalid decision' }, { status: 400 });
        }

        // Get leave request details
        const leaveRequests = await (async () => { const { data, error } = await supabase.from('leave_requests').select('*'); if (error) throw error; return data || [] })();
        if (!leaveRequests.length) {
            return Response.json({ error: 'Leave request not found' }, { status: 404 });
        }

        const leave = leaveRequests[0];

        // Get staff member's email
        const staff = await (async () => { const { data, error } = await supabaseAdmin.from('profiles').select('*'); if (error) throw error; return data || [] })();
        if (!staff.length) {
            return Response.json({ error: 'Staff member not found' }, { status: 404 });
        }

        const statusColor = decision === 'approved' ? '#10b981' : '#ef4444';
        const statusText = decision === 'approved' ? 'APPROVED' : 'REJECTED';

        // Send email notification
        await supabase.integrations.Core.SendEmail({
            to: staff[0].email,
            subject: `Leave Request ${statusText} - ${leave.type.replace(/_/g, ' ')}`,
            body: `
                <h2 style="color: ${statusColor}">Leave Request ${statusText}</h2>
                <p>Hi ${leave.staff_name},</p>
                <p>Your leave request has been ${decision}.</p>
                <ul>
                    <li><strong>Type:</strong> ${leave.type.replace(/_/g, ' ')}</li>
                    <li><strong>Start Date:</strong> ${leave.start_date}</li>
                    <li><strong>End Date:</strong> ${leave.end_date}</li>
                    ${leave.reason ? `<li><strong>Reason:</strong> ${leave.reason}</li>` : ''}
                </ul>
                ${notes ? `<p><strong>Review Notes:</strong> ${notes}</p>` : ''}
                <p>Reviewed by: ${user.full_name}</p>
                <p>If you have any questions, please contact your supervisor.</p>
                <p>Best regards,<br/>Accredi-Care Team</p>
            `
        });

        return Response.json({ success: true, message: 'Notification sent' });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});
