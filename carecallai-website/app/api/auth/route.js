import { NextResponse } from 'next/server';

export async function POST(request) {
  const { password } = await request.json();

  if (!password) {
    return NextResponse.json({ success: false, error: 'Password is required' }, { status: 400 });
  }

  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ success: false, error: 'Admin password not configured' }, { status: 500 });
  }

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ success: false, error: 'Invalid password' }, { status: 401 });
  }

  // Generate a session token
  const tokenPayload = {
    email: process.env.ADMIN_OWNER_EMAIL || 'owner',
    name: 'Platform Admin',
    role: 'platform_admin',
    ts: Date.now(),
  };
  const token = Buffer.from(JSON.stringify(tokenPayload)).toString('base64');

  return NextResponse.json({
    success: true,
    token,
    user: { email: tokenPayload.email, name: 'Platform Admin', role: 'platform_admin' },
  });
}
