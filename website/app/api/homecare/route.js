import { NextResponse } from 'next/server';
import { getCallerFromToken } from '@/app/lib/auth';

const BASE_URL = 'https://api.homecare.co.uk/index.cfm';

function getApiKey() {
  return process.env.HOMECARE_API_KEY || '';
}

// GET — proxy to homecare.co.uk enquiries, reviews, or jobs
export async function GET(request) {
  const caller = getCallerFromToken(request);
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const apiKey = getApiKey();
  if (!apiKey) {
    return NextResponse.json({ error: 'HOMECARE_API_KEY not configured' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'enquiries';

  let url;
  switch (type) {
    case 'enquiries':
      url = `${BASE_URL}/enquiry/?API_key=${apiKey}`;
      break;
    case 'reviews':
      url = `${BASE_URL}/reviews/?API_key=${apiKey}`;
      break;
    case 'review_score':
      url = `${BASE_URL}/reviews/scores?API_key=${apiKey}`;
      break;
    case 'review_connections':
      url = `${BASE_URL}/reviews/connections?API_key=${apiKey}`;
      break;
    case 'review_ratings':
      url = `${BASE_URL}/reviews/ratings?API_key=${apiKey}`;
      break;
    case 'jobs':
      url = `${BASE_URL}/jobs/?API_key=${apiKey}`;
      break;
    default:
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });
    const data = await res.json();
    return NextResponse.json({ success: true, type, data });
  } catch (err) {
    console.error(`Homecare API (${type}) error:`, err);
    return NextResponse.json({ error: err.message || 'API request failed' }, { status: 500 });
  }
}

// POST — post a new job or close a job
export async function POST(request) {
  const caller = getCallerFromToken(request);
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const apiKey = getApiKey();
  if (!apiKey) {
    return NextResponse.json({ error: 'HOMECARE_API_KEY not configured' }, { status: 500 });
  }

  const body = await request.json();
  const { action, ...fields } = body;

  try {
    if (action === 'post_job') {
      const res = await fetch(`${BASE_URL}/jobs/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ API_key: apiKey, ...fields }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(data));
      return NextResponse.json({ success: true, data });
    }

    if (action === 'close_job') {
      const { jobid } = fields;
      if (!jobid) return NextResponse.json({ error: 'jobid is required' }, { status: 400 });
      const res = await fetch(`${BASE_URL}/jobs/${jobid}/actions/close/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ API_key: apiKey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(data));
      return NextResponse.json({ success: true, data });
    }

    if (action === 'invite_review') {
      const { name, email, relationship } = fields;
      if (!name || !email) return NextResponse.json({ error: 'name and email are required' }, { status: 400 });
      const res = await fetch(`${BASE_URL}/reviews/connections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ API_key: apiKey, name, email, relationship: relationship || '' }),
      });
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { data = { raw: text }; }
      if (!res.ok) throw new Error(data.error || data.message || `API returned ${res.status}`);
      return NextResponse.json({ success: true, data });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    console.error('Homecare API POST error:', err);
    return NextResponse.json({ error: err.message || 'API request failed' }, { status: 500 });
  }
}

// PUT — edit an existing job
export async function PUT(request) {
  const caller = getCallerFromToken(request);
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const apiKey = getApiKey();
  if (!apiKey) {
    return NextResponse.json({ error: 'HOMECARE_API_KEY not configured' }, { status: 500 });
  }

  const body = await request.json();
  const { jobid, ...fields } = body;
  if (!jobid) return NextResponse.json({ error: 'jobid is required' }, { status: 400 });

  try {
    const res = await fetch(`${BASE_URL}/jobs/${jobid}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ API_key: apiKey, ...fields }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(data));
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('Homecare API PUT error:', err);
    return NextResponse.json({ error: err.message || 'API request failed' }, { status: 500 });
  }
}
