import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// HeyGen webhook handler — receives video completion events
export async function POST(request) {
  try {
    const event = await request.json();
    const eventType = event.event_type || event.event_name;
    const videoId = event.data?.video_id || event.video_id;

    if (!videoId) {
      return NextResponse.json({ received: true });
    }

    if (eventType === 'avatar_video.success' || eventType === 'video_agent.success') {
      const videoUrl = event.data?.video_url || event.data?.url;

      // Find script by heygen_video_id and update
      const { data: script } = await supabase
        .from('youtube_scripts')
        .select('id')
        .eq('heygen_video_id', videoId)
        .single();

      if (script) {
        await supabase
          .from('youtube_scripts')
          .update({
            video_url: videoUrl,
            status: 'video_ready',
            updated_at: new Date().toISOString(),
          })
          .eq('id', script.id);
      }
    }

    if (eventType === 'avatar_video.fail' || eventType === 'video_agent.fail') {
      const { data: script } = await supabase
        .from('youtube_scripts')
        .select('id')
        .eq('heygen_video_id', videoId)
        .single();

      if (script) {
        await supabase
          .from('youtube_scripts')
          .update({
            status: 'draft',
            notes: `Video generation failed: ${event.data?.error || 'Unknown error'}`,
            updated_at: new Date().toISOString(),
          })
          .eq('id', script.id);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    return NextResponse.json({ received: true, error: err.message });
  }
}
