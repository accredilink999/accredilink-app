import { createClient } from '@supabase/supabase-js';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CRON_SECRET = process.env.CRON_SECRET;

const BLOG_TOPICS = [
  {
    slug: 'ciw-compliance-checklist-domiciliary-care-wales',
    title: 'CIW Compliance Checklist for Domiciliary Care Agencies in Wales',
    category: 'Compliance',
    keywords: ['CIW compliance', 'RISCA 2016', 'domiciliary care Wales', 'CIW inspection checklist'],
    descriptionHint: 'A practical checklist covering everything CIW inspectors look for in a domiciliary care agency in Wales.',
  },
  {
    slug: 'cqc-key-lines-of-enquiry-home-care-guide',
    title: 'CQC Key Lines of Enquiry: A Complete Guide for Home Care Providers',
    category: 'Compliance',
    keywords: ['CQC KLoE', 'CQC inspection', 'home care compliance', 'CQC rating'],
    descriptionHint: 'Explain the 5 KLoE areas and what CQC inspectors want to see from domiciliary care providers.',
  },
  {
    slug: 'digital-care-records-ciw-cqc-requirements',
    title: 'Digital Care Records: What CIW and CQC Actually Require',
    category: 'Compliance',
    keywords: ['digital care records', 'CIW digital records', 'CQC care records', 'care documentation'],
    descriptionHint: 'Clarify what both regulators actually require for digital record-keeping and how software helps.',
  },
  {
    slug: 'staff-supervision-every-12-weeks-risca-reg-36',
    title: 'How to Manage Staff Supervisions Every 12 Weeks (RISCA Reg 36)',
    category: 'Staff Management',
    keywords: ['staff supervision care', 'RISCA Reg 36', '12-weekly supervision', 'care staff supervision'],
    descriptionHint: 'Practical guide to meeting the 12-weekly supervision requirement under RISCA Regulation 36.',
  },
  {
    slug: 'emar-vs-paper-mar-charts-safety-comparison',
    title: 'eMAR vs Paper MAR Charts: Which Is Safer for Your Care Agency?',
    category: 'Medication',
    keywords: ['eMAR care', 'electronic MAR chart', 'paper MAR chart problems', 'medication management care'],
    descriptionHint: 'Compare electronic vs paper MAR charts on safety, compliance, and efficiency.',
  },
  {
    slug: 'safeguarding-incident-reporting-domiciliary-care-guide',
    title: 'The Complete Guide to Safeguarding Incident Reporting in Domiciliary Care',
    category: 'Compliance',
    keywords: ['safeguarding reporting care', 'incident reporting domiciliary care', 'CIW safeguarding', 'CQC safeguarding'],
    descriptionHint: 'Step-by-step guide to reporting safeguarding incidents correctly and meeting regulatory requirements.',
  },
  {
    slug: 'reduce-staff-turnover-care-agency',
    title: 'How to Reduce Staff Turnover in Your Care Agency',
    category: 'Staff Management',
    keywords: ['care staff retention', 'reduce staff turnover care', 'care agency recruitment', 'domiciliary care staffing'],
    descriptionHint: 'Practical strategies for retaining care staff including better scheduling, communication and development.',
  },
  {
    slug: 'care-plan-software-what-to-look-for-2026',
    title: 'Care Plan Software: What to Look for in 2026',
    category: 'Getting Started',
    keywords: ['care plan software', 'care management software UK', 'best care software 2026', 'domiciliary care software'],
    descriptionHint: 'Buyers guide for care managers evaluating care management software in 2026.',
  },
  {
    slug: 'gps-tracking-domiciliary-care-benefits-gdpr',
    title: 'GPS Tracking for Domiciliary Care: Benefits, Concerns and GDPR',
    category: 'Technology',
    keywords: ['GPS tracking care', 'domiciliary care GPS', 'care staff tracking', 'GDPR care tracking'],
    descriptionHint: 'Explain how GPS tracking works in care, its benefits for safety and compliance, and GDPR considerations.',
  },
  {
    slug: 'how-to-prepare-ciw-inspection-managers-guide',
    title: 'How to Prepare for a CIW Inspection: A Manager\'s Guide',
    category: 'Compliance',
    keywords: ['CIW inspection preparation', 'CIW inspection tips', 'prepare for CIW inspection'],
    descriptionHint: 'Step-by-step preparation guide for registered managers facing a CIW inspection.',
  },
  {
    slug: 'what-is-news2-care-agency-clinical-assessment',
    title: 'What Is NEWS2 and Why Your Care Agency Should Be Using It',
    category: 'Clinical',
    keywords: ['NEWS2 care', 'clinical assessment care', 'early warning score care home'],
    descriptionHint: 'Explain the NEWS2 early warning system and how it helps domiciliary care agencies detect deterioration.',
  },
  {
    slug: 'mobile-app-for-carers-essential-features',
    title: 'Mobile Apps for Carers: What Features Actually Matter',
    category: 'Technology',
    keywords: ['carer mobile app', 'domiciliary care mobile app', 'care staff app'],
    descriptionHint: 'What features carers actually need on their phone — care logging, eMAR, rota, GPS check-in.',
  },
  {
    slug: 'ai-home-care-management-2026',
    title: 'How AI is Changing Home Care Management in 2026',
    category: 'Technology',
    keywords: ['AI care management', 'artificial intelligence domiciliary care', 'care technology 2026'],
    descriptionHint: 'How AI is being used in care management — from automated scheduling to compliance checking.',
  },
  {
    slug: 'waterlow-must-assessments-domiciliary-care',
    title: 'Understanding Waterlow and MUST Assessments in Domiciliary Care',
    category: 'Clinical',
    keywords: ['Waterlow assessment', 'MUST assessment', 'pressure sore risk', 'malnutrition screening care'],
    descriptionHint: 'Explain Waterlow pressure risk and MUST malnutrition assessments and how to use them in home care.',
  },
  {
    slug: 'care-agency-invoicing-get-paid-faster',
    title: 'Care Agency Invoicing: How to Get Paid Faster',
    category: 'Business',
    keywords: ['care agency invoicing', 'domiciliary care billing', 'care software invoicing'],
    descriptionHint: 'Tips for care agencies to speed up invoicing and improve cash flow with software.',
  },
];

