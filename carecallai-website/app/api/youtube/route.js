import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyAdmin } from '../campaigns/auth';

export async function GET(request) {
  const admin = verifyAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const video_type = searchParams.get('video_type');

  let query = supabase
    .from('youtube_scripts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (status) query = query.eq('status', status);
  if (video_type) query = query.eq('video_type', video_type);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, scripts: data });
}

export async function POST(request) {
  const admin = verifyAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  if (!body.title) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('youtube_scripts')
    .insert({
      title: body.title,
      video_type: body.video_type || 'compliance_tutorial',
      topic_category: body.topic_category || 'compliance',
      target_audience: body.target_audience || 'all',
      tone: body.tone || 'professional',
      target_duration: body.target_duration || 360,
      youtube_title: body.youtube_title || null,
      youtube_description: body.youtube_description || null,
      tags: body.tags || [],
      thumbnail_text: body.thumbnail_text || null,
      hook: body.hook || null,
      sections: body.sections || [],
      cta: body.cta || null,
      outro: body.outro || null,
      full_script: body.full_script || null,
      estimated_duration: body.estimated_duration || null,
      word_count: body.word_count || null,
      status: body.status || 'draft',
      notes: body.notes || null,
      created_by: admin.email || 'admin',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, script: data });
}

export async function PUT(request) {
  const admin = verifyAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('youtube_scripts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, script: data });
}

export async function DELETE(request) {
  const admin = verifyAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const { error } = await supabase.from('youtube_scripts').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
