import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyAdmin } from '../../campaigns/auth';

export const maxDuration = 60;

export async function POST(request) {
  const admin = verifyAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get('video');
    const scriptId = formData.get('script_id');

    if (!file) {
      return NextResponse.json({ error: 'No video file provided' }, { status: 400 });
    }

    // Validate file type
    const validTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. MP4, WebM, MOV or AVI only.' }, { status: 400 });
    }

    // Max 500MB
    if (file.size > 500 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum 500MB.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split('.').pop() || 'mp4';
    const fileName = `youtube-videos/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('media')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      // If bucket doesn't exist, create it
      if (uploadError.message?.includes('not found') || uploadError.statusCode === '404') {
        await supabase.storage.createBucket('media', { public: true });
        const { error: retryError } = await supabase.storage
          .from('media')
          .upload(fileName, buffer, { contentType: file.type, upsert: false });
        if (retryError) throw retryError;
      } else {
        throw uploadError;
      }
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from('media').getPublicUrl(fileName);
    const videoUrl = urlData.publicUrl;

    // If script_id provided, update the script with the video URL
    if (scriptId) {
      await supabase
        .from('youtube_scripts')
        .update({
          video_url: videoUrl,
          status: 'video_ready',
          updated_at: new Date().toISOString(),
        })
        .eq('id', scriptId);
    }

    return NextResponse.json({
      success: true,
      video_url: videoUrl,
      file_name: fileName,
      file_size: file.size,
    });
  } catch (err) {
    console.error('Video upload error:', err);
    return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 500 });
  }
}