const SYSTEM_PROMPT = `You are an expert blog writer for CareCallAI, a UK home care management software platform. Write SEO-optimised blog posts targeted at domiciliary care agency owners and managers in Wales and England.

Guidelines:
- Write 600-1000 words
- Use ## for section headings (H2)
- Use ### for sub-headings (H3) where appropriate
- Use **bold** for emphasis
- Use - for bullet lists
- Use numbered lists (1. 2. 3.) for step-by-step instructions
- Write in a professional but accessible tone
- Include practical advice, not just product promotion
- Naturally mention CareCallAI features where relevant
- End with a clear CTA encouraging a free trial at carecallai.co.uk/signup
- Target UK English spelling (organisation, optimise, etc.)
- Reference CIW (Wales) and CQC (England) regulations where appropriate
- Include specific, actionable tips that demonstrate expertise
- Do NOT start with "As a care agency..." or similar generic openings`;

export async function GET(request) {
  // Verify cron secret (Vercel sends this automatically)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return generatePost();
}

export async function POST(request) {
  // POST also supported for manual triggering
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  return generatePost(body.slug);
}

async function generatePost(specificSlug) {
  if (!ANTHROPIC_API_KEY || !supabaseUrl || !supabaseServiceKey) {
    return Response.json({ error: 'Missing environment variables' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Get existing slugs
  const { data: existing } = await supabase
    .from('blog_posts')
    .select('slug');

  const existingSlugs = new Set((existing || []).map(p => p.slug));

  // Pick topic
  let topic;
  if (specificSlug) {
    topic = BLOG_TOPICS.find(t => t.slug === specificSlug);
    if (!topic) return Response.json({ error: `Topic not found: ${specificSlug}` }, { status: 404 });
    if (existingSlugs.has(specificSlug)) return Response.json({ error: `Already exists: ${specificSlug}` }, { status: 409 });
  } else {
    const available = BLOG_TOPICS.filter(t => !existingSlugs.has(t.slug));
    if (available.length === 0) return Response.json({ message: 'All topics covered', total: existingSlugs.size });
    topic = available[0];
  }

  // Generate content
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: `Write a blog post about: ${topic.title}

Target SEO keywords: ${topic.keywords.join(', ')}
Category: ${topic.category}
Context: ${topic.descriptionHint}

Return ONLY a valid JSON object (no markdown code fences) with these keys:
- "title": the blog post title (can refine the suggested one)
- "description": SEO meta description, under 160 characters
- "content": the full blog post body using ## headings, **bold**, - bullet lists, numbered lists
- "readTime": estimated read time e.g. "5 min read"`,
      }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    return Response.json({ error: 'Anthropic API error', details: err }, { status: 500 });
  }

  const data = await response.json();
  const text = data.content?.[0]?.text || '';

  let parsed;
  try {
    // Handle potential markdown code fences around JSON
    const cleaned = text.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim();
    parsed = JSON.parse(cleaned);
  } catch (e) {
    return Response.json({ error: 'Failed to parse AI response', raw: text.slice(0, 500) }, { status: 500 });
  }

  // Insert into Supabase
  const { error } = await supabase.from('blog_posts').insert({
    slug: topic.slug,
    title: parsed.title || topic.title,
    description: parsed.description || topic.descriptionHint,
    content: parsed.content,
    category: topic.category,
    read_time: parsed.readTime || '5 min read',
    date: new Date().toISOString().split('T')[0],
    published: true,
    seo_keywords: topic.keywords,
    meta_title: parsed.title || topic.title,
    meta_description: parsed.description || topic.descriptionHint,
  });

  if (error) {
    return Response.json({ error: 'Supabase insert error', details: error.message }, { status: 500 });
  }

  return Response.json({ success: true, slug: topic.slug, title: parsed.title });
}
