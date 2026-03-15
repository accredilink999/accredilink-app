import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyAdmin } from '../auth';

export async function GET(request) {
  const admin = verifyAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const campaign_id = searchParams.get('campaign_id');
  const status = searchParams.get('status');

  if (!campaign_id) {
    return NextResponse.json({ error: 'campaign_id is required' }, { status: 400 });
  }

  let query = supabase
    .from('email_sends')
    .select('id, campaign_id, contact_id, email, status, sent_at, opened_at, clicked_at, error_message')
    .eq('campaign_id', campaign_id)
    .order('sent_at', { ascending: false, nullsFirst: false });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error } = await query.limit(500);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Build summary stats
  const stats = { total: 0, queued: 0, sent: 0, opened: 0, clicked: 0, failed: 0 };
  (data || []).forEach((s) => {
    stats.total++;
    if (s.status === 'queued') stats.queued++;
    else if (s.status === 'sent') stats.sent++;
    else if (s.status === 'opened') stats.opened++;
    else if (s.status === 'clicked') stats.clicked++;
    else if (s.status === 'failed') stats.failed++;
  });

  return NextResponse.json({ success: true, sends: data || [], stats });
}
