import { createClient } from 'npm:@supabase/supabase-js@2'
import { sendEmail } from '../_shared/sendEmail.ts';


const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
Deno.serve(async (req) => {
  try {
    // Handle requests without JSON body (from scheduled automations)
    let body = {};
    if (req.body) {
      try {
        body = await req.json();
      } catch {
        // No JSON body provided
      }
    }

      if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } })
  }
  const authHeader = req.headers.get('Authorization') || ''
  const supabase = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authHeader } } })
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
  const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()
  if (authError || !currentUser) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Get all admin users for notification
    const allUsers = await (async () => { const { data, error } = await supabaseAdmin.from('profiles').select('*').order('created_at', { ascending: false }).limit(1000); if (error) throw error; return data || [] })();
    const adminUsers = allUsers.filter(u => u.role === 'admin');

    if (adminUsers.length === 0) {
      return Response.json({ error: 'No admin users found' }, { status: 400 });
    }

    // Get all service users with upcoming or overdue care plan reviews
    const serviceUsers = await (async () => { const { data, error } = await supabaseAdmin.from('service_users').select('*'); if (error) throw error; return data || [] })();

    const today = new Date();
    const upcomingDays = 14; // Remind for reviews in next 14 days
    const upcomingDate = new Date(today);
    upcomingDate.setDate(upcomingDate.getDate() + upcomingDays);

    let remindersSent = 0;

    for (const serviceUser of serviceUsers) {
      if (!serviceUser.plan_review_date) continue;

      const reviewDate = new Date(serviceUser.plan_review_date);
      const isOverdue = reviewDate < today;
      const isUpcoming = reviewDate <= upcomingDate && reviewDate >= today;

      if (isOverdue || isUpcoming) {
        const status = isOverdue ? 'OVERDUE' : 'UPCOMING';
        const emailBody = isOverdue 
          ? `The care plan review for ${serviceUser.full_name} is OVERDUE as of ${serviceUser.plan_review_date}.\n\nPlease complete the review immediately.`
          : `The care plan review for ${serviceUser.full_name} is due on ${serviceUser.plan_review_date}.\n\nPlease schedule and complete the review.`;

        for (const admin of adminUsers) {
          await supabase.integrations.Core.SendEmail({
            to: admin.email,
            subject: `[${status}] Care Plan Review Reminder - ${serviceUser.full_name}`,
            body: emailBody
          });
        }

        remindersSent++;
      }
    }

    return Response.json({ 
      success: true, 
      remindersSent 
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
