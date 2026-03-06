import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST - Register or login a training user
export async function POST(request) {
  const body = await request.json();
  const { action } = body;

  if (action === 'register') {
    const { email, full_name, employer, job_role, password } = body;
    if (!email || !full_name || !password) {
      return NextResponse.json({ error: 'Email, full name, and password are required' }, { status: 400 });
    }

    // Check if email already exists
    const { data: existing } = await supabase
      .from('training_users')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists. Please sign in.' }, { status: 409 });
    }

    // Simple hash - bcrypt would be better but this avoids native deps in edge
    const encoder = new TextEncoder();
    const data = encoder.encode(password + '_carecallai_training_salt');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const password_hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const { data: user, error } = await supabase
      .from('training_users')
      .insert({
        email: email.toLowerCase().trim(),
        full_name: full_name.trim(),
        employer: employer?.trim() || null,
        job_role: job_role?.trim() || null,
        password_hash,
      })
      .select('id, email, full_name')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Create session token
    const token = Buffer.from(JSON.stringify({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: 'training_user',
      ts: Date.now(),
    })).toString('base64');

    return NextResponse.json({ success: true, user, token });
  }

  if (action === 'login') {
    const { email, password } = body;
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const { data: user, error } = await supabase
      .from('training_users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (error || !user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Verify password
    const encoder = new TextEncoder();
    const data = encoder.encode(password + '_carecallai_training_salt');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const password_hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    if (password_hash !== user.password_hash) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const token = Buffer.from(JSON.stringify({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: 'training_user',
      ts: Date.now(),
    })).toString('base64');

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, full_name: user.full_name },
      token,
    });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
