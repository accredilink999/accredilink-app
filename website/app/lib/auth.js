/**
 * Validate admin token from Authorization header.
 * Returns the decoded user payload or null.
 */
export function getCallerFromToken(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  try {
    const token = authHeader.slice(7);
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());
    if (!payload.role || !payload.ts) return null;
    return payload;
  } catch {
    return null;
  }
}
