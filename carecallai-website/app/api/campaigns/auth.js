// Shared auth helper for campaign API routes
// Mirrors the platform-admin auth pattern
export function verifyAdmin(request) {
  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.replace('Bearer ', '');
  if (!token) return null;
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());
    if (payload.role !== 'platform_admin' || !payload.ts) return null;
    if (Date.now() - payload.ts > 86400000) return null;
    return payload;
  } catch {
    return null;
  }
}
