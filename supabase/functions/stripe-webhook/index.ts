import { createClient } from 'npm:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@14';
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')!;
const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;

const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-12-18.acacia' });

// ── Email helper ──────────────────────────────────────────────────────
async function sendEmail(to: string, subject: string, html: string) {
  const smtpPass = Deno.env.get('CARECALLAI_SMTP_PASS') || '';
  if (!smtpPass) { console.error('SMTP not configured — skipping email'); return; }
  const client = new SMTPClient({
    connection: { hostname: 'smtp.ionos.co.uk', port: 465, tls: true, auth: { username: 'hello@carecallai.co.uk', password: smtpPass } },
  });
  await client.send({ from: '"CareCallAI" <hello@carecallai.co.uk>', to, subject, content: 'auto', html });
  await client.close();
}

// ── Welcome email HTML ────────────────────────────────────────────────
function welcomeEmailHtml(name: string) {
  return `<!DOCTYPE html>
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
  <p style="margin:0 0 20px;color:#1e293b;font-size:16px;line-height:1.6;">Hi <strong>${name}</strong>,</p>
  <p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.7;">Thank you for signing up to CareCallAI! We're thrilled to have you on board and we want to make sure you get the most out of the platform from day one.</p>
  <p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.7;">We know moving to a new system can feel overwhelming, so we'd love to help you get set up. Here's how we can support you:</p>
  <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 30px;">
    <tr><td style="padding:12px 16px;background:#f0fdfa;border-radius:8px;">
      <table cellpadding="0" cellspacing="0"><tr>
        <td style="padding-right:14px;vertical-align:top;font-size:24px;">&#9993;</td>
        <td><p style="margin:0;color:#0d9488;font-size:14px;font-weight:700;">Email Support</p>
        <p style="margin:4px 0 0;color:#475569;font-size:13px;line-height:1.5;">Drop us an email anytime at <a href="mailto:support@carecallai.co.uk" style="color:#0d9488;text-decoration:underline;">support@carecallai.co.uk</a> — we typically reply within a few hours.</p></td>
      </tr></table>
    </td></tr>
    <tr><td style="height:10px;"></td></tr>
    <tr><td style="padding:12px 16px;background:#f0fdfa;border-radius:8px;">
      <table cellpadding="0" cellspacing="0"><tr>
        <td style="padding-right:14px;vertical-align:top;font-size:24px;">&#128187;</td>
        <td><p style="margin:0;color:#0d9488;font-size:14px;font-weight:700;">Free Onboarding Call</p>
        <p style="margin:4px 0 0;color:#475569;font-size:13px;line-height:1.5;">Book a free 30-minute video call and we'll walk you through the system, set up your team, and answer any questions. Just reply to this email to arrange a time.</p></td>
      </tr></table>
    </td></tr>
    <tr><td style="height:10px;"></td></tr>
    <tr><td style="padding:12px 16px;background:#f0fdfa;border-radius:8px;">
      <table cellpadding="0" cellspacing="0"><tr>
        <td style="padding-right:14px;vertical-align:top;font-size:24px;">&#128172;</td>
        <td><p style="margin:0;color:#0d9488;font-size:14px;font-weight:700;">WhatsApp</p>
        <p style="margin:4px 0 0;color:#475569;font-size:13px;line-height:1.5;">Need a quick answer? Message us on WhatsApp at <a href="https://wa.me/447762533406?text=Hi%2C%20I%27ve%20just%20signed%20up%20for%20CareCallAI%20and%20would%20like%20some%20help%20getting%20set%20up" style="color:#0d9488;text-decoration:underline;">07762 533 406</a> for fast, friendly support.</p></td>
      </tr></table>
    </td></tr>
  </table>
  <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 30px;">
    <tr><td align="center">
      <a href="https://carecallai.co.uk/demo" style="display:inline-block;background:#0d9488;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;">Book Your Free Onboarding Call</a>
    </td></tr>
  </table>
  <p style="margin:0 0 14px;color:#1e293b;font-size:15px;font-weight:700;">Quick Start Tips:</p>
  <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
    <tr><td style="padding:6px 0;color:#475569;font-size:14px;line-height:1.5;">&#10003;&nbsp;&nbsp;Add your staff members and set up their roles</td></tr>
    <tr><td style="padding:6px 0;color:#475569;font-size:14px;line-height:1.5;">&#10003;&nbsp;&nbsp;Add your service users with their care plans</td></tr>
    <tr><td style="padding:6px 0;color:#475569;font-size:14px;line-height:1.5;">&#10003;&nbsp;&nbsp;Create your first rota and deploy shift patterns</td></tr>
    <tr><td style="padding:6px 0;color:#475569;font-size:14px;line-height:1.5;">&#10003;&nbsp;&nbsp;Download the mobile app for your care team</td></tr>
    <tr><td style="padding:6px 0;color:#475569;font-size:14px;line-height:1.5;">&#10003;&nbsp;&nbsp;Set up compliance tracking for CIW or CQC</td></tr>
  </table>
  <p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.7;">We're here to help every step of the way. Don't hesitate to reach out — no question is too small.</p>
  <p style="margin:0;color:#475569;font-size:15px;line-height:1.7;">Warm regards,<br/><strong style="color:#1e293b;">The CareCallAI Team</strong></p>
</td></tr>
<tr><td style="background:#f8fafc;padding:24px 40px;border-top:1px solid #e2e8f0;">
  <p style="margin:0 0 8px;color:#64748b;font-size:12px;text-align:center;">CareCallAI — The Hummingbird, 27-29 High St, Denbigh LL16 3HY</p>
  <p style="margin:0;color:#94a3b8;font-size:11px;text-align:center;">
    <a href="https://carecallai.co.uk" style="color:#0d9488;text-decoration:none;">carecallai.co.uk</a>&nbsp;&nbsp;|&nbsp;&nbsp;
    <a href="mailto:support@carecallai.co.uk" style="color:#0d9488;text-decoration:none;">support@carecallai.co.uk</a>&nbsp;&nbsp;|&nbsp;&nbsp;
    <a href="https://wa.me/447762533406?text=Hi%2C%20I%27ve%20just%20signed%20up%20for%20CareCallAI%20and%20would%20like%20some%20help%20getting%20set%20up" style="color:#0d9488;text-decoration:none;">WhatsApp</a>
  </p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

// ── Admin notification email ──────────────────────────────────────────
function adminNotificationHtml(customerEmail: string, customerName: string, orgName: string, plan: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
<tr><td style="background:#059669;padding:24px 40px;text-align:center;">
  <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">New Customer Signup!</h1>
</td></tr>
<tr><td style="padding:30px 40px;">
  <p style="margin:0 0 20px;color:#1e293b;font-size:16px;line-height:1.6;">A new customer has just signed up through the payment gateway.</p>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border-radius:8px;padding:20px;margin:0 0 20px;">
    <tr><td style="padding:6px 0;color:#475569;font-size:14px;"><strong>Name:</strong> ${customerName}</td></tr>
    <tr><td style="padding:6px 0;color:#475569;font-size:14px;"><strong>Email:</strong> <a href="mailto:${customerEmail}" style="color:#059669;">${customerEmail}</a></td></tr>
    <tr><td style="padding:6px 0;color:#475569;font-size:14px;"><strong>Organisation:</strong> ${orgName}</td></tr>
    <tr><td style="padding:6px 0;color:#475569;font-size:14px;"><strong>Plan:</strong> ${plan.charAt(0).toUpperCase() + plan.slice(1)}</td></tr>
    <tr><td style="padding:6px 0;color:#475569;font-size:14px;"><strong>Date:</strong> ${new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' })}</td></tr>
  </table>
  <p style="margin:0 0 10px;color:#475569;font-size:14px;">A welcome email has been automatically sent to the customer. They've also been added to your customer contacts list.</p>
  <p style="margin:0;color:#475569;font-size:14px;">
    <a href="https://carecallai.co.uk/admin/customers" style="color:#059669;text-decoration:underline;">View Customer Management</a>
  </p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return new Response('Missing stripe-signature header', { status: 400 });
  }

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, stripeWebhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const orgId = session.metadata?.organization_id;
        const plan = session.metadata?.plan || 'professional';

        if (orgId) {
          // Fetch the subscription to check if it's in trial
          let trialEnd = null;
          if (session.subscription) {
            const sub = await stripe.subscriptions.retrieve(session.subscription as string);
            if (sub.status === 'trialing' && sub.trial_end) {
              trialEnd = new Date(sub.trial_end * 1000).toISOString();
            }
          }

          await supabase
            .from('organizations')
            .update({
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: session.subscription as string,
              plan,
              is_active: true,
              trial_ends_at: trialEnd,
              updated_at: new Date().toISOString(),
            })
            .eq('id', orgId);

          console.log(`Checkout completed for org ${orgId}, plan: ${plan}, trial_ends: ${trialEnd}`);

          // ── Get customer details for emails ───────────────────────
          const customerEmail = session.customer_details?.email || session.customer_email || '';
          const customerName = session.customer_details?.name || 'there';

          // Get org name from DB
          const { data: orgData } = await supabase
            .from('organizations')
            .select('name')
            .eq('id', orgId)
            .single();
          const orgName = orgData?.name || 'Unknown';

          // ── 1. Send admin notification email ──────────────────────
          try {
            await sendEmail(
              'hello@carecallai.co.uk',
              `New Signup: ${customerName} (${orgName}) — ${plan}`,
              adminNotificationHtml(customerEmail, customerName, orgName, plan)
            );
            console.log(`Admin notification sent for ${customerEmail}`);
          } catch (emailErr) {
            console.error('Failed to send admin notification:', emailErr);
          }

          // ── 2. Send welcome email to customer ─────────────────────
          if (customerEmail) {
            try {
              await sendEmail(
                customerEmail,
                "Welcome to CareCallAI — Let's Get You Set Up!",
                welcomeEmailHtml(customerName)
              );
              console.log(`Welcome email sent to ${customerEmail}`);
            } catch (emailErr) {
              console.error('Failed to send welcome email:', emailErr);
            }

            // ── 3. Add to customer contacts list ──────────────────────
            try {
              const { data: existing } = await supabase
                .from('email_contacts')
                .select('id, tags')
                .eq('email', customerEmail)
                .maybeSingle();

              if (existing) {
                const tags = existing.tags || [];
                if (!tags.includes('customer')) {
                  tags.push('customer');
                  await supabase.from('email_contacts').update({ tags, name: customerName, organisation: orgName, updated_at: new Date().toISOString() }).eq('id', existing.id);
                }
              } else {
                await supabase.from('email_contacts').insert({
                  email: customerEmail,
                  name: customerName,
                  organisation: orgName,
                  tags: ['customer'],
                  data_source: 'stripe_signup',
                  status: 'subscribed',
                  metadata: { plan, org_id: orgId },
                });
              }
              console.log(`Customer contact added/updated: ${customerEmail}`);
            } catch (contactErr) {
              console.error('Failed to add customer contact:', contactErr);
            }
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const orgId = subscription.metadata?.organization_id;

        if (orgId) {
          const isActive = ['active', 'trialing'].includes(subscription.status);
          const plan = subscription.metadata?.plan || 'professional';

          await supabase
            .from('organizations')
            .update({
              plan,
              is_active: isActive,
              updated_at: new Date().toISOString(),
            })
            .eq('id', orgId);

          console.log(`Subscription updated for org ${orgId}: ${subscription.status}, plan: ${plan}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const orgId = subscription.metadata?.organization_id;

        if (orgId) {
          await supabase
            .from('organizations')
            .update({
              plan: 'cancelled',
              is_active: false,
              stripe_subscription_id: null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', orgId);

          console.log(`Subscription cancelled for org ${orgId}`);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Find org by stripe_customer_id
        const { data: org } = await supabase
          .from('organizations')
          .select('id, name')
          .eq('stripe_customer_id', customerId)
          .single();

        if (org) {
          console.log(`Payment failed for org ${org.id} (${org.name})`);
          try {
            await sendEmail(
              'hello@carecallai.co.uk',
              `Payment Failed: ${org.name}`,
              `<div style="font-family:Arial;padding:20px;"><h2 style="color:#dc2626;">Payment Failed</h2><p><strong>Organisation:</strong> ${org.name}</p><p><strong>Customer ID:</strong> ${customerId}</p><p><strong>Date:</strong> ${new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' })}</p><p>Check Stripe dashboard for details.</p></div>`
            );
          } catch (e) { console.error('Failed to send payment failure email:', e); }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error(`Error processing ${event.type}:`, err);
    return new Response(`Webhook handler error: ${err.message}`, { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
