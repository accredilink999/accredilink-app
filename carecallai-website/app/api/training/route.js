import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyAdmin } from '../campaigns/auth';

// GET - List all courses (public for published, all for admin)
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const publicOnly = searchParams.get('public') === '1';
  const slug = searchParams.get('slug');

  let query = supabase
    .from('training_courses')
    .select('*')
    .order('sort_order', { ascending: true });

  if (publicOnly) query = query.eq('status', 'published');
  if (slug) query = query.eq('slug', slug).single();

  const { data, error } = slug ? await query : await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, courses: slug ? [data] : data });
}

// POST - Create course (admin only)
export async function POST(request) {
  const admin = verifyAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  if (!body.title || !body.slug) {
    return NextResponse.json({ error: 'title and slug are required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('training_courses')
    .insert({
      title: body.title,
      slug: body.slug,
      category: body.category || 'mandatory',
      description: body.description || '',
      duration_minutes: body.duration_minutes || 15,
      youtube_url: body.youtube_url || null,
      thumbnail_url: body.thumbnail_url || null,
      pass_mark: body.pass_mark || 80,
      status: body.status || 'draft',
      sort_order: body.sort_order || 0,
      pin_code: body.pin_code || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, course: data });
}

// PUT - Update course (admin only)
export async function PUT(request) {
  const admin = verifyAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('training_courses')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, course: data });
}

// DELETE - Remove course (admin only)
export async function DELETE(request) {
  const admin = verifyAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const { error } = await supabase.from('training_courses').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
