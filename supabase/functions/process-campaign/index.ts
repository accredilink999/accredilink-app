import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const resendApiKey = Deno.env.get('RESEND_API_KEY') || '';

  try {
    const { campaign_id, test_email, batch_mode } = await req.json();
    if (!campaign_id) {
      return Response.json({ error: 'campaign_id is required' }, { status: 400 });
    }

    if (!resendApiKey) {
      return Response.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 });
    }

    const baseUrl = 'https://carecallai.co.uk';

    // Load campaign
    const { data: campaign, error: campErr } = await supabase
      .from('email_campaigns')
      .select('*')
      .eq('id', campaign_id)
      .single();

    if (campErr || !campaign) {
      return Response.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const fromName = campaign.from_name || 'CareCallAI';
    const fromEmail = campaign.from_email || 'hello@carecallai.co.uk';
    const replyTo = campaign.reply_to || fromEmail;

    // ═══════════════════════════════════════════
    // Send a single email via Resend API
    // ═══════════════════════════════════════════
    async function sendViaResend(to: string, subject: string, html: string, unsubLink?: string): Promise<void> {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      };

      const body: any = {
        from: `${fromName} <${fromEmail}>`,
        to: [to],
        reply_to: [replyTo],
        subject,
        html,
      };

      if (unsubLink) {
        body.headers = {
          'List-Unsubscribe': `<${unsubLink}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        };
      }

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Resend API error (${res.status})`);
      }
    }

    // ═══════════════════════════════════════════
    // TEST SEND — single email
    // ═══════════════════════════════════════════
    if (test_email) {
      const html = finaliseHtml(campaign.html_content, 'test', baseUrl);
      await sendViaResend(test_email, `[TEST] ${campaign.subject}`, html);
      return Response.json({ success: true, message: `Test email sent to ${test_email}` });
    }

    // ═══════════════════════════════════════════
    // BATCH MODE: Process up to 10 queued emails
    // ═══════════════════════════════════════════
    if (batch_mode) {
      const { data: queued } = await supabase
        .from('email_sends')
        .select('id, email, contact_id')
        .eq('campaign_id', campaign_id)
        .eq('status', 'queued')
        .limit(10);

      if (!queued || queued.length === 0) {
        // All done — count sent + opened
        const { count: sentCount } = await supabase
          .from('email_sends')
          .select('*', { count: 'exact', head: true })
          .eq('campaign_id', campaign_id)
          .eq('status', 'sent');

        const { count: openedCount } = await supabase
          .from('email_sends')
          .select('*', { count: 'exact', head: true })
          .eq('campaign_id', campaign_id)
          .eq('status', 'opened');

        const totalDelivered = (sentCount || 0) + (openedCount || 0);

        await supabase.from('email_campaigns').update({
          status: 'sent',
          total_sent: totalDelivered,
          sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }).eq('id', campaign_id);

        return Response.json({ done: true, total_sent: totalDelivered });
      }

      // Process each email via Resend API
      let batchSent = 0;
      const errors: string[] = [];

      for (const send of queued) {
        try {
          const html = finaliseHtml(campaign.html_content, send.id, baseUrl);
          const unsubLink = `${baseUrl}/api/campaigns/track?type=unsubscribe&sid=${send.id}`;

          await sendViaResend(send.email, campaign.subject, html, unsubLink);

          // Mark as sent
          const { error: sentErr } = await supabase.from('email_sends').update({
            status: 'sent',
            sent_at: new Date().toISOString(),
          }).eq('id', send.id);
          if (sentErr) console.error(`DB sent update error: ${sentErr.message}`);

          batchSent++;
          console.log(`OK: ${send.email}`);
        } catch (err: any) {
          const errMsg = err?.message || String(err);
          console.error(`FAIL: ${send.email}: ${errMsg}`);
          errors.push(`${send.email}: ${errMsg}`);

          // Mark as failed
          const { error: failErr } = await supabase.from('email_sends').update({
            status: 'failed',
            error_message: errMsg.substring(0, 500),
          }).eq('id', send.id);
          if (failErr) console.error(`DB fail update error: ${failErr.message}`);
        }

        // Small delay between emails
        await new Promise((r) => setTimeout(r, 200));
      }

      const { count: remaining } = await supabase
        .from('email_sends')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', campaign_id)
        .eq('status', 'queued');

      return Response.json({
        done: false,
        batch_sent: batchSent,
        batch_failed: errors.length,
        remaining,
        errors: errors.length > 0 ? errors : undefined,
      });
    }

    // ═══════════════════════════════════════════
    // INITIAL SEND: Set up queued records
    // ═══════════════════════════════════════════
    if (campaign.status === 'sending') {
      return Response.json({ error: 'Campaign is already sending' }, { status: 400 });
    }

    // Build audience
    let contactQuery = supabase.from('email_contacts').select('id, email, name, organisation').eq('status', 'active');
    if (campaign.regulator && campaign.regulator !== 'all') {
      contactQuery = contactQuery.eq('regulator', campaign.regulator);
    }
    if (campaign.provider_type && campaign.provider_type !== 'all') {
      contactQuery = contactQuery.eq('provider_type', campaign.provider_type);
    }

    const { data: contacts, error: contactErr } = await contactQuery.limit(5000);
    if (contactErr) return Response.json({ error: contactErr.message }, { status: 500 });
    if (!contacts || contacts.length === 0) {
      return Response.json({ error: 'No matching contacts found' }, { status: 400 });
    }

    // Exclude already-sent contacts for THIS campaign
    const { data: alreadySent } = await supabase
      .from('email_sends')
      .select('contact_id')
      .eq('campaign_id', campaign_id)
      .in('status', ['sent', 'opened', 'clicked']);
    const sentIds = new Set((alreadySent || []).map((s: any) => s.contact_id));
    const targetContacts = contacts.filter((c: any) => !sentIds.has(c.id));

    if (targetContacts.length === 0) {
      return Response.json({ error: 'All matching contacts have already been emailed' }, { status: 400 });
    }

    // Mark campaign as sending
    await supabase.from('email_campaigns').update({
      status: 'sending',
      total_recipients: targetContacts.length,
      updated_at: new Date().toISOString(),
    }).eq('id', campaign_id);

    // Create all send records as queued
    const sendRecords = targetContacts.map((c: any) => ({
      id: crypto.randomUUID(),
      campaign_id,
      contact_id: c.id,
      email: c.email,
      status: 'queued',
    }));

    for (let i = 0; i < sendRecords.length; i += 500) {
      await supabase.from('email_sends').insert(sendRecords.slice(i, i + 500));
    }

    return Response.json({
      success: true,
      message: 'Campaign queued for sending',
      total_recipients: targetContacts.length,
    });
  } catch (error: any) {
    console.error('Process campaign error:', error);
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
});

function finaliseHtml(html: string, sendId: string, baseUrl: string): string {
  const trackPixel = `<img src="${baseUrl}/api/campaigns/track?type=open&sid=${sendId}" width="1" height="1" style="display:block" alt="" />`;
  const unsubLink = `${baseUrl}/api/campaigns/track?type=unsubscribe&sid=${sendId}`;
  const companyAddress = 'CareCallAI, The Hummingbird, 27-29 High St, Denbigh LL16 3HY';
  const subscribeLink = `${baseUrl}/subscribe`;

  let finalHtml = html
    .replace(/\{\{UNSUBSCRIBE_LINK\}\}/g, unsubLink)
    .replace(/\{\{SUBSCRIBE_LINK\}\}/g, subscribeLink)
    .replace(/\{\{COMPANY_ADDRESS\}\}/g, companyAddress);

  if (finalHtml.includes('</body>')) {
    finalHtml = finalHtml.replace('</body>', `${trackPixel}</body>`);
  } else {
    finalHtml += trackPixel;
  }

  return finalHtml;
}
