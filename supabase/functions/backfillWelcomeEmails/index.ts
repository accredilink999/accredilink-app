/**
 * backfillWelcomeEmails
 * One-time function to send welcome emails to all trial org owners
 * who signed up via the app and didn't receive a welcome email.
 * Requires a valid authenticated user session (admin only via org check).
 */
import { createClient } from 'npm:@supabase/supabase-js@2';
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

async function sendWelcomeEmail(to: string, firstName: string) {
  const smtpPass = Deno.env.get('CARECALLAI_SMTP_PASS') || '';
  if (!smtpPass) { console.error('SMTP not configured'); return false; }
  const client = new SMTPClient({
    connection: { hostname: 'smtp.ionos.co.uk', port: 465, tls: true, auth: { username: 'hello@carecallai.co.uk', password: smtpPass } },
  });

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
<tr><td style="background:#0d9488;padding:30px 40px;text-align:center;">
  <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">Welcome to CareCallAI</h1>
  <p style="margin:8px 0 0;color:#ccfbf1;font-size:14px;">Your all-in-one care management platform</p>
</td></tr>
<tr><td style="padding:40px;">
  <p style="margin:0 0 20px;color:#1e293b;font-size:16px;line-height:1.6;">Hi <strong>${firstName}</strong>,</p>
  <p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.7;">Thank you for signing up to CareCallAI! Your free trial is active — no payment needed yet. We're excited to help you streamline your care management and stay compliant.</p>
  <p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.7;">We know moving to a new system can feel overwhelming, so we'd love to help you get set up:</p>
  <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 30px;">
    <tr><td style="padding:12px 16px;background:#f0fdfa;border-radius:8px;">
      <table cellpadding="0" cellspacing="0"><tr>
        <td style="padding-right:14px;vertical-align:top;font-size:24px;">&#9993;</td>
        <td><p style="margin:0;color:#0d9488;font-size:14px;font-weight:700;">Email Support</p>
        <p style="margin:4px 0 0;color:#475569;font-size:13px;">Drop us an email anytime at <a href="mailto:support@carecallai.co.uk" style="color:#0d9488;">support@carecallai.co.uk</a> — we reply within a few hours.</p></td>
      </tr></table>
    </td></tr>
    <tr><td style="height:10px;"></td></tr>
    <tr><td style="padding:12px 16px;background:#f0fdfa;border-radius:8px;">
      <table cellpadding="0" cellspacing="0"><tr>
        <td style="padding-right:14px;vertical-align:top;font-size:24px;">&#128187;</td>
        <td><p style="margin:0;color:#0d9488;font-size:14px;font-weight:700;">Free Onboarding Call</p>
        <p style="margin:4px 0 0;color:#475569;font-size:13px;">Book a free 30-minute video call — we'll walk you through the system. Just reply to this email to arrange a time.</p></td>
      </tr></table>
    </td></tr>
    <tr><td style="height:10px;"></td></tr>
    <tr><td style="padding:12px 16px;background:#f0fdfa;border-radius:8px;">
      <table cellpadding="0" cellspacing="0"><tr>
        <td style="padding-right:14px;vertical-align:top;font-size:24px;">&#128172;</td>
        <td><p style="margin:0;color:#0d9488;font-size:14px;font-weight:700;">WhatsApp</p>
        <p style="margin:4px 0 0;color:#475569;font-size:13px;">Message us at <a href="https://wa.me/447762533406" style="color:#0d9488;">07762 533 406</a> for fast, friendly support.</p></td>
      </tr></table>
    </td></tr>
  </table>
  <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 30px;">
    <tr><td align="center">
      <a href="https://app.carecallai.co.uk" style="display:inline-block;background:#0d9488;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;">Go to CareCallAI</a>
    </td></tr>
  </table>
  <p style="margin:0 0 14px;color:#1e293b;font-size:15px;font-weight:700;">Quick Start Tips:</p>
  <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
    <tr><td style="padding:6px 0;color:#475569;font-size:14px;">&#10003;&nbsp;&nbsp;Add your staff members and set up their roles</td></tr>
    <tr><td style="padding:6px 0;color:#475569;font-size:14px;">&#10003;&nbsp;&nbsp;Add your service users with their care plans</td></tr>
    <tr><td style="padding:6px 0;color:#475569;font-size:14px;">&#10003;&nbsp;&nbsp;Create your first rota and deploy shift patterns</td></tr>
    <tr><td style="padding:6px 0;color:#475569;font-size:14px;">&#10003;&nbsp;&nbsp;Set up compliance tracking for CIW or CQC</td></tr>
  </table>
  <p style="margin:0;color:#475569;font-size:15px;line-height:1.7;">Warm regards,<br/><strong style="color:#1e293b;">The CareCallAI Team</strong></p>
</td></tr>
<tr><td style="background:#f8fafc;padding:24px 40px;border-top:1px solid #e2e8f0;">
  <p style="margin:0 0 8px;color:#64748b;font-size:12px;text-align:center;">CareCallAI — The Hummingbird, 27-29 High St, Denbigh LL16 3HY</p>
  <p style="margin:0;color:#94a3b8;font-size:11px;text-align:center;">
    <a href="https://carecallai.co.uk" style="color:#0d9488;text-decoration:none;">carecallai.co.uk</a>&nbsp;&nbsp;|&nbsp;&nbsp;
    <a href="mailto:support@carecallai.co.uk" style="color:#0d9488;text-decoration:none;">support@carecallai.co.uk</a>
  </p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  await client.send({ from: '"CareCallAI" <hello@carecallai.co.uk>', to, subject: 'Welcome to CareCallAI — Your free trial is active! 🎉', content: 'auto', html });
  await client.close();
  return true;
}

