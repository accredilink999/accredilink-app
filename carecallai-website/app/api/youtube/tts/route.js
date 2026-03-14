import { NextResponse } from 'next/server';
import { verifyAdmin } from '../../campaigns/auth';

// Allow up to 60s for TTS generation (WebSocket + synthesis takes time)
export const maxDuration = 60;

function cleanTextForTTS(text) {
  return text
    .replace(/CareCallAI/gi, 'Care Call A.I.')
    .replace(/CareCall\b/gi, 'Care Call')
    .replace(/carecallai\.co\.uk/gi, 'care call A.I. dot co dot UK')
    .replace(/\bCIW\b/g, 'C.I.W.')
    .replace(/\bCQC\b/g, 'C.Q.C.')
    .replace(/\beMAR\b/g, 'e-MAR')
    .replace(/\bRISCA\b/g, 'RISCA')
    .replace(/\bNEWS2\b/g, 'NEWS 2')
    .replace(/\bMUST\b/g, 'MUST')
    .replace(/\[PAUSE\]/gi, '...')
    .replace(/\[CUT TO[^\]]*\]/gi, '')
    .replace(/\[B-ROLL[^\]]*\]/gi, '')
    .replace(/\[TEXT ON SCREEN[^\]]*\]/gi, '')
    .replace(/\[SCREEN[^\]]*\]/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Split text into chunks for Google Translate TTS (max ~200 chars per request)
function splitIntoChunks(text, maxLen = 180) {
  const sentences = text.replace(/([.!?])\s+/g, '$1|||').split('|||');
  const chunks = [];
  let current = '';
  for (const s of sentences) {
    if ((current + ' ' + s).trim().length > maxLen && current) {
      chunks.push(current.trim());
      current = s;
    } else {
      current = (current + ' ' + s).trim();
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

// Google Translate TTS — simple HTTP, works everywhere, no API key
async function googleTranslateTTS(text) {
  const chunks = splitIntoChunks(text);
  const audioChunks = [];

  for (const chunk of chunks) {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=en-GB&client=tw-ob&q=${encodeURIComponent(chunk)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://translate.google.com/',
      },
    });
    if (!res.ok) throw new Error(`Google TTS returned ${res.status}`);
    const buf = await res.arrayBuffer();
    audioChunks.push(Buffer.from(buf));
  }

  return Buffer.concat(audioChunks);
}

// Edge TTS — higher quality Microsoft neural voices
async function edgeTTS(text, voice) {
  const { EdgeTTS } = await import('edge-tts-universal');
  const tts = new EdgeTTS();
  await tts.synthesize(text, voice, { rate: '-5%', pitch: '+0Hz' });
  return tts.toBuffer();
}

export async function POST(request) {
  const admin = verifyAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { text, voice = 'en-GB-SoniaNeural' } = await request.json();
    if (!text || text.trim().length < 2) {
      return NextResponse.json({ error: 'text is required' }, { status: 400 });
    }

    const processedText = cleanTextForTTS(text);
    let audioBuffer;

    // Try Edge TTS first (best quality), fall back to Google Translate
    try {
      audioBuffer = await edgeTTS(processedText, voice);
      console.log('Edge TTS succeeded, buffer size:', audioBuffer.length);
    } catch (edgeErr) {
      console.warn('Edge TTS failed, falling back to Google Translate:', edgeErr.message);
      try {
        audioBuffer = await googleTranslateTTS(processedText);
        console.log('Google TTS succeeded, buffer size:', audioBuffer.length);
      } catch (googleErr) {
        console.error('Both TTS engines failed:', googleErr.message);
        return NextResponse.json({
          error: `TTS failed: Edge (${edgeErr.message}), Google (${googleErr.message})`,
        }, { status: 500 });
      }
    }

    if (!audioBuffer || audioBuffer.length < 100) {
      return NextResponse.json({ error: 'TTS returned empty audio' }, { status: 500 });
    }

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length.toString(),
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (err) {
    console.error('TTS error:', err);
    return NextResponse.json({ error: err.message || 'TTS generation failed' }, { status: 500 });
  }
}

// GET available voices
export async function GET(request) {
  const admin = verifyAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  return NextResponse.json({
    voices: [
      { id: 'en-GB-SoniaNeural', name: 'Sonia (UK Female)', locale: 'en-GB', gender: 'Female' },
      { id: 'en-GB-RyanNeural', name: 'Ryan (UK Male)', locale: 'en-GB', gender: 'Male' },
      { id: 'en-GB-LibbyNeural', name: 'Libby (UK Female)', locale: 'en-GB', gender: 'Female' },
      { id: 'en-GB-ThomasNeural', name: 'Thomas (UK Male)', locale: 'en-GB', gender: 'Male' },
    ],
  });
}
