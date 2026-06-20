import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Returns HH:MM in Europe/London timezone
function ukTime(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

// Returns YYYY-MM-DD in Europe/London timezone
function ukDate(date: Date): string {
  const p = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date).reduce((acc: Record<string, string>, { type, value }) => {
    acc[type] = value; return acc
  }, {})
  return `${p.year}-${p.month}-${p.day}`
}

async function sendNotification(recipientIds: string[], title: string, message: string) {
  if (!recipientIds.length) return
  await fetch(`${SUPABASE_URL}/functions/v1/createNotification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SERVICE_KEY}` },
    body: JSON.stringify({
      recipient_ids: recipientIds,
      type: 'shift_activity',
      title,
      message,
      priority: 'high',
      action_url: '/Rota',
      send_push: true,
    }),
  }).catch(e => console.warn('[checkOverdueCalls] notify failed:', e))
}

async function buildRecipients(
  supabase: ReturnType<typeof createClient>,
  staffId: string,
  pairedShiftId: string | null,
  areaId: string | null,
  orgId: string | null,
): Promise<string[]> {
  const ids = new Set<string>([staffId])

  // Paired partner
  if (pairedShiftId) {
    const { data } = await supabase.from('shifts').select('staff_id').eq('id', pairedShiftId).maybeSingle()
    if (data?.staff_id) ids.add(data.staff_id)
  }

  // Area admins (with scope filtering)
  if (orgId) {
    const { data: admins } = await supabase
      .from('users')
      .select('id, shift_notification_scope, shift_activity_notifications')
      .eq('organization_id', orgId)
      .in('role', ['admin', 'super_admin', 'manager'])
      .neq('id', staffId)

    let areaStaffIds = new Set<string>()
    if (areaId && (admins || []).some((a: any) => a.shift_notification_scope === 'my_team')) {
      const { data: perms } = await supabase.from('rota_permissions').select('staff_id').eq('rota_area_id', areaId)
      areaStaffIds = new Set((perms || []).map((p: any) => p.staff_id))
    }

    for (const admin of admins || []) {
      if (admin.shift_activity_notifications === false) continue
      if (admin.shift_notification_scope === 'my_team' && !areaStaffIds.has(admin.id)) continue
      ids.add(admin.id)
    }
  }

  return [...ids]
}

Deno.serve(async () => {
  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

    const now = new Date()
    const cutoff = new Date(now.getTime() - 15 * 60 * 1000)
    const today = ukDate(now)
    const cutoffTime = ukTime(cutoff)
    const nowIso = now.toISOString()
    // Suppress re-alerts within 4 hours
    const alertCutoff = new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString()

    let notified = 0

    // ── 1. Overdue pending calls ──────────────────────────────────────
    const { data: overdueCalls } = await supabase
      .from('shift_calls')
      .select('id, service_user_name, scheduled_time, shift:shifts!shift_id(staff_id, staff_name, paired_shift_id, rota_area_id, organization_id)')
      .eq('call_date', today)
      .eq('status', 'pending')
      .lt('scheduled_time', cutoffTime)
      .or(`overdue_alert_sent_at.is.null,overdue_alert_sent_at.lt.${alertCutoff}`)
      .or(`delay_until.is.null,delay_until.lt.${nowIso}`)

    for (const call of overdueCalls || []) {
      const shift = (call as any).shift
      if (!shift?.staff_id) continue

      const recipients = await buildRecipients(supabase, shift.staff_id, shift.paired_shift_id, shift.rota_area_id, shift.organization_id)

      await sendNotification(
        recipients,
        `⚠️ Late check-in: ${call.service_user_name}`,
        `${shift.staff_name || 'Staff'} has not checked in to ${call.service_user_name}'s ${call.scheduled_time} call — 15 minutes overdue.`,
      )

      await supabase.from('shift_calls').update({ overdue_alert_sent_at: nowIso, delay_until: null }).eq('id', call.id)
      notified++
    }

    // ── 2. Late shift clock-ons ───────────────────────────────────────
    const { data: lateShifts } = await supabase
      .from('shifts')
      .select('id, staff_id, staff_name, start_time, paired_shift_id, rota_area_id, organization_id')
      .eq('date', today)
      .eq('status', 'scheduled')
      .is('clock_in_time', null)
      .lt('start_time', cutoffTime)
      .or(`overdue_alert_sent_at.is.null,overdue_alert_sent_at.lt.${alertCutoff}`)
      .or(`delay_until.is.null,delay_until.lt.${nowIso}`)

    for (const shift of lateShifts || []) {
      const recipients = await buildRecipients(supabase, shift.staff_id, shift.paired_shift_id, shift.rota_area_id, shift.organization_id)

      await sendNotification(
        recipients,
        `⚠️ Late shift start: ${shift.staff_name || 'Staff'}`,
        `${shift.staff_name || 'Staff'} has not clocked on for their ${shift.start_time} shift — 15 minutes overdue.`,
      )

      await supabase.from('shifts').update({ overdue_alert_sent_at: nowIso, delay_until: null }).eq('id', shift.id)
      notified++
    }

    return new Response(
      JSON.stringify({ ok: true, notified, overdue_calls: (overdueCalls || []).length, late_shifts: (lateShifts || []).length }),
      { headers: { 'Content-Type': 'application/json' } },
    )
  } catch (err: any) {
    console.error('[checkOverdueCalls]', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
