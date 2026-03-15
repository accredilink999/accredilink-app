import { NextResponse } from 'next/server';
import { verifyAdmin } from '../auth';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function callEdgeFunction(body) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/process-campaign`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'apikey': SUPABASE_KEY,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Edge function failed (${res.status})`);
  return data;
}

async function sendEmailDirect({ to, from, subject, html, replyTo }) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/send-campaign-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'apikey': SUPABASE_KEY,
    },
    body: JSON.stringify({ to, from, subject, html, replyTo }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Send failed (${res.status})`);
  }
  return res.json();
}

export async function POST(request) {
  const admin = verifyAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { campaign_id, test_email, subject, html: directHtml, batch_mode } = await request.json();
  if (!campaign_id) return NextResponse.json({ error: 'campaign_id is required' }, { status: 400 });

  // Direct send (customer management)
  if (campaign_id === 'direct_send' && test_email && directHtml) {
    try {
      await sendEmailDirect({
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

  // Test send
  if (test_email) {
    try {
      const data = await callEdgeFunction({ campaign_id, test_email });
      return NextResponse.json(data);
    } catch (err) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  // Batch mode — process next batch of queued emails (called by frontend in a loop)
  if (batch_mode) {
    try {
      const data = await callEdgeFunction({ campaign_id, batch_mode: true });
      return NextResponse.json(data);
    } catch (err) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  // Initial send — just set up queued records and return immediately
  try {
    const setup = await callEdgeFunction({ campaign_id });
    return NextResponse.json(setup);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
