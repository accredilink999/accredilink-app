import { createClient } from 'npm:@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const DAILY_API_KEY = Deno.env.get('DAILY_API_KEY')!;
const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization') || '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    if (!GROQ_API_KEY) {
      return jsonResponse({ error: 'GROQ_API_KEY not configured' }, 500);
    }

    const { meeting_id, generate_minutes = true } = await req.json();

    if (!meeting_id) {
      return jsonResponse({ error: 'meeting_id is required' }, 400);
    }

    // Fetch the meeting
    const { data: meeting, error: meetingError } = await supabaseAdmin
      .from('meetings')
      .select('*')
      .eq('id', meeting_id)
      .single();

    if (meetingError || !meeting) {
      return jsonResponse({ error: 'Meeting not found' }, 404);
    }

    let transcript = meeting.transcript_text;

    // If we have a recording_id from Daily.co, fetch and transcribe
    if (!transcript && meeting.recording_id && DAILY_API_KEY) {
      // Get recording access link from Daily.co
      const accessRes = await fetch(
        `https://api.daily.co/v1/recordings/${meeting.recording_id}/access-link`,
        {
          headers: { Authorization: `Bearer ${DAILY_API_KEY}` },
        }
      );

      if (accessRes.ok) {
        const accessData = await accessRes.json();
        const downloadUrl = accessData.download_link;

        // Download the recording audio
        const audioRes = await fetch(downloadUrl);
        if (audioRes.ok) {
          const audioBuffer = await audioRes.arrayBuffer();
          const audioBytes = new Uint8Array(audioBuffer);

          // Convert to base64 for Whisper API
          let binary = '';
          for (let i = 0; i < audioBytes.length; i++) {
            binary += String.fromCharCode(audioBytes[i]);
          }
          const audioBase64 = btoa(binary);

          // Decode back to binary for FormData
          const binaryString = atob(audioBase64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          // Transcribe with Groq Whisper
          const formData = new FormData();
          const audioBlob = new Blob([bytes], { type: 'audio/mp4' });
          formData.append('file', audioBlob, 'recording.m4a');
          formData.append('model', 'whisper-large-v3');
          formData.append('language', 'en');
          formData.append('response_format', 'json');

          const whisperRes = await fetch(
            'https://api.groq.com/openai/v1/audio/transcriptions',
            {
              method: 'POST',
              headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
              body: formData,
            }
          );

          if (whisperRes.ok) {
            const whisperData = await whisperRes.json();
            transcript = whisperData.text || '';
          } else {
            const errText = await whisperRes.text();
            console.error('Whisper transcription error:', errText);
          }
        }
      }
    }

    // If we have a recording URL but no recording_id, try direct download
    if (!transcript && meeting.recording_url) {
      try {
        const audioRes = await fetch(meeting.recording_url);
        if (audioRes.ok) {
          const audioBuffer = await audioRes.arrayBuffer();
          const audioBytes = new Uint8Array(audioBuffer);

          const formData = new FormData();
          const audioBlob = new Blob([audioBytes], { type: 'audio/mp4' });
          formData.append('file', audioBlob, 'recording.m4a');
          formData.append('model', 'whisper-large-v3');
          formData.append('language', 'en');
          formData.append('response_format', 'json');

          const whisperRes = await fetch(
            'https://api.groq.com/openai/v1/audio/transcriptions',
            {
              method: 'POST',
              headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
              body: formData,
            }
          );

          if (whisperRes.ok) {
            const whisperData = await whisperRes.json();
            transcript = whisperData.text || '';
          }
        }
      } catch (e) {
        console.error('Direct recording download failed:', e);
      }
    }

    if (!transcript) {
      return jsonResponse({
        error: 'No recording available to transcribe. Enable recording when starting the meeting.',
      }, 400);
    }

    // Save transcript
    await supabaseAdmin
      .from('meetings')
      .update({
        transcript_text: transcript,
        updated_at: new Date().toISOString(),
      })
      .eq('id', meeting_id);

    let minutes = '';

    // Generate meeting minutes via LLM
    if (generate_minutes && transcript) {
      const llmRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: `You are a professional meeting minutes generator. Given a meeting transcript, produce well-structured meeting minutes in Markdown format including:

## Meeting Summary
A brief 2-3 sentence overview.

## Key Discussion Points
Bullet points of main topics discussed.

## Decisions Made
Any decisions agreed upon during the meeting.

## Action Items
- [ ] Task description — Assigned to: [Name if mentioned]

## Next Steps
Any follow-up items or next meeting plans.

Be concise and professional. If the transcript is unclear, note that.`,
            },
            {
              role: 'user',
              content: `Meeting: "${meeting.title}"\nDate: ${meeting.scheduled_at}\n\nTranscript:\n${transcript.slice(0, 15000)}`,
            },
          ],
          max_tokens: 2000,
          temperature: 0.3,
        }),
      });

      if (llmRes.ok) {
        const llmData = await llmRes.json();
        minutes = llmData.choices?.[0]?.message?.content || '';

        await supabaseAdmin
          .from('meetings')
          .update({
            minutes_text: minutes,
            updated_at: new Date().toISOString(),
          })
          .eq('id', meeting_id);
      } else {
        const errText = await llmRes.text();
        console.error('LLM minutes generation error:', errText);
      }
    }

    return jsonResponse({ transcript, minutes });
  } catch (err) {
    console.error('generateMeetingTranscript error:', err);
    return jsonResponse({ error: err.message || 'Internal error' }, 500);
  }
});
