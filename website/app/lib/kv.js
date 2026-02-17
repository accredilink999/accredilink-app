import { Redis } from '@upstash/redis';
import bcrypt from 'bcryptjs';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const SALT_ROUNDS = 10;
const INVITE_EXPIRY_SECONDS = 7 * 24 * 60 * 60; // 7 days

// ── User operations ──

export async function createUser({ email, name, password, role, invitedBy }) {
  const normalizedEmail = email.toLowerCase().trim();
  const passwordHash = bcrypt.hashSync(password, SALT_ROUNDS);

  await redis.hset(`user:${normalizedEmail}`, {
    email: normalizedEmail,
    name,
    passwordHash,
    role: role || 'manager',
    createdAt: new Date().toISOString(),
    invitedBy: invitedBy || 'owner',
  });

  await redis.sadd('admin:users', normalizedEmail);

  return { email: normalizedEmail, name, role: role || 'manager' };
}

export async function getUser(email) {
  const normalizedEmail = email.toLowerCase().trim();
  return await redis.hgetall(`user:${normalizedEmail}`);
}

export async function verifyPassword(email, password) {
  const user = await getUser(email);
  if (!user || !user.passwordHash) return null;
  const valid = bcrypt.compareSync(password, user.passwordHash);
  return valid ? user : null;
}

export async function listUsers() {
  const emails = await redis.smembers('admin:users');
  if (!emails || emails.length === 0) return [];

  const users = await Promise.all(
    emails.map(async (email) => {
      const user = await redis.hgetall(`user:${email}`);
      if (!user) return null;
      const { passwordHash, ...safeUser } = user;
      return safeUser;
    })
  );

  return users.filter(Boolean);
}

export async function deleteUser(email) {
  const normalizedEmail = email.toLowerCase().trim();
  await redis.del(`user:${normalizedEmail}`);
  await redis.srem('admin:users', normalizedEmail);
}

// ── Invite operations ──

export async function createInvite({ email, role, createdBy }) {
  const token = crypto.randomUUID();
  const normalizedEmail = email.toLowerCase().trim();

  await redis.hset(`invite:${token}`, {
    email: normalizedEmail,
    role: role || 'manager',
    createdBy,
    createdAt: new Date().toISOString(),
  });

  await redis.expire(`invite:${token}`, INVITE_EXPIRY_SECONDS);

  return { token, email: normalizedEmail };
}

export async function getInvite(token) {
  return await redis.hgetall(`invite:${token}`);
}

export async function deleteInvite(token) {
  await redis.del(`invite:${token}`);
}
