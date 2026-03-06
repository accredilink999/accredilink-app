import { NextResponse } from 'next/server';
import { verifyAdmin } from '../../campaigns/auth';

// Split text into chunks at sentence boundaries (~190 chars max for Google TTS)
function splitText(text, maxLen = 180) {
  if (text.length <= maxLen) return [text];
  const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
  const chunks = [];
  let current = '';
  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;
    if ((current + ' ' + trimmed).trim().length > maxLen && current) {
      chunks.push(current.trim());
      current = trimmed;
    } else {
      current = (current + ' ' + trimmed).trim();
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

export async function POST(request) {
  const admin = verifyAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { text, lang = 'en-GB' } = await request.json();
    if (!text || text.trim().length < 2) {
      return NextResponse.json({ error: 'text is required' }, { status: 400 });
    }

    // Replace CareCallAI with phonetic pronunciation for TTS
    const processedText = text
      .replace(/CareCallAI/gi, 'Care Call A.I.')
      .replace(/CareCall/gi, 'Care Call')
      .replace(/carecallai\.co\.uk/gi, 'care call a.i. dot co dot u.k.')
      .replace(/RISCA/g, 'RISCA')
      .replace(/CIW/g, 'C.I.W.')
      .replace(/CQC/g, 'C.Q.C.')
      .replace(/eMAR/g, 'e-MAR');

    const chunks = splitText(processedText);
    const audioBuffers = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(lang)}&client=tw-ob&q=${encodeURIComponent(chunk)}&total=${chunks.length}&idx=${i}&textlen=${chunk.length}`;

      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://translate.google.com/',
        },
      });

      if (!res.ok) {
        console.error(`TTS chunk ${i} failed: ${res.status}`);
        throw new Error(`TTS generation failed for chunk ${i + 1}`);
      }

      const buffer = await res.arrayBuffer();
      audioBuffers.push(Buffer.from(buffer));
    }

    const combined = Buffer.concat(audioBuffers);

    return new NextResponse(combined, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': combined.length.toString(),
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (err) {
    console.error('TTS error:', err);
    return NextResponse.json({ error: err.message || 'TTS generation failed' }, { status: 500 });
  }
}
