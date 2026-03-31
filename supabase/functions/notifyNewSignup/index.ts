import { createClient } from 'npm:@supabase/supabase-js@2';
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

async function sendEmail(to: string, subject: string, html: string) {
  const smtpPass = Deno.env.get('CARECALLAI_SMTP_PASS') || '';
  if (!smtpPass) { console.error('SMTP not configured'); return; }
  const client = new SMTPClient({
    connection: { hostname: 'smtp.ionos.co.uk', port: 465, tls: true, auth: { username: 'hello@carecallai.co.uk', password: smtpPass } },
  });
  await client.send({ from: '"CareCallAI" <hello@carecallai.co.uk>', to, subject, content: 'auto', html });
  await client.close();
}

Deno.serve(async (req) => {
  const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the caller is an authenticated app user
    const authHeader = req.headers.get('Authorization') || '';
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });

    const body = await req.json();
    const { orgId, orgName, userEmail, userName, plan } = body;

    const signupTime = new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' });

    // Get trial end date from org
    const { data: org } = await supabase
      .from('organizations')
      .select('trial_ends_at, plan')
      .eq('id', orgId)
      .single();

    const trialEnd = org?.trial_ends_at
      ? new Date(org.trial_ends_at).toLocaleDateString('en-GB')
      : '30 days from signup';

    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
<tr><td style="background:#0d9488;padding:24px 40px;text-align:center;">
  <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">🎉 New Trial Signup!</h1>
  <p style="margin:6px 0 0;color:#ccfbf1;font-size:13px;">Someone just started a free trial on CareCallAI</p>
</td></tr>
<tr><td style="padding:30px 40px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border-radius:8px;padding:20px;margin:0 0 24px;border-left:4px solid #0d9488;">
    <tr><td style="padding:5px 0;color:#1e293b;font-size:15px;"><strong>Name:</strong> ${userName || 'Not provided'}</td></tr>
    <tr><td style="padding:5px 0;color:#1e293b;font-size:15px;"><strong>Email:</strong> <a href="mailto:${userEmail}" style="color:#0d9488;">${userEmail}</a></td></tr>
    <tr><td style="padding:5px 0;color:#1e293b;font-size:15px;"><strong>Organisation:</strong> ${orgName}</td></tr>
    <tr><td style="padding:5px 0;color:#1e293b;font-size:15px;"><strong>Plan:</strong> ${plan || 'Trial'}</td></tr>
    <tr><td style="padding:5px 0;color:#1e293b;font-size:15px;"><strong>Trial Ends:</strong> ${trialEnd}</td></tr>
    <tr><td style="padding:5px 0;color:#1e293b;font-size:15px;"><strong>Signed Up:</strong> ${signupTime}</td></tr>
  </table>
  <p style="margin:0 0 16px;color:#475569;font-size:14px;line-height:1.6;">
    This signup was made directly on the app. Reach out to offer an onboarding call and convert them to a paying customer!
  </p>
  <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
    <tr>
      <td style="padding-right:8px;"><a href="mailto:${userEmail}?subject=Welcome to CareCallAI — Let's get you set up!&body=Hi ${userName || 'there'},%0A%0AWelcome to CareCallAI! I'd love to help you get the most out of your trial..." style="display:block;text-align:center;background:#0d9488;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-size:14px;font-weight:600;">Email ${userName || 'them'}</a></td>
      <td><a href="https://app.carecallai.co.uk/admin" style="display:block;text-align:center;background:#f1f5f9;color:#334155;text-decoration:none;padding:12px 20px;border-radius:8px;font-size:14px;font-weight:600;border:1px solid #e2e8f0;">View in Admin</a></td>
    </tr>
  </table>
  <p style="margin:0;color:#94a3b8;font-size:12px;">Org ID: ${orgId}</p>
</td></tr>
<tr><td style="background:#f8fafc;padding:16px 40px;border-top:1px solid #e2e8f0;text-align:center;">
  <p style="margin:0;color:#94a3b8;font-size:11px;">CareCallAI — The Hummingbird, 27-29 High St, Denbigh LL16 3HY</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

    // 1. Admin notification
    await sendEmail(
      'hello@carecallai.co.uk',
      `🎉 New Trial: ${orgName} — ${userEmail}`,
      html
    );

    // 2. Welcome email to the new user
    if (userEmail) {
      const firstName = (userName || 'there').split(' ')[0];
      const welcomeHtml = `<!DOCTYPE html>
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
  <p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.7;">Thank you for signing up to CareCallAI! Your 30-day free trial has started — no payment needed yet. We're thrilled to have you on board and want to make sure you get the most out of the platform from day one.</p>
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
        <p style="margin:4px 0 0;color:#475569;font-size:13px;">Book a free 30-minute video call — we'll walk you through the system and answer any questions. Just reply to this email to arrange a time.</p></td>
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
      <a href="https://app.carecallai.co.uk" style="display:inline-block;background:#0d9488;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;">Get Started</a>
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
      try {
        await sendEmail(
          userEmail,
          "Welcome to CareCallAI — Your free trial has started! 🎉",
          welcomeHtml
        );
        console.log(`[notifyNewSignup] Welcome email sent to ${userEmail}`);
      } catch (e) {
        console.error('[notifyNewSignup] Welcome email failed:', e);
      }

      // 3. Add to email_contacts list
      try {
        const { data: existing } = await supabase
          .from('email_contacts')
          .select('id, tags')
          .eq('email', userEmail)
          .maybeSingle();
        if (existing) {
          const tags = existing.tags || [];
          if (!tags.includes('trial')) tags.push('trial');
          await supabase.from('email_contacts').update({ tags, name: userName, organisation: orgName }).eq('id', existing.id);
        } else {
          await supabase.from('email_contacts').insert({
            email: userEmail, name: userName, organisation: orgName,
            tags: ['trial'], data_source: 'app_signup', status: 'subscribed',
            metadata: { plan: 'trial', org_id: orgId },
          });
        }
      } catch (e) { console.error('[notifyNewSignup] Contact insert failed:', e); }
    }

    console.log(`[notifyNewSignup] Complete for ${userEmail} / ${orgName}`);
    return Response.json({ ok: true }, { headers: corsHeaders });
  } catch (err) {
    console.error('[notifyNewSignup] Error:', err.message);
    return Response.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
});
