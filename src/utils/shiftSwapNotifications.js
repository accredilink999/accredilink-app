/**
 * shiftSwapNotifications.js — Push notifications for each stage of a shift swap.
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
    (u.role === 'admin' || u.job_title === 'admin' || u.job_title === 'manager') &&
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
 * Stage 1: Swap request created — notify target staff + area admins
 */
export async function notifySwapCreated({ swap, areaId }) {
  try {
    const targetIds = swap.swap_with_id ? [swap.swap_with_id] : []
    const adminIds = await getAreaAdminIds(areaId, [swap.requester_id])
    const allIds = [...new Set([...targetIds, ...adminIds])]

    await sendPush({
      recipientIds: allIds,
      title: 'Shift Swap Request',
      message: `${swap.requester_name} has requested a shift swap for ${swap.shift_date} (${swap.shift_time}).`,
      actionUrl: '/Dashboard',
    })
  } catch (e) {
    console.warn('[SwapNotify] Created failed:', e)
  }
}

/**
 * Stage 2: Target staff accepted — notify requester + area admins
 */
export async function notifySwapAccepted({ swap, targetName, areaId }) {
  try {
    const adminIds = await getAreaAdminIds(areaId, [swap.swap_with_id])
    const allIds = [...new Set([swap.requester_id, ...adminIds])]

    await sendPush({
      recipientIds: allIds,
      title: 'Shift Swap Accepted',
      message: `${targetName} has accepted the shift swap request from ${swap.requester_name}. Awaiting admin approval.`,
      actionUrl: '/RequestsManagement',
    })
  } catch (e) {
    console.warn('[SwapNotify] Accepted failed:', e)
  }
}

/**
 * Stage 3: Target staff declined — notify requester + area admins
 */
export async function notifySwapDeclined({ swap, targetName, areaId }) {
  try {
    const adminIds = await getAreaAdminIds(areaId, [swap.swap_with_id])
    const allIds = [...new Set([swap.requester_id, ...adminIds])]

    await sendPush({
      recipientIds: allIds,
      title: 'Shift Swap Declined',
      message: `${targetName} has declined the shift swap request from ${swap.requester_name} for ${swap.shift_date}.`,
      actionUrl: '/Dashboard',
    })
  } catch (e) {
    console.warn('[SwapNotify] Declined failed:', e)
  }
}

/**
 * Stage 4: Admin approved — notify both staff + area admins. Shifts are swapped.
 */
export async function notifySwapApproved({ swap, adminName, areaId }) {
  try {
    const staffIds = [swap.requester_id, swap.swap_with_id].filter(Boolean)
    const adminIds = await getAreaAdminIds(areaId, [])
    const allIds = [...new Set([...staffIds, ...adminIds])]

    await sendPush({
      recipientIds: allIds,
      title: 'Shift Swap Approved',
      message: `${adminName} has approved the shift swap between ${swap.requester_name} and ${swap.swap_with_name} for ${swap.shift_date}. Shifts have been updated.`,
      actionUrl: '/Rota',
    })
  } catch (e) {
    console.warn('[SwapNotify] Approved failed:', e)
  }
}

/**
 * Stage 5: Admin rejected — notify both staff
 */
export async function notifySwapRejected({ swap, adminName, areaId }) {
  try {
    const staffIds = [swap.requester_id, swap.swap_with_id].filter(Boolean)
    const adminIds = await getAreaAdminIds(areaId, [])
    const allIds = [...new Set([...staffIds, ...adminIds])]

    await sendPush({
      recipientIds: allIds,
      title: 'Shift Swap Rejected',
      message: `${adminName} has rejected the shift swap request from ${swap.requester_name} for ${swap.shift_date}.`,
      actionUrl: '/Dashboard',
    })
  } catch (e) {
    console.warn('[SwapNotify] Rejected failed:', e)
  }
}
