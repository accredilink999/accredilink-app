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
    const { event, data } = await req.json();

    if (event.type !== 'create' || event.entity_name !== 'Message') {
      return Response.json({ success: true });
    }

    const message = data;

    // Only send emails for announcements and direct messages, not weather warnings
    if (message.type === 'weather_warning') {
      return Response.json({ success: true });
    }

    // Get all active staff
    const staff = await (async () => { const { data, error } = await supabaseAdmin.from('profiles').select('*').order('created_at', { ascending: false }).limit(1000); if (error) throw error; return data || [] })();
    const activeStaff = staff.filter(s => s.is_active !== false && s.id !== message.sender_id);

    if (activeStaff.length === 0) {
      return Response.json({ success: true });
    }

    // Determine email subject and body based on message type
    let subject = '';
    let body = '';

    if (message.type === 'announcement') {
      subject = `New Announcement: ${message.title || 'Important Update'}`;
      body = `
You have received a new announcement from ${message.sender_name}:

Title: ${message.title || 'No title'}
Priority: ${message.priority || 'normal'}

Message:
${message.content}

Please acknowledge this announcement in the system.
      `.trim();
    } else if (message.type === 'direct') {
      subject = `New Message from ${message.sender_name}`;
      body = `
You have received a new message from ${message.sender_name}:

${message.content}
      `.trim();
    }

    // Send emails to all staff
    const emailPromises = activeStaff.map(staffMember => {
      return supabase.integrations.Core.SendEmail({
        to: staffMember.email,
        subject: subject,
        body: body
      }).catch(error => {
        console.error(`Failed to send email to ${staffMember.email}:`, error.message);
        return null;
      });
    });

    await Promise.all(emailPromises);

    return Response.json({ success: true, emailsSent: activeStaff.length });
  } catch (error) {
    console.error('Error sending message emails:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
