import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyAdmin } from '../../campaigns/auth';

// GET - List questions for a course
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const course_id = searchParams.get('course_id');

  if (!course_id) return NextResponse.json({ error: 'course_id is required' }, { status: 400 });

  const { data, error } = await supabase
    .from('training_questions')
    .select('*')
    .eq('course_id', course_id)
    .order('sort_order', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, questions: data });
}

// POST - Create question (admin only)
export async function POST(request) {
  const admin = verifyAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  if (!body.course_id || !body.question || !body.options) {
    return NextResponse.json({ error: 'course_id, question, and options are required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('training_questions')
    .insert({
      course_id: body.course_id,
      question: body.question,
      options: body.options,
      correct_index: body.correct_index ?? 0,
      explanation: body.explanation || '',
      sort_order: body.sort_order || 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, question: data });
}

// PUT - Update question (admin only)
export async function PUT(request) {
  const admin = verifyAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const { data, error } = await supabase
    .from('training_questions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, question: data });
}

// DELETE - Remove question (admin only)
export async function DELETE(request) {
  const admin = verifyAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const { error } = await supabase.from('training_questions').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
