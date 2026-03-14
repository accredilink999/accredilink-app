import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyAdmin } from '../../campaigns/auth';

export const maxDuration = 60;

// Exchange refresh token for a fresh access token
async function getAccessToken() {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: process.env.YOUTUBE_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OAuth token exchange failed: ${err}`);
  }
  const data = await res.json();
  return data.access_token;
}

export async function POST(request) {
  const admin = verifyAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Check credentials are configured
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.YOUTUBE_REFRESH_TOKEN) {
    return NextResponse.json({
      error: 'YouTube API not configured. Add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and YOUTUBE_REFRESH_TOKEN to environment variables.',
    }, { status: 500 });
  }

  try {
    const { script_id, privacy = 'private' } = await request.json();
    if (!script_id) {
      return NextResponse.json({ error: 'script_id is required' }, { status: 400 });
    }

    // Fetch script from DB
    const { data: script, error: scriptErr } = await supabase
      .from('youtube_scripts')
      .select('*')
      .eq('id', script_id)
      .single();

    if (scriptErr || !script) {
      return NextResponse.json({ error: 'Script not found' }, { status: 404 });
    }
    if (!script.video_url) {
      return NextResponse.json({ error: 'No video file attached to this script. Upload a video first.' }, { status: 400 });
    }

    // Get YouTube access token
    const accessToken = await getAccessToken();

    // Download video from Supabase Storage
    console.log('Downloading video from:', script.video_url);
    const videoRes = await fetch(script.video_url);
    if (!videoRes.ok) {
      throw new Error(`Failed to download video: ${videoRes.status}`);
    }
    const videoBuffer = Buffer.from(await videoRes.arrayBuffer());
    const contentType = videoRes.headers.get('content-type') || 'video/mp4';
    console.log('Video downloaded, size:', videoBuffer.length, 'type:', contentType);

    // Build YouTube metadata
    const metadata = {
      snippet: {
        title: (script.youtube_title || script.title || 'Untitled').slice(0, 100),
        description: (script.youtube_description || '').slice(0, 5000),
        tags: (script.tags || []).slice(0, 30),
        categoryId: '27', // Education
      },
      status: {
        privacyStatus: privacy, // private, unlisted, or public
        selfDeclaredMadeForKids: false,
      },
    };

    // Step 1: Initiate resumable upload
    const initRes = await fetch(
      'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json; charset=UTF-8',
          'X-Upload-Content-Length': videoBuffer.length.toString(),
          'X-Upload-Content-Type': contentType,
        },
        body: JSON.stringify(metadata),
      }
    );

    if (!initRes.ok) {
      const errBody = await initRes.text();
      throw new Error(`YouTube upload init failed (${initRes.status}): ${errBody}`);
    }

    const uploadUrl = initRes.headers.get('location');
    if (!uploadUrl) {
      throw new Error('No upload URL returned from YouTube');
    }

    // Step 2: Upload the video bytes
    console.log('Uploading', videoBuffer.length, 'bytes to YouTube...');
    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
        'Content-Length': videoBuffer.length.toString(),
      },
      body: videoBuffer,
    });

    if (!uploadRes.ok) {
      const errBody = await uploadRes.text();
      throw new Error(`YouTube video upload failed (${uploadRes.status}): ${errBody}`);
    }

    const ytVideo = await uploadRes.json();
    const youtubeVideoId = ytVideo.id;
    const youtubeUrl = `https://www.youtube.com/watch?v=${youtubeVideoId}`;

    console.log('YouTube upload complete:', youtubeUrl);

    // Update script in DB
    await supabase
      .from('youtube_scripts')
      .update({
        youtube_video_id: youtubeVideoId,
        youtube_url: youtubeUrl,
        status: 'published',
        updated_at: new Date().toISOString(),
      })
      .eq('id', script_id);

    return NextResponse.json({
      success: true,
      youtube_video_id: youtubeVideoId,
      youtube_url: youtubeUrl,
    });
  } catch (err) {
    console.error('YouTube publish error:', err);
    return NextResponse.json({ error: err.message || 'YouTube publish failed' }, { status: 500 });
  }
}
