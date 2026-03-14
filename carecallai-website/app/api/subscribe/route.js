import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request) {
  const { email, name, organisation } = await request.json();

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('email_contacts')
    .upsert(
      {
        email: email.toLowerCase().trim(),
        name: name?.trim() || null,
        organisation: organisation?.trim() || null,
        status: 'active',
        data_source: 'website_subscribe',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'email' }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: 'Subscribed successfully' });
}
