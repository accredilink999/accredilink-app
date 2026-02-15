import { supabase } from './supabaseClient'

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').trim()
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()

/** Check if a JWT is expired or expires within 60 seconds */
function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp * 1000 < Date.now() + 60000
  } catch {
    return true
  }
}

/**
 * Invoke a Supabase Edge Function using direct fetch().
 *
 * - Checks JWT expiry before each call and force-refreshes if stale
 * - Reads the full JSON response body (including error details + diagnostic steps)
 * - Retries once on 401 after forcing a session refresh
 */
export async function invokeFunction(functionName, args = {}) {
  console.log(`[invokeFunction] POST ${functionName}`, args)

  // Get session and ensure the token is still valid
  let { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) {
    throw new Error('Not logged in — please sign in again')
  }

  // Force refresh if the JWT is expired or about to expire
  if (isTokenExpired(session.access_token)) {
    console.log('[invokeFunction] Token expired/expiring, refreshing session...')
    const { data: { session: fresh }, error: refreshErr } = await supabase.auth.refreshSession()
    if (refreshErr || !fresh?.access_token) {
      throw new Error('Session expired — please log in again')
    }
    session = fresh
    console.log('[invokeFunction] Session refreshed successfully')
  }

  const url = `${SUPABASE_URL}/functions/v1/${functionName}`
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
    'apikey': SUPABASE_ANON_KEY,
  }

  let response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(args),
    })
  } catch (fetchErr) {
    console.error(`[invokeFunction] ${functionName} network error:`, fetchErr)
    throw new Error('Network error — check your connection and try again')
  }

  // Parse response body (works for both success and error responses)
  let data
  try {
    data = await response.json()
  } catch {
    data = null
  }

  console.log(`[invokeFunction] ${functionName} status=${response.status}`, data)

  if (response.ok) {
    return data
  }

  // ── Non-2xx response ──────────────────────────────────────────

  // 401 = expired/invalid token — refresh and retry once
  if (response.status === 401) {
    console.log('[invokeFunction] Got 401, forcing session refresh and retrying...')
    const { data: { session: newSession }, error: refreshError } = await supabase.auth.refreshSession()
    if (refreshError || !newSession?.access_token) {
      throw new Error('Session expired — please log in again')
    }

    let retryResp
    try {
      retryResp = await fetch(url, {
        method: 'POST',
        headers: {
          ...headers,
          'Authorization': `Bearer ${newSession.access_token}`,
        },
        body: JSON.stringify(args),
      })
    } catch {
      throw new Error('Network error on retry — check your connection')
    }

    let retryData
    try { retryData = await retryResp.json() } catch { retryData = null }

    if (retryResp.ok) {
      console.log(`[invokeFunction] ${functionName} retry success:`, retryData)
      return retryData
    }

    const errMsg = retryData?.error || retryData?.message || `Status ${retryResp.status}`
    const err = new Error(errMsg)
    if (retryData?.steps) err.steps = retryData.steps
    if (retryData?.detail) err.detail = retryData.detail
    throw err
  }

  // Other errors (400, 403, 500, etc.) — extract message from body
  const errMsg = data?.error || data?.message || `Edge function error (${response.status})`
  console.error(`[invokeFunction] ${functionName} error:`, errMsg, 'data:', data)

  const err = new Error(errMsg)
  if (data?.steps) err.steps = data.steps
  if (data?.detail) err.detail = data.detail
  throw err
}
