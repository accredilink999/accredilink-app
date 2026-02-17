import { NextResponse } from 'next/server';
import { verifyPassword } from '@/app/lib/kv';

export async function POST(request) {
  const { email, password } = await request.json();

  if (!password) {
    return NextResponse.json({ success: false, error: 'Password is required' }, { status: 400 });
  }

  // Mode 1: Individual email+password login
  if (email) {
    try {
      const user = await verifyPassword(email, password);
      if (user) {
        const tokenPayload = { email: user.email, name: user.name, role: user.role, ts: Date.now() };
        const token = Buffer.from(JSON.stringify(tokenPayload)).toString('base64');
        return NextResponse.json({
          success: true,
          token,
          user: { email: user.email, name: user.name, role: user.role },
        });
      }
    } catch {
      // Redis not available — fall through
    }
    return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 });
  }

  // Mode 2: Owner master password login (backward compatible)
  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ success: false, error: 'Admin password not configured' }, { status: 500 });
  }

  if (password === process.env.ADMIN_PASSWORD) {
    const tokenPayload = {
      email: process.env.ADMIN_OWNER_EMAIL || 'owner',
      name: 'Owner',
      role: 'owner',
      ts: Date.now(),
    };
    const token = Buffer.from(JSON.stringify(tokenPayload)).toString('base64');
    return NextResponse.json({
      success: true,
      token,
      user: { email: tokenPayload.email, name: 'Owner', role: 'owner' },
    });
  }

  return NextResponse.json({ success: false, error: 'Invalid password' }, { status: 401 });
}
