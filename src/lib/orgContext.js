/**
 * Organization context — singleton that stores the current user's org_id.
 * Initialized on app load after auth. Used by entity builder to auto-inject
 * organization_id on all create/update operations.
 */
import { supabase } from '@/api/supabaseClient'

let _currentOrgId = null
let _currentOrgRole = null
let _currentOrg = null   // full org record (plan, is_active, trial_ends_at)
let _initPromise = null

/**
 * Fetch and cache the current user's organization membership.
 * Call once after successful authentication.
 */
export async function initOrg() {
  if (_initPromise) return _initPromise

  _initPromise = (async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data, error } = await supabase
        .from('organization_members')
        .select('organization_id, role')
        .eq('user_id', user.id)
        .limit(1)
        .single()

      if (error || !data) {
        _currentOrgId = null
        _currentOrgRole = null
        return null
      }

      _currentOrgId = data.organization_id
      _currentOrgRole = data.role

      // Fetch org details for subscription gating
      const { data: org } = await supabase
        .from('organizations')
        .select('id, name, plan, is_active, trial_ends_at, stripe_subscription_id')
        .eq('id', data.organization_id)
        .single()
      _currentOrg = org || null

      return data.organization_id
    } catch {
      _currentOrgId = null
      _currentOrgRole = null
      _currentOrg = null
      return null
    }
  })()

  return _initPromise
}

export function getCurrentOrgId() {
  return _currentOrgId
}

export function getCurrentOrgRole() {
  return _currentOrgRole
}

export function getCurrentOrg() {
  return _currentOrg
}

export function hasOrg() {
  return _currentOrgId !== null
}

/**
 * Check if the current org has active access.
 * Returns { active: true } or { active: false, reason: '...' }
 */
export function checkOrgAccess() {
  if (!_currentOrg) return { active: true } // no org = legacy user, let through

  const { plan, is_active, trial_ends_at } = _currentOrg

  // Active paid subscription
  if (is_active && plan && !['trial', 'cancelled'].includes(plan)) {
    return { active: true }
  }

  // Active trial — check if still within trial period
  if (plan === 'trial' && trial_ends_at) {
    const trialEnd = new Date(trial_ends_at)
    if (trialEnd > new Date()) {
      return { active: true, trial: true, trialEndsAt: trialEnd }
    }
    return { active: false, reason: 'trial_expired' }
  }

  // Trial with no end date = just signed up, hasn't started checkout yet — allow access
  if (plan === 'trial' && !trial_ends_at) {
    return { active: true, trial: true }
  }

  // Cancelled or inactive
  if (!is_active || plan === 'cancelled') {
    return { active: false, reason: 'cancelled' }
  }

  // Default: allow
  return { active: true }
}

/**
 * Reset org context (call on logout).
 */
export function resetOrg() {
  _currentOrgId = null
  _currentOrgRole = null
  _currentOrg = null
  _initPromise = null
}
