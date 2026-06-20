import { createClient } from 'npm:@supabase/supabase-js@2';
import postgres from 'https://deno.land/x/postgresjs@v3.4.5/mod.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const dbUrl = Deno.env.get('SUPABASE_DB_URL')!;

  const supabase = createClient(supabaseUrl, serviceKey);
  const sql = postgres(dbUrl, { max: 1 });

  try {
    let totalAlerted = 0;

    // ─── 1. OVERDUE CALLS: pending calls 15+ minutes past scheduled time ───────
    const overdueCalls = await sql`
      SELECT
        sc.id            AS call_id,
        sc.service_user_name,
        sc.scheduled_time,
        sc.shift_id,
        s.staff_id,
        s.staff_name,
        s.paired_shift_id,
        s.rota_area_id,
        s.organization_id
      FROM shift_calls sc
      JOIN shifts s ON sc.shift_id = s.id
      WHERE sc.status = 'pending'
        AND sc.call_date = CURRENT_DATE
        AND (
          (sc.call_date::date + sc.scheduled_time::time) AT TIME ZONE 'Europe/London'
          + INTERVAL '15 minutes'
        ) <= NOW()
        AND s.status NOT IN ('completed', 'cancelled')
        AND (
          sc.overdue_alert_sent_at IS NULL
          OR (sc.delay_until IS NOT NULL AND sc.delay_until < NOW())
        )
    `;

    for (const call of overdueCalls) {
      const recipients = await buildRecipientList(supabase, {
        staffId: call.staff_id,
        pairedShiftId: call.paired_shift_id,
        orgId: call.organization_id,
        areaId: call.rota_area_id,
      });

      if (recipients.length > 0) {
        await sendNotification(supabaseUrl, serviceKey, {
          recipient_ids: recipients,
          title: `⚠️ Late check-in: ${call.service_user_name}`,
          message: `${call.staff_name || 'Staff'} has not checked in to ${call.service_user_name}'s ${call.scheduled_time} call — 15 minutes overdue.`,
        });
      }

      await sql`
        UPDATE shift_calls
        SET overdue_alert_sent_at = NOW(), delay_until = NULL
        WHERE id = ${call.call_id}
      `;
      totalAlerted++;
    }

    // ─── 2. LATE SHIFT START: staff not clocked on 15+ minutes past shift start ─
    const lateShiftStarts = await sql`
      SELECT
        s.id AS shift_id,
        s.staff_id,
        s.staff_name,
        s.start_time,
        s.paired_shift_id,
        s.rota_area_id,
        s.organization_id
      FROM shifts s
      WHERE s.status = 'scheduled'
        AND s.date = CURRENT_DATE
        AND s.clock_in_time IS NULL
        AND s.start_time IS NOT NULL
        AND s.start_time != ''
        AND (
          (CURRENT_DATE::date + s.start_time::time) AT TIME ZONE 'Europe/London'
          + INTERVAL '15 minutes'
        ) <= NOW()
        AND (
          s.overdue_alert_sent_at IS NULL
          OR (s.delay_until IS NOT NULL AND s.delay_until < NOW())
        )
    `;

    for (const shift of lateShiftStarts) {
      const recipients = await buildRecipientList(supabase, {
        staffId: shift.staff_id,
        pairedShiftId: shift.paired_shift_id,
        orgId: shift.organization_id,
        areaId: shift.rota_area_id,
      });

      if (recipients.length > 0) {
        await sendNotification(supabaseUrl, serviceKey, {
          recipient_ids: recipients,
          title: `⚠️ Late shift start: ${shift.staff_name || 'Staff'}`,
          message: `${shift.staff_name || 'Staff'} has not clocked on for their ${shift.start_time} shift — 15 minutes overdue.`,
        });
      }

      await sql`
        UPDATE shifts
        SET overdue_alert_sent_at = NOW(), delay_until = NULL
        WHERE id = ${shift.shift_id}
      `;
      totalAlerted++;
    }

    await sql.end();
    return new Response(
      JSON.stringify({
        success: true,
        overdue_calls: overdueCalls.length,
        late_shifts: lateShiftStarts.length,
        alerted: totalAlerted,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    await sql.end().catch(() => {});
    console.error('checkOverdueCalls error:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Build the list of people to notify: assigned staff + paired partner + area admins
async function buildRecipientList(
  supabase: any,
  { staffId, pairedShiftId, orgId, areaId }: { staffId: string; pairedShiftId?: string; orgId?: string; areaId?: string }
): Promise<string[]> {
  const ids: string[] = [];
  if (staffId) ids.push(staffId);

  if (pairedShiftId) {
    const { data: pairedShift } = await supabase
      .from('shifts')
      .select('staff_id')
      .eq('id', pairedShiftId)
      .maybeSingle();
    if (pairedShift?.staff_id && !ids.includes(pairedShift.staff_id)) {
      ids.push(pairedShift.staff_id);
    }
  }

  if (orgId) {
    const { data: orgAdmins } = await supabase
      .from('users')
      .select('id, shift_notification_scope, shift_activity_notifications')
      .eq('organization_id', orgId)
      .in('role', ['admin', 'super_admin', 'manager'])
      .neq('id', staffId || '');

    if (orgAdmins?.length) {
      let areaStaffIds: Set<string> = new Set();
      if (areaId) {
        const { data: areaPerms } = await supabase
          .from('rota_permissions')
          .select('staff_id')
          .eq('rota_area_id', areaId);
        areaStaffIds = new Set((areaPerms || []).map((p: any) => p.staff_id));
      }

      for (const admin of orgAdmins) {
        if (admin.shift_activity_notifications === false) continue;
        if (admin.shift_notification_scope === 'my_team' && !areaStaffIds.has(admin.id)) continue;
        if (!ids.includes(admin.id)) ids.push(admin.id);
      }
    }
  }

  return ids;
}

async function sendNotification(
  supabaseUrl: string,
  serviceKey: string,
  { recipient_ids, title, message }: { recipient_ids: string[]; title: string; message: string }
) {
  await fetch(`${supabaseUrl}/functions/v1/createNotification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${serviceKey}` },
    body: JSON.stringify({
      recipient_ids,
      type: 'shift_activity',
      title,
      message,
      priority: 'high',
      action_url: '/Rota',
      send_push: true,
    }),
  });
}
