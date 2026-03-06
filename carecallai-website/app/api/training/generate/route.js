import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { verifyAdmin } from '../../campaigns/auth';

// Extract YouTube video ID from various URL formats
function extractVideoId(url) {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

// Fetch YouTube transcript using the Innertube API (no API key needed)
async function fetchYouTubeTranscript(videoId) {
  try {
    // First get the video page to extract caption track
    const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });
    const html = await pageRes.text();

    // Extract serialized player response
    const match = html.match(/"captions":\s*(\{.*?"playerCaptionsTracklistRenderer".*?\})\s*,\s*"/s);
    if (!match) return null;

    // Try to parse and find caption URL
    const captionsJson = match[0].replace(/,$/, '').replace(/^"captions":\s*/, '');
    let captions;
    try {
      captions = JSON.parse(captionsJson);
    } catch {
      // Try extracting URL directly
      const urlMatch = html.match(/"baseUrl":"(https:\/\/www\.youtube\.com\/api\/timedtext[^"]+)"/);
      if (!urlMatch) return null;
      const captionUrl = urlMatch[1].replace(/\\u0026/g, '&');
      const captionRes = await fetch(captionUrl);
      const captionXml = await captionRes.text();
      return parseTranscriptXml(captionXml);
    }

    const tracks = captions?.playerCaptionsTracklistRenderer?.captionTracks;
    if (!tracks || tracks.length === 0) return null;

    // Prefer English, fall back to first track
    const enTrack = tracks.find(t => t.languageCode === 'en') || tracks[0];
    const captionUrl = enTrack.baseUrl;

    const captionRes = await fetch(captionUrl);
    const captionXml = await captionRes.text();
    return parseTranscriptXml(captionXml);
  } catch (err) {
    console.error('Transcript fetch error:', err.message);
    return null;
  }
}

function parseTranscriptXml(xml) {
  // Extract text from <text> elements
  const textMatches = [...xml.matchAll(/<text[^>]*>(.*?)<\/text>/gs)];
  if (textMatches.length === 0) return null;

  const lines = textMatches.map(m =>
    m[1]
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/<[^>]+>/g, '')
      .trim()
  ).filter(Boolean);

  return lines.join(' ');
}

export async function POST(request) {
  const admin = verifyAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
  }

  const body = await request.json();
  const { course_title, youtube_url, script_text, num_questions, difficulty } = body;

  if (!course_title) {
    return NextResponse.json({ error: 'course_title is required' }, { status: 400 });
  }

  // Get content from either YouTube transcript, script text, or just the course title
  let contentSource = '';
  let sourceType = 'title_only';

  if (script_text && script_text.trim().length > 50) {
    contentSource = script_text.trim();
    sourceType = 'script';
  } else if (youtube_url) {
    const videoId = extractVideoId(youtube_url);
    if (videoId) {
      const transcript = await fetchYouTubeTranscript(videoId);
      if (transcript && transcript.length > 50) {
        contentSource = transcript;
        sourceType = 'youtube_transcript';
      }
    }
  }

  const questionCount = Math.min(Math.max(num_questions || 10, 3), 25);
  const diffLevel = difficulty || 'standard';

  const prompt = `You are an expert UK care sector trainer creating assessment questions for domiciliary care and care home staff training.

COURSE: ${course_title}
${contentSource ? `\nSOURCE CONTENT (${sourceType}):\n${contentSource.substring(0, 8000)}` : '\nNo source content provided — generate questions based on your expert knowledge of this topic as it applies to UK domiciliary care and care home settings.'}

DIFFICULTY: ${diffLevel} (standard = straightforward knowledge checks, advanced = scenario-based & application questions)

Generate exactly ${questionCount} multiple-choice questions for this training course assessment.

QUESTION GUIDELINES:
- Questions should test understanding, not just recall — include scenario-based questions where possible
- All questions must be relevant to UK care settings (domiciliary care and care homes)
- Reference relevant UK legislation, regulations, and best practice where appropriate (CIW, CQC, RISCA, Health & Social Care Act, Mental Capacity Act, COSHH, RIDDOR, etc.)
- Each question must have exactly 4 answer options (A, B, C, D)
- Only ONE option should be the correct answer
- Wrong answers should be plausible but clearly incorrect to someone who has studied the material
- Include an explanation for the correct answer that reinforces learning
- Mix question types: knowledge recall, scenario application, best practice, regulatory knowledge
- Use UK English spelling throughout (organisation, recognise, colour, etc.)
- Questions should progress from basic knowledge to more applied/scenario-based

Return ONLY valid JSON with NO markdown code fences. Use this exact structure:
{
  "questions": [
    {
      "question": "The full question text?",
      "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
      "correct_index": 0,
      "explanation": "Explanation of why the correct answer is right and what the learner should know.",
      "difficulty": "basic|intermediate|advanced"
    }
  ]
}`;

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }],
    });

    let text = message.content[0].text.trim();
    if (text.startsWith('```')) {
      text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const generated = JSON.parse(text);

    return NextResponse.json({
      success: true,
      questions: generated.questions || [],
      source_type: sourceType,
      content_length: contentSource.length,
    });
  } catch (err) {
    console.error('Question generation error:', err);
    return NextResponse.json({ error: err.message || 'AI generation failed' }, { status: 500 });
  }
}
