import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getCallerFromToken } from '@/app/lib/auth';

// GET /api/social — list posts (with optional filters)
export async function GET(request) {
  const caller = getCallerFromToken(request);
  if (!caller) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const brand = searchParams.get('brand');
  const platform = searchParams.get('platform');
  const status = searchParams.get('status');

  let query = supabase
    .from('social_posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (brand) query = query.eq('brand', brand);
  if (platform) query = query.eq('platform', platform);
  if (status) query = query.eq('status', status);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, posts: data });
}

// POST /api/social — create a new post
export async function POST(request) {
  const caller = getCallerFromToken(request);
  if (!caller) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { brand, platform, title, content, hashtags, scheduled_at, status } = body;

  if (!brand || !platform || !content) {
    return NextResponse.json({ error: 'brand, platform, and content are required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('social_posts')
    .insert({
      brand,
      platform,
      title: title || null,
      content,
      hashtags: hashtags || null,
      scheduled_at: scheduled_at || null,
      status: status || 'draft',
      created_by: caller.name || caller.email,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, post: data });
}

// PUT /api/social — update a post
export async function PUT(request) {
  const caller = getCallerFromToken(request);
  if (!caller) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('social_posts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, post: data });
}

// DELETE /api/social — delete a post
export async function DELETE(request) {
  const caller = getCallerFromToken(request);
  if (!caller) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await request.json();

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('social_posts')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
