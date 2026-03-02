/**
 * rotaApi.js — Direct Supabase API for Shift and ShiftCall operations.
 *
 * Bypasses the base44 entity layer entirely. All rota components should
 * import from here instead of using base44.entities.Shift / ShiftCall.
 */
import { supabase } from '@/api/supabaseClient'
import { getCurrentOrgId } from '@/lib/orgContext'

/** Add organization_id filter for defense-in-depth */
function withOrgFilter(query) {
  const orgId = getCurrentOrgId()
  return orgId ? query.eq('organization_id', orgId) : query
}

/**
 * Parse a base44-style order string like '-created_date' into
 * { column, ascending } for Supabase .order().
 */
function parseOrder(orderStr) {
  if (!orderStr) return null
  const desc = orderStr.startsWith('-')
  const column = desc ? orderStr.slice(1) : orderStr
  return { column, ascending: !desc }
}

// ── Area filter helper ───────────────────────────────────────────────
// The shifts table has both `area_id` (original) and `rota_area_id` (added later).
// Different code paths may have set one or the other. This helper ensures queries
// match shifts regardless of which column holds the area value.
export function applyAreaFilter(query, areaId) {
  if (!areaId) return query
  // Also include shifts with NO area set (orphaned) so they remain visible
  return query.or(`rota_area_id.eq.${areaId},area_id.eq.${areaId},and(rota_area_id.is.null,area_id.is.null)`)
}

// When writing a shift, always set BOTH area columns so all queries find it.
export function withBothAreaColumns(record) {
  const areaId = record.rota_area_id || record.area_id
  if (!areaId) return record
  return { ...record, area_id: areaId, rota_area_id: areaId }
}

// ── Shift API ────────────────────────────────────────────────────────

export const ShiftApi = {
  async list(orderBy, limit = 500) {
    let q = withOrgFilter(supabase.from('shifts').select('*'))
    const ord = parseOrder(orderBy)
    if (ord) q = q.order(ord.column, { ascending: ord.ascending })
    if (limit) q = q.limit(limit)
    const { data, error } = await q
    if (error) throw error
    return data || []
  },

  async filter(criteria = {}, orderBy, limit) {
    let q = withOrgFilter(supabase.from('shifts').select('*'))
    for (const [k, v] of Object.entries(criteria)) {
      if (v === null || v === undefined) {
        q = q.is(k, null)
      } else {
        q = q.eq(k, v)
      }
    }
    const ord = parseOrder(orderBy)
    if (ord) q = q.order(ord.column, { ascending: ord.ascending })
    if (limit) q = q.limit(limit)
    const { data, error } = await q
    if (error) throw error
    return data || []
  },

  async create(record) {
    const { data, error } = await supabase
      .from('shifts')
      .insert(withBothAreaColumns(record))
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('shifts')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async delete(id) {
    const { error } = await supabase
      .from('shifts')
      .delete()
      .eq('id', id)
    if (error) throw error
  },

  async bulkCreate(records) {
    // Batch inserts to avoid 500 errors on large payloads
    const BATCH_SIZE = 50
    const allData = []
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE).map(withBothAreaColumns)
      const { data, error } = await supabase
        .from('shifts')
        .insert(batch)
        .select()
      if (error) throw error
      if (data) allData.push(...data)
    }
    return allData
  },

  subscribe(callback) {
    const channelName = `shifts-${Date.now()}-${Math.random().toString(36).slice(2)}`
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shifts' }, (payload) => {
        callback(payload)
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  },
}

// ── ShiftCall API ────────────────────────────────────────────────────

export const ShiftCallApi = {
  async list(orderBy, limit = 500) {
    let q = withOrgFilter(supabase.from('shift_calls').select('*'))
    const ord = parseOrder(orderBy)
    if (ord) q = q.order(ord.column, { ascending: ord.ascending })
    if (limit) q = q.limit(limit)
    const { data, error } = await q
    if (error) throw error
    return data || []
  },

  async filter(criteria = {}, orderBy, limit) {
    let q = withOrgFilter(supabase.from('shift_calls').select('*'))
    for (const [k, v] of Object.entries(criteria)) {
      if (v === null || v === undefined) {
        q = q.is(k, null)
      } else {
        q = q.eq(k, v)
      }
    }
    const ord = parseOrder(orderBy)
    if (ord) q = q.order(ord.column, { ascending: ord.ascending })
    if (limit) q = q.limit(limit)
    const { data, error } = await q
    if (error) throw error
    return data || []
  },

  async create(record) {
    const { data, error } = await supabase
      .from('shift_calls')
      .insert(record)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('shift_calls')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async bulkCreate(records) {
    const BATCH_SIZE = 50
    const allData = []
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE)
      const { data, error } = await supabase
        .from('shift_calls')
        .insert(batch)
        .select()
      if (error) throw error
      if (data) allData.push(...data)
    }
    return allData
  },

  async delete(id) {
    const { error } = await supabase
      .from('shift_calls')
      .delete()
      .eq('id', id)
    if (error) throw error
  },

  subscribe(callback) {
    const channelName = `shift-calls-${Date.now()}-${Math.random().toString(36).slice(2)}`
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shift_calls' }, (payload) => {
        callback(payload)
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  },
}

// ── ShiftPattern API ─────────────────────────────────────────────────

export const ShiftPatternApi = {
  async list(orderBy, limit = 100) {
    let q = withOrgFilter(supabase.from('shift_patterns').select('*'))
    const ord = parseOrder(orderBy)
    if (ord) q = q.order(ord.column, { ascending: ord.ascending })
    if (limit) q = q.limit(limit)
    const { data, error } = await q
    if (error) throw error
    return data || []
  },

  async filter(criteria = {}, orderBy) {
    let q = withOrgFilter(supabase.from('shift_patterns').select('*'))
    for (const [k, v] of Object.entries(criteria)) {
      if (v === null || v === undefined) {
        q = q.is(k, null)
      } else {
        q = q.eq(k, v)
      }
    }
    const ord = parseOrder(orderBy)
    if (ord) q = q.order(ord.column, { ascending: ord.ascending })
    const { data, error } = await q
    if (error) throw error
    return data || []
  },

  async create(record) {
    const { data, error } = await supabase
      .from('shift_patterns')
      .insert(record)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('shift_patterns')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async delete(id) {
    const { error } = await supabase
      .from('shift_patterns')
      .delete()
      .eq('id', id)
    if (error) throw error
  },
}
