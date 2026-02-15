/**
 * shiftTypeApi.js — Direct Supabase fallback for ShiftType operations.
 *
 * Tries base44.entities.ShiftType first; if it's undefined (e.g. stale
 * service-worker cache), falls back to direct supabase.from('shift_types').
 *
 * All rota components should import from here instead of using
 * base44.entities.ShiftType directly.
 */
import { supabase } from '@/api/supabaseClient'

// Direct Supabase implementation (always works, no cache dependency)
const directApi = {
  async filter(criteria = {}) {
    let q = supabase.from('shift_types').select('*')
    for (const [k, v] of Object.entries(criteria)) {
      if (v === null || v === undefined) {
        q = q.is(k, null)
      } else {
        q = q.eq(k, v)
      }
    }
    const { data, error } = await q.order('name')
    if (error) throw error
    return data || []
  },

  async list() {
    const { data, error } = await supabase
      .from('shift_types')
      .select('*')
      .order('name')
    if (error) throw error
    return data || []
  },

  async create(record) {
    const { data, error } = await supabase
      .from('shift_types')
      .insert(record)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('shift_types')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },
}

/**
 * Returns the ShiftType entity — prefers the base44 entity layer if
 * available, falls back to direct Supabase calls.
 */
export function getShiftTypeApi() {
  try {
    // Dynamic import to avoid circular deps; check at call time
    const { base44 } = require('@/api/base44Client')
    if (base44?.entities?.ShiftType) return base44.entities.ShiftType
  } catch {
    // base44Client not available — use direct
  }
  return directApi
}

// Convenience pre-bound exports for common operations
export const ShiftTypeApi = directApi
