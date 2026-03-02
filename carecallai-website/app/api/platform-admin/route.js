import { NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const PLATFORM_ADMIN_SECRET = process.env.PLATFORM_ADMIN_SECRET;

export async function POST(request) {
  // Verify admin session
  const authHeader = request.headers.get('Authorization') || '';
  const sessionToken = authHeader.replace('Bearer ', '');

  if (!sessionToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = JSON.parse(Buffer.from(sessionToken, 'base64').toString());
    if (payload.role !== 'platform_admin' || !payload.ts) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }
    // Session expires after 24h
    if (Date.now() - payload.ts > 86400000) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  // Proxy to Supabase edge function with shared secret
  const body = await request.json();

  const res = await fetch(`${SUPABASE_URL}/functions/v1/platform-admin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'apikey': SUPABASE_ANON_KEY,
      'x-admin-secret': PLATFORM_ADMIN_SECRET || '',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
