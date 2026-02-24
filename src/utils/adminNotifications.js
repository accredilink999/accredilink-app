/**
 * adminNotifications.js — Send shift activity push notifications to admins.
 *
 * Fetches admins who have shift_activity_notifications enabled,
 * excludes the current user, and sends via createNotification.
 */
import { base44 } from '@/api/base44Client'

/**
 * Send a shift-activity notification to all admins (except excludeUserId).
 * If areaId is provided, only notifies admins who have a RotaPermission for that area.
 * Silently swallows errors — callers should not await this.
 */
export async function notifyAdminsOfActivity({ title, message, excludeUserId, actionUrl = '/Rota', areaId }) {
  try {
    const allUsers = await base44.entities.User.list()
    let admins = allUsers.filter(u =>
      u.is_active !== false &&
      (u.role === 'admin' || u.role === 'super_admin' || u.job_title === 'admin' || u.job_title === 'manager') &&
      u.id !== excludeUserId &&
      u.shift_activity_notifications !== false   // default true if column is null
    )

    // Per-admin area filtering based on shift_notification_scope preference:
    // - scope 'all' (or null/undefined — the default): receives ALL shift notifications
    // - scope 'my_team': only receives notifications for areas they have RotaPermission for
    if (areaId) {
      const myTeamAdmins = admins.filter(a => a.shift_notification_scope === 'my_team')
      const allScopeAdmins = admins.filter(a => a.shift_notification_scope !== 'my_team')

      if (myTeamAdmins.length > 0) {
        const areaPermissions = await base44.entities.RotaPermission.filter({ rota_area_id: areaId })
        const areaStaffIds = new Set(areaPermissions.map(p => p.staff_id))
        const filteredMyTeam = myTeamAdmins.filter(a => areaStaffIds.has(a.id))
        admins = [...allScopeAdmins, ...filteredMyTeam]
      }
    }
    // When no areaId is provided, all admins receive the notification regardless of scope

    if (admins.length === 0) return

    const recipientIds = admins.map(a => a.id)

    await base44.functions.invoke('createNotification', {
      recipient_ids: recipientIds,
      type: 'shift_activity',
      title,
      message,
      priority: 'normal',
      action_url: actionUrl,
      send_push: true,
    })
  } catch (e) {
    console.warn('[AdminNotify] Failed:', e)
  }
}
