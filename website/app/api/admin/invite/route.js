import { NextResponse } from 'next/server';
import { createInvite, getUser } from '@/app/lib/kv';

function getCallerFromToken(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    return JSON.parse(Buffer.from(authHeader.split(' ')[1], 'base64').toString());
  } catch {
    return null;
  }
}

export async function POST(request) {
  const caller = getCallerFromToken(request);
  if (!caller || caller.role !== 'owner') {
    return NextResponse.json({ success: false, error: 'Only the owner can invite admins' }, { status: 403 });
  }

  const { email, role } = await request.json();

  if (!email || !email.includes('@')) {
    return NextResponse.json({ success: false, error: 'Valid email is required' }, { status: 400 });
  }

  const existing = await getUser(email);
  if (existing && existing.email) {
    return NextResponse.json({ success: false, error: 'This email already has an account' }, { status: 409 });
  }

  const invite = await createInvite({
    email,
    role: role || 'manager',
    createdBy: caller.email,
  });

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
    || request.headers.get('origin')
    || 'https://www.accredilinkcare.co.uk';
  const inviteUrl = `${baseUrl}/admin/register?token=${invite.token}`;

  return NextResponse.json({ success: true, inviteUrl, email: invite.email });
}
