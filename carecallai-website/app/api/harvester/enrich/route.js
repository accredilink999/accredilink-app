import { NextResponse } from 'next/server';
import { verifyAdmin } from '../../campaigns/auth';

export const maxDuration = 60;

function extractEmails(text) {
  const pattern = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
  const matches = text.match(pattern) || [];

  const blocked = new Set([
    'example.com', 'email.com', 'test.com', 'domain.com', 'yoursite.com',
    'sentry.io', 'wixpress.com', 'w3.org', 'schema.org', 'wordpress.org',
    'gravatar.com', 'googleapis.com', 'google.com', 'facebook.com',
  ]);
  const imageExts = new Set(['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico']);

  const unique = [...new Set(matches.map(e => e.toLowerCase()))];
  return unique.filter(email => {
    const domain = email.split('@')[1];
    if (blocked.has(domain)) return false;
    const ext = email.split('.').pop();
    if (imageExts.has(ext)) return false;
    if (email.split('@')[0].length < 2) return false;
    return true;
  });
}

async function fetchAndExtract(url) {
  let fullUrl = url;
  if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
    fullUrl = 'https://' + fullUrl;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(fullUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CareCallAI/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    });
    clearTimeout(timeout);

    if (!res.ok) return { url, emails: [], error: `HTTP ${res.status}` };

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('text/plain')) {
      return { url, emails: [], error: 'Not HTML' };
    }

    // Read body with its own timeout
    const bodyController = new AbortController();
    const bodyTimeout = setTimeout(() => bodyController.abort(), 4000);
    const text = await res.text();
    clearTimeout(bodyTimeout);

    const content = text.slice(0, 300000); // 300KB max
    const emails = extractEmails(content);
    return { url, emails };
  } catch (err) {
    return { url, emails: [], error: err.name === 'AbortError' ? 'Timeout' : (err.message || 'Failed').slice(0, 50) };
  }
}

export async function POST(request) {
  const admin = verifyAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { urls } = await request.json();
  if (!Array.isArray(urls) || urls.length === 0) {
    return NextResponse.json({ error: 'urls array is required' }, { status: 400 });
  }

  // Process all URLs in parallel (max 50 per request)
  const batch = urls.slice(0, 50);
  const results = await Promise.all(batch.map(url => fetchAndExtract(url)));

  return NextResponse.json({
    success: true,
    results,
    summary: {
      total: results.length,
      withEmails: results.filter(r => r.emails.length > 0).length,
      errors: results.filter(r => r.error).length,
    },
  });
}
