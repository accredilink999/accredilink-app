import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

function verifyTrainingUser(request) {
  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.replace('Bearer ', '');
  if (!token) return null;
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());
    if (payload.role !== 'training_user' || !payload.ts) return null;
    if (Date.now() - payload.ts > 7 * 86400000) return null; // 7 day expiry
    return payload;
  } catch {
    return null;
  }
}

// GET - Get user's completions
export async function GET(request) {
  const user = verifyTrainingUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('training_completions')
    .select('*, training_courses(title, slug, category)')
    .eq('user_id', user.id)
    .order('completed_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, completions: data });
}

// POST - Submit a test attempt
export async function POST(request) {
  const user = verifyTrainingUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { course_id, answers } = body;

  if (!course_id || !answers) {
    return NextResponse.json({ error: 'course_id and answers are required' }, { status: 400 });
  }

  // Get course pass mark
  const { data: course } = await supabase
    .from('training_courses')
    .select('pass_mark, title')
    .eq('id', course_id)
    .single();

  if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 });

  // Get questions and calculate score
  const { data: questions } = await supabase
    .from('training_questions')
    .select('id, correct_index')
    .eq('course_id', course_id)
    .order('sort_order', { ascending: true });

  if (!questions || questions.length === 0) {
    return NextResponse.json({ error: 'No questions found for this course' }, { status: 400 });
  }

  let correct = 0;
  questions.forEach((q, i) => {
    if (answers[i] === q.correct_index) correct++;
  });

  const score = Math.round((correct / questions.length) * 100);
  const passed = score >= (course.pass_mark || 80);

  // Generate certificate number if passed
  let certificate_number = null;
  if (passed) {
    const prefix = 'CC';
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    certificate_number = `${prefix}-${dateStr}-${random}`;
  }

  const { data, error } = await supabase
    .from('training_completions')
    .insert({
      user_id: user.id,
      course_id,
      score,
      passed,
      answers,
      certificate_number,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    success: true,
    completion: data,
    score,
    passed,
    correct,
    total: questions.length,
    certificate_number,
    course_title: course.title,
    user_name: user.full_name,
  });
}
