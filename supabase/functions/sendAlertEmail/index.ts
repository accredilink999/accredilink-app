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

    const { title, content, recipientEmails, priority } = await req.json();

    if (!title || !content || !recipientEmails) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const emailPromises = recipientEmails.map(email =>
      supabaseAdmin.integrations.Core.SendEmail({
        to: email,
        subject: `${priority === 'urgent' ? 'ðŸš¨ URGENT: ' : 'ðŸ”” '}${title}`,
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: ${priority === 'urgent' ? '#fee2e2' : '#f0fdfa'}; padding: 20px; border-radius: 8px; border-left: 4px solid ${priority === 'urgent' ? '#dc2626' : '#14b8a6'};">
              <h2 style="color: ${priority === 'urgent' ? '#991b1b' : '#115e59'}; margin: 0 0 16px 0;">${title}</h2>
              <div style="color: #334155; line-height: 1.6; white-space: pre-wrap;">
                ${content}
              </div>
            </div>
            <p style="color: #64748b; font-size: 12px; margin-top: 20px;">
              This is an automated alert from Accredi-Care AI Assistant. Please log in to the system to take action.
            </p>
          </div>
        `,
        from_name: 'Accredi-Care AI Assistant'
      })
    );

    await Promise.all(emailPromises);

    return Response.json({ 
      success: true, 
      message: `Email sent to ${recipientEmails.length} recipient(s)` 
    });
  } catch (error) {
    console.error('Error sending alert email:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
