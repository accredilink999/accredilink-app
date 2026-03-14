import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyAdmin } from '../auth';

const SMTP_HOST = 'smtp.ionos.co.uk';
const SMTP_PORT = 465;
const SMTP_USER = 'hello@carecallai.co.uk';
const BATCH_SIZE = 10;
const BATCH_DELAY_MS = 2000;

async function sendEmail({ to, from, subject, html, replyTo, listUnsubscribe }) {
  // Use Supabase edge function to send via SMTP
  // This avoids needing SMTP credentials in the Next.js environment
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-campaign-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ to, from, subject, html, replyTo, listUnsubscribe }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Send failed (${res.status})`);
  }
  return res.json();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function POST(request) {
  const admin = verifyAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { campaign_id, test_email, subject, html: directHtml } = await request.json();
  if (!campaign_id) return NextResponse.json({ error: 'campaign_id is required' }, { status: 400 });

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://carecallai.co.uk';

  // Direct send — send custom HTML to a single email (used by customer management)
  if (campaign_id === 'direct_send' && test_email && directHtml) {
    try {
      await sendEmail({
        to: test_email,
        from: 'CareCallAI <hello@carecallai.co.uk>',
        subject: subject || 'Message from CareCallAI',
        html: directHtml,
        replyTo: 'hello@carecallai.co.uk',
      });
      return NextResponse.json({ success: true, message: `Email sent to ${test_email}` });
    } catch (err) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  // Load campaign
  const { data: campaign, error: campErr } = await supabase
    .from('email_campaigns')
    .select('*')
    .eq('id', campaign_id)
    .single();

  if (campErr || !campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  if (campaign.status === 'sending') return NextResponse.json({ error: 'Campaign is already sending' }, { status: 400 });

  // Test send — send to a single test email
  if (test_email) {
    const html = finaliseHtml(campaign.html_content, 'test', baseUrl);
    try {
      await sendEmail({
        to: test_email,
        from: `${campaign.from_name} <${campaign.from_email}>`,
        subject: `[TEST] ${campaign.subject}`,
        html,
        replyTo: campaign.reply_to || campaign.from_email,
      });
      return NextResponse.json({ success: true, message: `Test email sent to ${test_email}` });
    } catch (err) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  // Full campaign send
  // Build audience query
  let contactQuery = supabase.from('email_contacts').select('id, email, name, organisation').eq('status', 'active');
  if (campaign.target_regulator) contactQuery = contactQuery.eq('regulator', campaign.target_regulator);
  if (campaign.target_provider_type) contactQuery = contactQuery.eq('provider_type', campaign.target_provider_type);

  const { data: contacts, error: contactErr } = await contactQuery.limit(5000);
  if (contactErr) return NextResponse.json({ error: contactErr.message }, { status: 500 });
  if (!contacts || contacts.length === 0) return NextResponse.json({ error: 'No matching contacts found' }, { status: 400 });

  // Exclude contacts who already received ANY previous campaign
  const { data: alreadySent } = await supabase
    .from('email_sends')
    .select('contact_id')
    .eq('status', 'sent');
  const sentIds = new Set((alreadySent || []).map(s => s.contact_id));
  const freshContacts = contacts.filter(c => !sentIds.has(c.id));

  if (freshContacts.length === 0) {
    return NextResponse.json({ error: 'All matching contacts have already been emailed in previous campaigns' }, { status: 400 });
  }

  // Use freshContacts from here on (replace contacts reference)
  const targetContacts = freshContacts;

  // Mark campaign as sending
  await supabase.from('email_campaigns').update({
    status: 'sending',
    total_recipients: targetContacts.length,
    updated_at: new Date().toISOString(),
  }).eq('id', campaign_id);

  // Create send records with pre-generated UUIDs so tracking links work
  const sendRecords = targetContacts.map(c => ({
    id: crypto.randomUUID(),
    campaign_id,
    contact_id: c.id,
    email: c.email,
    status: 'queued',
  }));

  // Insert in chunks
  for (let i = 0; i < sendRecords.length; i += 500) {
    await supabase.from('email_sends').insert(sendRecords.slice(i, i + 500));
  }

  // Build lookup map for send records by contact ID
  const sendMap = new Map(sendRecords.map(s => [s.contact_id, s]));

  // Send in batches
  let totalSent = 0;
  let totalFailed = 0;

  for (let i = 0; i < targetContacts.length; i += BATCH_SIZE) {
    const batch = targetContacts.slice(i, i + BATCH_SIZE);

    for (const contact of batch) {
      const sendRecord = sendMap.get(contact.id);
      const html = finaliseHtml(campaign.html_content, sendRecord.id, baseUrl);

      try {
        await sendEmail({
          to: contact.email,
          from: `${campaign.from_name} <${campaign.from_email}>`,
          subject: campaign.subject,
          html,
          replyTo: campaign.reply_to || campaign.from_email,
          listUnsubscribe: `${baseUrl}/api/campaigns/track?type=unsubscribe&sid=${sendRecord.id}`,
        });

        await supabase.from('email_sends').update({
          status: 'sent',
          sent_at: new Date().toISOString(),
        }).eq('campaign_id', campaign_id).eq('contact_id', contact.id);

        totalSent++;
      } catch (err) {
        console.error(`Failed to send to ${contact.email}:`, err.message);
        totalFailed++;
      }
    }

    // Rate limit delay between batches
    if (i + BATCH_SIZE < targetContacts.length) {
      await sleep(BATCH_DELAY_MS);
    }
  }

  // Update campaign stats
  await supabase.from('email_campaigns').update({
    status: 'sent',
    total_sent: totalSent,
    sent_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq('id', campaign_id);

  return NextResponse.json({
    success: true,
    total_recipients: targetContacts.length,
    total_sent: totalSent,
    total_failed: totalFailed,
  });
}

function finaliseHtml(html, sendId, baseUrl) {
  const trackPixel = `<img src="${baseUrl}/api/campaigns/track?type=open&sid=${sendId}" width="1" height="1" style="display:block" alt="" />`;
  const unsubLink = `${baseUrl}/api/campaigns/track?type=unsubscribe&sid=${sendId}`;
  const companyAddress = 'CareCallAI, The Hummingbird, 27-29 High St, Denbigh LL16 3HY';

  const subscribeLink = `${baseUrl}/subscribe`;

  let finalHtml = html
    .replace(/\{\{UNSUBSCRIBE_LINK\}\}/g, unsubLink)
    .replace(/\{\{SUBSCRIBE_LINK\}\}/g, subscribeLink)
    .replace(/\{\{COMPANY_ADDRESS\}\}/g, companyAddress);

  // Insert tracking pixel before closing body/html
  if (finalHtml.includes('</body>')) {
    finalHtml = finalHtml.replace('</body>', `${trackPixel}</body>`);
  } else {
    finalHtml += trackPixel;
  }

  return finalHtml;
}
