/**
 * shiftClaimNotifications.js — Push notifications for shift claim workflow.
 *
 * Sends to relevant staff and area admins via the createNotification edge function.
 */
import { base44 } from '@/api/base44Client'

/**
 * Get admin IDs for a given area (or all admins if no areaId).
 */
async function getAreaAdminIds(areaId, excludeIds = []) {
  const allUsers = await base44.entities.User.list()
  let admins = allUsers.filter(u =>
    u.is_active !== false &&
    (u.role === 'admin' || u.role === 'super_admin' || u.job_title === 'admin' || u.job_title === 'manager') &&
    !excludeIds.includes(u.id)
  )

  if (areaId && admins.length > 0) {
    const areaPermissions = await base44.entities.RotaPermission.filter({ rota_area_id: areaId })
    const areaStaffIds = new Set(areaPermissions.map(p => p.staff_id))
    admins = admins.filter(a => areaStaffIds.has(a.id))
  }

  return admins.map(a => a.id)
}

/**
 * Send push notification to a list of recipient IDs.
 */
async function sendPush({ recipientIds, title, message, actionUrl = '/RequestsManagement' }) {
  if (!recipientIds || recipientIds.length === 0) return
  await base44.functions.invoke('createNotification', {
    recipient_ids: recipientIds,
    type: 'shift_activity',
    title,
    message,
    priority: 'normal',
    action_url: actionUrl,
    send_push: true,
  })
}

/**
 * Staff submitted a claim → notify area admins
 */
export async function notifyClaimCreated({ claim, areaId }) {
  try {
    const adminIds = await getAreaAdminIds(areaId, [claim.staff_id])
    await sendPush({
      recipientIds: adminIds,
      title: 'Shift Claim Request',
      message: `${claim.staff_name} has requested to claim a shift on ${claim.shift_date} (${claim.shift_time}).`,
      actionUrl: '/RequestsManagement',
    })
  } catch (e) {
    console.warn('[ClaimNotify] Created failed:', e)
  }
}

/**
 * Admin approved the claim → notify claiming staff + area admins
 */
export async function notifyClaimApproved({ claim, adminName, areaId }) {
  try {
    const adminIds = await getAreaAdminIds(areaId, [])
    const allIds = [...new Set([claim.staff_id, ...adminIds])]
    await sendPush({
      recipientIds: allIds,
      title: 'Shift Claim Approved',
      message: `${adminName} has approved ${claim.staff_name}'s claim for the shift on ${claim.shift_date} (${claim.shift_time}).`,
      actionUrl: '/Rota',
    })
  } catch (e) {
    console.warn('[ClaimNotify] Approved failed:', e)
  }
}

/**
 * Get all active staff IDs in a given area (for broadcasting shift availability).
 */
async function getAreaStaffIds(areaId, excludeIds = []) {
  const allUsers = await base44.entities.User.list()
  let staff = allUsers.filter(u => u.is_active !== false && !excludeIds.includes(u.id))

  if (areaId) {
    const areaPermissions = await base44.entities.RotaPermission.filter({ rota_area_id: areaId })
    const areaStaffIds = new Set(areaPermissions.map(p => p.staff_id))
    staff = staff.filter(s => areaStaffIds.has(s.id))
  }

  return staff.map(s => s.id)
}

/**
 * Leave/sick approved → shifts released as available → notify ALL staff in the area
 */
export async function notifyShiftsReleased({ staffName, shiftCount, startDate, endDate, areaId, staffId }) {
  try {
    const areaStaffIds = await getAreaStaffIds(areaId, staffId ? [staffId] : [])
    await sendPush({
      recipientIds: areaStaffIds,
      title: 'Shifts Available to Claim',
      message: `${shiftCount} shift(s) now available ${startDate} to ${endDate} (${staffName} on leave). Open Rota to claim.`,
      actionUrl: '/Rota',
    })
  } catch (e) {
    console.warn('[ClaimNotify] ShiftsReleased failed:', e)
  }
}

/**
 * Admin rejected the claim → notify claiming staff
 */
export async function notifyClaimRejected({ claim, adminName, areaId }) {
  try {
    const adminIds = await getAreaAdminIds(areaId, [])
    const allIds = [...new Set([claim.staff_id, ...adminIds])]
    await sendPush({
      recipientIds: allIds,
      title: 'Shift Claim Rejected',
      message: `${adminName} has rejected ${claim.staff_name}'s claim for the shift on ${claim.shift_date}.`,
      actionUrl: '/Dashboard',
    })
  } catch (e) {
    console.warn('[ClaimNotify] Rejected failed:', e)
  }
}
