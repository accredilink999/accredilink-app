import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { verifyAdmin } from '../../campaigns/auth';

const VIDEO_TYPE_CONTEXT = {
  compliance_tutorial: 'A tutorial explaining compliance requirements, regulations, or inspection preparation. Educational and authoritative.',
  feature_demo: 'A product demonstration showing CareCallAI features in action. Practical and engaging with clear step-by-step instructions.',
  industry_tips: 'Industry tips, best practices, or expert advice for care providers. Thought-leadership style.',
  training_content: 'Staff training material that care managers can use for team development. Clear, instructional.',
  case_study: 'A case study or success story showing before/after transformation. Story-driven and relatable.',
  news_update: 'An industry news update or regulatory change announcement. Timely and informative.',
};

const AUDIENCE_DESC = {
  all: 'domiciliary care agency managers and care home managers across Wales and England',
  ciw: 'domiciliary care agencies and care homes in Wales regulated by Care Inspectorate Wales (CIW)',
  cqc: 'domiciliary care agencies and care homes in England regulated by the Care Quality Commission (CQC)',
  care_home: 'residential care home managers in Wales and England',
  domiciliary: 'domiciliary (home care) agency managers in Wales and England',
};

const TONE_DESC = {
  professional: 'Professional, authoritative, trustworthy. Like a knowledgeable colleague.',
  friendly: 'Warm, approachable, conversational. Like talking to a helpful friend.',
  urgent: 'Direct, compelling, time-sensitive. Creates urgency without being pushy.',
  educational: 'Clear, structured, teacher-like. Focus on learning outcomes.',
};

export async function POST(request) {
  const admin = verifyAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
  }

  const { videoType, topic, targetAudience, targetDuration, tone, additionalContext } = await request.json();

  if (!videoType || !topic) {
    return NextResponse.json({ error: 'videoType and topic are required' }, { status: 400 });
  }

  const durationSecs = targetDuration || 360;
  const durationMins = Math.round(durationSecs / 60);
  const approxWords = Math.round(durationSecs * 2.5);

  const prompt = `You are a professional YouTube scriptwriter for CareCallAI, an all-in-one care management platform for UK domiciliary care agencies and care homes.

ABOUT CARECALLAI:
- Website: carecallai.co.uk
- Features: scheduling/rota, digital care logging with GPS, eMAR, clinical assessments (Waterlow, MUST, NEWS2, Falls Risk, Abbey Pain, Barthel, SALT), CIW & CQC compliance management with pre-populated regulation forms, 12-weekly staff supervision tracking (RISCA Reg 36), safeguarding incident reporting, family portal, AI care insights, mobile app.
- USP: Only platform offering all 12 core features with built-in CIW/CQC compliance in one system
- Built in Wales, trusted by UK care providers

VIDEO TYPE: ${VIDEO_TYPE_CONTEXT[videoType] || videoType}
TOPIC: ${topic}
TARGET AUDIENCE: ${AUDIENCE_DESC[targetAudience] || targetAudience || AUDIENCE_DESC.all}
TONE: ${TONE_DESC[tone] || tone || TONE_DESC.professional}
TARGET DURATION: ${durationSecs} seconds (approximately ${durationMins} minutes, ${approxWords} words)
${additionalContext ? `ADDITIONAL CONTEXT: ${additionalContext}` : ''}

Write a complete YouTube video script following professional best practices:

SCRIPT STRUCTURE REQUIREMENTS:
1. HOOK (0-10 seconds): Start with a pattern interrupt — a surprising statistic, bold claim, or compelling question that stops viewers scrolling. Do NOT start with "Hey guys" or "Welcome to...". The first sentence must create curiosity or urgency.

2. INTRO (10-30 seconds): Briefly introduce what the video covers and why the viewer should keep watching. Include a "stick around because..." promise.

3. CONTENT SECTIONS (3-5 sections): Each section should have:
   - A clear title (used as a YouTube chapter/timestamp marker)
   - Estimated duration in seconds
   - The spoken script (natural, conversational, designed for speaking aloud)
   - Visual/production notes (what should appear on screen — text overlays, screen recordings, B-roll suggestions)

4. CTA (near the 70% mark of the video): Primary call to action for CareCallAI — mention the free demo, specific feature, or carecallai.co.uk. Make it natural, not salesy.

5. OUTRO (final 20-30 seconds): Recap the key takeaway, ask viewers to subscribe and hit the bell, tease a related topic for the next video, tell viewers to click the card on screen.

SCRIPT STYLE RULES:
- Write for SPEAKING, not reading. Use contractions, short sentences, conversational language.
- Use UK English spelling (organisation, optimise, colour).
- CRITICAL: DO NOT repeat the same phrases, words, or sentence structures across sections. Each section must feel fresh and distinct. Vary your vocabulary, sentence length, and rhythm throughout.
- DO NOT overuse the channel name, product name, or filler phrases like "let's dive in", "here's the thing", "so what does this mean". Use each transition phrase ONCE maximum.
- Include [PAUSE] markers for dramatic pauses (max 2-3 per script).
- Include [CUT TO SCREEN RECORDING] or [B-ROLL] or [TEXT ON SCREEN] markers for visual transitions.
- Each section should approach the topic from a different angle — don't just list points, tell mini-stories, use examples, ask rhetorical questions, and share practical tips.
- Reference specific regulations (RISCA, CQC, Reg 36, etc.) when relevant.
- Include 1-2 real statistics or data points where possible.
- Mention that more video courses and training content are coming to the CareCallAI Guru YouTube channel — encourage viewers to subscribe so they don't miss new content.
- The channel mascot is called "Guru" — you can reference him naturally (e.g. "Guru here to walk you through...", "as Guru always says...").

SEO REQUIREMENTS:
- YouTube title: max 66 characters, include primary keyword near the start, create curiosity
- Description: 200+ words. First 2 sentences must include CTA link to carecallai.co.uk. Include full timestamps. Include 3-5 relevant links/resources. End with hashtags.
- Tags: 8-12 relevant YouTube tags mixing broad and specific terms
- Thumbnail text: 2-4 bold words that work on a thumbnail (high contrast, readable at small size)

Return ONLY valid JSON with NO markdown code fences. Use this exact structure:
{
  "title": "internal title for management",
  "youtubeTitle": "YouTube title (max 66 chars)",
  "youtubeDescription": "full YouTube description with timestamps and CTAs",
  "tags": ["tag1", "tag2"],
  "thumbnailText": "2-4 WORD THUMBNAIL",
  "hook": "the first 10 seconds of script",
  "sections": [
    {
      "title": "Section Title",
      "duration": 60,
      "script": "the spoken script for this section",
      "visualNotes": "what appears on screen"
    }
  ],
  "cta": "the call to action script",
  "outro": "the outro script",
  "fullScript": "complete script combined in speaking order (hook + intro + all sections + cta + outro)",
  "estimatedDuration": ${durationSecs},
  "wordCount": ${approxWords}
}`;

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 6000,
      messages: [{ role: 'user', content: prompt }],
    });

    let text = message.content[0].text.trim();
    // Strip markdown code fences if present
    if (text.startsWith('```')) {
      text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const generated = JSON.parse(text);

    return NextResponse.json({ success: true, generated });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'AI generation failed' }, { status: 500 });
  }
}
