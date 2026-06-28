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
  // Allow retry if previous attempt returned null (failed)
  if (_initPromise) {
    const prev = await _initPromise
    if (prev) return prev
    // Previous attempt failed — clear and retry
    _initPromise = null
  }

  _initPromise = (async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      // Try organization_members first
      const { data, error } = await supabase
        .from('organization_members')
        .select('organization_id, role')
        .eq('user_id', user.id)
        .limit(1)
        .single()

      if (!error && data) {
        _currentOrgId = data.organization_id
        _currentOrgRole = data.role
      } else {
        // Fallback: check users table for organization_id
        const { data: userRow } = await supabase
          .from('users')
          .select('organization_id')
          .eq('id', user.id)
          .single()

        if (userRow?.organization_id) {
          _currentOrgId = userRow.organization_id
          _currentOrgRole = 'member'
          // Auto-repair: re-insert into organization_members
          await supabase.from('organization_members').upsert({
            organization_id: userRow.organization_id,
            user_id: user.id,
            role: 'member',
          }, { onConflict: 'organization_id,user_id' }).then(() => {})
        } else {
          _currentOrgId = null
          _currentOrgRole = null
          return null
        }
      }

      // Fetch org details for subscription gating
      const { data: org } = await supabase
        .from('organizations')
        .select('id, name, slug, plan, is_active, trial_ends_at, stripe_subscription_id, stripe_customer_id, invite_code, owner_onboarded')
        .eq('id', _currentOrgId)
        .single()
      _currentOrg = org || null

      return _currentOrgId
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

  const { plan, is_active, trial_ends_at, stripe_subscription_id } = _currentOrg

  // Active paid subscription
  if (is_active && plan && !['trial', 'cancelled'].includes(plan)) {
    return { active: true }
  }

  // Trial user — 30-day free trial, no credit card required
  if (plan === 'trial') {
    if (trial_ends_at) {
      const trialEnd = new Date(trial_ends_at)
      if (trialEnd > new Date()) {
        return { active: true, trial: true, trialEndsAt: trialEnd }
      }
      return { active: false, reason: 'trial_expired' }
    }
    // No trial end date set — allow (legacy user or setup in progress)
    return { active: true, trial: true }
  }

  // New signup — org created but not yet subscribed
  if (plan === 'pending') {
    return { active: false, reason: 'pending' }
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
