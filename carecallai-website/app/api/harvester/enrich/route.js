import { NextResponse } from 'next/server';
import { verifyAdmin } from '../../campaigns/auth';

// Extract emails from HTML/text content
function extractEmails(text) {
  const pattern = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
  const matches = text.match(pattern) || [];

  // Deduplicate and filter out common false positives
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
    // Skip image-like strings (e.g., 2x@image.png)
    const ext = email.split('.').pop();
    if (imageExts.has(ext)) return false;
    // Skip very short local parts (likely not real)
    if (email.split('@')[0].length < 2) return false;
    return true;
  });
}

export async function POST(request) {
  const admin = verifyAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { urls } = await request.json();

  if (!Array.isArray(urls) || urls.length === 0) {
    return NextResponse.json({ error: 'urls array is required' }, { status: 400 });
  }

  if (urls.length > 20) {
    return NextResponse.json({ error: 'Maximum 20 URLs per request' }, { status: 400 });
  }

  const results = [];

  for (const url of urls) {
    if (!url) {
      results.push({ url, emails: [], error: 'Empty URL' });
      continue;
    }

    // Ensure URL has protocol
    let fullUrl = url;
    if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
      fullUrl = 'https://' + fullUrl;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(fullUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; CareCallAI/1.0)',
          'Accept': 'text/html,application/xhtml+xml',
        },
        redirect: 'follow',
      });

      clearTimeout(timeout);

      if (!res.ok) {
        results.push({ url, emails: [], error: `HTTP ${res.status}` });
        continue;
      }

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('text/html') && !contentType.includes('text/plain')) {
        results.push({ url, emails: [], error: 'Not HTML content' });
        continue;
      }

      const text = await res.text();
      // Only scan first 500KB to avoid huge pages
      const content = text.slice(0, 500000);
      const emails = extractEmails(content);

      results.push({ url, emails });
    } catch (err) {
      results.push({
        url,
        emails: [],
        error: err.name === 'AbortError' ? 'Timeout (5s)' : err.message,
      });
    }

    // Rate limit: 1 second between fetches
    if (urls.indexOf(url) < urls.length - 1) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

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
