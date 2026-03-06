import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyAdmin } from '../auth';

export async function GET(request) {
  const admin = verifyAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const regulator = searchParams.get('regulator');
  const status = searchParams.get('status');
  const provider_type = searchParams.get('provider_type');
  const data_source = searchParams.get('data_source');
  const search = searchParams.get('search');
  const count_only = searchParams.get('count_only');
  const page = parseInt(searchParams.get('page') || '0');
  const limit = parseInt(searchParams.get('limit') || '50');

  let query = supabase.from('email_contacts').select(count_only === 'true' ? 'id' : '*', count_only === 'true' ? { count: 'exact', head: true } : undefined);

  if (regulator) query = query.eq('regulator', regulator);
  if (status && status !== 'all') query = query.eq('status', status);
  else if (!status) query = query.eq('status', 'active');
  if (provider_type) query = query.eq('provider_type', provider_type);
  if (data_source) query = query.eq('data_source', data_source);
  if (search) query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%,organisation.ilike.%${search}%`);

  if (count_only === 'true') {
    const { count, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, count });
  }

  query = query.order('created_at', { ascending: false }).range(page * limit, (page + 1) * limit - 1);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Also get total count for pagination
  const { count } = await supabase.from('email_contacts').select('id', { count: 'exact', head: true }).eq('status', status || 'active');

  return NextResponse.json({ success: true, contacts: data, total: count });
}

export async function POST(request) {
  const admin = verifyAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();

  // Bulk import
  if (body.contacts && Array.isArray(body.contacts)) {
    const contacts = body.contacts.map(c => ({
      email: (c.email || '').toLowerCase().trim(),
      name: c.name || null,
      organisation: c.organisation || c.organization || null,
      regulator: c.regulator || null,
      provider_type: c.provider_type || null,
      region: c.region || null,
      registration_number: c.registration_number || null,
      data_source: c.data_source || body.data_source || 'csv_import',
      tags: c.tags || [],
      status: c.status || 'active',
    })).filter(c => c.email && c.email.includes('@'));

    let imported = 0;
    let skipped = 0;
    const chunkSize = 500;

    for (let i = 0; i < contacts.length; i += chunkSize) {
      const chunk = contacts.slice(i, i + chunkSize);
      const { data, error } = await supabase
        .from('email_contacts')
        .upsert(chunk, { onConflict: 'email', ignoreDuplicates: false })
        .select('id');

      if (error) {
        return NextResponse.json({ error: error.message, imported, skipped }, { status: 500 });
      }
      imported += (data || []).length;
    }

    skipped = contacts.length - imported;
    return NextResponse.json({ success: true, imported, skipped, total: contacts.length });
  }

  // Single contact
  if (!body.email) {
    return NextResponse.json({ error: 'email is required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('email_contacts')
    .upsert({
      email: body.email.toLowerCase().trim(),
      name: body.name || null,
      organisation: body.organisation || null,
      regulator: body.regulator || null,
      provider_type: body.provider_type || null,
      region: body.region || null,
      registration_number: body.registration_number || null,
      data_source: body.data_source || 'manual',
      tags: body.tags || [],
    }, { onConflict: 'email' })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, contact: data });
}

export async function PUT(request) {
  const admin = verifyAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('email_contacts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, contact: data });
}

export async function DELETE(request) {
  const admin = verifyAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const { error } = await supabase.from('email_contacts').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
