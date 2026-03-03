import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getCallerFromToken } from '@/app/lib/auth';

const brandContext = {
  accredilink: {
    name: 'Accredilink Community Response Taskforce',
    description: 'A CIW-regulated domiciliary care agency based in Denbigh, North Wales. We provide compassionate home care, respite care, emergency response, palliative care, event medical services, and training across Denbighshire, Conwy, and Wrexham.',
    tone: 'Warm, professional, community-focused. Welsh pride. Emphasise compassion, reliability, and local roots.',
    website: 'www.accredilinkcare.co.uk',
    hashtags: '#Accredilink #DomiciliaryCare #NorthWales #Denbighshire #CIWRegulated #HomeCare #CareInTheHome #WelshCare #CommunityResponse',
  },
  carecallai: {
    name: 'CareCall AI',
    description: 'All-in-one home care management software for UK domiciliary care agencies. Features include scheduling/rota, care logging, eMAR, staff management, invoicing, CIW & CQC compliance, AI assistant, family portal, and mobile app.',
    tone: 'Modern, innovative, helpful. Position as the only platform with all 12 features + built-in CIW/CQC compliance. Emphasise saving time, reducing paperwork, and improving care quality.',
    website: 'carecallai.co.uk',
    hashtags: '#CareCallAI #CareTech #DomiciliaryCare #CareManagement #CIW #CQC #DigitalCare #CareHomeSoftware #HomeCareApp',
  },
};

const platformGuidelines = {
  facebook: 'Write an engaging Facebook post. Can be 1-3 paragraphs. Include a call-to-action. Emojis are OK but not excessive.',
  instagram: 'Write an Instagram caption. Start with a hook line. Use line breaks for readability. End with relevant hashtags (10-15). Include a call-to-action.',
  x: 'Write a tweet (max 280 characters). Be concise and punchy. Include 1-2 hashtags max. Can suggest a thread if the topic needs more.',
  linkedin: 'Write a professional LinkedIn post. 2-4 paragraphs. Thought-leadership style. Include industry insights. Professional tone with a human touch.',
  blog: 'Write a blog article (600-1000 words). Include an engaging title, introduction, 3-4 subheadings with content, and a conclusion with CTA. SEO-friendly.',
};

export async function POST(request) {
  const caller = getCallerFromToken(request);
  if (!caller) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured. Add it to Vercel environment variables.' }, { status: 500 });
  }

  const { brand, platform, topic, additionalContext } = await request.json();

  if (!brand || !platform || !topic) {
    return NextResponse.json({ error: 'brand, platform, and topic are required' }, { status: 400 });
  }

  const brandInfo = brandContext[brand];
  const platGuide = platformGuidelines[platform];

  if (!brandInfo || !platGuide) {
    return NextResponse.json({ error: 'Invalid brand or platform' }, { status: 400 });
  }

  const prompt = `You are a social media content creator for ${brandInfo.name}.

Brand: ${brandInfo.description}
Tone: ${brandInfo.tone}
Website: ${brandInfo.website}
Common hashtags: ${brandInfo.hashtags}

Platform: ${platform.toUpperCase()}
${platGuide}

Topic: ${topic}
${additionalContext ? `Additional context: ${additionalContext}` : ''}

Generate the content now. Return ONLY the post content — no explanations, no "Here's a post..." preamble. Just the ready-to-publish content.

${platform === 'blog' ? 'Format the blog post with markdown headings (##).' : ''}`;

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: platform === 'blog' ? 2000 : 600,
      messages: [{ role: 'user', content: prompt }],
    });

    const generatedContent = message.content[0].text;

    // Extract title for blog posts
    let title = null;
    if (platform === 'blog') {
      const titleMatch = generatedContent.match(/^#\s+(.+)/m);
      if (titleMatch) title = titleMatch[1];
    }

    // Extract hashtags
    const hashtagMatch = generatedContent.match(/(#\w+[\s]*)+$/);
    const hashtags = hashtagMatch ? hashtagMatch[0].trim() : brandInfo.hashtags;

    return NextResponse.json({
      success: true,
      generated: {
        content: generatedContent,
        title,
        hashtags,
        brand,
        platform,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'AI generation failed' }, { status: 500 });
  }
}
