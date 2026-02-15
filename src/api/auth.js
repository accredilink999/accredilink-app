import { supabase } from './supabaseClient'
import { isBiometricEnabled } from '@/utils/biometric'

/**
 * Returns the current authenticated user merged with their profile row.
 * Mirrors: base44.auth.me()
 */
export async function me() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw error || new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return {
    id: user.id,
    email: user.email,
    ...profile,
  }
}

/**
 * Signs the user out and redirects to /login.
 * Mirrors: base44.auth.logout()
 */
export async function logout() {
  try {
    // If biometric is enabled, use 'local' scope to keep the refresh token
    // valid server-side so biometric login can restore the session later.
    // Otherwise use default ('global') which revokes all tokens.
    const scope = isBiometricEnabled() ? 'local' : 'global';
    await supabase.auth.signOut({ scope })
  } catch (e) {
    console.error('signOut error (continuing):', e)
  }
  // Clear any cached Supabase tokens from localStorage
  const keys = Object.keys(localStorage)
  for (const key of keys) {
    if (key.startsWith('sb-') && (key.endsWith('-auth-token') || key.endsWith('auth-token-code-verifier'))) {
      localStorage.removeItem(key)
    }
  }
  window.location.href = '/login'
}

/**
 * Navigates to /login.
 * Mirrors: base44.auth.redirectToLogin()
 */
export function redirectToLogin() {
  window.location.href = '/login'
}

/**
 * Updates the current user's profile row.
 * Mirrors: base44.auth.updateMe(data)
 */
export async function updateMe(data) {
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) throw userError || new Error('Not authenticated')

  const { error } = await supabase
    .from('profiles')
    .update(data)
    .eq('id', user.id)

  if (error) throw error

  // Sync name/phone changes to the users table too (staff lists read from users)
  const userFields = {}
  if (data.full_name) userFields.full_name = data.full_name
  if (data.staff_full_name) userFields.staff_full_name = data.staff_full_name
  if (data.phone !== undefined) userFields.phone = data.phone
  if (data.photo_url !== undefined) userFields.photo_url = data.photo_url
  if (data.onboarding_complete !== undefined) userFields.onboarding_complete = data.onboarding_complete
  if (Object.keys(userFields).length > 0) {
    await supabase.from('users').update(userFields).eq('id', user.id)
  }

  return me()
}

export const auth = { me, logout, redirectToLogin, updateMe }
