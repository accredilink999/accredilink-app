import { NextResponse } from 'next/server';

export async function POST(request) {
  const { password } = await request.json();

  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ success: false, error: 'Admin password not configured' }, { status: 500 });
  }

  if (password === process.env.ADMIN_PASSWORD) {
    const token = Buffer.from(`admin:${Date.now()}:${Math.random().toString(36).slice(2)}`).toString('base64');
    return NextResponse.json({ success: true, token });
  }

  return NextResponse.json({ success: false, error: 'Invalid password' }, { status: 401 });
}
