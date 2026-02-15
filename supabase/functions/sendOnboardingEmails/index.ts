import { createClient } from 'npm:@supabase/supabase-js@2';
import { sendEmail } from '../_shared/sendEmail.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all unsent emails whose scheduled_at has passed
    const now = new Date().toISOString();
    const { data: pendingEmails, error: fetchError } = await supabaseAdmin
      .from('scheduled_onboarding_emails')
      .select('*')
      .eq('sent', false)
      .lte('scheduled_at', now)
      .order('created_at', { ascending: true });

    if (fetchError) throw fetchError;

    if (!pendingEmails || pendingEmails.length === 0) {
      return jsonResponse({ message: 'No pending emails to send', sent: 0 });
    }

    let sentCount = 0;
    const errors: string[] = [];

    for (const email of pendingEmails) {
      try {
        await sendEmail({
          to: email.email,
          subject: email.subject,
          body: email.html_body.replace(/<[^>]*>/g, ''), // plain text fallback
          html: email.html_body,
        });

        await supabaseAdmin
          .from('scheduled_onboarding_emails')
          .update({ sent: true, sent_at: new Date().toISOString() })
          .eq('id', email.id);

        sentCount++;
      } catch (err) {
        const errMsg = `Failed to send to ${email.email}: ${err.message}`;
        console.error(errMsg);
        errors.push(errMsg);

        await supabaseAdmin
          .from('scheduled_onboarding_emails')
          .update({ error: err.message })
          .eq('id', email.id);
      }
    }

    return jsonResponse({
      message: `Sent ${sentCount} of ${pendingEmails.length} emails`,
      sent: sentCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    return jsonResponse({ error: error.message }, 500);
  }
});
