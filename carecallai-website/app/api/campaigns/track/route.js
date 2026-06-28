import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// 1x1 transparent GIF
const PIXEL = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const sid = searchParams.get('sid');
  const url = searchParams.get('url');

  if (!type || !sid || sid === 'test') {
    // Test sends or invalid — return pixel/redirect silently
    if (type === 'open') {
      return new Response(PIXEL, { headers: { 'Content-Type': 'image/gif', 'Cache-Control': 'no-store' } });
    }
    if (type === 'unsubscribe') {
      return new Response(unsubscribeHtml(), { headers: { 'Content-Type': 'text/html' } });
    }
    return NextResponse.redirect(url || 'https://www.carecallai.co.uk');
  }

  if (type === 'open') {
    // Update send record
    await supabase.from('email_sends').update({ status: 'opened', opened_at: new Date().toISOString() }).eq('id', sid).is('opened_at', null);

    // Increment campaign counter
    const { data: send } = await supabase.from('email_sends').select('campaign_id').eq('id', sid).single();
    if (send?.campaign_id) {
      await supabase.rpc('increment_campaign_stat', { cid: send.campaign_id, stat_name: 'total_opened' }).catch(() => {
        // Fallback: manual increment
        supabase.from('email_campaigns').select('total_opened').eq('id', send.campaign_id).single().then(({ data }) => {
          if (data) supabase.from('email_campaigns').update({ total_opened: (data.total_opened || 0) + 1 }).eq('id', send.campaign_id);
        });
      });
    }

    return new Response(PIXEL, { headers: { 'Content-Type': 'image/gif', 'Cache-Control': 'no-store' } });
  }

  if (type === 'click') {
    await supabase.from('email_sends').update({ status: 'clicked', clicked_at: new Date().toISOString() }).eq('id', sid);

    const { data: send } = await supabase.from('email_sends').select('campaign_id').eq('id', sid).single();
    if (send?.campaign_id) {
      supabase.from('email_campaigns').select('total_clicked').eq('id', send.campaign_id).single().then(({ data }) => {
        if (data) supabase.from('email_campaigns').update({ total_clicked: (data.total_clicked || 0) + 1 }).eq('id', send.campaign_id);
      });
    }

    return NextResponse.redirect(url || 'https://www.carecallai.co.uk');
  }

  if (type === 'unsubscribe') {
    // Get the contact email from the send record
    const { data: send } = await supabase.from('email_sends').select('email, campaign_id, contact_id').eq('id', sid).single();

    if (send) {
      // Mark contact as unsubscribed
      await supabase.from('email_contacts').update({
        status: 'unsubscribed',
        unsubscribed_at: new Date().toISOString(),
      }).eq('id', send.contact_id);

      // Create audit record
      await supabase.from('email_unsubscribes').insert({
        email: send.email,
        campaign_id: send.campaign_id,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
      });

      // Increment campaign counter
      supabase.from('email_campaigns').select('total_unsubscribed').eq('id', send.campaign_id).single().then(({ data }) => {
        if (data) supabase.from('email_campaigns').update({ total_unsubscribed: (data.total_unsubscribed || 0) + 1 }).eq('id', send.campaign_id);
      });
    }

    return new Response(unsubscribeHtml(), { headers: { 'Content-Type': 'text/html' } });
  }

  return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
}

function unsubscribeHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Unsubscribed</title></head>
<body style="font-family:Arial,sans-serif;max-width:500px;margin:60px auto;text-align:center;padding:20px;">
  <div style="background:#f0fdfa;border:1px solid #99f6e4;border-radius:12px;padding:40px 30px;">
    <h1 style="color:#0d9488;font-size:24px;margin:0 0 16px;">You've been unsubscribed</h1>
    <p style="color:#475569;font-size:15px;line-height:1.6;">
      You will no longer receive marketing emails from CareCallAI.
      If this was a mistake, please contact us at
      <a href="mailto:hello@carecallai.co.uk" style="color:#0d9488;">hello@carecallai.co.uk</a>.
    </p>
    <a href="https://www.carecallai.co.uk" style="display:inline-block;margin-top:20px;padding:10px 24px;background:#0d9488;color:white;text-decoration:none;border-radius:8px;font-size:14px;">Visit CareCallAI</a>
  </div>
</body>
</html>`;
}
