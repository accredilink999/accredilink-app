import { NextResponse } from 'next/server';
import { listUsers, deleteUser } from '@/app/lib/kv';

function getCallerFromToken(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    return JSON.parse(Buffer.from(authHeader.split(' ')[1], 'base64').toString());
  } catch {
    return null;
  }
}

export async function GET(request) {
  const caller = getCallerFromToken(request);
  if (!caller || caller.role !== 'owner') {
    return NextResponse.json({ success: false, error: 'Only the owner can view admin users' }, { status: 403 });
  }

  const users = await listUsers();
  return NextResponse.json({ success: true, users });
}

export async function DELETE(request) {
  const caller = getCallerFromToken(request);
  if (!caller || caller.role !== 'owner') {
    return NextResponse.json({ success: false, error: 'Only the owner can remove admins' }, { status: 403 });
  }

  const { email } = await request.json();
  if (!email) {
    return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
  }

  await deleteUser(email);
  return NextResponse.json({ success: true, message: `Removed ${email}` });
}
