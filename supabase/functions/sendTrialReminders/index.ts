/**
 * sendTrialReminders
 * Runs daily (via GitHub Actions cron) to send trial lifecycle emails:
 *   - 7 days before expiry: "Your trial ends in 7 days"
 *   - 3 days before expiry: "Your trial ends in 3 days"
 *   - 1 day before expiry:  "Your trial ends tomorrow"
 *   - Day of expiry:        "Your trial has ended — subscribe to keep access"
 */
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

function buildReminderEmail(firstName: string, orgName: string, daysLeft: number, trialEndDate: string): string {
  const isExpired = daysLeft <= 0;
  const urgencyColor = daysLeft <= 1 ? '#dc2626' : daysLeft <= 3 ? '#d97706' : '#0d9488';
  const headerBg = isExpired ? '#1e293b' : urgencyColor;

  const headline = isExpired
    ? 'Your Free Trial Has Ended'
    : daysLeft === 1
      ? 'Your Trial Ends Tomorrow!'
      : `Your Trial Ends in ${daysLeft} Days`;

  const subline = isExpired
    ? 'Upgrade now to keep access to your care management data'
    : daysLeft === 1
      ? 'Last chance — subscribe today to avoid losing access'
      : 'Keep your care management running without interruption';

  const bodyText = isExpired
    ? `Your 30-day free trial of CareCallAI ended on <strong>${trialEndDate}</strong>. Your data is safe, but access to the platform has been paused. Subscribe now to restore access instantly.`
    : `Your free trial of CareCallAI will end on <strong>${trialEndDate}</strong> — that's only <strong>${daysLeft} day${daysLeft !== 1 ? 's' : ''}</strong> away. Subscribe now to keep your care management, rota, compliance tracking, and staff records running without interruption.`;

  const ctaText = isExpired ? 'Restore Access Now' : 'Subscribe & Keep Access';
  const ctaUrl = 'https://carecallai.co.uk/pricing';

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
<tr><td style="background:${headerBg};padding:30px 40px;text-align:center;">
  <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">${headline}</h1>
  <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">${subline}</p>
</td></tr>
<tr><td style="padding:40px;">
  <p style="margin:0 0 20px;color:#1e293b;font-size:16px;line-height:1.6;">Hi <strong>${firstName}</strong>,</p>
  <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.7;">${bodyText}</p>

  ${!isExpired ? `
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border-radius:8px;padding:16px 20px;margin:0 0 24px;border-left:4px solid #0d9488;">
    <tr><td style="color:#1e293b;font-size:14px;line-height:1.7;">
      <strong>What you keep with a subscription:</strong><br/>
      ✓ All staff, service users &amp; care records<br/>
      ✓ Rota and shift patterns<br/>
      ✓ CIW/CQC compliance tracking<br/>
      ✓ eMAR, care logs &amp; clinical assessments<br/>
      ✓ Family portal &amp; AI features
    </td></tr>
  </table>` : `
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;border-radius:8px;padding:16px 20px;margin:0 0 24px;border-left:4px solid #dc2626;">
    <tr><td style="color:#1e293b;font-size:14px;line-height:1.7;">
      <strong>Your data is safe.</strong> All your records, staff, service users, and care logs are securely stored. Subscribe now to restore access — nothing is lost.
    </td></tr>
  </table>`}

  <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 30px;">
    <tr><td align="center">
      <a href="${ctaUrl}" style="display:inline-block;background:${urgencyColor};color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:8px;font-size:16px;font-weight:700;">${ctaText}</a>
    </td></tr>
  </table>

  <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
    <tr>
      <td style="padding-right:8px;"><a href="mailto:support@carecallai.co.uk?subject=Trial query — ${encodeURIComponent(orgName)}" style="display:block;text-align:center;background:#f1f5f9;color:#334155;text-decoration:none;padding:11px 0;border-radius:8px;font-size:13px;border:1px solid #e2e8f0;">Email Support</a></td>
      <td><a href="https://wa.me/447762533406" style="display:block;text-align:center;background:#f1f5f9;color:#334155;text-decoration:none;padding:11px 0;border-radius:8px;font-size:13px;border:1px solid #e2e8f0;">WhatsApp Us</a></td>
    </tr>
  </table>

  <p style="margin:0;color:#94a3b8;font-size:13px;text-align:center;">Any questions? Reply to this email or message us on WhatsApp at 07762 533 406.</p>
</td></tr>
<tr><td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;text-align:center;">
  <p style="margin:0 0 6px;color:#64748b;font-size:12px;">CareCallAI — The Hummingbird, 27-29 High St, Denbigh LL16 3HY</p>
  <p style="margin:0;color:#94a3b8;font-size:11px;">
    <a href="https://carecallai.co.uk" style="color:#0d9488;text-decoration:none;">carecallai.co.uk</a>&nbsp;&nbsp;|&nbsp;&nbsp;
    <a href="mailto:support@carecallai.co.uk" style="color:#0d9488;text-decoration:none;">support@carecallai.co.uk</a>
  </p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

Deno.serve(async (req) => {
  const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  // Auth: accept service role JWT or cron secret
  const cronSecret = Deno.env.get('CRON_SECRET') || '';
  const authHeader = req.headers.get('Authorization') || '';
  const cronHeader = req.headers.get('X-Cron-Secret') || '';

  // Allow either service role bearer token or cron secret header
  const isServiceRole = authHeader.startsWith('Bearer ') && authHeader.includes('service_role');
  const isCronCall = cronSecret && cronHeader === cronSecret;
  const isBearerMatch = authHeader === `Bearer ${cronSecret}`;

  if (!isServiceRole && !isCronCall && !isBearerMatch) {
    // Fall back: verify as a valid JWT user (allows manual triggering from app)
    const supabaseAnon = Deno.env.get('SUPABASE_ANON_KEY')!;
    const userClient = createClient(supabaseUrl, supabaseAnon, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error } = await userClient.auth.getUser();
    if (error || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Helper: get date N days from today as ISO date string (YYYY-MM-DD)
  const dateOffset = (days: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  };

  const results: { email: string; org: string; type: string; status: string }[] = [];
  let totalSent = 0;

  // Check each reminder type
  const reminders = [
    { daysLeft: 7, dateStr: dateOffset(7) },
    { daysLeft: 3, dateStr: dateOffset(3) },
    { daysLeft: 1, dateStr: dateOffset(1) },
    { daysLeft: 0, dateStr: dateOffset(0) }, // expires today
  ];

  for (const { daysLeft, dateStr } of reminders) {
    // Find orgs whose trial ends on this specific date
    const { data: orgs, error: orgsErr } = await supabase
      .from('organizations')
      .select('id, name, trial_ends_at, plan')
      .eq('plan', 'trial')
      .gte('trial_ends_at', `${dateStr}T00:00:00Z`)
      .lt('trial_ends_at', `${dateStr}T23:59:59Z`);

    if (orgsErr) {
      console.error(`[sendTrialReminders] Query error for daysLeft=${daysLeft}:`, orgsErr);
      continue;
    }

    for (const org of orgs || []) {
      // Get org owner
      const { data: members } = await supabase
        .from('organization_members')
        .select('user_id')
        .eq('organization_id', org.id)
        .eq('role', 'owner')
        .limit(1);

      if (!members || members.length === 0) continue;

      const { data: userData } = await supabase.auth.admin.getUserById(members[0].user_id);
      const email = userData?.user?.email;
      const name = userData?.user?.user_metadata?.full_name || '';
      if (!email) continue;

      const firstName = (name || 'there').split(' ')[0];
      const trialEndFmt = new Date(org.trial_ends_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
      const subject = daysLeft === 0
        ? `⚠️ Your CareCallAI trial has ended — restore access now`
        : daysLeft === 1
          ? `⏰ Your CareCallAI trial ends tomorrow — subscribe today`
          : `Your CareCallAI trial ends in ${daysLeft} days`;

      const type = daysLeft === 0 ? 'expired' : `${daysLeft}d-reminder`;

      try {
        await sendEmail(email, subject, buildReminderEmail(firstName, org.name, daysLeft, trialEndFmt));
        results.push({ email, org: org.name, type, status: 'sent' });
        totalSent++;
        console.log(`[sendTrialReminders] ${type} email sent to ${email} (${org.name})`);
      } catch (e) {
        results.push({ email, org: org.name, type, status: `failed: ${(e as Error).message}` });
        console.error(`[sendTrialReminders] Failed for ${email}:`, e);
      }

      // Also notify admin when trial expires
      if (daysLeft === 0) {
        try {
          await sendEmail(
            'hello@carecallai.co.uk',
            `⚠️ Trial expired: ${org.name} — ${email}`,
            `<p><strong>${org.name}</strong> (${email}) — trial expired today (${trialEndFmt}). Follow up to convert to paying customer.</p>`
          );
        } catch (_e) { /* non-critical */ }
      }

      await new Promise(r => setTimeout(r, 500));
    }
  }

  console.log(`[sendTrialReminders] Complete. Sent ${totalSent} emails.`);
  return Response.json({ ok: true, sent: totalSent, results }, { headers: corsHeaders });
});