Deno.serve(async (req) => {
  const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  // Verify caller is an authenticated app user
  const authHeader = req.headers.get('Authorization') || '';
  const userClient = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authHeader } } });
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Optional body params:
  //   skipEmails: true → don't send welcome emails, just backfill email_contacts
  //   contactsOnly:  alias for skipEmails
  let skipEmails = false;
  try {
    const body = await req.json();
    skipEmails = !!(body?.skipEmails || body?.contactsOnly);
  } catch { /* no body */ }

  try {
    // Get all trial org owners with email from the users table (which has email stored)
    const { data: members, error: membersErr } = await supabase
      .from('organization_members')
      .select(`
        user_id,
        role,
        organizations!inner(id, name, plan, created_at)
      `)
      .eq('role', 'owner')
      .eq('organizations.plan', 'trial');

    if (membersErr) throw membersErr;

    const results: { email: string; org: string; status: string; contact: string }[] = [];

    for (const member of members || []) {
      // Get user's email from auth admin API
      const { data: userData } = await supabase.auth.admin.getUserById(member.user_id);
      const email = userData?.user?.email;
      const name = userData?.user?.user_metadata?.full_name || '';
      const org = (member as any).organizations;
      const orgName = org?.name || '';
      const orgId = org?.id || '';

      if (!email) continue;

      const firstName = (name || 'there').split(' ')[0];

      // ─── Backfill into email_contacts ───
      let contactStatus = 'skipped';
      try {
        const { data: existing } = await supabase
          .from('email_contacts')
          .select('id, tags')
          .eq('email', email)
          .maybeSingle();
        if (existing) {
          const tags: string[] = existing.tags || [];
          if (!tags.includes('trial')) tags.push('trial');
          if (!tags.includes('customer')) tags.push('customer');
          await supabase.from('email_contacts').update({
            tags,
            name: name || null,
            organisation: orgName || null,
            status: 'subscribed',
          }).eq('id', existing.id);
          contactStatus = 'updated';
        } else {
          await supabase.from('email_contacts').insert({
            email,
            name: name || null,
            organisation: orgName || null,
            tags: ['trial', 'customer'],
            data_source: 'app_signup_backfill',
            status: 'subscribed',
            metadata: { plan: 'trial', org_id: orgId },
          });
          contactStatus = 'inserted';
        }
      } catch (e) {
        contactStatus = `failed: ${(e as Error).message}`;
        console.error(`[backfill] Contact insert failed for ${email}:`, e);
      }

      // ─── Optionally send welcome email ───
      let emailStatus = 'skipped';
      if (!skipEmails) {
        try {
          await sendWelcomeEmail(email, firstName);
          emailStatus = 'sent';
          console.log(`[backfill] Sent welcome email to ${email} (${orgName})`);
        } catch (e) {
          emailStatus = `failed: ${(e as Error).message}`;
          console.error(`[backfill] Email send failed for ${email}:`, e);
        }
        // Small delay to avoid SMTP rate limits
        await new Promise(r => setTimeout(r, 600));
      }

      results.push({ email, org: orgName, status: emailStatus, contact: contactStatus });
    }

    return Response.json({
      ok: true,
      processed: results.length,
      skipEmails,
      results,
    }, { headers: corsHeaders });
  } catch (err) {
    console.error('[backfillWelcomeEmails] Error:', (err as Error).message);
    return Response.json({ error: (err as Error).message }, { status: 500, headers: corsHeaders });
  }
});
