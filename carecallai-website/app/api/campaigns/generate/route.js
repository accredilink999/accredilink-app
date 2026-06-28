import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { verifyAdmin } from '../auth';

const EMAIL_TOPICS = {
  product_launch: [
    'Introducing CareCallAI — All-in-One Care Management',
    'New: Clinical Assessments (Waterlow, MUST, NEWS2) in CareCallAI',
    'CareCallAI Mobile App — Care Management in Your Pocket',
    'New Feature: AI-Powered Virtual Care Inspector',
    'Introducing eMAR — Safer Medication Management',
  ],
  compliance_update: [
    'Preparing for Your Next CIW Inspection — Digital Checklist',
    'RISCA Regulation 36: Meeting Staff Supervision Requirements',
    'CQC Key Lines of Enquiry — How Digital Records Help',
    'New CIW Guidance on Digital Care Records',
    'Safeguarding Compliance — Building Better Audit Trails',
  ],
  newsletter: [
    'Monthly Care Tech Update — What\'s New in CareCallAI',
    'Top 5 Ways to Reduce Paperwork in Your Care Agency',
    'Care Sector Insights — Digital Transformation in 2026',
    'Staff Retention in Domiciliary Care — Practical Tips',
  ],
  promotional: [
    'Get Started with CareCallAI — £99/month, Everything Included',
    'Switch from Paper to Digital — Free Migration Support',
    'CareCallAI vs. Multiple Systems — The Cost Comparison',
  ],
};

export async function POST(request) {
  const admin = verifyAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
  }

  const { campaignType, topic, targetAudience, additionalContext } = await request.json();

  if (!campaignType || !topic) {
    return NextResponse.json({ error: 'campaignType and topic are required' }, { status: 400 });
  }

  const audienceDesc = targetAudience === 'ciw'
    ? 'domiciliary care agencies and care homes in Wales regulated by Care Inspectorate Wales (CIW)'
    : targetAudience === 'cqc'
    ? 'domiciliary care agencies and care homes in England regulated by the Care Quality Commission (CQC)'
    : 'domiciliary care agencies and care homes across Wales and England';

  const prompt = `You are writing a marketing email for CareCallAI — an all-in-one care management platform for UK domiciliary care agencies and care homes.

CareCallAI features: scheduling/rota, digital care logging with GPS, electronic MAR charts (eMAR), clinical assessments (Waterlow, MUST, NEWS2, Falls Risk, Abbey Pain, Barthel, SALT), CIW & CQC compliance management with pre-populated regulation forms, 12-weekly staff supervision tracking (RISCA Reg 36), safeguarding incident reporting, family portal, AI care insights, mobile app.

Website: carecallai.co.uk
Tone: Professional, helpful, not pushy. Focus on solving real problems care providers face. Welsh-built, trusted by providers.

TARGET AUDIENCE: ${audienceDesc}
CAMPAIGN TYPE: ${campaignType}
TOPIC: ${topic}
${additionalContext ? `ADDITIONAL CONTEXT: ${additionalContext}` : ''}

Generate a complete HTML email. Return a JSON object with these fields:
- subject: Email subject line (max 60 chars, compelling)
- previewText: Preview/preheader text (max 100 chars)
- htmlContent: Full HTML email body with inline CSS. Use table-based layout, max-width 600px. Include:
  - Teal (#0d9488) header with CareCallAI branding
  - Clear headline and body text
  - One clear call-to-action button (teal background, white text, links to carecallai.co.uk)
  - Footer placeholder: {{UNSUBSCRIBE_LINK}} and {{COMPANY_ADDRESS}}
- plainText: Plain text version of the email

Return ONLY valid JSON, no markdown code fences, no explanation.`;

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4000,
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
