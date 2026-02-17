import { NextResponse } from 'next/server';
import { getInvite, deleteInvite, createUser, getUser } from '@/app/lib/kv';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ success: false, error: 'Token is required' }, { status: 400 });
  }

  const invite = await getInvite(token);
  if (!invite || !invite.email) {
    return NextResponse.json({ success: false, error: 'Invalid or expired invite link' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    invite: { email: invite.email, role: invite.role },
  });
}

export async function POST(request) {
  const { token, name, password } = await request.json();

  if (!token || !name || !password) {
    return NextResponse.json({ success: false, error: 'Token, name, and password are required' }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ success: false, error: 'Password must be at least 8 characters' }, { status: 400 });
  }

  const invite = await getInvite(token);
  if (!invite || !invite.email) {
    return NextResponse.json({ success: false, error: 'Invalid or expired invite link' }, { status: 404 });
  }

  const existing = await getUser(invite.email);
  if (existing && existing.email) {
    await deleteInvite(token);
    return NextResponse.json({ success: false, error: 'An account with this email already exists' }, { status: 409 });
  }

  const user = await createUser({
    email: invite.email,
    name,
    password,
    role: invite.role,
    invitedBy: invite.createdBy,
  });

  await deleteInvite(token);

  return NextResponse.json({
    success: true,
    message: 'Account created successfully. You can now sign in.',
    user: { email: user.email, name: user.name, role: user.role },
  });
}
