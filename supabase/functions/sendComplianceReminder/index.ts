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

    // Check if user is admin
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { documentId, staffEmail, documentTitle, expiryDate } = await req.json();

    if (!documentId || !staffEmail || !documentTitle || !expiryDate) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Send email reminder
    await supabase.integrations.Core.SendEmail({
      to: staffEmail,
      subject: `Compliance Reminder: ${documentTitle} Expiration`,
      body: `Dear Team Member,\n\nThis is a reminder that the following compliance document is overdue:\n\nDocument: ${documentTitle}\nExpiry Date: ${expiryDate}\n\nPlease take immediate action to renew or update this document.\n\nIf you have already completed this, please contact your administrator.\n\nBest regards,\nCompliance Team`
    });

    return Response.json({ 
      success: true, 
      message: `Reminder sent to ${staffEmail}` 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
