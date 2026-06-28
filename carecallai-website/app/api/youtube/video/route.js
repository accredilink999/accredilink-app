import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyAdmin } from '../../campaigns/auth';

const HEYGEN_API = 'https://api.heygen.com';

// POST — Generate video from a saved script via HeyGen
export async function POST(request) {
  const admin = verifyAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!process.env.HEYGEN_API_KEY) {
    return NextResponse.json({ error: 'HEYGEN_API_KEY not configured. Add it to Vercel environment variables.' }, { status: 500 });
  }

  const { script_id, avatar_id, voice_id, background } = await request.json();
  if (!script_id) return NextResponse.json({ error: 'script_id is required' }, { status: 400 });

  // Load the script
  const { data: script, error: scriptErr } = await supabase
    .from('youtube_scripts')
    .select('*')
    .eq('id', script_id)
    .single();

  if (scriptErr || !script) return NextResponse.json({ error: 'Script not found' }, { status: 404 });
  if (!script.full_script) return NextResponse.json({ error: 'Script has no content. Generate a script first.' }, { status: 400 });

  // Build HeyGen scenes from script sections
  const scenes = [];
  const sections = script.sections || [];

  // Add hook as first scene
  if (script.hook) {
    scenes.push({
      script: { type: 'text', input: script.hook.substring(0, 4999) },
      ...(avatar_id && { avatar: { avatar_id, scale: 1, style: 'normal' } }),
      ...(background && { background: { type: 'color', value: background || '#0d9488' } }),
    });
  }

  // Add content sections
  for (const section of sections) {
    if (section.script) {
      scenes.push({
        script: { type: 'text', input: section.script.substring(0, 4999) },
        ...(avatar_id && { avatar: { avatar_id, scale: 1, style: 'normal' } }),
        ...(background && { background: { type: 'color', value: background || '#0d9488' } }),
      });
    }
  }

  // Add CTA as scene
  if (script.cta) {
    scenes.push({
      script: { type: 'text', input: script.cta.substring(0, 4999) },
      ...(avatar_id && { avatar: { avatar_id, scale: 1, style: 'normal' } }),
      ...(background && { background: { type: 'color', value: background || '#0d9488' } }),
    });
  }

  // Add outro as scene
  if (script.outro) {
    scenes.push({
      script: { type: 'text', input: script.outro.substring(0, 4999) },
      ...(avatar_id && { avatar: { avatar_id, scale: 1, style: 'normal' } }),
      ...(background && { background: { type: 'color', value: background || '#0d9488' } }),
    });
  }

  // If no scenes built, use full script as single scene
  if (scenes.length === 0 && script.full_script) {
    scenes.push({
      script: { type: 'text', input: script.full_script.substring(0, 4999) },
      ...(avatar_id && { avatar: { avatar_id, scale: 1, style: 'normal' } }),
      ...(background && { background: { type: 'color', value: background || '#0d9488' } }),
    });
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.carecallai.co.uk';

  try {
    const res = await fetch(`${HEYGEN_API}/v2/video/generate`, {
      method: 'POST',
      headers: {
        'X-Api-Key': process.env.HEYGEN_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: script.youtube_title || script.title,
        video_inputs: scenes,
        dimension: { width: 1920, height: 1080 },
        caption: true,
        callback_url: `${baseUrl}/api/youtube/webhook`,
      }),
    });

    const result = await res.json();

    if (!res.ok || result.error) {
      return NextResponse.json({ error: result.error?.message || result.message || 'HeyGen API error' }, { status: 500 });
    }

    const videoId = result.data?.video_id;

    // Update script with HeyGen video ID and status
    await supabase
      .from('youtube_scripts')
      .update({
        heygen_video_id: videoId,
        status: 'generating_video',
        updated_at: new Date().toISOString(),
      })
      .eq('id', script_id);

    return NextResponse.json({ success: true, video_id: videoId, message: 'Video generation started' });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Failed to start video generation' }, { status: 500 });
  }
}

// GET — Check video generation status
export async function GET(request) {
  const admin = verifyAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!process.env.HEYGEN_API_KEY) {
    return NextResponse.json({ error: 'HEYGEN_API_KEY not configured' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const video_id = searchParams.get('video_id');
  const script_id = searchParams.get('script_id');

  if (!video_id && !script_id) {
    return NextResponse.json({ error: 'video_id or script_id is required' }, { status: 400 });
  }

  let heygenVideoId = video_id;

  // If script_id provided, look up the heygen_video_id
  if (!heygenVideoId && script_id) {
    const { data } = await supabase
      .from('youtube_scripts')
      .select('heygen_video_id')
      .eq('id', script_id)
      .single();
    heygenVideoId = data?.heygen_video_id;
  }

  if (!heygenVideoId) {
    return NextResponse.json({ error: 'No video generation found for this script' }, { status: 404 });
  }

  try {
    const res = await fetch(`${HEYGEN_API}/v1/video_status.get?video_id=${heygenVideoId}`, {
      headers: { 'X-Api-Key': process.env.HEYGEN_API_KEY },
    });

    const result = await res.json();

    if (!res.ok) {
      return NextResponse.json({ error: result.message || 'Failed to check status' }, { status: 500 });
    }

    const status = result.data?.status;
    const videoUrl = result.data?.video_url;

    // If completed, update the script record
    if (status === 'completed' && videoUrl && script_id) {
      await supabase
        .from('youtube_scripts')
        .update({
          video_url: videoUrl,
          status: 'video_ready',
          updated_at: new Date().toISOString(),
        })
        .eq('id', script_id);
    }

    return NextResponse.json({
      success: true,
      status,
      video_url: videoUrl || null,
      thumbnail_url: result.data?.thumbnail_url || null,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Failed to check video status' }, { status: 500 });
  }
}
